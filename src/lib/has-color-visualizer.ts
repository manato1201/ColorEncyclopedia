import { COLOR_EFFECT_SCENES } from "./color-effect-scenes";
import {
  COLOR_CONTRAST_DEMOS,
  COLOR_DEMO_HEX,
  COLOR_MIXING_MODES,
  COLOR_PALETTE_VISUALIZERS,
  HUE_WHEEL_VISUALIZERS,
} from "./color-visualizers";

/**
 * このidに対応する色の可視化があるかどうか。
 * The-Algorithm-Illustrated の has-visualizer.ts と同じ役割で、ビルド時(getAllMeta)・
 * 詳細ページ・比較画面のいずれからでも安全にimportできる。
 *
 * 可視化の種類(どれか1つでもあれば対応あり):
 * - 色相環・配色理論(HUE_WHEEL_VISUALIZERS: colorValueを持つ色)
 * - デモ用の色を使う色相環・ライブプレビュー(COLOR_DEMO_HEX: 色相環・色の三属性)
 * - 混色(COLOR_MIXING_MODES)、見え方の場面(COLOR_EFFECT_SCENES)
 * - パレットの分布・季節の木(COLOR_PALETTE_VISUALIZERS)
 * HARMONY_VISUALIZERS は HUE_WHEEL_VISUALIZERS と同一オブジェクトのエイリアスなので、ここでは前者だけを見れば足りる。
 */
export function hasColorVisualizer(colorId: string): boolean {
  return (
    colorId in HUE_WHEEL_VISUALIZERS ||
    colorId in COLOR_DEMO_HEX ||
    colorId in COLOR_CONTRAST_DEMOS ||
    colorId in COLOR_MIXING_MODES ||
    colorId in COLOR_EFFECT_SCENES ||
    colorId in COLOR_PALETTE_VISUALIZERS
  );
}
