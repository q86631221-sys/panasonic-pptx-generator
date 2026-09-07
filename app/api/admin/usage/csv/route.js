import { sql, ensureSchema } from "../../../../../lib/db.js";
import { getSessionFromRequest } from "../../../../../lib/auth.js";

export const runtime = "nodejs";

function escapeCsv(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export async function GET(req) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return new Response(JSON.stringify({ error: "権限がありません。" }), { status: 403 });
  }

  await ensureSchema();
  const { searchParams } = new URL(req.url);
  const fromDate = searchParams.get("from") || "1970-01-01";
  const toDate = searchParams.get("to") || "2999-12-31";

  const { rows } = await sql`
    SELECT d.usage_date, u.email, u.department, d.api_calls, d.tokens_used
    FROM usage_daily d
    JOIN users u ON u.id = d.user_id
    WHERE d.usage_date BETWEEN ${fromDate} AND ${toDate}
    ORDER BY d.usage_date, u.email
  `;

  const header = ["日付", "メールアドレス", "部署", "API呼び出し回数", "トークン数"].join(",");
  const lines = rows.map((r) =>
    [r.usage_date, r.email, r.department, r.api_calls, r.tokens_used].map(escapeCsv).join(",")
  );
  // Excelでの文字化け対策としてBOMを付与
  const csv = "\uFEFF" + [header, ...lines].join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="usage_${fromDate}_${toDate}.csv"`,
    },
  });
}
