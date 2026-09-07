"use client";

import { useState } from "react";

export default function AccountPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("新しいパスワード（確認）が一致しません。");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "パスワードの変更に失敗しました。");
      setDone(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "パスワードの変更に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="gradient-line" />
      <h1>パスワード変更</h1>
      <p className="subtitle">ログイン中のご自身のパスワードを変更します。</p>

      {error && <div className="error">{error}</div>}
      {done && <div className="notice-success">パスワードを変更しました。</div>}

      <form className="login-card" onSubmit={handleSubmit}>
        <label htmlFor="currentPassword">現在のパスワード</label>
        <input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <label htmlFor="newPassword">新しいパスワード（6文字以上）</label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={6}
        />
        <label htmlFor="confirmPassword">新しいパスワード（確認）</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={6}
        />
        <button type="submit" disabled={busy}>
          {busy ? "変更中…" : "パスワードを変更"}
        </button>
      </form>

      <p className="footer-note">
        <a href="/">← パワポ生成画面に戻る</a>
      </p>
    </div>
  );
}
