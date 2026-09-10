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

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/admin/files?userId=${userId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setUser(data.user);
        setFiles(data.files);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  return (
    <div className="page admin-page">
      <div className="gradient-line" />
      <h1>生成資料の履歴</h1>
      <p className="subtitle">
        {user ? `${user.email}${user.department ? `（${user.department}）` : ""}が作成した資料の一覧です。` : ""}
      </p>

      {error && <div className="error">{error}</div>}

      <div className="admin-panel">
        {loading ? (
          <p>読み込み中…</p>
        ) : files.length === 0 ? (
          <p>まだ資料の生成履歴はありません。</p>
        ) : (
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
        )}
      </div>

      <p className="footer-note">
        <a href="/admin">← 管理画面に戻る</a>
      </p>
    </div>
  );
}
