import pptxgen from "pptxgenjs";
import * as P from "../../../lib/panasonicHelpers.js";
import { buildSystemPrompt } from "../../../lib/prompt.js";
import { normalizeStructured } from "../../../lib/normalize.js";
import { getSessionFromRequest } from "../../../lib/auth.js";
import { sql, ensureSchema } from "../../../lib/db.js";

export const runtime = "nodejs";

const GEMINI_MODEL = "gemini-3.7-flash";

async function logUsage(userId, tokens) {
  try {
    await ensureSchema();
    await sql`
      INSERT INTO usage_daily (user_id, usage_date, api_calls, tokens_used)
      VALUES (${userId}, CURRENT_DATE, 1, ${tokens})
      ON CONFLICT (user_id, usage_date)
      DO UPDATE SET
        api_calls = usage_daily.api_calls + 1,
        tokens_used = usage_daily.tokens_used + ${tokens}
    `;
  } catch (err) {
    // 使用量記録の失敗で本体機能を止めない
    console.error("usage log failed", err);
  }
}

async function structureContent({ text, audience, chartPreference, includeInsight, slideCountTarget, apiKey: userApiKey }) {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini APIキーが利用できません。画面上部の入力欄にご自身のAPIキーを入力するか、管理者にお問い合わせください。");
  }

  const systemPrompt = buildSystemPrompt({ audience, chartPreference, includeInsight, slideCountTarget });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.4,
          thinkingConfig: { thinkingLevel: "low" },
        },
      }),
    }
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini APIエラー (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  const candidate = data.candidates && data.candidates[0];
  const part = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0];
  const rawText = part && part.text;
  const totalTokens = (data.usageMetadata && data.usageMetadata.totalTokenCount) || 0;
  if (!rawText) throw new Error("Gemini APIから構造化結果を取得できませんでした。");

  let structured;
  try {
    structured = JSON.parse(rawText);
  } catch (e) {
    throw new Error("構造化結果のJSON解析に失敗しました: " + e.message);
  }
  return { structured, totalTokens };
}

function buildPptx({ structured, department, dateStr, includeIuo }) {
  const pres = new pptxgen();
  pres.layout = P.LAYOUT;
  P.defineMasters(pres);

  const subtitleLines = [...(structured.coverSubtitleLines || [])];
  const metaLine = [dateStr, department].filter(Boolean).join("　");
  if (metaLine) subtitleLines.push(metaLine);

  P.coverSlide(pres, {
    title: structured.coverTitle || "資料タイトル",
    subtitleLines,
    includeIuo,
    // 本アプリはPanasonic社内利用を前提とし、実物ロゴを使用する。
    // 他社/社外提供用途に転用する場合は logoPath: null に変更すること。
  });

  const slides = structured.slides || [];
  const total = slides.length + 1; // 表紙を1ページ目としてカウント
  const masterName = includeIuo ? P.MASTER_CONTENT_IUO : P.MASTER_CONTENT_NOIUO;

  slides.forEach((s, idx) => {
    const n = idx + 2; // 表紙が1なので本文は2から
    const slide = pres.addSlide({ masterName });
    P.contentChromeMaster(slide, n, total, s.title || "", s.headMessage || "");
    P.renderBody(pres, slide, s);
  });

  P.endSlide(pres);
  return pres;
}

export async function POST(req) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return new Response(JSON.stringify({ error: "認証が必要です。再度ログインしてください。" }), { status: 401 });
    }

    const body = await req.json();
    const {
      text,
      department = "",
      dateStr = "",
      audience = "internal",
      includeIuo = true,
      chartPreference = "auto",
      includeInsight = null,
      slideCountTarget = null,
      apiKey = "",
    } = body;

    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ error: "本文テキストを入力してください。" }), { status: 400 });
    }

    const { structured: structuredRaw, totalTokens } = await structureContent({
      text,
      audience,
      chartPreference,
      includeInsight,
      slideCountTarget,
      apiKey,
    });
    await logUsage(session.userId, totalTokens);

    const structured = normalizeStructured(structuredRaw);
    const pres = buildPptx({ structured, department, dateStr, includeIuo: !!includeIuo });

    const buffer = await pres.write({ outputType: "nodebuffer" });

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="generated.pptx"`,
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message || "生成に失敗しました。" }), { status: 500 });
  }
}
