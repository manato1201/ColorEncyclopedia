/**
 * 色空間変換とWCAGコントラスト比の計算式。Canvas 2D描画・deriveThemeFromColor・
 * ContrastVisualizerなど、CSS変数を直接読めない文脈から共有される唯一の実装(Phase 0のアンチパターン参照:
 * WCAGコントラスト計算式を独自に再実装・近似しない)。
 */

export type Hsv = { h: number; s: number; v: number };
export type Rgb = { r: number; g: number; b: number };

export function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h: Math.round(h), s: Math.round(s * 100), v: Math.round(v * 100) };
}

export function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const sn = s / 100;
  const vn = v / 100;
  const c = vn * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = vn - c;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (h < 60) [rp, gp, bp] = [c, x, 0];
  else if (h < 120) [rp, gp, bp] = [x, c, 0];
  else if (h < 180) [rp, gp, bp] = [0, c, x];
  else if (h < 240) [rp, gp, bp] = [0, x, c];
  else if (h < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  return { r: (rp + m) * 255, g: (gp + m) * 255, b: (bp + m) * 255 };
}

export function hexToHsv(hex: string): Hsv {
  return rgbToHsv(hexToRgb(hex));
}

export type Hsl = { h: number; s: number; l: number };
export type Lab = { l: number; a: number; b: number };
export type Lch = { l: number; c: number; h: number };

/** sRGB → HSL。色相はHSVと同じ定義(0〜360°)、s/lは0〜100%の整数に丸める。 */
export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const { h } = rgbToHsv({ r, g, b });
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hexToHsl(hex: string): Hsl {
  return rgbToHsl(hexToRgb(hex));
}

/**
 * sRGB(D65) → CIE L*a*b*。frontmatterのcolorValue.labと同じ式。丸めずに返す(表示側で桁を揃える)。
 * 標準の変換行列とCIE定義の f(t) をそのまま使っており、独自の近似は含まない。
 */
export function rgbToLab({ r, g, b }: Rgb): Lab {
  const rl = srgbChannelToLinear(r);
  const gl = srgbChannelToLinear(g);
  const bl = srgbChannelToLinear(b);
  const x = rl * 0.4124 + gl * 0.3576 + bl * 0.1805;
  const y = rl * 0.2126 + gl * 0.7152 + bl * 0.0722;
  const z = rl * 0.0193 + gl * 0.1192 + bl * 0.9505;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x / 0.95047);
  const fy = f(y / 1.0);
  const fz = f(z / 1.08883);
  return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

export function hexToLab(hex: string): Lab {
  return rgbToLab(hexToRgb(hex));
}

/** Lab → LCh(円筒座標)。c=彩度に相当する距離√(a²+b²)、h=色相角(0〜360°)。 */
export function labToLch({ l, a, b }: Lab): Lch {
  const c = Math.sqrt(a * a + b * b);
  const h = (Math.atan2(b, a) * 180) / Math.PI;
  return { l, c, h: (h + 360) % 360 };
}

export function hsvToHex(hsv: Hsv): string {
  return rgbToHex(hsvToRgb({ ...hsv, h: ((hsv.h % 360) + 360) % 360 }));
}

/** sRGBの1チャンネル(0-255)をWCAG相対輝度計算用の線形値に変換する。 */
function srgbChannelToLinear(channel255: number): number {
  const c = channel255 / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG 2.x の相対輝度(0=黒〜1=白)。 */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const rl = srgbChannelToLinear(r);
  const gl = srgbChannelToLinear(g);
  const bl = srgbChannelToLinear(b);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/** WCAG 2.x の標準コントラスト比計算(既知の公式、独自近似なし)。1:1(無差)〜21:1(黒/白)。 */
export function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

export const WCAG_AA_NORMAL = 4.5;
export const WCAG_AA_LARGE = 3;
export const WCAG_AAA_NORMAL = 7;
export const WCAG_AAA_LARGE = 4.5;

/**
 * 2色のLab上のユークリッド距離(CIE76のΔE)。小さいほど近い色に見える。
 * 厳密な知覚差にはΔE2000などがあるが、ここでは「近い色の並べ替え」と比較表示に使う簡易指標。
 */
export function deltaE76(a: Lab, b: Lab): number {
  return Math.sqrt((a.l - b.l) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2);
}

// ---- LCh → sRGB(逆変換)と、sRGBに収まる最大の彩度 ----

/** rgbToLabと同じ白色点(D65)・行列の逆変換。範囲外の値はそのまま返す(収まるかどうかは inGamut で判定)。 */
export function labToRgbUnclamped({ l, a, b }: Lab): { r: number; g: number; b: number } {
  const fy = (l + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const finv = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);
  const x = finv(fx) * 0.95047;
  const y = finv(fy) * 1.0;
  const z = finv(fz) * 1.08883;
  const rl = 3.2406 * x - 1.5372 * y - 0.4986 * z;
  const gl = -0.9689 * x + 1.8758 * y + 0.0415 * z;
  const bl = 0.0557 * x - 0.204 * y + 1.057 * z;
  const gamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
  return { r: gamma(rl) * 255, g: gamma(gl) * 255, b: gamma(bl) * 255 };
}

/** LCh(明度L*・彩度C*・色相h°)がsRGBの範囲に収まるか。 */
export function lchInGamut({ l, c, h }: Lch, epsilon = 0.5): boolean {
  const rad = (h * Math.PI) / 180;
  const { r, g, b } = labToRgbUnclamped({ l, a: c * Math.cos(rad), b: c * Math.sin(rad) });
  return [r, g, b].every((v) => v >= -epsilon && v <= 255 + epsilon);
}

/**
 * 同じ明度L*・色相hで、sRGBに収まる最大の彩度C*(二分探索)。
 * 色相によって出せる彩度の上限は大きく違う(例: 同じ明度でも、青や赤は余地が大きく、黄緑〜青緑は小さい)。
 */
export function maxChromaInGamut(l: number, h: number): number {
  let lo = 0;
  let hi = 160;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (lchInGamut({ l, c: mid, h })) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** LCh → HEX。sRGBに収まらない場合は、同じ明度・色相で収まる最大の彩度に抑えて返す(clipped で知らせる)。 */
export function lchToHex({ l, c, h }: Lch): { hex: string; clipped: boolean; chroma: number } {
  const max = maxChromaInGamut(l, h);
  const chroma = Math.min(c, max);
  const rad = (h * Math.PI) / 180;
  const rgb = labToRgbUnclamped({ l, a: chroma * Math.cos(rad), b: chroma * Math.sin(rad) });
  return { hex: rgbToHex(rgb), clipped: c > max, chroma };
}
