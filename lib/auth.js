import bcrypt from "bcryptjs";

// セッション署名用の秘密鍵。本番では SESSION_SECRET を必ず設定すること。
const SECRET = process.env.SESSION_SECRET || "panasonic-pptx-dev-secret-change-me";

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7日

// ---- パスワードハッシュ（bcryptjs, Node実行時のみ使用） ----
export async function hashPassword(pw) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw, hash) {
  return bcrypt.compare(pw, hash);
}

// ---- セッションCookie署名（Web Crypto APIを使用し、Edge/Node両ランタイムで動作） ----
function base64url(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64urlToBytes(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
async function hmac(data) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return base64url(new Uint8Array(sig));
}

export async function signSession(payload) {
  const body = base64url(
    new TextEncoder().encode(JSON.stringify({ ...payload, exp: Date.now() + SESSION_MAX_AGE * 1000 }))
  );
  const sig = await hmac(body);
  return `${body}.${sig}`;
}

export async function verifySession(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = await hmac(body);
  if (sig !== expected) return null;
  try {
    const json = new TextDecoder().decode(base64urlToBytes(body));
    const data = JSON.parse(json);
    if (data.exp && Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

/** API route (Node.js runtime) 内で、リクエストヘッダーからセッションを取得するヘルパー */
export async function getSessionFromRequest(req) {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  const token = match ? decodeURIComponent(match[1]) : null;
  return verifySession(token);
}
