/**
 * 3D表示用の幾何データ(three.js に依存しない純粋な関数)。座標は y が上、右手系。
 * three.js 側(src/components/visualizer3d)は、ここで作った配列をそのままバッファに渡すだけにする。
 * そのため `npm run verify` が、three.js なしで数値の健全性(有限・範囲内・個数)を検査できる。
 */

export type Vec3 = [number, number, number];

export type MeshData = {
  positions: Float32Array;
  /** 頂点色(0〜1の sRGB。無ければ単色)。 */
  colors?: Float32Array;
  indices: Uint32Array;
};

/**
 * パラメータ面 (u,v ∈ [0,1]) を、格子状の三角形メッシュにする。
 * point(u,v) が頂点位置、color(u,v) が頂点色(省略可)。
 */
export function gridSurface(
  nu: number,
  nv: number,
  point: (u: number, v: number) => Vec3,
  color?: (u: number, v: number) => Vec3,
): MeshData {
  const count = (nu + 1) * (nv + 1);
  const positions = new Float32Array(count * 3);
  const colors = color ? new Float32Array(count * 3) : undefined;
  const indices = new Uint32Array(nu * nv * 6);
  let p = 0;
  for (let i = 0; i <= nu; i++) {
    for (let j = 0; j <= nv; j++) {
      const u = i / nu;
      const v = j / nv;
      const [x, y, z] = point(u, v);
      positions[p * 3] = x;
      positions[p * 3 + 1] = y;
      positions[p * 3 + 2] = z;
      if (colors && color) {
        const [r, g, b] = color(u, v);
        colors[p * 3] = r;
        colors[p * 3 + 1] = g;
        colors[p * 3 + 2] = b;
      }
      p++;
    }
  }
  let q = 0;
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const a = i * (nv + 1) + j;
      const b = a + 1;
      const c = a + (nv + 1);
      const d = c + 1;
      indices.set([a, b, c, b, d, c], q);
      q += 6;
    }
  }
  return { positions, colors, indices };
}

/** 複数のメッシュを1つにまとめる(頂点番号をずらして連結)。 */
export function mergeMeshData(parts: MeshData[]): MeshData {
  const withColor = parts.every((m) => m.colors);
  const vertexCount = parts.reduce((n, m) => n + m.positions.length / 3, 0);
  const indexCount = parts.reduce((n, m) => n + m.indices.length, 0);
  const positions = new Float32Array(vertexCount * 3);
  const colors = withColor ? new Float32Array(vertexCount * 3) : undefined;
  const indices = new Uint32Array(indexCount);
  let vo = 0;
  let io = 0;
  for (const m of parts) {
    positions.set(m.positions, vo * 3);
    if (colors && m.colors) colors.set(m.colors, vo * 3);
    for (let i = 0; i < m.indices.length; i++)
      indices[io + i] = m.indices[i] + vo;
    vo += m.positions.length / 3;
    io += m.indices.length;
  }
  return { positions, colors, indices };
}

/** 配列の値がすべて有限か。 */
export function allFinite(values: ArrayLike<number>): boolean {
  for (let i = 0; i < values.length; i++) {
    if (!Number.isFinite(values[i])) return false;
  }
  return true;
}

/** 点列の外接の最大絶対値(範囲の検査用)。 */
export function maxAbs(values: ArrayLike<number>): number {
  let m = 0;
  for (let i = 0; i < values.length; i++) m = Math.max(m, Math.abs(values[i]));
  return m;
}
