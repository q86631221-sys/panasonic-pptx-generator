import { sql, ensureSchema } from "../../../../../lib/db.js";
import { getSessionFromRequest } from "../../../../../lib/auth.js";
import { get } from "@vercel/blob";

export const runtime = "nodejs";

function buildContentDisposition(filenameBase) {
  const asciiFallback = "generated.pptx";
  const encoded = encodeURIComponent(`${filenameBase}.pptx`);
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

export async function GET(req, { params }) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return new Response(JSON.stringify({ error: "権限がありません。" }), { status: 403 });
  }

  await ensureSchema();
  const { id } = await params;
  const fileId = Number(id);

  const { rows } = await sql`
    SELECT title, blob_pathname
    FROM generated_files WHERE id = ${fileId}
  `;
  if (!rows.length || !rows[0].blob_pathname) {
    return new Response(JSON.stringify({ error: "ファイルが見つかりません（保存前の旧データの可能性があります）。" }), { status: 404 });
  }

  const { title, blob_pathname } = rows[0];
  const result = await get(blob_pathname, { access: "private" });
  if (!result || result.statusCode !== 200) {
    return new Response(JSON.stringify({ error: "ファイルの取得に失敗しました。" }), { status: 404 });
  }

  return new Response(result.stream, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": buildContentDisposition(title || "資料"),
      "X-Content-Type-Options": "nosniff",
    },
  });
}

