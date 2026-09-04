import { contrastRatio, hexToHsv, hsvToHex, WCAG_AA_NORMAL } from "@/lib/color-math";

export interface DerivedTheme {
  primary: string;
  accent: string;
}

/**
 * ページの地色(globals.cssの--color-parchment)。ここに一致させておくこと。
 * WCAG判定は「選択色がこの実際に塗られている背景の上でどれだけ読めるか」を基準にする必要があり、
 * 描画されないダミーの背景色を基準にすると判定が実態と乖離するため、直接この値を使う。
 */
const PAGE_CANVAS_HEX = "#E5E4E0";

export const SAFE_FALLBACK_THEME: DerivedTheme = {
  primary: "#2B2B2B",
  accent: "#5B8DEF",
};

/**
 * 選択色(hex)から primary/accent を導出する純関数。
 * WCAG AA(コントラスト比4.5:1)を、選択色が実際に使われる文脈
 * (パーチメント地の上のゴーストリンク文字色 / インク地の上の反転背景色)で満たさない場合は
 * SAFE_FALLBACK_THEMEへ切り替える(ColorEncyclopedia_DESIGN.md Phase 4の制約)。
 */
export function deriveThemeFromColor(hex: string): DerivedTheme {
  const { h, s, v } = hexToHsv(hex);
  const accent = hsvToHex({ h: (h + 180) % 360, s, v }); // 補色回転

  if (contrastRatio(hex, PAGE_CANVAS_HEX) < WCAG_AA_NORMAL) {
    return SAFE_FALLBACK_THEME;
  }

  return { primary: hex, accent };
}
