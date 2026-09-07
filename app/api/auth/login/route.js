import { sql, ensureSchema } from "../../../../lib/db.js";
import { verifyPassword, signSession, SESSION_COOKIE, SESSION_MAX_AGE } from "../../../../lib/auth.js";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    await ensureSchema();
    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "メールアドレスとパスワードを入力してください。" }), { status: 400 });
    }

    const { rows } = await sql`SELECT * FROM users WHERE email = ${email}`;
    const user = rows[0];
    if (!user) {
      return new Response(JSON.stringify({ error: "メールアドレスまたはパスワードが正しくありません。" }), { status: 401 });
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return new Response(JSON.stringify({ error: "メールアドレスまたはパスワードが正しくありません。" }), { status: 401 });
    }

    const token = await signSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      department: user.department,
    });

    const res = new Response(JSON.stringify({ ok: true, role: user.role }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.headers.append(
      "Set-Cookie",
      `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}${secureFlag}`
    );
    return res;
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message || "ログインに失敗しました。" }), { status: 500 });
  }
}
