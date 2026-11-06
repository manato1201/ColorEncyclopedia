import type { Vec3 } from "./mesh-data.ts";

/** 3次元のフラクタル・空間充填曲線・枝分かれの幾何データ。 */

// ---------------------------------------------------------------------------
// メンガーのスポンジ / カントール塵(立方体を3×3×3に分ける)
// ---------------------------------------------------------------------------

export type CubeVariant = "menger" | "cantor";

/** 一辺が size で、中心が (x,y,z) の立方体のリスト。メンガー: 20^n 個、カントール塵: 8^n 個。 */
export function subdividedCubes(
  level: number,
  variant: CubeVariant,
): { x: number; y: number; z: number; size: number }[] {
  let cubes = [{ x: 0, y: 0, z: 0, size: 2 }];
  for (let n = 0; n < level; n++) {
    const next: typeof cubes = [];
    for (const c of cubes) {
      const s = c.size / 3;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          for (let k = -1; k <= 1; k++) {
            const middles =
              (i === 0 ? 1 : 0) + (j === 0 ? 1 : 0) + (k === 0 ? 1 : 0);
            // メンガー: 中央が2つ以上そろう立方体(面の中心・体の中心)を抜く。カントール塵: 中央が1つでもあれば抜く。
            const keep = variant === "menger" ? middles <= 1 : middles === 0;
            if (keep)
              next.push({
                x: c.x + i * s,
                y: c.y + j * s,
                z: c.z + k * s,
                size: s,
              });
          }
        }
      }
    }
    cubes = next;
  }
  return cubes;
}

// ---------------------------------------------------------------------------
// シェルピンスキーの四面体
// ---------------------------------------------------------------------------

/** 正四面体の4頂点(中心が原点、外接球の半径は √3)。 */
export const TETRA_VERTICES: Vec3[] = [
  [1, 1, 1],
  [1, -1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
];

/** 4^level 個の小さな正四面体。center と scale(元の四面体を scale 倍したもの)で表す。 */
export function sierpinskiTetrahedra(
  level: number,
): { center: Vec3; scale: number }[] {
  let items: { center: Vec3; scale: number }[] = [
    { center: [0, 0, 0], scale: 1 },
  ];
  for (let n = 0; n < level; n++) {
    const next: typeof items = [];
    for (const it of items) {
      for (const v of TETRA_VERTICES) {
        // 頂点 v を中心に、1/2 に縮めた四面体
        next.push({
          center: [
            it.center[0] + (v[0] * it.scale) / 2,
            it.center[1] + (v[1] * it.scale) / 2,
            it.center[2] + (v[2] * it.scale) / 2,
          ],
          scale: it.scale / 2,
        });
      }
    }
    items = next;
  }
  return items;
}

// ---------------------------------------------------------------------------
// 3次元ヒルベルト曲線(Skillingの変換)
// ---------------------------------------------------------------------------

/** order 段の3次元ヒルベルト曲線の、index 番目の格子点(0〜2^order-1 の整数3つ組)。 */
export function hilbert3dPoint(index: number, order: number): Vec3 {
  // 位置 index のビットを、3つの軸に振り分ける(転置形式)
  const x = [0, 0, 0];
  for (let p = 0; p < order * 3; p++) {
    const bit = Math.floor(index / 2 ** p) % 2;
    const group = Math.floor(p / 3);
    const axis = 2 - (p % 3);
    x[axis] |= bit << group;
  }
  const n = 3;
  const big = 2 << (order - 1);
  // グレイコードを戻す
  let t = x[n - 1] >> 1;
  for (let i = n - 1; i > 0; i--) x[i] ^= x[i - 1];
  x[0] ^= t;
  // 余分な作業を戻す
  for (let q = 2; q !== big; q <<= 1) {
    const pm = q - 1;
    for (let i = n - 1; i >= 0; i--) {
      if (x[i] & q) {
        x[0] ^= pm;
      } else {
        t = (x[0] ^ x[i]) & pm;
        x[0] ^= t;
        x[i] ^= t;
      }
    }
  }
  return [x[0], x[1], x[2]];
}

/** order 段のヒルベルト曲線の全点(立方体 [-1,1]^3 の中に、格子の中心を並べる)。 */
export function hilbert3dPath(order: number): Vec3[] {
  const side = 2 ** order;
  const total = side ** 3;
  const pts: Vec3[] = [];
  for (let i = 0; i < total; i++) {
    const [a, b, c] = hilbert3dPoint(i, order);
    pts.push([
      ((a + 0.5) / side) * 2 - 1,
      ((b + 0.5) / side) * 2 - 1,
      ((c + 0.5) / side) * 2 - 1,
    ]);
  }
  return pts;
}

// ---------------------------------------------------------------------------
// 3次元のフラクタルツリー
// ---------------------------------------------------------------------------

export type Branch = { from: Vec3; to: Vec3; depth: number };

function rotateAround(v: Vec3, axis: Vec3, angle: number): Vec3 {
  const [ax, ay, az] = axis;
  const len = Math.hypot(ax, ay, az) || 1;
  const k: Vec3 = [ax / len, ay / len, az / len];
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const dot = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
  const cross: Vec3 = [
    k[1] * v[2] - k[2] * v[1],
    k[2] * v[0] - k[0] * v[2],
    k[0] * v[1] - k[1] * v[0],
  ];
  return [
    v[0] * c + cross[0] * s + k[0] * dot * (1 - c),
    v[1] * c + cross[1] * s + k[1] * dot * (1 - c),
    v[2] * c + cross[2] * s + k[2] * dot * (1 - c),
  ];
}

/**
 * 1本の枝が3本に分かれる木(幹→枝、長さ ratio 倍、開き角 spread 度、枝ごとに120°ずつ回す)。
 * 枝の数は 3^depth 以下。決定的(乱数なし)。
 */
export function fractalTree3d(
  depth: number,
  spreadDeg: number,
  ratio = 0.7,
): Branch[] {
  const out: Branch[] = [];
  const spread = (spreadDeg * Math.PI) / 180;
  const grow = (
    from: Vec3,
    dir: Vec3,
    length: number,
    d: number,
    twist: number,
  ) => {
    const to: Vec3 = [
      from[0] + dir[0] * length,
      from[1] + dir[1] * length,
      from[2] + dir[2] * length,
    ];
    out.push({ from, to, depth: d });
    if (d >= depth) return;
    // dir に垂直な軸を1つ作る
    const helper: Vec3 = Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const perp: Vec3 = [
      dir[1] * helper[2] - dir[2] * helper[1],
      dir[2] * helper[0] - dir[0] * helper[2],
      dir[0] * helper[1] - dir[1] * helper[0],
    ];
    const base = rotateAround(perp, dir, twist);
    for (let i = 0; i < 3; i++) {
      const axis = rotateAround(base, dir, (i * 2 * Math.PI) / 3);
      const next = rotateAround(dir, axis, spread);
      grow(to, next, length * ratio, d + 1, twist + 0.9);
    }
  };
  grow([0, -1, 0], [0, 1, 0], 0.7, 0, 0);
  return out;
}
