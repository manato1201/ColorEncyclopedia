import type { Vec3 } from "./mesh-data.ts";
import { PHI } from "./polyhedra.ts";

/**
 * 凸多面体を「頂点の座標」から作る(凸包)。面・辺の数、双対、対称軸を、座標から計算する。
 * 数え直せるので、頂点・辺・面の数(オイラーの多面体定理)や回転群の位数を verify で検査できる。
 */

const EPS = 1e-6;

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
const unit = (a: Vec3): Vec3 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

export type Hull = {
  vertices: Vec3[];
  /** 面ごとの頂点番号(面の外側から見て反時計回り)。 */
  faces: number[][];
  /** 辺(小さい番号, 大きい番号)。 */
  edges: [number, number][];
};

/** 点集合の凸包(全頂点が凸位置にある多面体向け。同一平面上の点は1つの面にまとめる)。 */
export function convexHull(points: Vec3[]): Hull {
  // 重複を除く
  const verts: Vec3[] = [];
  for (const p of points) if (!verts.some((q) => len(sub(p, q)) < EPS)) verts.push(p);
  const n = verts.length;
  const center: Vec3 = [0, 0, 0];
  for (const v of verts) {
    center[0] += v[0] / n;
    center[1] += v[1] / n;
    center[2] += v[2] / n;
  }
  const seen = new Set<string>();
  const faces: number[][] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        let normal = cross(sub(verts[j], verts[i]), sub(verts[k], verts[i]));
        if (len(normal) < EPS) continue;
        normal = unit(normal);
        const d = dot(normal, verts[i]);
        let above = 0;
        let below = 0;
        const onPlane: number[] = [];
        for (let m = 0; m < n; m++) {
          const s = dot(normal, verts[m]) - d;
          if (Math.abs(s) < EPS) onPlane.push(m);
          else if (s > 0) above++;
          else below++;
        }
        if (above > 0 && below > 0) continue; // 全点が片側にある平面だけが面
        const key = onPlane.join(",");
        if (seen.has(key)) continue;
        seen.add(key);
        // 外向きの法線にそろえ、面の中心のまわりに角度順で並べる
        const out = above > 0 ? ([-normal[0], -normal[1], -normal[2]] as Vec3) : normal;
        const fc: Vec3 = [0, 0, 0];
        for (const m of onPlane) {
          fc[0] += verts[m][0] / onPlane.length;
          fc[1] += verts[m][1] / onPlane.length;
          fc[2] += verts[m][2] / onPlane.length;
        }
        const u = unit(sub(verts[onPlane[0]], fc));
        const w = cross(out, u);
        const sorted = [...onPlane].sort((a, b) => {
          const va = sub(verts[a], fc);
          const vb = sub(verts[b], fc);
          return Math.atan2(dot(va, w), dot(va, u)) - Math.atan2(dot(vb, w), dot(vb, u));
        });
        faces.push(sorted);
      }
    }
  }
  const edgeSet = new Set<string>();
  const edges: [number, number][] = [];
  for (const f of faces) {
    for (let i = 0; i < f.length; i++) {
      const a = Math.min(f[i], f[(i + 1) % f.length]);
      const b = Math.max(f[i], f[(i + 1) % f.length]);
      const k = `${a},${b}`;
      if (!edgeSet.has(k)) {
        edgeSet.add(k);
        edges.push([a, b]);
      }
    }
  }
  return { vertices: verts, faces, edges };
}

// ---------------------------------------------------------------------------
// 頂点座標の作り方(順列・符号)
// ---------------------------------------------------------------------------

function signs(v: Vec3): Vec3[] {
  const out: Vec3[] = [];
  for (const sx of v[0] === 0 ? [1] : [1, -1]) for (const sy of v[1] === 0 ? [1] : [1, -1]) for (const sz of v[2] === 0 ? [1] : [1, -1]) out.push([v[0] * sx, v[1] * sy, v[2] * sz]);
  return out;
}

/** すべての順列(重複は後で除く)。 */
function allPerms(v: Vec3): Vec3[] {
  const [a, b, c] = v;
  return [
    [a, b, c],
    [a, c, b],
    [b, a, c],
    [b, c, a],
    [c, a, b],
    [c, b, a],
  ];
}

/** 偶置換(巡回)のみ。 */
function cyclicPerms(v: Vec3): Vec3[] {
  const [a, b, c] = v;
  return [
    [a, b, c],
    [b, c, a],
    [c, a, b],
  ];
}

function build(seeds: Vec3[], perms: (v: Vec3) => Vec3[]): Vec3[] {
  const out: Vec3[] = [];
  for (const s of seeds) for (const p of perms(s)) for (const q of signs(p)) if (!out.some((r) => len(sub(r, q)) < EPS)) out.push(q);
  return out;
}

export type HullSolidId =
  | "tetrahedron"
  | "cube"
  | "octahedron"
  | "dodecahedron"
  | "icosahedron"
  | "cuboctahedron"
  | "truncated-tetrahedron"
  | "truncated-cube"
  | "truncated-octahedron"
  | "rhombicuboctahedron"
  | "icosidodecahedron"
  | "truncated-icosahedron"
  | "rhombic-dodecahedron";

export type HullSolidSpec = {
  id: HullSolidId;
  name: string;
  /** 半正多面体(アルキメデスの立体)か。 */
  archimedean: boolean;
  vertices: () => Vec3[];
};

const R2 = Math.SQRT2;

export const HULL_SOLIDS: HullSolidSpec[] = [
  { id: "tetrahedron", name: "正四面体", archimedean: false, vertices: () => [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]] },
  { id: "cube", name: "正六面体(立方体)", archimedean: false, vertices: () => build([[1, 1, 1]], allPerms) },
  { id: "octahedron", name: "正八面体", archimedean: false, vertices: () => build([[1, 0, 0]], allPerms) },
  {
    id: "dodecahedron",
    name: "正十二面体",
    archimedean: false,
    vertices: () => [...build([[1, 1, 1]], allPerms), ...build([[0, 1 / PHI, PHI]], cyclicPerms)],
  },
  { id: "icosahedron", name: "正二十面体", archimedean: false, vertices: () => build([[0, 1, PHI]], cyclicPerms) },
  { id: "cuboctahedron", name: "立方八面体", archimedean: true, vertices: () => build([[1, 1, 0]], allPerms) },
  {
    id: "truncated-tetrahedron",
    name: "切頂四面体",
    archimedean: true,
    vertices: () => {
      // (±3,±1,±1) の順列のうち、負の符号が偶数個
      const out: Vec3[] = [];
      for (const p of allPerms([3, 1, 1])) for (const q of signs(p)) if (q.filter((x) => x < 0).length % 2 === 0 && !out.some((r) => len(sub(r, q)) < EPS)) out.push(q);
      return out;
    },
  },
  { id: "truncated-cube", name: "切頂六面体", archimedean: true, vertices: () => build([[1, 1, R2 - 1]], allPerms) },
  { id: "truncated-octahedron", name: "切頂八面体", archimedean: true, vertices: () => build([[0, 1, 2]], allPerms) },
  { id: "rhombicuboctahedron", name: "菱形立方八面体", archimedean: true, vertices: () => build([[1, 1, 1 + R2]], allPerms) },
  {
    id: "icosidodecahedron",
    name: "二十・十二面体",
    archimedean: true,
    vertices: () => [...build([[0, 0, PHI]], allPerms), ...build([[0.5, PHI / 2, (PHI * PHI) / 2]], cyclicPerms)],
  },
  {
    id: "truncated-icosahedron",
    name: "切頂二十面体(サッカーボール型)",
    archimedean: true,
    vertices: () => [
      ...build([[0, 1, 3 * PHI]], cyclicPerms),
      ...build([[1, 2 + PHI, 2 * PHI]], cyclicPerms),
      ...build([[PHI, 2, 2 * PHI + 1]], cyclicPerms),
    ],
  },
  {
    id: "rhombic-dodecahedron",
    name: "菱形十二面体",
    archimedean: false,
    vertices: () => [...build([[1, 1, 1]], allPerms), ...build([[2, 0, 0]], allPerms)],
  },
];

const hullCache = new Map<HullSolidId, Hull>();

/** 外接球の半径が 1 になるよう大きさをそろえた凸包。 */
export function solidHull(id: HullSolidId): Hull {
  const cached = hullCache.get(id);
  if (cached) return cached;
  const spec = HULL_SOLIDS.find((s) => s.id === id)!;
  const raw = spec.vertices();
  const r = Math.max(...raw.map(len));
  const hull = convexHull(raw.map((v): Vec3 => [v[0] / r, v[1] / r, v[2] / r]));
  hullCache.set(id, hull);
  return hull;
}

/** 面の種類の内訳(n角形がいくつ)。 */
export function faceBreakdown(h: Hull): { sides: number; count: number }[] {
  const m = new Map<number, number>();
  for (const f of h.faces) m.set(f.length, (m.get(f.length) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([sides, count]) => ({ sides, count }));
}

/** 双対多面体: 各面の中心を頂点にする。元の外接球上に、面の中心を伸ばして置く。 */
export function dualHull(h: Hull): Hull {
  const centers = h.faces.map((f): Vec3 => {
    const c: Vec3 = [0, 0, 0];
    for (const i of f) {
      c[0] += h.vertices[i][0] / f.length;
      c[1] += h.vertices[i][1] / f.length;
      c[2] += h.vertices[i][2] / f.length;
    }
    return c;
  });
  return convexHull(centers);
}

// ---------------------------------------------------------------------------
// 回転対称の軸
// ---------------------------------------------------------------------------

export type SymmetryAxis = { direction: Vec3; fold: number };

/** 頂点・面の中心・辺の中点を通る軸を集め、同じ直線は1本にして、n回対称の n を求める。 */
export function rotationAxes(h: Hull): SymmetryAxis[] {
  const cands: SymmetryAxis[] = [];
  for (const f of h.faces) {
    const c: Vec3 = [0, 0, 0];
    for (const i of f) {
      c[0] += h.vertices[i][0];
      c[1] += h.vertices[i][1];
      c[2] += h.vertices[i][2];
    }
    cands.push({ direction: unit(c), fold: f.length });
  }
  const degree = new Map<number, number>();
  for (const [a, b] of h.edges) {
    degree.set(a, (degree.get(a) ?? 0) + 1);
    degree.set(b, (degree.get(b) ?? 0) + 1);
    const m: Vec3 = [(h.vertices[a][0] + h.vertices[b][0]) / 2, (h.vertices[a][1] + h.vertices[b][1]) / 2, (h.vertices[a][2] + h.vertices[b][2]) / 2];
    cands.push({ direction: unit(m), fold: 2 });
  }
  h.vertices.forEach((v, i) => cands.push({ direction: unit(v), fold: degree.get(i) ?? 0 }));

  // 同じ直線(向きが逆でも同じ)の候補は、n が最大のものを採る。素朴な n は多面体の面・頂点の次数と一致する(正多面体)。
  const axes: SymmetryAxis[] = [];
  for (const c of cands) {
    const same = axes.find((a) => Math.abs(Math.abs(dot(a.direction, c.direction)) - 1) < 1e-6);
    if (same) same.fold = Math.max(same.fold, c.fold);
    else axes.push({ direction: c.direction, fold: c.fold });
  }
  return axes;
}

/** 回転群の位数(恒等 + 各軸の (n−1) 個の回転)。正多面体では 12・24・60。 */
export function rotationGroupOrder(axes: SymmetryAxis[]): number {
  return 1 + axes.reduce((s, a) => s + (a.fold - 1), 0);
}

// ---------------------------------------------------------------------------
// 空間充填(立体を並べる)
// ---------------------------------------------------------------------------

export type SpaceFiller = "cube" | "truncated-octahedron" | "rhombic-dodecahedron";

/**
 * 同じ立体で空間をすき間なく埋める並べ方の、中心の座標(大きさは solidHull の外接球=1 のとき)。
 * cube: 単純立方格子 / truncated-octahedron: 体心立方格子 / rhombic-dodecahedron: 面心立方格子。
 * radius の内側にある中心だけを返す。
 */
export function spaceFillingCenters(kind: SpaceFiller, radius: number): Vec3[] {
  const hull = solidHull(kind);
  // 隣り合う中心の距離 = 2 × 内接球の半径(面の中心までの距離)
  const inradius = Math.min(...hull.faces.map((f) => {
    const c: Vec3 = [0, 0, 0];
    for (const i of f) {
      c[0] += hull.vertices[i][0] / f.length;
      c[1] += hull.vertices[i][1] / f.length;
      c[2] += hull.vertices[i][2] / f.length;
    }
    return len(c);
  }));
  const out: Vec3[] = [];
  const range = 6;
  for (let i = -range; i <= range; i++) {
    for (let j = -range; j <= range; j++) {
      for (let k = -range; k <= range; k++) {
        if (kind === "cube") out.push([i, j, k]);
        // 体心立方格子: 整数の格子点と、その体の中心(+½,+½,+½)
        if (kind === "truncated-octahedron") out.push([i, j, k], [i + 0.5, j + 0.5, k + 0.5]);
        // 面心立方格子: i+j+k が偶数の格子点
        if (kind === "rhombic-dodecahedron" && (((i + j + k) % 2) + 2) % 2 === 0) out.push([i, j, k]);
      }
    }
  }
  // 最近接の中心間距離が 2×内接半径になるよう、格子を拡大する
  const dists = out.filter((p) => len(p) > EPS).map(len);
  const nearest = Math.min(...dists);
  const scale = (2 * inradius) / nearest;
  return out.map((p): Vec3 => [p[0] * scale, p[1] * scale, p[2] * scale]).filter((p) => len(p) <= radius + EPS);
}
