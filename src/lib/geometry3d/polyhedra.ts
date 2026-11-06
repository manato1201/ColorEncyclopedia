/** 多面体の表(頂点・辺・面の数)と、立方体の展開図(全11種を、サイコロを転がす判定で導出)。 */

export type PolyhedronId =
  | "tetrahedron"
  | "cube"
  | "octahedron"
  | "dodecahedron"
  | "icosahedron"
  | "triangular-prism"
  | "square-pyramid";

export type PolyhedronSpec = {
  id: PolyhedronId;
  name: string;
  /** 正多面体か(すべての面が合同な正多角形で、すべての頂点のまわりが同じ)。 */
  regular: boolean;
  faces: string;
  v: number;
  e: number;
  f: number;
};

export const POLYHEDRA: readonly PolyhedronSpec[] = [
  { id: "tetrahedron", name: "正四面体", regular: true, faces: "正三角形 × 4", v: 4, e: 6, f: 4 },
  { id: "cube", name: "正六面体(立方体)", regular: true, faces: "正方形 × 6", v: 8, e: 12, f: 6 },
  { id: "octahedron", name: "正八面体", regular: true, faces: "正三角形 × 8", v: 6, e: 12, f: 8 },
  { id: "dodecahedron", name: "正十二面体", regular: true, faces: "正五角形 × 12", v: 20, e: 30, f: 12 },
  { id: "icosahedron", name: "正二十面体", regular: true, faces: "正三角形 × 20", v: 12, e: 30, f: 20 },
  { id: "triangular-prism", name: "三角柱", regular: false, faces: "正三角形 × 2 + 長方形 × 3", v: 6, e: 9, f: 5 },
  { id: "square-pyramid", name: "四角錐", regular: false, faces: "正方形 × 1 + 三角形 × 4", v: 5, e: 8, f: 5 },
];

/** オイラーの多面体定理 V − E + F = 2 を満たすか(凸多面体)。 */
export function eulerCharacteristic(p: Pick<PolyhedronSpec, "v" | "e" | "f">): number {
  return p.v - p.e + p.f;
}

/** 黄金比。 */
export const PHI = (1 + Math.sqrt(5)) / 2;

// ---------------------------------------------------------------------------
// 立方体の展開図
// ---------------------------------------------------------------------------

/** 展開図のマス目 [列, 行](行は下向きに増える)。 */
export type NetCell = [number, number];

const key = (c: NetCell) => `${c[0]},${c[1]}`;

function normalize(cells: NetCell[]): NetCell[] {
  const minC = Math.min(...cells.map((c) => c[0]));
  const minR = Math.min(...cells.map((c) => c[1]));
  return cells
    .map(([c, r]) => [c - minC, r - minR] as NetCell)
    .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

/** 回転・反転の8通りのうち、辞書順で最小のものを代表にする(同じ形を同じ文字列にする)。 */
function canonical(cells: NetCell[]): string {
  const transforms: ((c: NetCell) => NetCell)[] = [
    ([c, r]) => [c, r],
    ([c, r]) => [-r, c],
    ([c, r]) => [-c, -r],
    ([c, r]) => [r, -c],
    ([c, r]) => [-c, r],
    ([c, r]) => [r, c],
    ([c, r]) => [c, -r],
    ([c, r]) => [-r, -c],
  ];
  return transforms
    .map((t) => normalize(cells.map(t)).map(key).join(";"))
    .sort()[0];
}

const NEIGHBORS: NetCell[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** 6マスの連結した図形(ヘキソミノ)をすべて数え上げる(回転・反転で同じものは1つ)。35種類。 */
export function enumerateHexominoes(): NetCell[][] {
  let level = new Map<string, NetCell[]>([[canonical([[0, 0]]), [[0, 0]]]]);
  for (let size = 2; size <= 6; size++) {
    const next = new Map<string, NetCell[]>();
    for (const cells of level.values()) {
      const taken = new Set(cells.map(key));
      for (const [c, r] of cells) {
        for (const [dc, dr] of NEIGHBORS) {
          const cell: NetCell = [c + dc, r + dr];
          if (taken.has(key(cell))) continue;
          const grown = normalize([...cells, cell]);
          const k = canonical(grown);
          if (!next.has(k)) next.set(k, grown);
        }
      }
    }
    level = next;
  }
  return [...level.values()];
}

type Die = { top: number; bottom: number; north: number; south: number; east: number; west: number };

/** サイコロを1マス転がす。dc>0 は東(右)、dr>0 は南(下)。 */
function roll(d: Die, dc: number, dr: number): Die {
  if (dc > 0) return { ...d, bottom: d.east, east: d.top, top: d.west, west: d.bottom };
  if (dc < 0) return { ...d, bottom: d.west, west: d.top, top: d.east, east: d.bottom };
  if (dr > 0) return { ...d, bottom: d.south, south: d.top, top: d.north, north: d.bottom };
  return { ...d, bottom: d.north, north: d.top, top: d.south, south: d.bottom };
}

/** 展開図の折りたたみの木(根のマスから、隣り合うマスへ蝶番でつながる)。 */
export type NetFold = {
  cells: NetCell[];
  /** 根のマス(重心にいちばん近いもの)の番号。 */
  root: number;
  /** 幅優先の順に並んだ蝶番。parent の中心から (dc,dr) の向きの辺で child とつながる。 */
  hinges: { parent: number; child: number; dc: number; dr: number }[];
};

export function netFoldTree(cells: NetCell[]): NetFold {
  const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
  const cy = cells.reduce((s, c) => s + c[1], 0) / cells.length;
  let root = 0;
  let best = Infinity;
  cells.forEach((c, i) => {
    const d = (c[0] - cx) ** 2 + (c[1] - cy) ** 2;
    if (d < best) {
      best = d;
      root = i;
    }
  });
  const index = new Map(cells.map((c, i) => [key(c), i]));
  const seen = new Set([root]);
  const queue = [root];
  const hinges: NetFold["hinges"] = [];
  while (queue.length > 0) {
    const p = queue.shift()!;
    for (const [dc, dr] of NEIGHBORS) {
      const q = index.get(key([cells[p][0] + dc, cells[p][1] + dr]));
      if (q === undefined || seen.has(q)) continue;
      seen.add(q);
      hinges.push({ parent: p, child: q, dc, dr });
      queue.push(q);
    }
  }
  return { cells, root, hinges };
}

/** 展開図が立方体に折りたためるか: サイコロを転がして、6マスの底が6つの面すべてになれば折りたためる。 */
export function foldsToCube(cells: NetCell[]): boolean {
  const tree = netFoldTree(cells);
  const dice = new Map<number, Die>();
  dice.set(tree.root, { top: 0, bottom: 1, north: 2, south: 3, east: 4, west: 5 });
  for (const h of tree.hinges) dice.set(h.child, roll(dice.get(h.parent)!, h.dc, h.dr));
  const bottoms = new Set([...dice.values()].map((d) => d.bottom));
  return bottoms.size === 6;
}

/** 立方体の展開図の全種類(11種)。 */
export function enumerateCubeNets(): NetCell[][] {
  return enumerateHexominoes().filter(foldsToCube);
}

/** 展開図の呼び名(行ごとのマス数。例: 1-4-1型)。横長に置いたときの行で数える。 */
export function netLabel(cells: NetCell[]): string {
  const rows = new Map<number, number>();
  for (const [, r] of cells) rows.set(r, (rows.get(r) ?? 0) + 1);
  const parts = [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([, n]) => n);
  const reversed = [...parts].reverse();
  return (parts.join("-") <= reversed.join("-") ? parts : reversed).join("-");
}

/** 横長(列数 ≥ 行数)に置いた、立方体の展開図11種(型の順)。転置は折りたためるかどうかを変えない。 */
export const CUBE_NETS: NetCell[][] = enumerateCubeNets()
  .map((cells) => {
    const cols = Math.max(...cells.map((c) => c[0])) + 1;
    const rows = Math.max(...cells.map((c) => c[1])) + 1;
    return cols >= rows ? cells : normalize(cells.map(([c, r]) => [r, c] as NetCell));
  })
  .sort((a, b) => netLabel(a).localeCompare(netLabel(b)));
