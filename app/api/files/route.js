import { sql, ensureSchema } from "../../../lib/db.js";
import { getSessionFromRequest } from "../../../lib/auth.js";

export const runtime = "nodejs";

const PAGE_SIZE = 10;

export async function GET(req) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return new Response(JSON.stringify({ error: "認証が必要です。" }), { status: 401 });
  }

  await ensureSchema();
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || null; // "YYYY-MM" 形式、未指定なら全期間
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const { rows: countRows } = await sql`
    SELECT COUNT(*)::int AS total
    FROM generated_files
    WHERE user_id = ${session.userId}
      AND (${month}::text IS NULL OR to_char(created_at, 'YYYY-MM') = ${month})
  `;
  const total = countRows[0].total;

  const { rows: files } = await sql`
    SELECT id, title, summary, file_size, created_at
    FROM generated_files
    WHERE user_id = ${session.userId}
      AND (${month}::text IS NULL OR to_char(created_at, 'YYYY-MM') = ${month})
    ORDER BY created_at DESC
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  `;

  return new Response(
    JSON.stringify({ files, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

