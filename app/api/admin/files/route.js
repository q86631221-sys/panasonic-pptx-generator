import { sql, ensureSchema } from "../../../../lib/db.js";
import { getSessionFromRequest } from "../../../../lib/auth.js";

export const runtime = "nodejs";

export async function GET(req) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return new Response(JSON.stringify({ error: "権限がありません。" }), { status: 403 });
  }

  await ensureSchema();
  const { searchParams } = new URL(req.url);
  const userId = Number(searchParams.get("userId"));
  if (!userId) {
    return new Response(JSON.stringify({ error: "userIdを指定してください。" }), { status: 400 });
  }

  const { rows: userRows } = await sql`SELECT id, email, department FROM users WHERE id = ${userId}`;
  if (!userRows.length) {
    return new Response(JSON.stringify({ error: "ユーザーが見つかりません。" }), { status: 404 });
  }

  const { rows: files } = await sql`
    SELECT id, title, summary, file_size, created_at
    FROM generated_files
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;

  return new Response(JSON.stringify({ user: userRows[0], files }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
