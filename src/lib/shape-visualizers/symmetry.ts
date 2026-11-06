import type { ShapeElement, ShapeFrame } from "./base.ts";
import { arcPts, circle, dot, frame, label, line, path, polar, poly, regularPolygon, type Pt } from "./helpers.ts";

/** 対称性カテゴリの作図ジェネレータ。非対称なモチーフ(F字)に変換を重ね、変換ごとの像を見せる。 */

/** 非対称なモチーフ(F字)。左下を原点に、幅8・高さ10。 */
const MOTIF_F: Pt[] = [
  [0, 0],
  [0, 10],
  [8, 10],
  [8, 7],
  [3, 7],
  [3, 5],
  [6, 5],
  [6, 2],
  [3, 2],
  [3, 0],
];

type Transform = (points: Pt[]) => Pt[];

const place = (points: Pt[], x: number, y: number, scale = 1): Pt[] =>
  points.map(([px, py]) => [x + px * scale, y - py * scale]); // y上向きの形を画面(y下)へ置く

const translate =
  (dx: number, dy: number): Transform =>
  (pts) =>
    pts.map(([x, y]) => [x + dx, y + dy]);
const rotateAbout =
  (cx: number, cy: number, deg: number): Transform =>
  (pts) => {
    const rad = (deg * Math.PI) / 180;
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
  };
const reflectV =
  (x0: number): Transform =>
  (pts) =>
    pts.map(([x, y]) => [2 * x0 - x, y]);
const reflectH =
  (y0: number): Transform =>
  (pts) =>
    pts.map(([x, y]) => [x, 2 * y0 - y]);
/** 中心(cx,cy)を通り、画面座標で角度 angleDeg(x軸から、y下向きを正)の直線に対する反転。 */
const reflectLine =
  (cx: number, cy: number, angleDeg: number): Transform =>
  (pts) => {
    const a = (angleDeg * Math.PI) / 180;
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    return pts.map(([x, y]) => {
      const dx = x - cx;
      const dy = y - cy;
      const dot = dx * ux + dy * uy;
      return [cx + 2 * dot * ux - dx, cy + 2 * dot * uy - dy];
    });
  };
const compose =
  (...fs: Transform[]): Transform =>
  (pts) =>
    fs.reduce((acc, f) => f(acc), pts);

const centroid = (pts: Pt[]): Pt => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
const key = (pts: Pt[]) => pts.slice(0, 3).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("|");

/** 生成する変換の集まりから、有限範囲に収まるモチーフの像をすべて集める(幅優先)。 */
function orbit(motif: Pt[], gens: Transform[], bounds: { x: [number, number]; y: [number, number] }, maxDepth = 7): Pt[][] {
  const seen = new Map<string, Pt[]>([[key(motif), motif]]);
  let frontier = [motif];
  for (let d = 0; d < maxDepth; d++) {
    const next: Pt[][] = [];
    for (const shape of frontier) {
      for (const g of gens) {
        const img = g(shape);
        const [cx, cy] = centroid(img);
        if (cx < bounds.x[0] || cx > bounds.x[1] || cy < bounds.y[0] || cy > bounds.y[1]) continue;
        const k = key(img);
        if (seen.has(k)) continue;
        seen.set(k, img);
        next.push(img);
      }
    }
    if (next.length === 0) break;
    frontier = next;
  }
  return [...seen.values()];
}

const draw = (shapes: Pt[][], first: Pt[]): ShapeElement[] =>
  shapes.map((s) => poly(s, key(s) === key(first) ? "active" : "final"));

/** 巡回群 C_n。回転だけ(鏡映は含まない)で、n回で元に戻る。 */
export function cyclicGroupSteps(): ShapeFrame[] {
  const c: Pt = [50, 52];
  const base = place(MOTIF_F, 46, 26, 0.9);
  const make = (n: number): Pt[][] => Array.from({ length: n }, (_, k) => rotateAbout(c[0], c[1], (360 * k) / n)(base));
  const ring = path(arcPts(c[0], c[1], 28, 0, 360, 60), "guide");
  const frames: ShapeFrame[] = [];
  for (const n of [3, 4, 6]) {
    frames.push(
      frame(
        [ring, dot(c, "guide"), ...make(n).map((s, i) => poly(s, i === 0 ? "active" : "final"))],
        `C${n}: ${360 / n}°ずつ回して${n}個。${360 / n}°回すたびに重なる(位数${n})。鏡に映した像(反転)は含まない`,
      ),
    );
  }
  frames.push(
    frame(
      [ring, dot(c, "guide"), ...make(4).map((s) => poly(s, "final")), ...make(4).map((s) => poly(reflectV(c[0])(s), "guide"))],
      "鏡映(反転)も加えると、二面体群 D4(位数8)になる。巡回群 C4 はその中の回転だけの部分",
    ),
  );
  return frames;
}

/** 並進対称。同じ形を一定の間隔(周期)で平行移動して並べる。 */
export function translationSymmetrySteps(): ShapeFrame[] {
  const P = 22;
  const base = place(MOTIF_F, 8, 58, 1.1);
  const copies = (n: number) => Array.from({ length: n }, (_, k) => translate(k * P, 0)(base));
  const arrow = (k: number): ShapeElement[] => [line([14 + k * P, 72], [14 + (k + 1) * P, 72], "guide"), label(14 + k * P + 6, 78, `${P}`)];
  return [
    frame([poly(base, "active")], "基準の形を1つ置く"),
    frame([...copies(2).map((s, i) => poly(s, i === 0 ? "active" : "final")), ...arrow(0)], `右へ${P}だけ平行移動した像を作る。この${P}が周期`),
    frame([...copies(4).map((s, i) => poly(s, i === 0 ? "active" : "final")), ...arrow(0), ...arrow(1), ...arrow(2)], "同じ移動を繰り返すと、同じ間隔で無限に続く帯(並進対称)になる。回転も反転もしていない"),
  ];
}

/** 滑り鏡映。軸で反転してから、軸に沿って半周期だけ平行移動する。足跡の並びがこの形。 */
export function glideReflectionSteps(): ShapeFrame[] {
  const axisY = 50;
  const base = place(MOTIF_F, 8, 46, 0.9);
  const reflected = reflectH(axisY)(base);
  const glide = translate(22, 0)(reflected);
  const axis = line([4, axisY], [96, axisY], "guide", true);
  const steps = Array.from({ length: 4 }, (_, k) => translate(k * 44, 0)(base)).flatMap((s) => [s, translate(22, 0)(reflectH(axisY)(s))]);
  return [
    frame([axis, poly(base, "active")], "基準の形と、軸(水平の直線)を置く"),
    frame([axis, poly(base, "active"), poly(reflected, "guide")], "軸で上下に反転する(線対称の像)"),
    frame([axis, poly(base, "active"), poly(reflected, "guide"), poly(glide, "final")], "さらに軸に沿って右へ22だけ滑らせる。これが滑り鏡映(反転+平行移動)"),
    frame([axis, ...steps.filter((s) => centroid(s)[0] < 98).map((s, i) => poly(s, i === 0 ? "active" : "final"))], "繰り返すと、左右の足跡が互い違いに続く並び(フリーズ群の1つ)になる"),
  ];
}

/** フリーズ群(7種類)。1方向に繰り返す帯模様の対称性の分類。 */
export function friezeGroupsSteps(): ShapeFrame[] {
  const P = 24;
  const cy = 50;
  const x0 = 17;
  const motif = place(MOTIF_F, x0 - 5, cy + 5, 0.75);
  const T = translate(P, 0);
  const Ti = translate(-P, 0);
  const bounds = { x: [4, 96] as [number, number], y: [20, 80] as [number, number] };
  const band = [line([2, cy - 22], [98, cy - 22], "guide"), line([2, cy + 22], [98, cy + 22], "guide")];
  const mirrorV = (x: number) => line([x, cy - 24], [x, cy + 24], "guide", true);
  const defs: { name: string; gens: Transform[]; extra: ShapeElement[]; note: string }[] = [
    { name: "p1", gens: [T, Ti], extra: [], note: "平行移動だけ" },
    { name: "p11g", gens: [compose(reflectH(cy), translate(P / 2, 0)), compose(reflectH(cy), translate(-P / 2, 0))], extra: [line([2, cy], [98, cy], "guide", true)], note: "滑り鏡映(軸で反転して半周期ずらす)" },
    { name: "p11m", gens: [reflectH(cy), T, Ti], extra: [line([2, cy], [98, cy], "guide", true)], note: "横向きの鏡映(軸は帯の中央の水平線)" },
    { name: "p1m1", gens: [reflectV(x0 + 8), T, Ti], extra: [mirrorV(x0 + 8), mirrorV(x0 + 8 + P / 2), mirrorV(x0 + 8 + P), mirrorV(x0 + 8 + 1.5 * P)], note: "縦向きの鏡映(縦の軸が等間隔に並ぶ)" },
    { name: "p2", gens: [rotateAbout(x0 + 4, cy, 180), T, Ti], extra: [dot([x0 + 4, cy], "guide"), dot([x0 + 4 + P / 2, cy], "guide"), dot([x0 + 4 + P, cy], "guide")], note: "180°回転(回転の中心が等間隔に並ぶ)" },
    { name: "p2mg", gens: [rotateAbout(x0 + 4, cy, 180), reflectV(x0 + 4 + P / 4), T, Ti], extra: [mirrorV(x0 + 4 + P / 4), mirrorV(x0 + 4 + (3 * P) / 4)], note: "180°回転と縦の鏡映を組み合わせた形(滑り鏡映も含む)" },
    { name: "p2mm", gens: [rotateAbout(x0 + 4, cy, 180), reflectV(x0 + 4), reflectH(cy), T, Ti], extra: [mirrorV(x0 + 4), mirrorV(x0 + 4 + P / 2), line([2, cy], [98, cy], "guide", true)], note: "縦横の鏡映と180°回転をすべて含む、最も対称性の高い形" },
  ];
  return defs.map((d, i) => {
    const shapes = orbit(motif, d.gens, bounds);
    return frame([...band, ...d.extra, ...draw(shapes, motif), label(4, 12, `${i + 1}/7 ${d.name}`)], `${d.name}: ${d.note}`);
  });
}

/** 壁紙群(平面を2方向に繰り返す模様の対称性)。ここでは代表的な5種類を見る。 */
export function wallpaperGroupsSteps(): ShapeFrame[] {
  const P = 30;
  const x0 = 29;
  const y0 = 29;
  const motif = place(MOTIF_F, x0 - 3, y0 + 3.5, 0.55);
  const T1 = translate(P, 0);
  const T1i = translate(-P, 0);
  const T2 = translate(0, P);
  const T2i = translate(0, -P);
  const lattice = [T1, T1i, T2, T2i];
  const bounds = { x: [2, 98] as [number, number], y: [2, 98] as [number, number] };
  const defs: { name: string; gens: Transform[]; note: string }[] = [
    { name: "p1", gens: lattice, note: "平行移動だけ(2方向)。最も対称性が低い" },
    { name: "p2", gens: [...lattice, rotateAbout(x0, y0, 180)], note: "180°回転が加わる" },
    { name: "pmm", gens: [...lattice, reflectV(x0), reflectH(y0)], note: "縦・横の鏡映が加わる" },
    { name: "p4", gens: [...lattice, rotateAbout(x0, y0, 90)], note: "90°回転が加わる(4回回転対称)" },
    { name: "p4m", gens: [...lattice, rotateAbout(x0, y0, 90), reflectV(x0)], note: "90°回転と鏡映が加わる。正方形の対称性をすべて持つ" },
  ];
  const cell = [line([x0 - P / 2, 2], [x0 - P / 2, 98], "guide", true), line([2, y0 - P / 2], [98, y0 - P / 2], "guide", true)];
  return defs.map((d) =>
    frame([...cell, ...draw(orbit(motif, d.gens, bounds, 9), motif), label(4, 8, d.name)], `${d.name}: ${d.note}(壁紙群は全部で17種類)`),
  );
}

/** 正方形の対称(二面体群 D4)。回転4つと反転4つの、計8つの変換。 */
export function squareD4Steps(): ShapeFrame[] {
  const c: Pt = [50, 50];
  const motif = place(MOTIF_F, 41, 56, 1.0);
  const square = poly([[20, 20], [80, 20], [80, 80], [20, 80]], "guide");
  const ops: { name: string; t: Transform; extra?: ShapeElement[] }[] = [
    { name: "恒等(何もしない)", t: (p) => p },
    { name: "90°回転", t: rotateAbout(c[0], c[1], 90) },
    { name: "180°回転", t: rotateAbout(c[0], c[1], 180) },
    { name: "270°回転", t: rotateAbout(c[0], c[1], 270) },
    { name: "縦の軸で反転", t: reflectV(50), extra: [line([50, 14], [50, 86], "guide", true)] },
    { name: "横の軸で反転", t: reflectH(50), extra: [line([14, 50], [86, 50], "guide", true)] },
    { name: "右上がりの対角線で反転", t: reflectLine(50, 50, -45), extra: [line([16, 84], [84, 16], "guide", true)] },
    { name: "右下がりの対角線で反転", t: reflectLine(50, 50, 45), extra: [line([16, 16], [84, 84], "guide", true)] },
  ];
  return ops.map((op, i) =>
    frame(
      [square, ...(op.extra ?? []), poly(motif, "guide"), poly(op.t(motif), "active")],
      `${i + 1}/8 ${op.name}。正方形は、この8通りの変換でぴったり重なる(位数8、二面体群D4)`,
    ),
  );
}

/** 正多角形の対称軸。正n角形には、対称軸がn本ある。 */
export function polygonAxesSteps(): ShapeFrame[] {
  const c: Pt = [50, 50];
  return [3, 4, 5, 6, 8].map((n) => {
    const pts = regularPolygon(c[0], c[1], 36, n, 0);
    const axes = Array.from({ length: n }, (_, k) => {
      const a = (180 * k) / n;
      return line(polar(c[0], c[1], 42, a), polar(c[0], c[1], 42, a + 180), "guide", true);
    });
    return frame(
      [poly(pts, "final"), ...axes, circle(c[0], c[1], 1.4, "active")],
      `正${n}角形の対称軸は${n}本。${n % 2 === 1 ? "頂点と向かい合う辺の中点を結ぶ軸" : "向かい合う頂点どうし、向かい合う辺の中点どうしを結ぶ軸"}。回転対称の位数(${n})と同じ数になる`,
    );
  });
}

export const SYMMETRY_VISUALIZERS: Record<string, () => ShapeFrame[]> = {
  "cyclic-group": cyclicGroupSteps,
  "translation-symmetry": translationSymmetrySteps,
  "glide-reflection": glideReflectionSteps,
  "frieze-groups": friezeGroupsSteps,
  "wallpaper-groups": wallpaperGroupsSteps,
  "square-d4": squareD4Steps,
  "polygon-axes": polygonAxesSteps,
};
