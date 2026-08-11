import {
  contrastRatio,
  hexToHsv,
  hsvToHex,
  WCAG_AA_NORMAL,
} from "@/lib/color-math";

export interface DerivedTheme {
  primary: string;
  accent: string;
  bgTint: string;
  textOn: "light" | "dark";
}

export const SAFE_FALLBACK_THEME: DerivedTheme = {
  primary: "#2B2B2B",
  accent: "#5B8DEF",
  bgTint: "#F5F5F5",
  textOn: "dark",
};

/**
 * 選択色(hex)から primary/accent/bgTint/textOn を導出する純関数。
 * WCAG AA(コントラスト比4.5:1)を満たさない組み合わせになった場合は SAFE_FALLBACK_THEME へ切り替える
 * (ColorEncyclopedia_DESIGN.md Phase 4: 色駆動テーマ機能を持ってもWCAG AAコントラストを維持する制約)。
 */
export function deriveThemeFromColor(hex: string): DerivedTheme {
  const { h, s, v } = hexToHsv(hex);
  const accent = hsvToHex({ h: (h + 180) % 360, s, v }); // 補色回転
  const bgTint = hsvToHex({ h, s: Math.min(s, 18), v: 96 }); // 彩度クランプで淡色背景に
  const textOn =
    contrastRatio(hex, "#FFFFFF") >= WCAG_AA_NORMAL ? "light" : "dark";

  if (contrastRatio(hex, bgTint) < WCAG_AA_NORMAL) {
    return SAFE_FALLBACK_THEME;
  }

  return { primary: hex, accent, bgTint, textOn };
}
