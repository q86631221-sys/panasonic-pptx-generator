"use client";

import { useState } from "react";

export default function SetupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, department }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "セットアップに失敗しました。");
      setDone(true);
    } catch (err) {
      setError(err.message || "セットアップに失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="page">
        <div className="gradient-line" />
        <h1>セットアップ完了</h1>
        <p>管理者アカウントを作成しました。</p>
        <p>
          <a href="/login">ログイン画面へ進む →</a>
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="gradient-line" />
      <h1>初期セットアップ（初回のみ）</h1>
      <p className="subtitle">
        最初の管理者アカウントを作成します。既にユーザーが1人でも存在する場合、この画面は利用できません。
      </p>

      {error && <div className="error">{error}</div>}

      <form className="login-card" onSubmit={handleSubmit}>
        <label htmlFor="email">メールアドレス（管理者ログインID）</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label htmlFor="password">パスワード（6文字以上）</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <label htmlFor="department">部署</label>
        <input id="department" type="text" value={department} onChange={(e) => setDepartment(e.target.value)} />
        <button type="submit" disabled={busy}>
          {busy ? "作成中…" : "管理者アカウントを作成"}
        </button>
      </form>
    </div>
  );
}
