import { sql, ensureSchema } from "../../../../lib/db.js";
import { getSessionFromRequest, hashPassword, verifyPassword } from "../../../../lib/auth.js";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return new Response(JSON.stringify({ error: "認証が必要です。再度ログインしてください。" }), { status: 401 });
    }

    await ensureSchema();
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return new Response(JSON.stringify({ error: "現在のパスワードと新しいパスワードを入力してください。" }), { status: 400 });
    }
    if (newPassword.length < 6) {
      return new Response(JSON.stringify({ error: "新しいパスワードは6文字以上にしてください。" }), { status: 400 });
    }

    const { rows } = await sql`SELECT * FROM users WHERE id = ${session.userId}`;
    const user = rows[0];
    if (!user) {
      return new Response(JSON.stringify({ error: "ユーザーが見つかりません。" }), { status: 404 });
    }

    const ok = await verifyPassword(currentPassword, user.password_hash);
    if (!ok) {
      return new Response(JSON.stringify({ error: "現在のパスワードが正しくありません。" }), { status: 401 });
    }

    const newHash = await hashPassword(newPassword);
    await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${session.userId}`;

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message || "パスワードの変更に失敗しました。" }), { status: 500 });
  }
}
