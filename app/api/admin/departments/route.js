import { sql, ensureSchema } from "../../../../lib/db.js";
import { getSessionFromRequest } from "../../../../lib/auth.js";

export const runtime = "nodejs";

async function requireAdmin(req) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") return null;
  return session;
}

export async function GET(req) {
  const session = await requireAdmin(req);
  if (!session) return new Response(JSON.stringify({ error: "権限がありません。" }), { status: 403 });

  await ensureSchema();
  const { rows } = await sql`SELECT id, name FROM departments ORDER BY name`;
  return new Response(JSON.stringify({ departments: rows }), { status: 200, headers: { "Content-Type": "application/json" } });
}

export async function POST(req) {
  const session = await requireAdmin(req);
  if (!session) return new Response(JSON.stringify({ error: "権限がありません。" }), { status: 403 });

  await ensureSchema();
  try {
    const { name } = await req.json();
    const trimmed = (name || "").trim();
    if (!trimmed) {
      return new Response(JSON.stringify({ error: "部署名を入力してください。" }), { status: 400 });
    }
    const { rows } = await sql`
      INSERT INTO departments (name) VALUES (${trimmed})
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name
    `;
    if (!rows.length) {
      return new Response(JSON.stringify({ error: "この部署名は既に登録されています。" }), { status: 409 });
    }
    return new Response(JSON.stringify({ ok: true, department: rows[0] }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message || "作成に失敗しました。" }), { status: 500 });
  }
}
