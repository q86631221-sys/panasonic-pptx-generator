"use client";

import { useState, useRef, useEffect } from "react";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

const CHART_LABELS = {
  table: "表",
  stacked_bar: "積み上げ棒グラフ",
  pie_chart: "円グラフ",
  share_bars: "構成比の変化グラフ",
  waterfall: "ウォーターフォール図",
  stat_row: "数値ハイライト（複数）",
  stat_highlight: "数値ハイライト（単一）",
  none: "グラフ・表は使わない",
};

let uid = 0;
function nextId() {
  uid += 1;
  return uid;
}

export default function Home() {
  const [messages, setMessages] = useState([
    { id: nextId(), role: "bot", content: "資料に入れたい内容を教えてください。箇条書きでも文章でも構いません。" },
  ]);
  const [step, setStep] = useState("main_text");
  const [mainText, setMainText] = useState("");
  const [originalQuestion, setOriginalQuestion] = useState("");
  const [textInput, setTextInput] = useState("");
  const [dateInput, setDateInput] = useState(todayStr());
  const [analysis, setAnalysis] = useState(null);
  const [answers, setAnswers] = useState({
    department: "",
    dateStr: "",
    audience: "internal",
    includeIuo: true,
    chartPreference: "auto",
    includeInsight: null,
    slideCountTarget: null,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]); // [{ id, name, text, status: 'uploading'|'done'|'error' }]
  const [isDragging, setIsDragging] = useState(false);
  const [me, setMe] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const fileInputRef = useRef(null);
  const logEndRef = useRef(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setMe(data))
      .catch(() => setMe(null));
  }, []);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("gemini_api_key") : null;
    if (saved) setApiKey(saved);
  }, []);

  function handleApiKeyChange(value) {
    setApiKey(value);
    if (typeof window !== "undefined") {
      if (value) window.localStorage.setItem("gemini_api_key", value);
      else window.localStorage.removeItem("gemini_api_key");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  function pushBot(content) {
    setMessages((m) => [...m, { id: nextId(), role: "bot", content }]);
  }
  function pushUser(content) {
    setMessages((m) => [...m, { id: nextId(), role: "user", content }]);
  }

  const MAX_FILES = 5;
  const ACCEPTED_EXT = [".pdf", ".txt", ".md", ".csv"];

  function isAcceptedFile(file) {
    const name = (file.name || "").toLowerCase();
    return (
      file.type === "application/pdf" ||
      file.type.startsWith("text/") ||
      ACCEPTED_EXT.some((ext) => name.endsWith(ext))
    );
  }

  async function uploadOneFile(file) {
    const id = nextId();
    setAttachedFiles((prev) => [...prev, { id, name: file.name, text: "", status: "uploading" }]);
    try {
      const dataBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
        reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました。"));
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/extract-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, mimeType: file.type, dataBase64 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "ファイルの解析に失敗しました。");
      setAttachedFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, text: data.text, status: "done" } : f))
      );
    } catch (err) {
      setAttachedFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: "error", error: err.message } : f))
      );
    }
  }

  function handleFilesAdded(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const room = MAX_FILES - attachedFiles.length;
    if (room <= 0) {
      setError(`参考資料は最大${MAX_FILES}件まで添付できます。`);
      return;
    }
    const accepted = files.filter(isAcceptedFile).slice(0, room);
    const rejected = files.filter((f) => !isAcceptedFile(f));
    if (rejected.length) {
      setError("PDF・テキスト(.txt/.md/.csv)のみ添付できます。対応外のファイルはスキップしました。");
    } else {
      setError("");
    }
    accepted.forEach((file) => uploadOneFile(file));
  }

  function handleFileInputChange(e) {
    handleFilesAdded(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemoveAttachment(id) {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function handleDragOver(e) {
    e.preventDefault();
    if (step === "main_text") setIsDragging(true);
  }
  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }
  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (step !== "main_text") return;
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
      handleFilesAdded(e.dataTransfer.files);
    }
  }

  function handlePaste(e) {
    const items = e.clipboardData && e.clipboardData.files;
    if (items && items.length) {
      // クリップボードにファイル（画像のスクリーンショット等を含む）が含まれる場合は添付として扱う。
      // テキストのみの通常の貼り付けはブラウザ標準の動作に任せる。
      handleFilesAdded(items);
    }
  }

  const uploading = attachedFiles.some((f) => f.status === "uploading");

  async function handleMainTextSubmit() {
    if (!textInput.trim()) return;
    const value = textInput.trim();
    const doneFiles = attachedFiles.filter((f) => f.status === "done" && f.text);
    const referenceBlock = doneFiles
      .map((f) => `\n\n# 参考資料（${f.name}）\n${f.text}`)
      .join("");
    const combined = value + referenceBlock;
    setMainText(combined);
    setOriginalQuestion(value);
    const fileNames = doneFiles.map((f) => `📎 ${f.name}`).join("\n");
    pushUser(
      (value.length > 80 ? value.slice(0, 80) + "…" : value) + (fileNames ? `\n${fileNames}` : "")
    );
    setTextInput("");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: combined, apiKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "分析に失敗しました。");
      setAnalysis(data);
      pushBot("ありがとうございます。いくつか確認させてください。まず、部署名を教えてください（任意）。");
      setStep("department");
    } catch (err) {
      setError(err.message || "分析中にエラーが発生しました。");
      pushBot("分析中にエラーが発生しました。もう一度内容を送っていただけますか？");
    } finally {
      setBusy(false);
    }
  }

  function handleDepartmentSubmit(skip) {
    const value = skip ? "" : textInput.trim();
    setAnswers((a) => ({ ...a, department: value }));
    pushUser(value || "（未入力）");
    setTextInput("");
    pushBot(`日付表記を教えてください（任意、既定は「${dateInput}」です）。`);
    setStep("date");
  }

  function handleDateSubmit(useDefault) {
    const value = useDefault ? dateInput : textInput.trim() || dateInput;
    setAnswers((a) => ({ ...a, dateStr: value }));
    pushUser(value || "（未入力）");
    setTextInput("");
    pushBot("資料の読み手を教えてください。");
    setStep("audience");
  }

  function handleAudienceSelect(value) {
    setAnswers((a) => ({ ...a, audience: value }));
    pushUser(value === "internal" ? "社内向け" : "社外・PB店向け");
    pushBot("表紙・各ページ右上にIUO（Internal Use Only）表示を含めますか？");
    setStep("iuo");
  }

  function handleIuoSelect(value) {
    setAnswers((a) => ({ ...a, includeIuo: value }));
    pushUser(value ? "含める" : "含めない");
    proceedAfterIuo();
  }

  function proceedAfterIuo() {
    if (analysis && analysis.hasAnalysisData) {
      const s = analysis.chartSuggestion;
      const reasonText = s && s.reason ? `（理由：${s.reason}）` : "";
      const label = s ? s.label || CHART_LABELS[s.type] || s.type : "表またはグラフ";
      pushBot(`入力内容に分析データが含まれているようです。おすすめの表現方法は「${label}」です${reasonText}。この形式でよろしいですか？`);
      setStep("chart_choice");
    } else {
      pushBot(`内容から想定される本文スライド枚数は約${analysis?.suggestedSlideCount ?? 6}枚です${analysis?.slideCountReason ? `（理由：${analysis.slideCountReason}）` : ""}。枚数はこのままでよいですか？`);
      setStep("slide_count");
    }
  }

  function handleChartSelect(type, label) {
    setAnswers((a) => ({ ...a, chartPreference: type }));
    pushUser(label);
    pushBot("分析内容について、AIとしての気づき・所感を加えますか？（データから読み取れる範囲に留め、拡大解釈は行いません）");
    setStep("insight");
  }

  function handleInsightSelect(value) {
    setAnswers((a) => ({ ...a, includeInsight: value }));
    pushUser(value ? "所感を加える" : "所感は加えない");
    pushBot(`内容から想定される本文スライド枚数は約${analysis?.suggestedSlideCount ?? 6}枚です${analysis?.slideCountReason ? `（理由：${analysis.slideCountReason}）` : ""}。枚数はこのままでよいですか？`);
    setStep("slide_count");
  }

  function handleSlideCountSelect(kind) {
    const base = analysis?.suggestedSlideCount ?? 6;
    let target = base;
    let label = "このまま";
    if (kind === "fewer") {
      target = Math.max(3, base - 2);
      label = "少なくする";
    } else if (kind === "more") {
      target = Math.min(10, base + 2);
      label = "多くする";
    }
    setAnswers((a) => ({ ...a, slideCountTarget: target }));
    pushUser(label);
    pushBot("内容を確認しました。この内容でパワポ資料を生成します。よろしいですか？");
    setStep("confirm");
  }

  async function handleGenerate() {
    pushUser("生成する");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: mainText,
          originalQuestion,
          department: answers.department,
          dateStr: answers.dateStr,
          audience: answers.audience,
          includeIuo: answers.includeIuo,
          chartPreference: answers.chartPreference,
          includeInsight: answers.includeInsight,
          slideCountTarget: answers.slideCountTarget,
          apiKey,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `生成に失敗しました (${res.status})`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      let filename = "generated.pptx";
      const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      if (utf8Match) {
        filename = decodeURIComponent(utf8Match[1]);
      } else {
        const plainMatch = disposition.match(/filename="?([^";]+)"?/i);
        if (plainMatch) filename = plainMatch[1];
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      pushBot("パワポを生成しました。内容は必ずご自身でご確認ください。");
      setStep("done");
    } catch (err) {
      setError(err.message || "生成中にエラーが発生しました。");
      pushBot("生成中にエラーが発生しました。もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  function handleRestart() {
    setMessages([{ id: nextId(), role: "bot", content: "資料に入れたい内容を教えてください。箇条書きでも文章でも構いません。" }]);
    setStep("main_text");
    setMainText("");
    setOriginalQuestion("");
    setTextInput("");
    setAnalysis(null);
    setAnswers({
      department: "",
      dateStr: "",
      audience: "internal",
      includeIuo: true,
      chartPreference: "auto",
      includeInsight: null,
      slideCountTarget: null,
    });
    setError("");
    setAttachedFiles([]);
  }

  function handleKeyDown(e, submitFn) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitFn();
    }
  }

  return (
    <div className="page">
      <div className="gradient-line" />
      <h1>社内テンプレート パワポ自動生成</h1>
      <p className="subtitle">チャットでいくつか質問しながら、社内フォーマットのパワーポイント資料を生成します。</p>

      <div className="userbar">
        <span className="userbar-info">
          {me ? `${me.email}${me.department ? `（${me.department}）` : ""}` : ""}
        </span>
        <div className="userbar-actions">
          {me && me.role === "admin" && <a href="/admin">管理画面</a>}
          <a href="/history">マイ履歴</a>
          <a href="/account">パスワード変更</a>
          <button type="button" className="userbar-logout" onClick={handleLogout}>
            ログアウト
          </button>
        </div>
      </div>

      <div className="apikey-bar">
        <label htmlFor="apiKeyInput" className="apikey-label">Gemini APIキー（任意）</label>
        <input
          id="apiKeyInput"
          type={showApiKey ? "text" : "password"}
          className="apikey-input"
          value={apiKey}
          onChange={(e) => handleApiKeyChange(e.target.value)}
          placeholder="未入力の場合はサーバー側の共通キーを使用します"
          autoComplete="off"
        />
        <button type="button" className="apikey-toggle" onClick={() => setShowApiKey((v) => !v)}>
          {showApiKey ? "隠す" : "表示"}
        </button>
        <a
          className="apikey-link"
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
        >
          APIキーを取得 ↗
        </a>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="chat-container">
        <div className="chat-log">
          {messages.map((m) => (
            <div key={m.id} className={`chat-bubble ${m.role}`}>
              {m.content}
            </div>
          ))}
          {busy && <div className="chat-bubble bot chat-loading">…</div>}
          <div ref={logEndRef} />
        </div>

        <div className="chat-input-area">
          {step === "main_text" && (
            <div
              className={`chat-main-input-wrap${isDragging ? " dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {attachedFiles.length > 0 && (
                <div className="chat-attachment-list">
                  {attachedFiles.map((f) => (
                    <div
                      key={f.id}
                      className={`chat-attachment-chip${f.status === "error" ? " error" : ""}`}
                      title={f.status === "error" ? f.error : undefined}
                    >
                      📎 {f.name}
                      {f.status === "uploading" && <span className="chat-attachment-status"> 読込中…</span>}
                      {f.status === "error" && <span className="chat-attachment-status"> 失敗</span>}
                      <button
                        type="button"
                        className="chat-attachment-remove"
                        onClick={() => handleRemoveAttachment(f.id)}
                        aria-label="添付を削除"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {isDragging && <div className="chat-dropzone-hint">ここにファイルをドロップして添付</div>}
              <div className="chat-input-row">
                <textarea
                  className="chat-textarea"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="例：新商品の企画概要、課題と対応策、実績データ等（ファイルのドラッグ&ドロップ・貼り付けも可）"
                  disabled={busy}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.txt,.md,.csv,application/pdf,text/plain,text/markdown,text/csv"
                  style={{ display: "none" }}
                  onChange={handleFileInputChange}
                />
                <button
                  type="button"
                  className="chat-attach-btn"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  disabled={busy || attachedFiles.length >= MAX_FILES}
                  title="参考資料を添付（PDF・テキスト、複数可）"
                >
                  📎 参考資料
                </button>
                <button onClick={handleMainTextSubmit} disabled={busy || uploading || !textInput.trim()}>
                  送信
                </button>
              </div>
            </div>
          )}

          {step === "department" && (
            <div className="chat-input-row">
              <input
                className="chat-text-input"
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, () => handleDepartmentSubmit(false))}
                placeholder="例：事業企画統括部"
                disabled={busy}
              />
              <button onClick={() => handleDepartmentSubmit(false)} disabled={busy}>送信</button>
              <button className="chat-skip-btn" onClick={() => handleDepartmentSubmit(true)} disabled={busy}>
                入力しない
              </button>
            </div>
          )}

          {step === "date" && (
            <div className="chat-input-row">
              <input
                className="chat-text-input"
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, () => handleDateSubmit(false))}
                placeholder={dateInput}
                disabled={busy}
              />
              <button onClick={() => handleDateSubmit(false)} disabled={busy}>送信</button>
              <button className="chat-skip-btn" onClick={() => handleDateSubmit(true)} disabled={busy}>
                「{dateInput}」のままにする
              </button>
            </div>
          )}

          {step === "audience" && (
            <div className="chat-options">
              <button onClick={() => handleAudienceSelect("internal")}>社内向け（体言止め）</button>
              <button onClick={() => handleAudienceSelect("external")}>社外・PB店向け（丁寧調）</button>
            </div>
          )}

          {step === "iuo" && (
            <div className="chat-options">
              <button onClick={() => handleIuoSelect(true)}>含める</button>
              <button onClick={() => handleIuoSelect(false)}>含めない</button>
            </div>
          )}

          {step === "chart_choice" && analysis && (
            <div className="chat-options">
              {analysis.chartSuggestion && (
                <button
                  onClick={() =>
                    handleChartSelect(
                      analysis.chartSuggestion.type,
                      `提案の通り（${analysis.chartSuggestion.label || CHART_LABELS[analysis.chartSuggestion.type] || analysis.chartSuggestion.type}）`
                    )
                  }
                >
                  提案の通りにする
                </button>
              )}
              {(analysis.chartAlternatives || []).map((c) => (
                <button key={c.type} onClick={() => handleChartSelect(c.type, `${c.label || CHART_LABELS[c.type] || c.type}にする`)}>
                  {c.label || CHART_LABELS[c.type] || c.type}にする
                </button>
              ))}
              <button onClick={() => handleChartSelect("none", "グラフ・表は使わない")}>グラフ・表は使わない</button>
            </div>
          )}

          {step === "insight" && (
            <div className="chat-options">
              <button onClick={() => handleInsightSelect(true)}>所感を加える</button>
              <button onClick={() => handleInsightSelect(false)}>所感は加えない</button>
            </div>
          )}

          {step === "slide_count" && (
            <div className="chat-options">
              <button onClick={() => handleSlideCountSelect("fewer")}>少なくする</button>
              <button onClick={() => handleSlideCountSelect("same")}>このまま</button>
              <button onClick={() => handleSlideCountSelect("more")}>多くする</button>
            </div>
          )}

          {step === "confirm" && (
            <div className="chat-options">
              <button onClick={handleGenerate} disabled={busy}>
                {busy ? "生成中…" : "パワポを生成してダウンロード"}
              </button>
            </div>
          )}

          {step === "done" && (
            <div className="chat-options">
              <button onClick={handleRestart}>最初からやり直す</button>
            </div>
          )}
        </div>
      </div>

      <p className="footer-note">内容は必ず生成後にご自身でご確認ください。</p>
    </div>
  );
}
