import { sql, ensureSchema } from "../../../lib/db.js";
import { getSessionFromRequest } from "../../../lib/auth.js";

export const runtime = "nodejs";

export async function GET(req) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return new Response(JSON.stringify({ error: "認証が必要です。" }), { status: 401 });
  }

  await ensureSchema();
  const { rows: files } = await sql`
    SELECT id, title, summary, file_size, created_at
    FROM generated_files
    WHERE user_id = ${session.userId}
    ORDER BY created_at DESC
  `;

  return new Response(JSON.stringify({ files }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
