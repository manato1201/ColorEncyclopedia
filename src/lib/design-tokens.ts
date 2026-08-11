/**
 * デザイントークン(TS版)。CSS変数を直接読めない文脈(Canvas 2D描画・Web WorkerへのpostMessage等)で使用する。
 * app/globals.css の :root と値は必ず一致させること。
 */

export const coreColors = {
  bgVoid: "#06070A",
  bgSurface: "#12141B",
  bgSurface2: "#191C26",
  text: "#EDF0F5",
  textMuted: "#8B93A7",
  accentGreen: "#4DFFB0",
  accentAmber: "#FFA733",
} as const;

/** ShapeConstructionVisualizerで使う要素状態パレット。 */
export const shapeStateColors = {
  idle: "#3A3F4D",
  guide: "#5B6478",
  active: coreColors.accentAmber,
  final: coreColors.accentGreen,
} as const;

export type ShapeStateColorKey = keyof typeof shapeStateColors;
