import pptxgen from "pptxgenjs";
import * as P from "./lib/panasonicHelpers.js";

const pres = new pptxgen();
pres.layout = P.LAYOUT;
P.defineMasters(pres);
P.coverSlide(pres, {
  title: "全レイアウトパターン一覧（ダミーデータ）",
  subtitleLines: ["社内テンプレート パワポ自動生成システム", "2026年9月　動作確認用"],
});

const slidesData = [
  {
    title: "箇条書き",
    headMessage: "最も基本的な文章中心のレイアウト",
    bodyType: "bullets",
    bullets: [
      { text: "1つ目の要点をここに記載する", emphasis: false },
      { text: "特に重要な項目は赤字で強調できる", emphasis: true },
      { text: "3つ目の要点、詳細情報や背景を補足する", emphasis: false },
      { text: "4つ目の要点をここに記載する", emphasis: false },
    ],
  },
  {
    title: "表",
    headMessage: "複数項目・複数列の比較データを構造化",
    bodyType: "table",
    table: {
      keyHeader: "項目",
      columns: ["2025年度", "2026年度", "増減"],
      rows: [
        ["売上高", "120億円", "132億円", "+10%"],
        ["営業利益", "18億円", "21億円", "+16.7%"],
        ["従業員数", "450名", "480名", "+30名"],
      ],
    },
  },
  {
    title: "数値ハイライト",
    headMessage: "最も訴求力のある単一実績を補足と共に強調",
    bodyType: "stat_highlight",
    bullets: [
      { text: "前年から大幅な伸びを達成", emphasis: true },
      { text: "主要因は新規顧客獲得の増加", emphasis: false },
    ],
    stat: { value: "132", unit: "億円", label: "2026年度売上高" },
  },
  {
    title: "ウォーターフォール図",
    headMessage: "起点から複数要因を経て着地点に至る差異分析",
    bodyType: "waterfall",
    waterfall: {
      unit: "百万円",
      bars: [
        { label: "期初計画", value: 1000, kind: "total" },
        { label: "販売増", value: 150, kind: "increase" },
        { label: "コスト増", value: 80, kind: "decrease" },
        { label: "為替影響", value: 30, kind: "decrease" },
        { label: "期末実績", value: 1040, kind: "total" },
      ],
    },
  },
  {
    title: "左右2カラム",
    headMessage: "性質の異なる2つの情報を左右に並べて提示",
    bodyType: "two_column",
    left: { heading: "現状の課題", bodyType: "bullets", bullets: ["対応工数が多い", "属人化している"] },
    right: { heading: "改善の方向性", bodyType: "bullets", bullets: ["自動化ツール導入", "マニュアル整備"] },
  },
  {
    title: "比較カード",
    headMessage: "複数案・選択肢を横並びで比較評価",
    bodyType: "comparison_cards",
    cards: [
      { title: "案A：自社開発", sections: [{ label: "評価される点", items: ["柔軟性が高い", "長期コスト低"] }, { label: "指摘事項", items: ["初期投資が大きい"] }] },
      { title: "案B：外部委託", sections: [{ label: "評価される点", items: ["導入が早い"] }, { label: "指摘事項", items: ["継続コスト増", "自由度が低い"] }] },
    ],
    summary: "総合的には自社開発が中長期的に優位",
  },
  {
    title: "積み上げ棒グラフ",
    headMessage: "複数カテゴリ×複数系列の内訳推移を可視化",
    bodyType: "stacked_bar",
    categories: ["4月", "5月", "6月", "7月"],
    series: [
      { name: "既存", values: [80, 85, 90, 95] },
      { name: "新規", values: [20, 30, 45, 60] },
    ],
  },
  {
    title: "円グラフ",
    headMessage: "全体に対する構成比を単一時点で提示",
    bodyType: "pie_chart",
    slices: [
      { label: "製品A", value: 42 },
      { label: "製品B", value: 28 },
      { label: "製品C", value: 18 },
      { label: "その他", value: 12 },
    ],
  },
  {
    title: "数値ハイライト（複数）",
    headMessage: "訴求力のある複数のKPIを並列表示",
    bodyType: "stat_row",
    stats: [
      { value: "142", unit: "件", label: "新規契約数" },
      { value: "2.1", unit: "%", label: "解約率" },
      { value: "94", unit: "%", label: "顧客満足度" },
    ],
    bullets: ["全指標が前年を上回る結果に"],
  },
  {
    title: "手順リスト",
    headMessage: "手順・使い方を順序立てて説明",
    bodyType: "numbered_steps",
    steps: [
      { text: "申請フォームに必要事項を入力する" },
      { text: "上長の承認を得る" },
      { text: "システムに登録し完了通知を受け取る" },
    ],
    note: "承認までに2営業日を要する点に注意",
  },
  {
    title: "構成比の変化",
    headMessage: "ある構成比が複数時点でどう変化したかを比較",
    bodyType: "share_bars",
    groups: [
      { title: "2020年", segments: [{ label: "A社", value: 45 }, { label: "B社", value: 35 }, { label: "その他", value: 20 }] },
      { title: "2026年", segments: [{ label: "A社", value: 32 }, { label: "B社", value: 40 }, { label: "その他", value: 28 }] },
    ],
    insight: "B社のシェアが6年間で拡大傾向",
    takeaway: "競争環境は流動的であり継続監視が必要",
  },
  {
    title: "上下2段",
    headMessage: "性質の異なる2つの情報を上下に積んで提示",
    bodyType: "two_row",
    top: { heading: "実績サマリー", bodyType: "table", table: { keyHeader: "項目", columns: ["値"], rows: [["売上", "132億円"]] } },
    bottom: { heading: "所感", bodyType: "bullets", bullets: ["堅調に推移している"] },
  },
  {
    title: "工程フロー",
    headMessage: "段階が左から右へ矢印でつながる工程を提示",
    bodyType: "process_flow",
    steps: [
      { label: "受付", sublabel: "24時間対応" },
      { label: "審査", sublabel: "1営業日", emphasis: true },
      { label: "承認", sublabel: "" },
      { label: "実行", sublabel: "" },
    ],
    captions: ["自動受付", "重点確認工程", "", "完了通知送付"],
  },
  {
    title: "フェーズマトリクス",
    headMessage: "複数フェーズ×複数カテゴリの全体像を提示",
    bodyType: "phase_matrix",
    phases: [{ title: "計画" }, { title: "実行" }, { title: "検証" }],
    rows: [
      { label: "成果物", cells: [["企画書"], ["試作品"], ["評価報告書"]] },
      { label: "課題", cells: [["予算調整"], ["人員不足"], ["品質基準"]] },
    ],
  },
  {
    title: "横並びステップカード",
    headMessage: "独立した施策を番号付きカードで並列提示",
    bodyType: "step_cards",
    steps: [
      { number: 1, heading: "現状分析", body: "市場動向と自社ポジションを整理する" },
      { number: 2, heading: "施策立案", body: "優先度の高い課題への対策を検討する" },
      { number: 3, heading: "実行検証", body: "小規模試行の上で本格展開する" },
    ],
    note: "各ステップは2週間サイクルで進行",
  },
  {
    title: "ランキングリスト",
    headMessage: "複数項目を順位付き・数値強調で提示",
    bodyType: "ranking_list",
    listTitle: "地域別シェア（2026年上期）",
    items: [
      { rank: 1, label: "関東", value: "38%" },
      { rank: 2, label: "関西", value: "24%" },
      { rank: 3, label: "中部", value: "19%" },
    ],
  },
  {
    title: "KPIグリッド",
    headMessage: "カテゴリ×指標をトレンド矢印付きで一覧提示",
    bodyType: "stat_grid",
    groups: [
      { title: "営業部門", cells: [{ label: "売上高", value: "12.4億円", trend: "up", change: "+8.2%" }, { label: "解約率", value: "2.1%", trend: "down", change: "-0.4pt" }] },
      { title: "開発部門", cells: [{ label: "リリース数", value: "8件", trend: "up", change: "+3件" }, { label: "工期遵守率", value: "94%", trend: "flat", change: "±0pt" }] },
    ],
  },
  {
    title: "セクション大見出し",
    headMessage: "章の区切りとして大きな主張を提示",
    bodyType: "section_header",
    statement: "全社DX推進の具体的な実行計画",
    subtext: "各部門の役割分担とスケジュールを次頁より説明する",
  },
  {
    title: "全体像＋詳細フロー",
    headMessage: "全体の道のりと現在地・詳細工程を1枚で提示",
    bodyType: "journey_map",
    stages: [
      { label: "認知", current: false },
      { label: "検討", current: true },
      { label: "提案", current: false },
      { label: "成約", current: false },
    ],
    steps: [
      { number: 1, label: "課題ヒアリング" },
      { number: 2, label: "要件整理" },
      { number: 3, label: "提案書作成" },
    ],
    summary: "検討段階での丁寧なヒアリングが成約率向上の鍵",
  },
  {
    title: "スイムレーン業務フロー",
    headMessage: "複数の役割にまたがる業務の流れを可視化",
    bodyType: "swimlane_flow",
    stageLabels: ["受付", "一次対応", "調査", "回答"],
    lanes: [
      { role: "顧客", activities: ["問い合わせ送信", null, null, "回答受領"] },
      { role: "担当者", activities: [null, "内容確認", "原因調査", "回答作成"] },
      { role: "システム", activities: ["自動受付", "担当割当", null, "送信記録"] },
    ],
  },
];

const total = slidesData.length + 1;
slidesData.forEach((s, idx) => {
  const slide = pres.addSlide({ masterName: P.MASTER_CONTENT_IUO });
  P.contentChromeMaster(slide, idx + 2, total, s.title, s.headMessage);
  P.renderBody(pres, slide, s);
});
P.endSlide(pres);
await pres.writeFile({ fileName: "全レイアウトパターン一覧.pptx" });
console.log(`生成完了：全${slidesData.length}レイアウト`);
