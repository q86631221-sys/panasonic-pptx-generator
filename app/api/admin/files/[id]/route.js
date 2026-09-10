import { sql, ensureSchema } from "../../../../../lib/db.js";
import { getSessionFromRequest } from "../../../../../lib/auth.js";

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

  const { rows } = await sql`SELECT title, file_data FROM generated_files WHERE id = ${fileId}`;
  if (!rows.length) {
    return new Response(JSON.stringify({ error: "ファイルが見つかりません。" }), { status: 404 });
  }

  const { title, file_data } = rows[0];
  const buffer = Buffer.from(file_data);

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": buildContentDisposition(title || "資料"),
    },
  });
}
