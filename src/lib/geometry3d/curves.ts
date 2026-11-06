import { gridSurface, type MeshData, type Vec3 } from "./mesh-data.ts";
import { PHI } from "./polyhedra.ts";

/** 曲線・曲面・点の配置(黄金角・巻き貝・円錐曲線・球の詰め込みなど)の幾何データ。 */

export const GOLDEN_ANGLE_DEG = 180 * (3 - Math.sqrt(5)); // 約137.5077…°

// ---------------------------------------------------------------------------
// 黄金角のひまわり(球面上の配置)
// ---------------------------------------------------------------------------

/** n個の点を、高さを等間隔・回転角を angleDeg ずつずらして球面に並べる(angleDeg=黄金角でフィボナッチ球)。 */
export function phyllotaxisSphere(n: number, angleDeg: number): Vec3[] {
  const pts: Vec3[] = [];
  const step = (angleDeg * Math.PI) / 180;
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * step;
    pts.push([r * Math.cos(theta), y, r * Math.sin(theta)]);
  }
  return pts;
}

// ---------------------------------------------------------------------------
// 巻き貝(対数らせんを軸のまわりに回す)
// ---------------------------------------------------------------------------

/**
 * 巻き貝の面。上から見ると対数らせん。1/4回転(90°)ごとに半径が growth 倍になる
 * (growth=黄金比なら、真上から見た輪郭が「黄金らせん」)。管の太さは半径に比例させる。
 */
export function shellSurface(options: { turns: number; growth: number; tube?: number; rise?: number }): MeshData {
  const { turns, growth } = options;
  const tube = options.tube ?? 0.42;
  const rise = options.rise ?? 0.5;
  const b = Math.log(growth) / (Math.PI / 2); // 角度1radあたりの対数的な成長
  const uMax = turns * 2 * Math.PI;
  const scale = 1 / Math.exp(b * uMax) / (1 + tube) ; // 最大の半径が1付近に収まるよう正規化
  return gridSurface(
    Math.round(turns * 48),
    24,
    (uu, vv) => {
      const u = uu * uMax;
      const v = vv * 2 * Math.PI;
      const r = Math.exp(b * u) * scale;
      const ring = 1 + tube * Math.cos(v);
      return [r * ring * Math.cos(u), r * tube * Math.sin(v) - rise * r, r * ring * Math.sin(u)];
    },
    (uu) => {
      // 内側(古い部分)から外側へ、色相を少しずつ変える(巻きの進み具合を見るため)
      const t = uu;
      return [0.72 + 0.2 * t, 0.62 - 0.12 * t, 0.5 - 0.2 * t];
    },
  );
}

// ---------------------------------------------------------------------------
// 3次元リサジュー曲線
// ---------------------------------------------------------------------------

export function lissajous3d(freq: Vec3, phase: Vec3, n = 600): Vec3[] {
  const pts: Vec3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * 2 * Math.PI;
    pts.push([Math.sin(freq[0] * t + phase[0]), Math.sin(freq[1] * t + phase[1]), Math.sin(freq[2] * t + phase[2])]);
  }
  return pts;
}

// ---------------------------------------------------------------------------
// 円錐曲線(円錐を平面で切る)
// ---------------------------------------------------------------------------

/** 円錐の半頂角(軸から母線までの角)。45°にすると、放物線になる平面の傾きもちょうど45°になる。 */
export const CONE_HALF_ANGLE_DEG = 45;

export type ConicKind = "circle" | "ellipse" | "parabola" | "hyperbola";

/** 平面の傾き(水平から何度か)から、切り口の種類を決める。 */
export function conicKind(tiltDeg: number, epsilon = 0.25): ConicKind {
  const parabolaTilt = 90 - CONE_HALF_ANGLE_DEG;
  if (Math.abs(tiltDeg) < epsilon) return "circle";
  if (Math.abs(tiltDeg - parabolaTilt) < epsilon) return "parabola";
  return tiltDeg < parabolaTilt ? "ellipse" : "hyperbola";
}

export const CONIC_LABEL: Record<ConicKind, string> = {
  circle: "円",
  ellipse: "楕円",
  parabola: "放物線",
  hyperbola: "双曲線",
};

/** 頂点が原点、軸が y の二重円錐(v: 下の円錐→上の円錐)。 */
export function doubleConeMesh(height = 1.5): MeshData {
  const a = (CONE_HALF_ANGLE_DEG * Math.PI) / 180;
  return gridSurface(
    48,
    16,
    (u, v) => {
      const phi = u * 2 * Math.PI;
      const t = (v * 2 - 1) * height;
      return [Math.abs(t) * Math.tan(a) * Math.cos(phi) , t, Math.abs(t) * Math.tan(a) * Math.sin(phi)];
    },
  );
}

/**
 * 水平から tiltDeg 傾けた平面(軸上の高さ h を通る)と円錐の交わりの線。連続する点列ごとに1本(双曲線は2本)。
 * 無限に伸びる部分は、頂点からの距離 tMax で打ち切る。
 */
export function conicSection(tiltDeg: number, h = 0.8, tMax = 2.4): Vec3[][] {
  const a = (CONE_HALF_ANGLE_DEG * Math.PI) / 180;
  const beta = (tiltDeg * Math.PI) / 180;
  const n: Vec3 = [Math.sin(beta), Math.cos(beta), 0];
  const N = 360;
  const samples: ({ p: Vec3; sign: number } | null)[] = [];
  for (let k = 0; k < N; k++) {
    const phi = (k / N) * 2 * Math.PI;
    // 上の円錐の母線の向き
    const d: Vec3 = [Math.sin(a) * Math.cos(phi), Math.cos(a), Math.sin(a) * Math.sin(phi)];
    const nd = n[0] * d[0] + n[1] * d[1] + n[2] * d[2];
    if (Math.abs(nd) < 1e-6) {
      samples.push(null);
      continue;
    }
    const t = (h * n[1]) / nd; // 平面 n·(p − (0,h,0)) = 0 との交点 p = t·d
    if (Math.abs(t) > tMax) {
      samples.push(null);
      continue;
    }
    samples.push({ p: [t * d[0], t * d[1], t * d[2]], sign: Math.sign(t) });
  }
  // 連続する(同じ側の円錐に乗った)点をつなぐ
  const runs: Vec3[][] = [];
  let current: Vec3[] = [];
  let currentSign = 0;
  const flush = () => {
    if (current.length > 1) runs.push(current);
    current = [];
    currentSign = 0;
  };
  for (const s of samples) {
    if (!s || (currentSign !== 0 && s.sign !== currentSign)) flush();
    if (s) {
      current.push(s.p);
      currentSign = s.sign;
    }
  }
  flush();
  // 最後の列が先頭の列とつながっている場合は1本にまとめる(閉じた曲線・角度0をまたぐ弧)
  const head = samples[0];
  const tail = samples[N - 1];
  if (runs.length > 1 && head && tail) {
    const first = runs[0];
    const last = runs[runs.length - 1];
    if (head.sign === tail.sign) {
      runs.splice(runs.length - 1, 1);
      runs[0] = [...last, ...first];
    }
  }
  // 円・楕円は閉じる
  if (runs.length === 1 && samples.every((s) => s !== null)) runs[0].push(runs[0][0]);
  return runs;
}

// ---------------------------------------------------------------------------
// 球の詰め込み
// ---------------------------------------------------------------------------

export type PackingKind = "fcc" | "hcp";

/**
 * 半径 1 の球の最密充填(積み重ね)。各層は正三角形の格子。
 * fcc: A-B-C-A… / hcp: A-B-A-B…(どちらも空間の74.05%を占める)。
 */
export function spherePacking(kind: PackingKind, layers: number, radius = 1): Vec3[] {
  const pts: Vec3[] = [];
  const d = 2 * radius;
  const rowsHalf = 2;
  const layerOffset = (layer: number): [number, number] => {
    const pattern = kind === "fcc" ? layer % 3 : layer % 2; // 0=A, 1=B, 2=C
    // B・Cは、Aの三角形の「くぼみ」に乗る(重心の位置)
    const bx = d / 2;
    const bz = d / (2 * Math.sqrt(3));
    if (pattern === 0) return [0, 0];
    if (pattern === 1) return [bx, bz];
    return [d, 2 * bz];
  };
  for (let l = 0; l < layers; l++) {
    const [ox, oz] = layerOffset(l);
    for (let i = -rowsHalf; i <= rowsHalf; i++) {
      for (let j = -rowsHalf; j <= rowsHalf; j++) {
        // 正三角形の格子(行ごとに半分ずらす)
        const x = (j + (i % 2 === 0 ? 0 : 0.5)) * d + ox;
        const z = i * d * (Math.sqrt(3) / 2) + oz;
        pts.push([x, l * d * Math.sqrt(2 / 3), z]);
      }
    }
  }
  return pts;
}

/** 球の詰め込み密度 π/√18(fcc・hcpとも)。 */
export const PACKING_DENSITY = Math.PI / Math.sqrt(18);

// ---------------------------------------------------------------------------
// 一葉双曲面(糸かけ・包絡線の3次元版)
// ---------------------------------------------------------------------------

/**
 * 下の円(半径1)と上の円(半径1)を、n本の直線で結ぶ。上の円を twistDeg だけ回してつなぐと、
 * 直線の束が「ひねられた」曲面(一葉双曲面)の輪郭をつくる。twistDeg=0 なら円柱。
 */
export function hyperboloidLines(n: number, twistDeg: number, height = 1.6): [Vec3, Vec3][] {
  const twist = (twistDeg * Math.PI) / 180;
  const lines: [Vec3, Vec3][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI;
    lines.push([
      [Math.cos(a), -height / 2, Math.sin(a)],
      [Math.cos(a + twist), height / 2, Math.sin(a + twist)],
    ]);
  }
  return lines;
}

// ---------------------------------------------------------------------------
// 3次元ベジェ曲線(ド・カステリョのアルゴリズム)
// ---------------------------------------------------------------------------

export const BEZIER_CONTROL_POINTS: Vec3[] = [
  [-1, -0.8, 0.4],
  [-0.9, 1.0, -0.6],
  [0.9, -1.0, 0.7],
  [1, 0.8, -0.4],
];

function lerp3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** ド・カステリョ: 制御点から t での点まで、各段の点列(最後の段が曲線上の点)。 */
export function deCasteljau(points: Vec3[], t: number): Vec3[][] {
  const levels: Vec3[][] = [points];
  let cur = points;
  while (cur.length > 1) {
    const next: Vec3[] = [];
    for (let i = 0; i < cur.length - 1; i++) next.push(lerp3(cur[i], cur[i + 1], t));
    levels.push(next);
    cur = next;
  }
  return levels;
}

export function bezierCurve(points: Vec3[], n = 80): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i <= n; i++) {
    const levels = deCasteljau(points, i / n);
    out.push(levels[levels.length - 1][0]);
  }
  return out;
}

// ---------------------------------------------------------------------------
// 黄金長方形と正二十面体
// ---------------------------------------------------------------------------

/** 正二十面体の12頂点は、互いに直交する3枚の黄金長方形(縦横比 1:φ)の頂点になっている。 */
export function goldenRectangles(): Vec3[][] {
  return [
    [
      [-1, -PHI, 0],
      [1, -PHI, 0],
      [1, PHI, 0],
      [-1, PHI, 0],
    ],
    [
      [0, -1, -PHI],
      [0, 1, -PHI],
      [0, 1, PHI],
      [0, -1, PHI],
    ],
    [
      [-PHI, 0, -1],
      [PHI, 0, -1],
      [PHI, 0, 1],
      [-PHI, 0, 1],
    ],
  ];
}

/** 正二十面体の辺(12頂点のうち、距離が2のもの)。 */
export function icosahedronEdges(): [Vec3, Vec3][] {
  const verts = goldenRectangles().flat();
  const edges: [Vec3, Vec3][] = [];
  for (let i = 0; i < verts.length; i++) {
    for (let j = i + 1; j < verts.length; j++) {
      const d = Math.hypot(verts[i][0] - verts[j][0], verts[i][1] - verts[j][1], verts[i][2] - verts[j][2]);
      if (Math.abs(d - 2) < 1e-6) edges.push([verts[i], verts[j]]);
    }
  }
  return edges;
}
