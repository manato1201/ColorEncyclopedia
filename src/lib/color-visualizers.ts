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
  akaneiro: true,
  enji: true,
  shojohi: true,
  momoiro: true,
  nadeshikoiro: true,
  sangoiro: true,
  kakiiro: true,
  mikaniro: true,
  anzuiro: true,
  oni: true,
  kohakuiro: true,
  rengairo: true,
  kariyasuiro: true,
  ukoniro: true,
  himawariiro: true,
  karashiiro: true,
  moegiiro: true,
  wakabairo: true,
  tokiwairo: true,
  chitosemidori: true,
  kokeiro: true,
  seijiiro: true,
  hisuiiro: true,
  rokushoiro: true,
  mizuiro: true,
  hanadairo: true,
  tsuyukusairo: true,
  byakugun: true,
  edomurasaki: true,
  kyomurasaki: true,
  sumireiro: true,
  ebiiro: true,
  nezumiiro: true,
  shikkoku: true,
};

/** 配色理論可視化(補色・類似色・トライアド・スプリットコンプリメンタリ)は色相環と同じ対象集合を使う。 */
export const HARMONY_VISUALIZERS: Record<string, true> = HUE_WHEEL_VISUALIZERS;

/**
 * 色相環の対象ではない概念エントリ(色相環・色の三属性)が、色相環・配色理論・ライブプレビューで見せる「デモ用の色」。
 * その項目自体の色ではないので、画面には「デモ用の色」と明示する。
 */
export const COLOR_DEMO_HEX: Record<string, string> = {
  "hue-circle": "#EB6238",
  "three-attributes": "#2792C3",
  // 配色理論の概念エントリ(colorValueを持たない): デモ用の色で、色相環上の関係(補色・類似色・トライアド・分裂補色)を見せる
  "complementary-harmony": "#EB6238",
  "analogous-harmony": "#2792C3",
  "triadic-harmony": "#AACF53",
  "split-complementary-harmony": "#745399",
  "tone-on-tone-harmony": "#2792C3",
  "dominant-color-harmony": "#38B48B",
  "gradation-harmony": "#E58A2B",
  "camaieu-harmony": "#7DB46C",
  "bicolore-harmony": "#2B5FAE",
  "tetrad-harmony": "#2792C3",
  "psychological-complementary": "#E8452B",
  "identical-hue-harmony": "#2792C3",
  "adjacent-hue-harmony": "#2792C3",
  "similar-hue-harmony": "#2792C3",
  "mid-hue-harmony": "#2792C3",
  "contrast-hue-harmony": "#2792C3",
};

/** 色相差による配色(24色相環で、色相が何つ離れているか)。最初に見せる色相差(つ)。 */
export const COLOR_HUE_DIFFERENCE: Record<string, number> = {
  "identical-hue-harmony": 0,
  "adjacent-hue-harmony": 1,
  "similar-hue-harmony": 2,
  "mid-hue-harmony": 5,
  "contrast-hue-harmony": 9,
};

/** 色覚の見え方のシミュレーションを見せる概念エントリ。 */
export const COLOR_VISION_IDS: Record<string, true> = { "color-vision-diversity": true };

/** 配色理論の概念エントリが、色相環の配色理論の可視化で最初に開く種類。 */
export const COLOR_HARMONY_TYPE: Record<string, "complementary" | "analogous" | "triadic" | "split-complementary" | "tetrad"> = {
  "complementary-harmony": "complementary",
  "psychological-complementary": "complementary",
  "analogous-harmony": "analogous",
  "triadic-harmony": "triadic",
  "split-complementary-harmony": "split-complementary",
  "tetrad-harmony": "tetrad",
};

/** コントラスト比の確認(ContrastVisualizer)を、デモ用の前景・背景で見せる概念エントリ。#767676 と白は、AAの境目(約4.54:1)。 */
export const COLOR_CONTRAST_DEMOS: Record<string, { fg: string; bg: string }> = {
  "accessible-color-design": { fg: "#767676", bg: "#FFFFFF" },
};

/** 混色の可視化(光の混色と、色材の混色)。 */
export const COLOR_MIXING_MODES: Record<string, "additive" | "subtractive"> = {
  "additive-mixing": "additive",
  "subtractive-mixing": "subtractive",
};

/** パレット(palette)を色相・彩度・明度の位置で見せる可視化の対象(複数色で見せる用語)。 */
export const COLOR_PALETTE_VISUALIZERS: Record<string, true> = {
  duotone: true,
  "teal-and-orange": true,
  "high-key": true,
  "low-key": true,
  monochrome: true,
  "film-grain": true,
  backlighting: true,
  "golden-hour": true,
  "blue-hour": true,
  "spring-palette": true,
  "summer-palette": true,
  "autumn-palette": true,
  "winter-palette": true,
  "tone-vivid": true,
  "tone-strong": true,
  "tone-bright": true,
  "tone-light": true,
  "tone-pale": true,
  "tone-soft": true,
  "tone-dull": true,
  "tone-deep": true,
  "tone-dark": true,
  "tone-light-grayish": true,
  "tone-grayish": true,
  "tone-dark-grayish": true,
  "accent-color": true,
  "separation-color": true,
  "repetition-harmony": true,
  "faux-camaieu-harmony": true,
  "natural-harmony": true,
  "complex-harmony": true,
  "dominant-tone-harmony": true,
  "sepia": true,
  "bleach-bypass": true,
  "white-balance": true,
  "rim-light": true,
  "overcast-light": true,
  "candlelight": true,
  "neon-glow": true,
};

/** 季節の配色(同じ構図の木に、季節ごとのパレットを当てはめて並べる)。この順に再生する。 */
export const SEASON_PALETTE_IDS = ["spring-palette", "summer-palette", "autumn-palette", "winter-palette"] as const;
