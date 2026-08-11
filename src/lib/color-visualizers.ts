/**
 * 色相環・配色理論可視化(HueWheelVisualizer/HarmonyVisualizer)の対応レジストリ。
 * colorValue(hex/hsv/lab)を持つ色エントリはすべて同じ汎用ロジックで色相環上に描画できるため、
 * どのエントリを可視化対象とするかをここに一本化する(has-visualizer.tsの`in`演算子パターンを踏襲)。
 * frontmatterには書き込まない(ColorEncyclopedia_DESIGN.md Phase 0のアンチパターン参照)。
 */
export const HUE_WHEEL_VISUALIZERS: Record<string, true> = {
  shuiro: true,
  beniiro: true,
  yamabukiiro: true,
  daidaiiro: true,
  ruriiro: true,
  aiiro: true,
  asagiiro: true,
  gunjouiro: true,
  wakakusairo: true,
  macchairo: true,
  fujiiro: true,
  uguisuiro: true,
  beniaka: true,
  rikyunezumi: true,
  gofunniro: true,
  sumiiro: true,
  sakurairo: true,
  suou: true,
  konjiro: true,
  sorairo: true,
  wakatakeiro: true,
  murasaki: true,
  hiiro: true,
  nibiiro: true,
  kinariiro: true,
  nurigarasu: true,
};

/** 配色理論可視化(補色・類似色・トライアド・スプリットコンプリメンタリ)は色相環と同じ対象集合を使う。 */
export const HARMONY_VISUALIZERS: Record<string, true> = HUE_WHEEL_VISUALIZERS;
