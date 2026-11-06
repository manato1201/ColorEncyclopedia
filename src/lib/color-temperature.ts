import { rgbToHex } from "./color-math.ts";

/**
 * 色温度(K)を画面の色(sRGB)に直す近似式(黒体放射の色を多項式で近似した、広く使われる簡易式)。
 * 1000〜40000K の範囲で使う。厳密な値ではなく、色温度による色みの向きを見せるための近似。
 */
export function kelvinToHex(kelvin: number): string {
  const t = Math.min(Math.max(kelvin, 1000), 40000) / 100;
  const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const clamp = (n: number) => Math.min(255, Math.max(0, n));
  return rgbToHex({ r: clamp(r), g: clamp(g), b: clamp(b) });
}
