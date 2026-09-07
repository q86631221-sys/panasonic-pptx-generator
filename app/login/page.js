"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "ログインに失敗しました。");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err.message || "ログインに失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="gradient-line" />
      <h1>ログイン</h1>
      <p className="subtitle">社内テンプレート パワポ自動生成システム</p>

      {error && <div className="error">{error}</div>}

      <form className="login-card" onSubmit={handleSubmit}>
        <label htmlFor="email">メールアドレス</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />
        <label htmlFor="password">パスワード</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <button type="submit" disabled={busy}>
          {busy ? "ログイン中…" : "ログイン"}
        </button>
      </form>

      <p className="footer-note">パスワードを忘れた場合は、システム管理者にお問い合わせください。</p>
    </div>
  );
}
