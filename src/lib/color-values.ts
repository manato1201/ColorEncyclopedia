import { hexToHsv, hexToLab, hexToRgb, type Hsv, type Lab, type Rgb } from "@/lib/color-math";

export type ColorValues = { hex: string; rgb: Rgb; hsv: Hsv; lab: Lab };

/**
 * 画面に出す色の数値は、すべてHEXからこの1か所の変換で出す(IMPROVEMENT_DESIGN X11)。
 * `npm run verify` が content の記載値(frontmatterのhsv/lab)を同じ関数で再計算して突き合わせているので、
 * 画面の表示値と verify の値は同じ変換から出ている。画面側でfrontmatterの値を直接表示しない。
 */
export function deriveColorValues(hex: string): ColorValues {
  return { hex, rgb: hexToRgb(hex), hsv: hexToHsv(hex), lab: hexToLab(hex) };
}
