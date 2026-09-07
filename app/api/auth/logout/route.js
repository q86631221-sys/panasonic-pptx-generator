import { SESSION_COOKIE } from "../../../../lib/auth.js";

export const runtime = "nodejs";

export async function POST() {
  const res = new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
  res.headers.append("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return res;
}
