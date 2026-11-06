import type { ShapeElement, ShapeFrame } from "./base.ts";
import { circle, dot, frame, label, line, poly, regularPolygon, rect, type Pt } from "./helpers.ts";

/** 立体・多面体カテゴリ(2次元の図で表せるもの)の作図ジェネレータ。 */

/** 頂点Oから、辺の向き heading(度、画面上で反時計回りを正)で始まる正n角形(一辺 s)。 */
function polygonFromVertex(o: Pt, heading: number, n: number, s: number): Pt[] {
  const pts: Pt[] = [];
  let pos: Pt = [o[0], o[1]];
  let h = heading;
  for (let i = 0; i < n; i++) {
    pts.push([pos[0], pos[1]]);
    pos = [pos[0] + s * Math.cos((h * Math.PI) / 180), pos[1] - s * Math.sin((h * Math.PI) / 180)];
    h += 360 / n;
  }
  return pts;
}

/** 正多面体: 1つの頂点に集まる正多角形の内角の和が360°未満であることを、頂点のまわりの扇形で見る。 */
export function platonicSolidsSteps(): ShapeFrame[] {
  const o: Pt = [50, 52];
  const cases: { n: number; count: number; name: string; solid: string | null }[] = [
    { n: 3, count: 3, name: "正三角形が3枚", solid: "正四面体" },
    { n: 3, count: 4, name: "正三角形が4枚", solid: "正八面体" },
    { n: 3, count: 5, name: "正三角形が5枚", solid: "正二十面体" },
    { n: 3, count: 6, name: "正三角形が6枚", solid: null },
    { n: 4, count: 3, name: "正方形が3枚", solid: "正六面体(立方体)" },
    { n: 4, count: 4, name: "正方形が4枚", solid: null },
    { n: 5, count: 3, name: "正五角形が3枚", solid: "正十二面体" },
    { n: 6, count: 3, name: "正六角形が3枚", solid: null },
  ];
  return cases.map(({ n, count, name, solid }) => {
    const interior = ((n - 2) * 180) / n;
    const total = interior * count;
    const s = n === 3 ? 28 : n === 4 ? 24 : n === 5 ? 20 : 18;
    const els: ShapeElement[] = [];
    let heading = 0;
    for (let i = 0; i < count; i++) {
      els.push(poly(polygonFromVertex(o, heading, n, s), i === 0 ? "active" : "final"));
      heading += interior;
    }
    els.push(dot(o, "guide", 1.6), label(6, 10, `${interior}°×${count}=${total}°`));
    const text =
      solid !== null
        ? `${name}: 内角の和 ${total}°(360°未満)。すき間があるので、折り曲げて頂点をつくれる → ${solid}ができる`
        : `${name}: 内角の和 ${total}°=360°。すき間がなく、平らに敷き詰まってしまう(立体の頂点にならない。平面のテセレーション)`;
    return frame(els, text);
  });
}

/** 立方体の展開図(全部で11種類)。 */
export function cubeNetSteps(): ShapeFrame[] {
  const s = 18;
  const sq = (c: number, r: number, x0: number, y0: number, state: "final" | "active" = "final"): ShapeElement => rect(x0 + c * s, y0 + r * s, s, s, state);
  const nums = (cells: [number, number][], x0: number, y0: number): ShapeElement[] => cells.map(([c, r], i) => label(x0 + c * s + s / 2 - 1, y0 + r * s + s / 2 + 1.5, String(i + 1)));
  const nets: { cells: [number, number][]; text: string }[] = [
    { cells: [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]], text: "十字形(1-4-1型)。中央の4面が側面になり、上下の面が折り上がる" },
    { cells: [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [3, 2]], text: "1-4-1型の別の形。4面の列の上と下に、ずらして面がつく" },
    { cells: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]], text: "階段型(2-2-2型)。2面ずつが、ずれながら並ぶ" },
  ];
  return nets.map((net, i) => {
    const x0 = 50 - 2 * s;
    const y0 = 50 - 1.5 * s;
    return frame(
      [...net.cells.map((c) => sq(c[0], c[1], x0, y0, "final")), ...nums(net.cells, x0, y0)],
      `${i + 1}/3 ${net.text}。立方体の展開図は、回転・反転で重なるものを同じとして、全部で11種類ある`,
    );
  });
}

/** オイラーの多面体定理 V−E+F=2。平面グラフとして描いた正多面体で、頂点・辺・面の数を数える。 */
export function eulerPolyhedronSteps(): ShapeFrame[] {
  type G = { name: string; v: Pt[]; e: [number, number][]; f: number };
  const tetra: G = {
    name: "正四面体",
    v: [[50, 10], [10, 80], [90, 80], [50, 58]],
    e: [[0, 1], [1, 2], [2, 0], [0, 3], [1, 3], [2, 3]],
    f: 4,
  };
  const cubeOuter = regularPolygon(50, 50, 40, 4, 45);
  const cubeInner = regularPolygon(50, 50, 18, 4, 45);
  const cube: G = {
    name: "立方体",
    v: [...cubeOuter, ...cubeInner],
    e: [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]],
    f: 6,
  };
  const octOuter = regularPolygon(50, 54, 42, 3, 0);
  const octInner = regularPolygon(50, 54, 20, 3, 180);
  const oct: G = {
    name: "正八面体",
    v: [...octOuter, ...octInner],
    e: [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 3], [0, 4], [0, 5], [1, 3], [1, 5], [2, 3], [2, 4]],
    f: 8,
  };
  return [tetra, cube, oct].map((g) => {
    const els: ShapeElement[] = [...g.e.map(([a, b]) => line(g.v[a], g.v[b], "final")), ...g.v.map((p) => dot(p, "active", 1.8))];
    const V = g.v.length;
    const E = g.e.length;
    return frame(
      [...els, label(4, 8, `V=${V} E=${E} F=${g.f}`)],
      `${g.name}: 頂点 V=${V}、辺 E=${E}、面 F=${g.f}(外側の広がりも1面と数える)。V−E+F = ${V}−${E}+${g.f} = ${V - E + g.f}`,
    );
  });
}

/** 正多角形の内角。多角形を1つの頂点からの対角線で三角形に分けて、内角の和を数える。 */
export function interiorAnglesSteps(): ShapeFrame[] {
  return [3, 4, 5, 6, 8].map((n) => {
    const pts = regularPolygon(50, 52, 38, n, 0);
    const diag = Array.from({ length: n - 3 }, (_, k) => line(pts[0], pts[k + 2], "guide", true));
    const sum = (n - 2) * 180;
    return frame(
      [poly(pts, "final"), ...diag, dot(pts[0], "active", 1.8), circle(50, 52, 0.01, "guide")],
      `正${n}角形: 1つの頂点から対角線を引くと、三角形が ${n - 2} 個できる。内角の和は 180°×${n - 2}=${sum}°、1つの内角は ${sum}°÷${n}=${(sum / n).toFixed(1)}°(外角は ${(360 / n).toFixed(1)}°)`,
    );
  });
}


export const SOLID_VISUALIZERS: Record<string, () => ShapeFrame[]> = {
  "platonic-solids": platonicSolidsSteps,
  "cube-net": cubeNetSteps,
  "euler-polyhedron": eulerPolyhedronSteps,
  "interior-angles": interiorAnglesSteps,
};
