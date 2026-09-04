import { HUE_WHEEL_VISUALIZERS } from "./color-visualizers";

/**
 * このidに対応する色可視化(色相環+配色理論)があるかどうか。
 * The-Algorithm-Illustrated の has-visualizer.ts と同じ役割で、ビルド時(getAllMeta)・
 * 詳細ページ・比較画面のいずれからでも安全にimportできる。
 *
 * HARMONY_VISUALIZERSは現状HUE_WHEEL_VISUALIZERSと同一オブジェクトを指すエイリアスのため、
 * ここでの判定はHUE_WHEEL_VISUALIZERSだけを見れば十分(両方を`in`で見ると同じ判定を二重に行うだけになる)。
 * 配色理論可視化だけを個別に無効化する必要が生じたら、color-visualizers.tsで両者を独立した
 * オブジェクトに分離し、ここも両方を見るように戻すこと。
 */
export function hasColorVisualizer(colorId: string): boolean {
  return colorId in HUE_WHEEL_VISUALIZERS;
}
