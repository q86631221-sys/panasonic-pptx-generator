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
  const fromDate = searchParams.get("from") || "1970-01-01";
  const toDate = searchParams.get("to") || "2999-12-31";

  const { rows: byUser } = await sql`
    SELECT u.id, u.email, u.department,
           COALESCE(SUM(d.api_calls), 0)::int AS api_calls,
           COALESCE(SUM(d.tokens_used), 0)::bigint AS tokens_used
    FROM users u
    LEFT JOIN usage_daily d
      ON d.user_id = u.id AND d.usage_date BETWEEN ${fromDate} AND ${toDate}
    GROUP BY u.id, u.email, u.department
    ORDER BY tokens_used DESC
  `;

  const { rows: byDept } = await sql`
    SELECT COALESCE(NULLIF(u.department, ''), '未設定') AS department,
           COALESCE(SUM(d.api_calls), 0)::int AS api_calls,
           COALESCE(SUM(d.tokens_used), 0)::bigint AS tokens_used
    FROM users u
    LEFT JOIN usage_daily d
      ON d.user_id = u.id AND d.usage_date BETWEEN ${fromDate} AND ${toDate}
    GROUP BY COALESCE(NULLIF(u.department, ''), '未設定')
    ORDER BY tokens_used DESC
  `;

  const { rows: daily } = await sql`
    SELECT d.usage_date, u.email, u.department, d.api_calls, d.tokens_used
    FROM usage_daily d
    JOIN users u ON u.id = d.user_id
    WHERE d.usage_date BETWEEN ${fromDate} AND ${toDate}
    ORDER BY d.usage_date DESC, u.email
  `;

  return new Response(JSON.stringify({ byUser, byDept, daily }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
