import type { ShapeElement, ShapeFrame } from "./base.ts";
import {
  PHI,
  arcPts,
  circle,
  dist,
  dot,
  f1,
  frame,
  label,
  lerpPt,
  line,
  path,
  polar,
  poly,
  seededRandom,
  type Pt,
} from "./helpers.ts";

/** 平面充填(テセレーション)・分割カテゴリの作図ジェネレータ。 */

const inBox = (p: Pt, lo = 4, hi = 96) => p[0] >= lo && p[0] <= hi && p[1] >= lo && p[1] <= hi;
const centroid = (pts: Pt[]): Pt => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];

/** 正三角形のタイリング。1つの頂点に6枚(60°×6=360°)が集まる。 */
export function triangleTessellationSteps(): ShapeFrame[] {
  const s = 17;
  const h = (s * Math.sqrt(3)) / 2;
  const rows: Pt[][][] = [];
  for (let r = 0; r < 6; r++) {
    const row: Pt[][] = [];
    const y0 = 8 + r * h;
    for (let i = -1; i < 7; i++) {
      const x0 = 4 + i * s + (r % 2 === 0 ? 0 : s / 2);
      row.push([[x0, y0 + h], [x0 + s, y0 + h], [x0 + s / 2, y0]]);
      row.push([[x0 + s / 2, y0], [x0 + (3 * s) / 2, y0], [x0 + s, y0 + h]]);
    }
    rows.push(row.filter((t) => t.every((p) => inBox(p, 2, 98))));
  }
  const draw = (n: number) => rows.slice(0, n).flat().map((t) => poly(t, "final"));
  const all = draw(6);
  const v: Pt = [4 + 3 * s + s / 2, 8 + 3 * h];
  return [
    frame(draw(1), "正三角形を1段並べる。辺と辺をぴったり合わせる"),
    frame(draw(3), "段を重ねていく。すき間も重なりも生じない"),
    frame(all, "画面いっぱいに敷き詰めた。内角60°の三角形が、どの頂点にも同じように集まる"),
    frame([...all, circle(v[0], v[1], 2.2, "active"), label(v[0] + 4, v[1] - 3, "60°×6=360°")], "1つの頂点に6枚が集まり、60°×6=360°でちょうど一周する。これが正三角形で敷き詰められる理由"),
  ];
}

/** 正方形のタイリング。1つの頂点に4枚(90°×4=360°)が集まる。 */
export function squareTessellationSteps(): ShapeFrame[] {
  const s = 15;
  const grid = (cols: number, rows: number) =>
    Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => poly([[5 + c * s, 5 + r * s], [5 + (c + 1) * s, 5 + r * s], [5 + (c + 1) * s, 5 + (r + 1) * s], [5 + c * s, 5 + (r + 1) * s]], "final")),
    ).flat();
  const v: Pt = [5 + 3 * s, 5 + 3 * s];
  return [
    frame(grid(1, 1), "一辺15の正方形を1つ置く"),
    frame(grid(6, 1), "辺をそろえて横に並べる"),
    frame(grid(6, 6), "段を重ねて敷き詰める。碁盤の目の形"),
    frame([...grid(6, 6), circle(v[0], v[1], 2.2, "active"), label(v[0] + 4, v[1] - 3, "90°×4=360°")], "1つの頂点に4枚が集まり、90°×4=360°でぴったり埋まる"),
  ];
}

/** 3.6.3.6(カゴメ格子)。正三角形と正六角形が、1頂点のまわりに交互(三角・六角・三角・六角)に並ぶ。 */
function trihexagonalElements(): { hexes: Pt[][]; tris: Pt[][] } {
  const a = 8;
  const u: Pt = [2 * a, 0];
  const v: Pt = [a, a * Math.sqrt(3)];
  const hexes: Pt[][] = [];
  const tris: Pt[][] = [];
  for (let j = -3; j <= 6; j++) {
    for (let i = -4; i <= 6; i++) {
      const c: Pt = [30 + i * u[0] + j * v[0], 10 + i * u[1] + j * v[1]];
      const hex = Array.from({ length: 6 }, (_, k) => polar(c[0], c[1], a, 90 + 60 * k));
      if (inBox(c, 12, 88)) hexes.push(hex);
      const c1: Pt = [c[0] + u[0], c[1] + u[1]];
      const c2: Pt = [c[0] + v[0], c[1] + v[1]];
      const c3: Pt = [c[0] + u[0] + v[0], c[1] + u[1] + v[1]];
      const mid = (p: Pt, q: Pt): Pt => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      const t1 = [mid(c, c1), mid(c1, c2), mid(c, c2)];
      const t2 = [mid(c1, c2), mid(c2, c3), mid(c1, c3)];
      for (const t of [t1, t2]) if (inBox(centroid(t), 8, 92)) tris.push(t);
    }
  }
  return { hexes, tris };
}

export function trihexagonalTessellationSteps(): ShapeFrame[] {
  const { hexes, tris } = trihexagonalElements();
  const H = hexes.map((h) => poly(h, "final"));
  const T = tris.map((t) => poly(t, "active"));
  return [
    frame(H, "正六角形を、頂点どうしだけでつなぐように並べる(辺は共有しない)"),
    frame([...H, ...T], "六角形のあいだのすき間に、正三角形がちょうどはまる"),
    frame([...H, ...T], "どの頂点でも、三角形・六角形・三角形・六角形の順に並ぶ(記号 3.6.3.6)。内角は 60+120+60+120=360°"),
  ];
}

/** 4.8.8(切頂正方形)。正八角形と正方形の組み合わせ。 */
export function truncatedSquareTessellationSteps(): ShapeFrame[] {
  const a = 11;
  const d = a * (1 + Math.SQRT2);
  const R = a / (2 * Math.sin(Math.PI / 8));
  const x0 = 50 - d;
  const octs: Pt[][] = [];
  const squares: Pt[][] = [];
  for (let j = 0; j < 3; j++) {
    for (let i = 0; i < 3; i++) {
      const c: Pt = [x0 + i * d, x0 + j * d];
      octs.push(Array.from({ length: 8 }, (_, k) => polar(c[0], c[1], R, 22.5 + 45 * k)));
      if (i < 2 && j < 2) {
        const m: Pt = [c[0] + d / 2, c[1] + d / 2];
        const r = a / Math.SQRT2;
        squares.push([[m[0], m[1] - r], [m[0] + r, m[1]], [m[0], m[1] + r], [m[0] - r, m[1]]]);
      }
    }
  }
  const O = octs.map((o) => poly(o, "final"));
  const S = squares.map((q) => poly(q, "active"));
  const v = squares[0][3];
  return [
    frame(O.slice(0, 3), "正八角形(内角135°)を、辺をそろえて並べる"),
    frame(O, "縦にも並べると、4つの八角形のあいだに、斜めの正方形の形のすき間ができる"),
    frame([...O, ...S], "すき間にぴったり、正方形(内角90°)がはまる"),
    frame([...O, ...S, circle(v[0], v[1], 2, "guide"), label(v[0] + 3, v[1] + 8, "90+135+135=360°")], "どの頂点でも、正方形・八角形・八角形が集まる(記号 4.8.8)。90°+135°+135°=360°"),
  ];
}

/** 準正則テセレーション(アルキメデスのタイリング)。3.6.3.6 と 4.8.8 を並べて見る。 */
export function semiRegularTessellationSteps(): ShapeFrame[] {
  const tri = trihexagonalTessellationSteps();
  const sq = truncatedSquareTessellationSteps();
  return [
    { elements: tri[2].elements, description: "3.6.3.6: 三角形・六角形・三角形・六角形。60+120+60+120=360°" },
    { elements: sq[3].elements, description: "4.8.8: 正方形・八角形・八角形。90+135+135=360°。どの頂点も同じ並びになる" },
  ];
}

/** 点列(ボロノイ・ドロネー共通)。決定的な疑似乱数で、近すぎない点を選ぶ。 */
function sites(n: number, seed: number): Pt[] {
  const rnd = seededRandom(seed);
  const pts: Pt[] = [];
  let guard = 0;
  while (pts.length < n && guard++ < 2000) {
    const p: Pt = [12 + rnd() * 76, 12 + rnd() * 76];
    if (pts.every((q) => dist(p, q) > 17)) pts.push(p);
  }
  return pts;
}

/** 多角形を半平面 (p−m)·n ≤ 0 で切り取る(Sutherland–Hodgman)。 */
function clipHalfPlane(polygon: Pt[], m: Pt, n: Pt): Pt[] {
  const out: Pt[] = [];
  const side = (p: Pt) => (p[0] - m[0]) * n[0] + (p[1] - m[1]) * n[1];
  for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i];
    const q = polygon[(i + 1) % polygon.length];
    const sp = side(p);
    const sq = side(q);
    if (sp <= 0) out.push(p);
    if ((sp < 0 && sq > 0) || (sp > 0 && sq < 0)) {
      const t = sp / (sp - sq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
}

function voronoiCells(pts: Pt[]): Pt[][] {
  const box: Pt[] = [[4, 4], [96, 4], [96, 96], [4, 96]];
  return pts.map((p, i) => {
    let cell = box;
    for (let j = 0; j < pts.length; j++) {
      if (i === j || cell.length === 0) continue;
      const q = pts[j];
      cell = clipHalfPlane(cell, [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], [q[0] - p[0], q[1] - p[1]]);
    }
    return cell;
  });
}

/** ボロノイ分割。平面を「どの点に最も近いか」で区切る。 */
export function voronoiDiagramSteps(): ShapeFrame[] {
  const pts = sites(13, 7);
  const cells = voronoiCells(pts);
  const dots = pts.map((p) => dot(p, "active", 1.6));
  const a = pts[0];
  const b = pts.slice(1).sort((p, q) => dist(a, p) - dist(a, q))[0];
  const m = lerpPt(a, b, 0.5);
  const nx = -(b[1] - a[1]);
  const ny = b[0] - a[0];
  const len = Math.hypot(nx, ny);
  const bis = line([m[0] - (nx / len) * 22, m[1] - (ny / len) * 22], [m[0] + (nx / len) * 22, m[1] + (ny / len) * 22], "active", true);
  return [
    frame(dots, "点(母点)をいくつか置く"),
    frame([...dots, line(a, b, "guide"), bis], "2点の垂直二等分線は、2点から等しい距離にある点の集まり。この線が2点の領域の境目になる"),
    frame([...dots, poly(cells[0], "final")], "他のすべての点との垂直二等分線で切り取ると、1つの点の領域(セル)ができる"),
    frame([...dots, ...cells.map((c, i) => poly(c, i === 0 ? "active" : "final"))], "すべての点で行うと、平面が領域に分かれる。各領域の中のどの場所も、その領域の点が一番近い"),
  ];
}

/** ドロネー三角形分割。どの三角形の外接円の内側にも、他の点が入らない。 */
export function delaunayTriangulationSteps(): ShapeFrame[] {
  const pts = sites(13, 7);
  const tris: [number, number, number][] = [];
  const circum = (a: Pt, b: Pt, c: Pt): { c: Pt; r: number } | null => {
    const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
    if (Math.abs(d) < 1e-6) return null;
    const ux = ((a[0] ** 2 + a[1] ** 2) * (b[1] - c[1]) + (b[0] ** 2 + b[1] ** 2) * (c[1] - a[1]) + (c[0] ** 2 + c[1] ** 2) * (a[1] - b[1])) / d;
    const uy = ((a[0] ** 2 + a[1] ** 2) * (c[0] - b[0]) + (b[0] ** 2 + b[1] ** 2) * (a[0] - c[0]) + (c[0] ** 2 + c[1] ** 2) * (b[0] - a[0])) / d;
    return { c: [ux, uy], r: Math.hypot(a[0] - ux, a[1] - uy) };
  };
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++)
      for (let k = j + 1; k < pts.length; k++) {
        const cc = circum(pts[i], pts[j], pts[k]);
        if (!cc) continue;
        if (pts.every((p, idx) => idx === i || idx === j || idx === k || dist(p, cc.c) > cc.r + 1e-6)) tris.push([i, j, k]);
      }
  const shapes = tris.map(([i, j, k]) => poly([pts[i], pts[j], pts[k]], "final"));
  const dots = pts.map((p) => dot(p, "active", 1.5));
  const first = tris[Math.floor(tris.length / 2)];
  const cc = circum(pts[first[0]], pts[first[1]], pts[first[2]])!;
  const ring: ShapeElement = path(arcPts(cc.c[0], cc.c[1], cc.r, 0, 360, 72).map((p) => [Math.max(-20, Math.min(120, p[0])), Math.max(-20, Math.min(120, p[1]))] as Pt), "guide");
  return [
    frame(dots, "同じ点(母点)から始める"),
    frame([...shapes.slice(0, Math.ceil(shapes.length / 3)), ...dots], "点を結んで三角形を作る。ただし、どの三角形の外接円にも、他の点が入らないものだけを選ぶ"),
    frame([...shapes, ...dots, ring, poly([pts[first[0]], pts[first[1]], pts[first[2]]], "active")], "ある三角形(強調)と、その外接円。円の中に他の点は1つもない(これがドロネーの条件)"),
    frame([...shapes, ...dots], `すべての三角形(${tris.length}個)。細長い三角形ができにくい分割で、ボロノイ分割の「となり合う点どうし」を結んだものと一致する`),
  ];
}

/** ピタゴラス敷き。大小2種類の正方形だけで平面を埋める。 */
export function pythagoreanTilingSteps(): ShapeFrame[] {
  const a = 14;
  const b = 8;
  const c = Math.hypot(a, b);
  const bigs: Pt[][] = [];
  const smalls: Pt[][] = [];
  const sq = (x: number, y: number, s: number): Pt[] => [[x, y], [x + s, y], [x + s, y + s], [x, y + s]];
  for (let i = -6; i <= 6; i++) {
    for (let j = -6; j <= 6; j++) {
      const ox = 40 + i * a - j * b;
      const oy = 40 + i * b + j * a;
      const big = sq(ox, oy, a);
      const small = sq(ox + a, oy, b);
      if (inBox(centroid(big), 6, 94)) bigs.push(big);
      if (inBox(centroid(small), 6, 94)) smalls.push(small);
    }
  }
  const B = bigs.map((s) => poly(s, "final"));
  const S = smalls.map((s) => poly(s, "active"));
  return [
    frame(B, `大きい正方形(一辺${a})だけを並べる。斜めに、少しずつずらして置く`),
    frame([...B, ...S], `すき間に、小さい正方形(一辺${b})がちょうどはまる。2種類の正方形だけで敷き詰められた`),
    frame([...B, ...S], `繰り返しの単位(格子)は、一辺√(${a}²+${b}²)=${f1(c)} の正方形。その面積 ${a}²+${b}² = ${a * a + b * b} は、大小の正方形の面積の和。ピタゴラスの定理の図になっている`),
  ];
}

/** 円充填。同じ大きさの円を最も密に詰める並べ方(六方最密)。 */
export function circlePackingSteps(): ShapeFrame[] {
  const r = 6;
  const squareGrid: ShapeElement[] = [];
  const hexGrid: ShapeElement[] = [];
  for (let j = 0; j < 7; j++) {
    for (let i = 0; i < 7; i++) {
      const x = 12 + i * 2 * r;
      const y = 12 + j * 2 * r;
      if (x + r <= 96 && y + r <= 96) squareGrid.push(circle(x, y, r, "final"));
      const hx = 12 + i * 2 * r + (j % 2 === 0 ? 0 : r);
      const hy = 12 + j * r * Math.sqrt(3);
      if (hx + r <= 96 && hy + r <= 96) hexGrid.push(circle(hx, hy, r, "active"));
    }
  }
  return [
    frame(squareGrid, "円を正方形の格子に並べる。円が占める面積の割合は π/4 ≈ 0.785"),
    frame(hexGrid, "1段おきに半径ぶんずらすと、円が6つの円に囲まれる並び(六方最密)になる。割合は π/√12 ≈ 0.907"),
  ];
}

/** ペンローズタイル(Robinson三角形の分割)。厚い菱形と薄い菱形で、周期なく平面を埋める。 */
export function penroseTilingSteps(): ShapeFrame[] {
  type Tri = { color: 0 | 1; A: Pt; B: Pt; C: Pt };
  const add = (p: Pt, q: Pt): Pt => [p[0] + q[0], p[1] + q[1]];
  const sub = (p: Pt, q: Pt): Pt => [p[0] - q[0], p[1] - q[1]];
  const mul = (p: Pt, k: number): Pt => [p[0] * k, p[1] * k];
  let tris: Tri[] = [];
  for (let i = 0; i < 10; i++) {
    let B = polar(0, 0, 1, ((2 * i - 1) * 36) / 2);
    let C = polar(0, 0, 1, ((2 * i + 1) * 36) / 2);
    if (i % 2 === 0) [B, C] = [C, B];
    tris.push({ color: 0, A: [0, 0], B, C });
  }
  const subdivide = (list: Tri[]): Tri[] => {
    const out: Tri[] = [];
    for (const t of list) {
      if (t.color === 0) {
        const P = add(t.A, mul(sub(t.B, t.A), 1 / PHI));
        out.push({ color: 0, A: t.C, B: P, C: t.B }, { color: 1, A: P, B: t.C, C: t.A });
      } else {
        const Q = add(t.B, mul(sub(t.A, t.B), 1 / PHI));
        const R = add(t.B, mul(sub(t.C, t.B), 1 / PHI));
        out.push({ color: 1, A: R, B: t.C, C: t.A }, { color: 1, A: Q, B: R, C: t.B }, { color: 0, A: R, B: Q, C: t.A });
      }
    }
    return out;
  };
  const toEls = (list: Tri[]): ShapeElement[] =>
    list.map((t) => path([[50 + t.C[0] * 46, 50 + t.C[1] * 46], [50 + t.A[0] * 46, 50 + t.A[1] * 46], [50 + t.B[0] * 46, 50 + t.B[1] * 46]], t.color === 0 ? "final" : "active"));
  const frames: ShapeFrame[] = [frame(toEls(tris), "10枚の三角形を、中心のまわりに放射状に並べる(最初の状態)")];
  for (let g = 1; g <= 4; g++) {
    tris = subdivide(tris);
    frames.push(frame(toEls(tris), `${g}回分割: 各三角形を黄金比(1:${PHI.toFixed(3)})の位置で2〜3個に分ける(三角形${tris.length}枚)。2種類の菱形が現れ、周期的には繰り返さない`));
  }
  return frames;
}

export const TILING_VISUALIZERS: Record<string, () => ShapeFrame[]> = {
  "triangle-tessellation": triangleTessellationSteps,
  "square-tessellation": squareTessellationSteps,
  "trihexagonal-tessellation": trihexagonalTessellationSteps,
  "truncated-square-tessellation": truncatedSquareTessellationSteps,
  "semi-regular-tessellation": semiRegularTessellationSteps,
  "voronoi-diagram": voronoiDiagramSteps,
  "delaunay-triangulation": delaunayTriangulationSteps,
  "pythagorean-tiling": pythagoreanTilingSteps,
  "circle-packing": circlePackingSteps,
  "penrose-tiling": penroseTilingSteps,
};

