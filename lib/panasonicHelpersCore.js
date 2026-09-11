import path from "path";
import fs from "fs";
import { PANASONIC_LOGO_DATA_URI } from "./logoData.js";

export const NAVY = "001CAD";
export const HEADING_BG = "1F497D";
export const RED = "C00000";
export const BLACK = "000000";
export const DGRAY = "4E4C4F";
export const MGRAY = "A6A6A6";
export const LGRAY = "BFBFBF";
export const BLUE1 = "1F497D";
export const BLUE2 = "376092";
export const BLUE3 = "0282B7";
export const BLUE4 = "8EB4E3";
export const BLUE5 = "C6D9F1";
export const WHITE = "FFFFFF";
export const FONT = "Meiryo UI";

export const PT = (pt) => pt / 72;

// フォントサイズの最小値と刻み幅（10.5pt始まり、以降2pt刻み）
export const FS_MIN = 10.5;
export function FS(n) {
  if (n == null) return FS_MIN;
  if (n <= FS_MIN) return FS_MIN;
  return 12 + Math.ceil((n - 12) / 2) * 2;
}
// 0.2cm をポイント換算した左右余白（1cm = 28.3465pt）
export const MARGIN_0_2CM_PT = 0.2 * 28.3465;

export const LAYOUT = "LAYOUT_16x9";

const ASSETS_DIR = path.join(process.cwd(), "assets");

export function gradientLine(pres, slide, xPt, yPt, wPt, hPt) {
  gradientLineObjects(xPt, yPt, wPt, hPt).forEach((o) => {
    slide.addShape(pres.ShapeType.rect, o.rect);
  });
}

export function gradientLineObjects(xPt, yPt, wPt, hPt) {
  const stops = [
    [244, 160, 0],
    [250, 193, 11],
    [150, 199, 69],
  ];
  const slices = 48;
  const out = [];
  for (let i = 0; i < slices; i++) {
    const t = i / (slices - 1);
    const seg = t < 0.5 ? 0 : 1;
    const lt = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5;
    const c0 = stops[seg];
    const c1 = stops[seg + 1];
    const r = Math.round(c0[0] + (c1[0] - c0[0]) * lt);
    const g = Math.round(c0[1] + (c1[1] - c0[1]) * lt);
    const b = Math.round(c0[2] + (c1[2] - c0[2]) * lt);
    const hex = [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
    const sliceW = wPt / slices;
    out.push({
      rect: {
        x: PT(xPt + i * sliceW), y: PT(yPt), w: PT(sliceW + 0.5), h: PT(hPt),
        fill: { color: hex }, line: { type: "none" },
      },
    });
  }
  return out;
}

export function iuoBadge(pres, slide) {
  iuoBadgeObjects().forEach((o) => {
    if (o.rect) slide.addShape(pres.ShapeType.rect, o.rect);
    if (o.text) slide.addText(o.text.text, o.text.options);
  });
}

export function iuoBadgeObjects() {
  return [
    { rect: { x: PT(641.9), y: PT(3.3), w: PT(65.2), h: PT(15.6), fill: { color: RED }, line: { color: RED, width: 0.5 } } },
    { rect: { x: PT(669.6), y: PT(4.0), w: PT(36.9), h: PT(14.2), fill: { color: WHITE }, line: { type: "none" } } },
    { text: { text: "IUO", options: {
      x: PT(644.5), y: PT(3.7), w: PT(23), h: PT(14.5),
      fontFace: FONT, fontSize: 12, color: WHITE, align: "left", valign: "middle", margin: 0,
    } } },
    { text: { text: "Internal\nUseOnly", options: {
      x: PT(676.9), y: PT(5.2), w: PT(38), h: PT(12.1),
      fontFace: FONT, fontSize: 5, bold: true, color: RED, align: "left", valign: "middle", margin: 0, lineSpacingMultiple: 1.0,
    } } },
  ];
}

export function pageTitle(slide, text) {
  slide.addText(text, {
    x: PT(20), y: PT(8.6), w: PT(560), h: PT(29),
    fontFace: FONT, fontSize: FS(20), bold: true, color: BLACK,
    align: "left", valign: "middle", margin: 0, isTextBox: true,
  });
}

export function pageNumber(slide, n, total) {
  slide.addText(`${n} / ${total}`, {
    x: PT(648), y: PT(26.5), w: PT(62), h: PT(19),
    fontFace: FONT, fontSize: FS(12), bold: true, color: BLACK,
    align: "right", valign: "middle", margin: 0, isTextBox: true,
  });
}

export function headMessage(slide, text) {
  // グラデーションライン下端(46.5pt)〜本文開始位置(108pt=FULL_BOX.yPt)の間で
  // リード文（ヘッドメッセージ）の上下余白が均等になるよう中央配置する。
  // (46.5〜108の61.5ptの中に高さ29ptのボックスを中央配置 → 上下余白 各16.25pt)
  slide.addText(text, {
    x: PT(8), y: PT(62.75), w: PT(704), h: PT(29),
    fontFace: FONT, fontSize: FS(20), bold: true, color: NAVY,
    align: "center", valign: "middle", margin: 0, isTextBox: true,
  });
}

export function contentChrome(pres, slide, n, total, title, head) {
  iuoBadge(pres, slide);
  pageTitle(slide, title);
  pageNumber(slide, n, total);
  gradientLine(pres, slide, 0, 42.5, 720, 4);
  headMessage(slide, head);
}

export const MASTER_CONTENT_IUO = "PANA_CONTENT_IUO";
export const MASTER_CONTENT_NOIUO = "PANA_CONTENT_NOIUO";
export const MASTER_END = "PANA_END";

export function defineMasters(pres) {
  // ページ番号（n部分）は PowerPoint ネイティブのスライド番号フィールド（slideNumber）を
  // スライドマスタに埋め込む。ダウンロード後にユーザーがスライドを手動で追加・削除・並べ替え
  // した場合でも、n部分はPowerPointが自動的に再計算してくれる。
  // 「/ 総数」部分は生成時点のスライド枚数を静的に描画する（総数の自動追従は
  // PowerPointの標準機能に無いため、手動編集後は必要に応じてユーザー側で修正いただく想定）。
  const slideNumberOpts = {
    x: PT(648), y: PT(26.5), w: PT(30), h: PT(19),
    fontFace: FONT, fontSize: FS(12), bold: true, color: BLACK, align: "right",
  };

  pres.defineSlideMaster({
    title: MASTER_CONTENT_IUO,
    background: { color: WHITE },
    slideNumber: slideNumberOpts,
    objects: [...iuoBadgeObjects(), ...gradientLineObjects(0, 42.5, 720, 4)],
  });

  pres.defineSlideMaster({
    title: MASTER_CONTENT_NOIUO,
    background: { color: WHITE },
    slideNumber: slideNumberOpts,
    objects: [...gradientLineObjects(0, 42.5, 720, 4)],
  });

  pres.defineSlideMaster({
    title: MASTER_END,
    background: { color: WHITE },
    objects: [
      { text: { text: "end", options: {
        x: PT(60), y: PT(175), w: PT(600), h: PT(55),
        fontFace: FONT, fontSize: FS(28), bold: true, color: BLACK, align: "center", valign: "middle", margin: 0,
      } } },
    ],
  });
}

// 「/ 総ページ数」部分。ネイティブ slideNumber フィールド（現在ページ、マスタ側で自動描画）の
// すぐ右に接続して静的に表示する。
export function pageNumberSuffix(slide, total) {
  slide.addText(` / ${total}`, {
    x: PT(678), y: PT(26.5), w: PT(32), h: PT(19),
    fontFace: FONT, fontSize: FS(12), bold: true, color: BLACK,
    align: "left", valign: "middle", margin: 0, isTextBox: true,
  });
}

export function contentChromeMaster(slide, n, total, title, head) {
  pageTitle(slide, title);
  pageNumberSuffix(slide, total);
  headMessage(slide, head);
}

export function sectionBar(pres, slide, xPt, yPt, wPt, hPt, text, color, opts = {}) {
  slide.addShape(pres.ShapeType.rect, { x: PT(xPt), y: PT(yPt), w: PT(wPt), h: PT(hPt), fill: { color }, line: { type: "none" } });
  slide.addText(text, {
    x: PT(xPt), y: PT(yPt), w: PT(wPt), h: PT(hPt),
    fontFace: FONT, fontSize: FS(opts.fontSize || 16), bold: true, color: opts.textColor || WHITE,
    align: "center", valign: "middle", margin: 0, isTextBox: true,
  });
}

export const CHART_MONO_BLUE = [NAVY, BLUE1, BLUE3, BLUE4, BLUE5];
export const CHART_MONO_ORANGE = ["E46C0A", "F79646", "FFBF00", "FFD96D", "FFEEBD"];

export const PIE_COLORS = [NAVY, BLUE2, BLUE3, BLUE4, BLUE5];

export function photoWithOverlay(pres, slide, { imgPath, xPt, yPt, wPt, hPt, overlayOpacity = 60 }) {
  if (imgPath) {
    slide.addImage({ path: imgPath, x: PT(xPt), y: PT(yPt), w: PT(wPt), h: PT(hPt) });
  } else {
    slide.addShape(pres.ShapeType.rect, { x: PT(xPt), y: PT(yPt), w: PT(wPt), h: PT(hPt), fill: { color: LGRAY }, line: { color: LGRAY, width: 0.75 } });
  }
  slide.addShape(pres.ShapeType.rect, {
    x: PT(xPt), y: PT(yPt), w: PT(wPt), h: PT(hPt),
    fill: { color: "000000", transparency: 100 - overlayOpacity }, line: { type: "none" },
  });
}

export function styledTable(pres, slide, { xPt, yPt, wPt, rows, keyColWidthPt, keyColColor = BLUE3, fontSize = 14 }) {
  const nCols = rows[0].length;
  const colW = keyColWidthPt
    ? [keyColWidthPt, ...Array(nCols - 1).fill((wPt - keyColWidthPt) / (nCols - 1))]
    : Array(nCols).fill(wPt / nCols);

  const tableRows = rows.map((row, ri) =>
    row.map((cell, ci) => ({
      text: cell,
      options: {
        fontFace: FONT,
        fontSize: FS(fontSize),
        bold: true,
        color: ci === 0 ? WHITE : BLACK,
        fill: { color: ci === 0 ? keyColColor : WHITE },
        align: ci === 0 ? "center" : "left",
        valign: "middle",
        border: [
          { type: ri === 0 ? "solid" : "dash", pt: ri === 0 ? 1.0 : 0.5, color: MGRAY },
          { type: "none" },
          { type: ri === rows.length - 1 ? "solid" : "dash", pt: ri === rows.length - 1 ? 1.0 : 0.5, color: MGRAY },
          { type: "none" },
        ],
      },
    }))
  );

  slide.addTable(tableRows, { x: PT(xPt), y: PT(yPt), w: PT(wPt), colW: colW.map(PT), autoPage: false });
}

export function coverSlide(pres, { title, subtitleLines = [], logoPath, logoLabel = "[企業ロゴ]", includeIuo = true }) {
  // ロゴ画像はコード内にBase64データURIとして埋め込み、実行時のファイルシステム読み込みには依存しない。
  // （Vercelのサーバーレス関数バンドルにおいて、assets/配下のバイナリファイルをfsで読み込む方式は
  //   ビルド時のファイルトレーシング処理で画像データが破損する事象が確認されたため、この方式に変更した。）
  const resolvedLogoData = logoPath === null ? null : logoPath || PANASONIC_LOGO_DATA_URI;

  const s = pres.addSlide();
  s.background = { color: WHITE };
  if (includeIuo) iuoBadge(pres, s);

  if (resolvedLogoData) {
    const w = 128.4;
    const h = 21;
    const imgOpts = { x: PT(37.4), y: PT(32.8 + (21 - h) / 2), w: PT(w), h: PT(h) };
    if (resolvedLogoData.startsWith("data:")) {
      s.addImage({ data: resolvedLogoData, ...imgOpts });
    } else {
      s.addImage({ path: resolvedLogoData, ...imgOpts });
    }
  } else {
    s.addShape(pres.ShapeType.rect, { x: PT(37.4), y: PT(32.8), w: PT(129), h: PT(21), fill: { color: LGRAY, transparency: 75 }, line: { color: LGRAY, width: 0.5 } });
    s.addText(logoLabel, { x: PT(37.4), y: PT(32.8), w: PT(129), h: PT(21), fontFace: FONT, fontSize: FS_MIN, bold: true, color: DGRAY, align: "center", valign: "middle", isTextBox: true, margin: 0 });
  }

  s.addText(title, {
    x: PT(49.5), y: PT(143), w: PT(621), h: PT(42),
    fontFace: FONT, fontSize: FS(32), bold: true, color: BLACK, align: "center", valign: "middle", isTextBox: true, margin: 0,
  });

  gradientLine(pres, s, 43.25, 199.6, 635.5, 5.9);

  if (subtitleLines.length) {
    s.addText(
      subtitleLines.map((line, i) => ({ text: line, options: i < subtitleLines.length - 1 ? { breakLine: true, paraSpaceAfter: 10 } : {} })),
      {
        x: PT(108), y: PT(290.7), w: PT(504), h: PT(87),
        fontFace: FONT, fontSize: FS(14), bold: true, color: BLACK, align: "center", valign: "top", isTextBox: true, margin: 0, lineSpacingMultiple: 1.3,
      }
    );
  }
  return s;
}

export function endSlide(pres) {
  return pres.addSlide({ masterName: MASTER_END });
}

export function statCard(pres, slide, { xPt, yPt, wPt, hPt, value, unit = "", label = "", color = NAVY }) {
  slide.addShape(pres.ShapeType.roundRect, {
    x: PT(xPt), y: PT(yPt), w: PT(wPt), h: PT(hPt),
    rectRadius: 0.06,
    fill: { color: BLUE5 },
    line: { color, width: 1 },
  });
  const valueRuns = [
    { text: value, options: { fontSize: 40, bold: true, color } },
  ];
  if (unit) valueRuns.push({ text: unit, options: { fontSize: 16, bold: true, color } });
  slide.addText(valueRuns, {
    x: PT(xPt), y: PT(yPt + hPt * 0.16), w: PT(wPt), h: PT(hPt * 0.5),
    fontFace: FONT, align: "center", valign: "bottom", isTextBox: true, margin: 0,
  });
  if (label) {
    slide.addText(label, {
      x: PT(xPt + 10), y: PT(yPt + hPt * 0.62), w: PT(wPt - 20), h: PT(hPt * 0.34),
      fontFace: FONT, fontSize: FS(12), bold: true, color: BLACK, align: "center", valign: "top",
      isTextBox: true, margin: 0, lineSpacingMultiple: 1.15,
    });
  }
}

export function waterfallChart(pres, slide, { xPt, yPt, wPt, hPt, bars, unit = "" }) {
  if (!bars || !bars.length) return;
  const n = bars.length;
  const barGap = 10;
  const plotTop = yPt + 18;
  const catH = 30;
  const plotBottom = yPt + hPt - catH;
  const plotH = Math.max(plotBottom - plotTop, 10);
  const barW = (wPt - barGap * (n - 1)) / n;

  let running = 0;
  const computed = bars.map((b) => {
    let top, bottom;
    if (b.kind === "total") {
      running = b.value;
      top = running;
      bottom = 0;
    } else if (b.kind === "decrease") {
      top = running;
      running = running - Math.abs(b.value);
      bottom = running;
    } else {
      bottom = running;
      running = running + Math.abs(b.value);
      top = running;
    }
    return { ...b, top, bottom };
  });

  const maxVal = Math.max(...computed.map((c) => Math.max(c.top, c.bottom)), 1);
  const scale = plotH / (maxVal * 1.2);
  const valueToY = (v) => plotBottom - v * scale;

  computed.forEach((c, i) => {
    const x = xPt + i * (barW + barGap);
    const yTop = valueToY(c.top);
    const yBottom = valueToY(c.bottom);
    const h = Math.max(Math.abs(yBottom - yTop), 2);
    const y = Math.min(yTop, yBottom);
    const color = c.kind === "total" ? NAVY : c.kind === "decrease" ? RED : BLUE3;

    slide.addShape(pres.ShapeType.rect, {
      x: PT(x), y: PT(y), w: PT(barW), h: PT(h),
      fill: { color }, line: { type: "none" },
    });

    const sign = c.kind === "decrease" ? "▲" : c.kind === "increase" ? "+" : "";
    slide.addText(`${sign}${Math.abs(c.value)}${unit}`, {
      x: PT(x - 8), y: PT(y - 16), w: PT(barW + 16), h: PT(14),
      fontFace: FONT, fontSize: FS(11), bold: true, color,
      align: "center", valign: "bottom", isTextBox: true, margin: 0,
    });

    slide.addText(c.label, {
      x: PT(x - 8), y: PT(plotBottom + 4), w: PT(barW + 16), h: PT(catH - 4),
      fontFace: FONT, fontSize: FS(10), bold: true, color: BLACK,
      align: "center", valign: "top", isTextBox: true, margin: 0, lineSpacingMultiple: 1.05,
    });

    if (i < computed.length - 1) {
      const connectY = valueToY(c.top);
      slide.addShape(pres.ShapeType.line, {
        x: PT(x + barW), y: PT(connectY), w: PT(barGap), h: 0,
        line: { color: MGRAY, width: 0.75, dashType: "dash" },
      });
    }
  });
}

// yPtは46.5(グラデーションライン下端)〜ここまでの間にヘッドメッセージ(headMessage)と、
// process_flowの補足キャプション等が重ならないよう十分な余白を確保した値。
export const FULL_BOX = { xPt: 36, yPt: 108, wPt: 648, hPt: 268 };

