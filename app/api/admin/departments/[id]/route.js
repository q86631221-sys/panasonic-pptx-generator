import { sql, ensureSchema } from "../../../../../lib/db.js";
import { getSessionFromRequest } from "../../../../../lib/auth.js";

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
  const deptId = Number(id);

  try {
    const { name } = await req.json();
    const trimmed = (name || "").trim();
    if (!trimmed) {
      return new Response(JSON.stringify({ error: "部署名を入力してください。" }), { status: 400 });
    }

    const { rows: existing } = await sql`SELECT name FROM departments WHERE id = ${deptId}`;
    if (!existing.length) {
      return new Response(JSON.stringify({ error: "部署が見つかりません。" }), { status: 404 });
    }
    const oldName = existing[0].name;

    await sql`UPDATE departments SET name = ${trimmed} WHERE id = ${deptId}`;
    // 既にこの部署名を使っているユーザーのdepartment表記も追従させる
    if (oldName !== trimmed) {
      await sql`UPDATE users SET department = ${trimmed} WHERE department = ${oldName}`;
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    const msg = /duplicate|unique/i.test(err.message || "") ? "この部署名は既に登録されています。" : err.message || "更新に失敗しました。";
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAdmin(req);
  if (!session) return new Response(JSON.stringify({ error: "権限がありません。" }), { status: 403 });

  await ensureSchema();
  const { id } = await params;
  const deptId = Number(id);

  await sql`DELETE FROM departments WHERE id = ${deptId}`;
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
