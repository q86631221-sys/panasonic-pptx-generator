import { getSessionFromRequest } from "../../../../lib/auth.js";

export const runtime = "nodejs";

export async function GET(req) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401 });
  }
  return new Response(
    JSON.stringify({ email: session.email, role: session.role, department: session.department }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
