import { sql, ensureSchema } from "../../../../lib/db.js";
import { getSessionFromRequest, hashPassword } from "../../../../lib/auth.js";

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
  const { rows } = await sql`SELECT id, email, department, role, created_at FROM users ORDER BY id`;
  return new Response(JSON.stringify({ users: rows }), { status: 200, headers: { "Content-Type": "application/json" } });
}

export async function POST(req) {
  const session = await requireAdmin(req);
  if (!session) return new Response(JSON.stringify({ error: "権限がありません。" }), { status: 403 });

  await ensureSchema();
  try {
    const { email, password, department = "", role = "general" } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "メールアドレスとパスワードを入力してください。" }), { status: 400 });
    }
    if (!["general", "admin"].includes(role)) {
      return new Response(JSON.stringify({ error: "権限の指定が不正です。" }), { status: 400 });
    }
    const passwordHash = await hashPassword(password);
    await sql`
      INSERT INTO users (email, password_hash, department, role)
      VALUES (${email}, ${passwordHash}, ${department}, ${role})
    `;
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    const msg = /duplicate|unique/i.test(err.message || "")
      ? "このメールアドレスは既に登録されています。"
      : err.message || "作成に失敗しました。";
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
