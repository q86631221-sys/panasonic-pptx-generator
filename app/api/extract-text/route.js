import { getSessionFromRequest } from "../../../lib/auth.js";

export const runtime = "nodejs";

const MAX_CHARS = 12000; // Geminiへの入力が肥大化しすぎないよう上限を設ける

function truncate(text) {
  const t = (text || "").trim();
  if (t.length <= MAX_CHARS) return t;
  return t.slice(0, MAX_CHARS) + "\n…（以下省略）";
}

export async function POST(req) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return new Response(JSON.stringify({ error: "認証が必要です。再度ログインしてください。" }), { status: 401 });
    }

    const body = await req.json();
    const { filename = "", mimeType = "", dataBase64 = "" } = body;

    if (!dataBase64) {
      return new Response(JSON.stringify({ error: "ファイルデータがありません。" }), { status: 400 });
    }

    const buffer = Buffer.from(dataBase64, "base64");
    const lowerName = filename.toLowerCase();
    let text = "";

    if (mimeType === "application/pdf" || lowerName.endsWith(".pdf")) {
      // pdf-parse@1.1.1 の index.js は `!module.parent` でデバッグモードを判定しており、
      // ESM の動的importではこれが正しく機能せずデバッグ用のテストファイル読み込みが
      // 走ってしまう。デバッグブロックを含まない内部実装 lib/pdf-parse.js を直接読み込む。
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const result = await pdfParse(buffer);
      text = (result.text || "").trim();
    } else if (
      mimeType.startsWith("text/") ||
      lowerName.endsWith(".txt") ||
      lowerName.endsWith(".md") ||
      lowerName.endsWith(".csv")
    ) {
      text = buffer.toString("utf-8");
    } else {
      return new Response(
        JSON.stringify({ error: "対応していないファイル形式です。PDF・テキスト(.txt/.md/.csv)のみ対応しています。" }),
        { status: 400 }
      );
    }

    text = truncate(text);
    if (!text) {
      return new Response(JSON.stringify({ error: "ファイルからテキストを抽出できませんでした。" }), { status: 422 });
    }

    return new Response(JSON.stringify({ text, filename }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message || "ファイルの解析に失敗しました。" }), { status: 500 });
  }
}
