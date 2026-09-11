import { sql, ensureSchema } from "../../../../lib/db.js";
import { getSessionFromRequest } from "../../../../lib/auth.js";

export const runtime = "nodejs";

function buildContentDisposition(filenameBase) {
  const asciiFallback = "generated.pptx";
  const encoded = encodeURIComponent(`${filenameBase}.pptx`);
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

export async function GET(req, { params }) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return new Response(JSON.stringify({ error: "認証が必要です。" }), { status: 401 });
  }

  await ensureSchema();
  const { id } = await params;
  const fileId = Number(id);

  const { rows } = await sql`
    SELECT title, user_id, encode(file_data, 'hex') AS file_hex
    FROM generated_files WHERE id = ${fileId}
  `;
  if (!rows.length) {
    return new Response(JSON.stringify({ error: "ファイルが見つかりません。" }), { status: 404 });
  }

  const { title, user_id, file_hex } = rows[0];
  if (user_id !== session.userId && session.role !== "admin") {
    return new Response(JSON.stringify({ error: "権限がありません。" }), { status: 403 });
  }

  const buffer = Buffer.from(file_hex, "hex");

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": buildContentDisposition(title || "資料"),
    },
  });
}
