import { sql, ensureSchema } from "../../../lib/db.js";
import { hashPassword } from "../../../lib/auth.js";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    await ensureSchema();

    const { rows } = await sql`SELECT COUNT(*)::int AS count FROM users`;
    if (rows[0].count > 0) {
      return new Response(
        JSON.stringify({ error: "既にユーザーが存在するため、初期セットアップは実行できません。管理者にログインIDの発行を依頼してください。" }),
        { status: 403 }
      );
    }

    const { email, password, department = "" } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "メールアドレスとパスワードを入力してください。" }), { status: 400 });
    }
    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "パスワードは6文字以上にしてください。" }), { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    await sql`
      INSERT INTO users (email, password_hash, department, role)
      VALUES (${email}, ${passwordHash}, ${department}, 'admin')
    `;

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message || "セットアップに失敗しました。" }), { status: 500 });
  }
}
