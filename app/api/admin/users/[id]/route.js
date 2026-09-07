import { sql, ensureSchema } from "../../../../../lib/db.js";
import { getSessionFromRequest, hashPassword } from "../../../../../lib/auth.js";

export const runtime = "nodejs";

async function requireAdmin(req) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") return null;
  return session;
}

export async function PUT(req, { params }) {
  const session = await requireAdmin(req);
  if (!session) return new Response(JSON.stringify({ error: "権限がありません。" }), { status: 403 });

  await ensureSchema();
  const { id } = await params;
  const userId = Number(id);

  try {
    const body = await req.json();
    const { department, role, password } = body;

    if (department !== undefined) {
      await sql`UPDATE users SET department = ${department} WHERE id = ${userId}`;
    }
    if (role !== undefined) {
      if (!["general", "admin"].includes(role)) {
        return new Response(JSON.stringify({ error: "権限の指定が不正です。" }), { status: 400 });
      }
      if (userId === session.userId && role !== "admin") {
        return new Response(JSON.stringify({ error: "自分自身の権限は変更できません。" }), { status: 400 });
      }
      await sql`UPDATE users SET role = ${role} WHERE id = ${userId}`;
    }
    if (password) {
      if (password.length < 6) {
        return new Response(JSON.stringify({ error: "パスワードは6文字以上にしてください。" }), { status: 400 });
      }
      const passwordHash = await hashPassword(password);
      await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${userId}`;
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message || "更新に失敗しました。" }), { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAdmin(req);
  if (!session) return new Response(JSON.stringify({ error: "権限がありません。" }), { status: 403 });

  await ensureSchema();
  const { id } = await params;
  const userId = Number(id);

  if (userId === session.userId) {
    return new Response(JSON.stringify({ error: "自分自身は削除できません。" }), { status: 400 });
  }

  await sql`DELETE FROM users WHERE id = ${userId}`;
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
