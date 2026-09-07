import { buildAnalysisPrompt } from "../../../lib/prompt.js";
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
    console.error("usage log failed", err);
  }
}

function asBool(v, fallback = false) {
  return typeof v === "boolean" ? v : fallback;
}
function asString(v, fallback = "") {
  return typeof v === "string" ? v : fallback;
}
function asInt(v, fallback) {
  const n = typeof v === "number" ? v : parseInt(v, 10);
  return Number.isFinite(n) ? Math.max(3, Math.min(10, Math.round(n))) : fallback;
}
function normalizeChartItem(v) {
  if (!v || typeof v !== "object") return null;
  const type = asString(v.type).trim();
  if (!type) return null;
  return { type, label: asString(v.label, type), reason: asString(v.reason) || undefined };
}

export async function POST(req) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return new Response(JSON.stringify({ error: "認証が必要です。再度ログインしてください。" }), { status: 401 });
    }

    const body = await req.json();
    const { text, apiKey: userApiKey } = body;
    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ error: "本文テキストを入力してください。" }), { status: 400 });
    }

    const apiKey = userApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Gemini APIキーが利用できません。画面上部の入力欄にご自身のAPIキーを入力するか、管理者にお問い合わせください。" }), { status: 400 });
    }

    const systemPrompt = buildAnalysisPrompt();

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
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
    if (!rawText) throw new Error("Gemini APIから解析結果を取得できませんでした。");

    await logUsage(session.userId, totalTokens);

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      throw new Error("解析結果のJSON解析に失敗しました: " + e.message);
    }

    const hasAnalysisData = asBool(parsed.hasAnalysisData, false);
    const chartSuggestion = hasAnalysisData ? normalizeChartItem(parsed.chartSuggestion) : null;
    const chartAlternatives = hasAnalysisData
      ? (Array.isArray(parsed.chartAlternatives) ? parsed.chartAlternatives : []).map(normalizeChartItem).filter(Boolean).slice(0, 3)
      : [];
    const suggestedSlideCount = asInt(parsed.suggestedSlideCount, 6);
    const slideCountReason = asString(parsed.slideCountReason);

    return new Response(
      JSON.stringify({ hasAnalysisData, chartSuggestion, chartAlternatives, suggestedSlideCount, slideCountReason }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message || "解析に失敗しました。" }), { status: 500 });
  }
}
