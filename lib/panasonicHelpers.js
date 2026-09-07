/**
 * 公開エントリポイント。route.js からは従来どおり `import * as P from ".../panasonicHelpers.js"` で
 * 全機能にアクセスできるよう、実体を分割した2ファイル（基盤部分/レイアウト実装部分）を re-export する。
 * ファイルサイズが大きくなりすぎたため panasonicHelpersCore.js（色定数・chrome・マスタ定義等）と
 * bodyLayouts.js（BODY_LAYOUTS本体）に分割している。
 */
export * from "./panasonicHelpersCore.js";
export * from "./bodyLayouts.js";
