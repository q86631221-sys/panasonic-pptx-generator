"use client";

import { useState, useEffect } from "react";

export default function AdminPage() {
  const [tab, setTab] = useState("users");

  return (
    <div className="page admin-page">
      <div className="gradient-line" />
      <h1>管理画面</h1>
      <p className="subtitle">ユーザー管理・API利用状況・部署別サマリの確認ができます。</p>

      <div className="admin-tabs">
        <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}>
          ユーザー管理
        </button>
        <button className={tab === "usage" ? "active" : ""} onClick={() => setTab("usage")}>
          利用状況・部署サマリ
        </button>
        <button className={tab === "departments" ? "active" : ""} onClick={() => setTab("departments")}>
          部署マスタ
        </button>
      </div>

      {tab === "users" && <UsersPanel />}
      {tab === "usage" && <UsagePanel />}
      {tab === "departments" && <DepartmentsPanel />}

      <p className="footer-note">
        <a href="/">← パワポ生成画面に戻る</a>
      </p>
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "", department: "", role: "general" });
  const [creating, setCreating] = useState(false);
  const [pendingReset, setPendingReset] = useState({});

  async function loadDepartments() {
    try {
      const res = await fetch("/api/admin/departments");
      const data = await res.json();
      if (res.ok) setDepartments(data.departments);
    } catch {
      // 部署一覧の取得失敗はユーザー管理自体をブロックしない
    }
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    loadDepartments();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm({ email: "", password: "", department: "", role: "general" });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(id, patch) {
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const DEFAULT_RESET_PASSWORD = "PASD1234";

  function handleResetPassword(id) {
    setPendingReset((prev) => ({ ...prev, [id]: true }));
  }

  async function handleApplyReset(id) {
    await handleUpdate(id, { password: DEFAULT_RESET_PASSWORD });
    setPendingReset((prev) => ({ ...prev, [id]: false }));
  }

  async function handleDelete(id) {
    if (!window.confirm("このユーザーを削除しますか？この操作は取り消せません。")) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-panel">
      {error && <div className="error">{error}</div>}

      <form className="admin-create-form" onSubmit={handleCreate}>
        <h3>新規ユーザー追加</h3>
        <div className="admin-form-row">
          <input
            type="email"
            placeholder="メールアドレス（ログインID）"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="初期パスワード"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
            <option value="">部署を選択</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="general">一般</option>
            <option value="admin">管理者</option>
          </select>
          <button type="submit" disabled={creating}>
            追加
          </button>
        </div>
      </form>

      {loading ? (
        <p>読み込み中…</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>メールアドレス</th>
              <th>部署</th>
              <th>権限</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>
                  <select
                    defaultValue={u.department}
                    onChange={(e) => handleUpdate(u.id, { department: e.target.value })}
                  >
                    <option value="">未設定</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select defaultValue={u.role} onChange={(e) => handleUpdate(u.id, { role: e.target.value })}>
                    <option value="general">一般</option>
                    <option value="admin">管理者</option>
                  </select>
                </td>
                <td className="admin-actions">
                  <button type="button" className="admin-btn-secondary" onClick={() => handleResetPassword(u.id)}>
                    PWリセット
                  </button>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    disabled={!pendingReset[u.id]}
                    onClick={() => handleApplyReset(u.id)}
                  >
                    反映
                  </button>
                  <button type="button" className="admin-btn-danger" onClick={() => handleDelete(u.id)}>
                    削除
                  </button>
                  {pendingReset[u.id] && (
                    <span className="admin-reset-notice">「{DEFAULT_RESET_PASSWORD}」に変更予定。反映ボタンで確定します。</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function UsagePanel() {
  const [data, setData] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/admin/usage?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCsv() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    window.location.href = `/api/admin/usage/csv?${params.toString()}`;
  }

  return (
    <div className="admin-panel">
      {error && <div className="error">{error}</div>}

      <div className="admin-form-row">
        <label>期間：</label>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <span>〜</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <button type="button" onClick={load}>
          絞り込み
        </button>
        <button type="button" className="admin-btn-secondary" onClick={handleCsv}>
          CSVダウンロード
        </button>
      </div>

      {loading ? (
        <p>読み込み中…</p>
      ) : (
        data && (
          <>
            <h3>部署別サマリ（経費配分の目安）</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>部署</th>
                  <th>API呼び出し回数</th>
                  <th>トークン数</th>
                </tr>
              </thead>
              <tbody>
                {data.byDept.map((d) => (
                  <tr key={d.department}>
                    <td>{d.department}</td>
                    <td>{d.api_calls}</td>
                    <td>{Number(d.tokens_used).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>ユーザー別サマリ</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>メールアドレス</th>
                  <th>部署</th>
                  <th>API呼び出し回数</th>
                  <th>トークン数</th>
                </tr>
              </thead>
              <tbody>
                {data.byUser.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.department}</td>
                    <td>{u.api_calls}</td>
                    <td>{Number(u.tokens_used).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )
      )}
    </div>
  );
}

function DepartmentsPanel() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/departments");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDepartments(data.departments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewName("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleRename(id, oldName) {
    const newVal = window.prompt("新しい部署名を入力してください", oldName);
    if (!newVal || newVal.trim() === oldName) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/departments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newVal.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`部署「${name}」を削除しますか？既にこの部署名が設定されているユーザーの表記はそのまま残ります。`)) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/departments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-panel">
      {error && <div className="error">{error}</div>}

      <form className="admin-create-form" onSubmit={handleCreate}>
        <h3>部署を追加</h3>
        <div className="admin-form-row">
          <input
            type="text"
            placeholder="部署名（例：営業企画部）"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <button type="submit" disabled={creating}>
            追加
          </button>
        </div>
      </form>

      {loading ? (
        <p>読み込み中…</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>部署名</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td className="admin-actions">
                  <button type="button" className="admin-btn-secondary" onClick={() => handleRename(d.id, d.name)}>
                    名称変更
                  </button>
                  <button type="button" className="admin-btn-danger" onClick={() => handleDelete(d.id, d.name)}>
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
