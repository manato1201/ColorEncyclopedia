import {
  HUE_WHEEL_VISUALIZERS,
  HARMONY_VISUALIZERS,
} from "./color-visualizers";

/**
 * このidに対応する色可視化(色相環+配色理論)があるかどうか。
 * The-Algorithm-Illustrated の has-visualizer.ts と同じ役割で、ビルド時(getAllMeta)・
 * 詳細ページ・比較画面のいずれからでも安全にimportできる。
 */
export function hasColorVisualizer(colorId: string): boolean {
  return colorId in HUE_WHEEL_VISUALIZERS || colorId in HARMONY_VISUALIZERS;
}
