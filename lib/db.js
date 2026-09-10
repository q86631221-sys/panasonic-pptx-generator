import { sql } from "@vercel/postgres";

let schemaEnsured = false;

/**
 * users / usage_daily テーブルが存在しなければ作成する。
 * Vercel Postgres (Neon) の接続情報は環境変数 POSTGRES_URL 等から
 * @vercel/postgres が自動的に読み取る。
 */
export async function ensureSchema() {
  if (schemaEnsured) return;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      department TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'general',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS usage_daily (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      usage_date DATE NOT NULL,
      api_calls INTEGER NOT NULL DEFAULT 0,
      tokens_used BIGINT NOT NULL DEFAULT 0,
      UNIQUE(user_id, usage_date)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS generated_files (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT '無題',
      summary TEXT NOT NULL DEFAULT '',
      file_data BYTEA NOT NULL,
      file_size INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  schemaEnsured = true;
}

export { sql };
