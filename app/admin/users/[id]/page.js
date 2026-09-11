"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UserFilesPage() {
  const params = useParams();
  const userId = params.id;
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [month, setMonth] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params2 = new URLSearchParams();
        params2.set("userId", userId);
        if (month) params2.set("month", month);
        params2.set("page", String(page));
        const res = await fetch(`/api/admin/files?${params2.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setUser(data.user);
        setFiles(data.files);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId, month, page]);

  function handleMonthChange(value) {
    setMonth(value);
    setPage(1);
  }

  return (
    <div className="page admin-page">
      <div className="gradient-line" />
      <h1>生成資料の履歴</h1>
      <p className="subtitle">
        {user ? `${user.email}${user.department ? `（${user.department}）` : ""}が作成した資料の一覧です。` : ""}
      </p>

      {error && <div className="error">{error}</div>}

      <div className="admin-panel">
        <div className="admin-form-row">
          <label>対象月：</label>
          <input type="month" value={month} onChange={(e) => handleMonthChange(e.target.value)} />
          {month && (
            <button type="button" className="admin-btn-secondary" onClick={() => handleMonthChange("")}>
              全期間に戻す
            </button>
          )}
          {total > 0 && <span className="file-history-count">全{total}件</span>}
        </div>

        {loading ? (
          <p>読み込み中…</p>
        ) : files.length === 0 ? (
          <p>該当する資料はありません。</p>
        ) : (
          <>
            <div className="file-history-list">
              {files.map((f) => (
                <div key={f.id} className="file-history-item">
                  <a href={`/api/admin/files/${f.id}`} className="file-history-title">
                    📄 {f.title}.pptx
                  </a>
                  <div className="file-history-meta">
                    {formatDate(f.created_at)}　・　{formatSize(f.file_size)}
                  </div>
                  <div className="file-history-summary">{f.summary || "（概要なし）"}</div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  ← 前へ
                </button>
                <span className="pagination-info">
                  ページ {page} / {totalPages}
                </span>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  次へ →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <p className="footer-note">
        <a href="/admin">← 管理画面に戻る</a>
      </p>
    </div>
  );
}

