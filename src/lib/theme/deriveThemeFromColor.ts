import { contrastRatio, hexToHsv, hsvToHex, WCAG_AA_NORMAL } from "@/lib/color-math";

export type ThemeMode = "light" | "dark";

export interface DerivedTheme {
  primary: string;
  accent: string;
}

/**
 * モードごとのページの地色。globals.css の --color-parchment(ライト)と
 * :root[data-theme="dark"] の --color-parchment(ダーク)に一致させておくこと。
 * WCAG判定は「選択色が実際に塗られている背景の上でどれだけ読めるか」を基準にする必要があり、
 * 描画されないダミーの背景色を基準にすると判定が実態と乖離するため、直接この値を使う。
 */
export const PAGE_CANVAS_HEX: Record<ThemeMode, string> = {
  light: "#E5E4E0",
  dark: "#151412",
};

/** AAを満たせない(無彩色に近い・白や黒に張り付いた)色のときに使う安全なテーマ。 */
export const SAFE_FALLBACK_THEME: Record<ThemeMode, DerivedTheme> = {
  light: { primary: "#2B2B2B", accent: "#5B8DEF" },
  dark: { primary: "#E6E3DC", accent: "#8FB4FF" },
};

/** 無彩色とみなす彩度(%)。これ未満でAAを満たせない色は、色相を保つ意味がないのでフォールバックする。 */
const ACHROMATIC_SATURATION = 12;

/**
 * 地色に対してAA(4.5:1)を満たすよう、色相を保ったまま明るさだけ調整する。
 * ライトでは暗く(明度Vを下げる)、ダークでは明るく(Vを上げ、最後は彩度Sを下げる)していき、
 * 最初にAAを満たした色を返す。満たせなければnull。
 */
function ensureContrast(hex: string, canvas: string, mode: ThemeMode): string | null {
  if (contrastRatio(hex, canvas) >= WCAG_AA_NORMAL) return hex;

  const { h, s, v } = hexToHsv(hex);
  if (s < ACHROMATIC_SATURATION) return null;

  if (mode === "light") {
    for (let nextV = v - 2; nextV >= 20; nextV -= 2) {
      const candidate = hsvToHex({ h, s, v: nextV });
      if (contrastRatio(candidate, canvas) >= WCAG_AA_NORMAL) return candidate;
    }
    return null;
  }

  for (let nextV = v + 2; nextV <= 100; nextV += 2) {
    const candidate = hsvToHex({ h, s, v: nextV });
    if (contrastRatio(candidate, canvas) >= WCAG_AA_NORMAL) return candidate;
  }
  for (let nextS = s - 3; nextS >= 25; nextS -= 3) {
    const candidate = hsvToHex({ h, s: nextS, v: 100 });
    if (contrastRatio(candidate, canvas) >= WCAG_AA_NORMAL) return candidate;
  }
  return null;
}

/**
 * 選択色(hex)から primary/accent を導出する純関数。
 * 選択色が(そのモードの)実際の地色の上でWCAG AA(コントラスト比4.5:1)を満たさない場合は、
 * 色相を保ったまま明るさを調整し、それでも満たせない場合は SAFE_FALLBACK_THEME へ切り替える
 * (ColorEncyclopedia_DESIGN.md Phase 4の制約。ダークテーマの追加でモード別の判定が必要になった)。
 */
export function deriveThemeFromColor(hex: string, mode: ThemeMode = "light"): DerivedTheme {
  const primary = ensureContrast(hex, PAGE_CANVAS_HEX[mode], mode);
  if (!primary) return SAFE_FALLBACK_THEME[mode];

  const { h, s, v } = hexToHsv(primary);
  const accent = hsvToHex({ h: (h + 180) % 360, s, v }); // 補色回転
  return { primary, accent };
}
