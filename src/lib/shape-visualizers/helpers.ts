import type { ShapeElement, ShapeElementState, ShapeFrame } from "./base.ts";

/**
 * 作図ジェネレータ共通の小さな部品。座標系は 0〜100 の正方形(y は下向き)。
 * 角度は度。極座標 polar は「真上=0°、時計回りに増える」。
 */
export type Pt = [number, number];

export const PHI = (1 + Math.sqrt(5)) / 2;

export const polar = (cx: number, cy: number, r: number, deg: number): Pt => {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)];
};

/** 正n角形の頂点(1つ目は真上)。 */
export function regularPolygon(cx: number, cy: number, r: number, n: number, startDeg = 0): Pt[] {
  return Array.from({ length: n }, (_, i) => polar(cx, cy, r, startDeg + (360 * i) / n));
}

/** 円弧の点列(角度は polar と同じ向き)。 */
export function arcPts(cx: number, cy: number, r: number, fromDeg: number, toDeg: number, steps = 32): Pt[] {
  return Array.from({ length: steps + 1 }, (_, i) => polar(cx, cy, r, fromDeg + ((toDeg - fromDeg) * i) / steps));
}

export const circlePts = (cx: number, cy: number, r: number, steps = 72): Pt[] => arcPts(cx, cy, r, 0, 360, steps);

export const line = (a: Pt, b: Pt, state: ShapeElementState = "final", dashed = false): ShapeElement => ({
  kind: "line",
  x1: a[0],
  y1: a[1],
  x2: b[0],
  y2: b[1],
  state,
  dashed: dashed || undefined,
});
export const poly = (points: Pt[], state: ShapeElementState = "final"): ShapeElement => ({
  kind: "polygon",
  points,
  state,
});
export const path = (points: Pt[], state: ShapeElementState = "final"): ShapeElement => ({
  kind: "polyline",
  points,
  state,
});
export const circle = (cx: number, cy: number, r: number, state: ShapeElementState = "final"): ShapeElement => ({
  kind: "circle",
  cx,
  cy,
  r,
  state,
});
export const rect = (x: number, y: number, w: number, h: number, state: ShapeElementState = "final"): ShapeElement => ({
  kind: "rect",
  x,
  y,
  w,
  h,
  state,
});
export const label = (x: number, y: number, text: string): ShapeElement => ({ kind: "label", x, y, text });
export const dot = (p: Pt, state: ShapeElementState = "active", r = 1.6): ShapeElement => circle(p[0], p[1], r, state);

export const frame = (elements: ShapeElement[], description: string): ShapeFrame => ({ elements, description });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpPt = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const mid = (a: Pt, b: Pt): Pt => lerpPt(a, b, 0.5);

/** 点列(複数)を、余白 margin を残して 0〜100 の箱に等倍で収め、中央に置く変換を返す。 */
export function fitTransform(all: Pt[], margin = 8): (p: Pt) => Pt {
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scale = (100 - 2 * margin) / Math.max(maxX - minX, maxY - minY, 1e-9);
  const offX = 50 - ((minX + maxX) / 2) * scale;
  const offY = 50 - ((minY + maxY) / 2) * scale;
  return (p) => [p[0] * scale + offX, p[1] * scale + offY];
}

/** 数値を短く(小数1桁)整形。 */
export const f1 = (n: number) => n.toFixed(1);
export const f3 = (n: number) => n.toFixed(3);

/** 決定的な疑似乱数(mulberry32)。ボロノイなど、再描画のたびに形が変わらないようにする。 */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
