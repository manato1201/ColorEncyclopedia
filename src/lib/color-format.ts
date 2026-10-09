import type { Hsl, Hsv, Lab, Lch, Rgb } from "@/lib/color-math";

/**
 * 色の数値の表示用整形。IMPROVEMENT_DESIGN_2026-10 §3「数字: 半角・等幅。RGB・Lab は等幅で桁を揃える」に従い、
 * 各成分を固定幅の半角スペースで右揃えにする(表示側で .num と white-space: pre を併用すること)。
 */
const pad = (value: number | string, width: number) =>
  String(value).padStart(width, " ");
const fixed = (value: number, width: number, digits = 1) =>
  pad(value.toFixed(digits), width);

export function formatRgb({ r, g, b }: Rgb): string {
  return `R ${pad(Math.round(r), 3)}  G ${pad(Math.round(g), 3)}  B ${pad(Math.round(b), 3)}`;
}

export function formatHsv({ h, s, v }: Hsv): string {
  return `H ${pad(h, 3)}°  S ${pad(s, 3)}%  V ${pad(v, 3)}%`;
}

export function formatHsl({ h, s, l }: Hsl): string {
  return `H ${pad(h, 3)}°  S ${pad(s, 3)}%  L ${pad(l, 3)}%`;
}

export function formatLab({ l, a, b }: Lab): string {
  return `L* ${fixed(l, 5)}  a* ${fixed(a, 6)}  b* ${fixed(b, 6)}`;
}

export function formatLch({ l, c, h }: Lch): string {
  return `L* ${fixed(l, 5)}  C* ${fixed(c, 5)}  h  ${fixed(h, 5)}°`;
}
