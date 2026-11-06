/**
 * 植物図譜モチーフ用の ASCII 植物(IMPROVEMENT_DESIGN「追補: ASCII モチーフ」: 植物・B. Grow・静止画から)。
 * シードから決定的に枝分かれする植物を、文字のセルに描く。同じシードなら、サーバーとクライアントで同じ絵になる。
 * 描画に使う文字は固定(| / \ _ - , . ' @ * o ~)で、HTMLとして安全。装飾用で、情報は持たない。
 */

export type PlantCell = {
  x: number;
  y: number;
  ch: string;
  kind: "ground" | "stem" | "leaf" | "flower";
  /** 成長の順番(小さいほど先に現れる)。 */
  order: number;
};

/** 文字列をシード(整数)にする。 */
export function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Branch = {
  px: number;
  py: number;
  angle: number;
  length: number;
  depth: number;
};

/** 枝の方向(度、真上=0°、右へ傾くと正)に合う文字。 */
function stemChar(angle: number): string {
  const deg = ((angle % 360) + 360) % 360;
  const fromUp = deg > 180 ? 360 - deg : deg; // 0〜180(真上からの開き)
  if (fromUp < 22) return "|";
  if (fromUp > 68 && fromUp < 112) return "-";
  const rightLeaning = deg < 180;
  const upward = fromUp < 90;
  return rightLeaning === upward ? "/" : "\\";
}

export function generatePlant(seed: number, cols = 48, rows = 20): PlantCell[] {
  const rnd = random(seed);
  const cells = new Map<string, PlantCell>();
  let order = 0;
  const put = (x: number, y: number, ch: string, kind: PlantCell["kind"]) => {
    if (x < 0 || x >= cols || y < 0 || y >= rows) return;
    const key = `${x},${y}`;
    const existing = cells.get(key);
    // 先に描かれたもの(幹・太い枝)を、あとの葉・花で上書きしない。花は葉の上に置く
    if (existing && !(kind === "flower" && existing.kind === "leaf")) return;
    cells.set(key, { x, y, ch, kind, order: order++ });
  };

  // 地面
  for (let x = 0; x < cols; x++)
    put(x, rows - 1, rnd() < 0.8 ? "_" : "~", "ground");

  const baseX = cols / 2 + (rnd() - 0.5) * 8;
  const queue: Branch[] = [
    {
      px: baseX,
      py: (rows - 2) * 2,
      angle: (rnd() - 0.5) * 8,
      length: rows * 0.62,
      depth: 0,
    },
  ];
  const maxDepth = 4 + (rnd() < 0.5 ? 1 : 0);

  while (queue.length > 0) {
    const b = queue.shift()!;
    const rad = (b.angle * Math.PI) / 180;
    const dx = Math.sin(rad);
    const dy = -Math.cos(rad); // px/py は、横1セル=1、縦1セル=2 の等方な座標
    const steps = Math.max(2, Math.round(b.length));
    let x = b.px;
    let y = b.py;
    for (let i = 0; i < steps; i++) {
      x += dx;
      y += dy;
      put(Math.round(x), Math.round(y / 2), stemChar(b.angle), "stem");
    }
    if (b.depth >= maxDepth || b.length < 3) {
      // 枝先: 花か葉
      const cx = Math.round(x);
      const cy = Math.round(y / 2);
      const flowers = ["@", "*", "o"];
      put(
        cx,
        cy,
        rnd() < 0.55 ? flowers[Math.floor(rnd() * flowers.length)] : ",",
        rnd() < 0.55 ? "flower" : "leaf",
      );
      for (const [ox, oy] of [
        [-1, 0],
        [1, 0],
        [0, 1],
        [-1, -1],
        [1, -1],
      ] as [number, number][]) {
        if (rnd() < 0.55)
          put(cx + ox, cy + oy, rnd() < 0.5 ? "," : "'", "leaf");
      }
      continue;
    }
    const spread = 18 + rnd() * 20;
    const shrink = 0.66 + rnd() * 0.1;
    queue.push(
      {
        px: x,
        py: y,
        angle: b.angle - spread,
        length: b.length * shrink,
        depth: b.depth + 1,
      },
      {
        px: x,
        py: y,
        angle: b.angle + spread * (0.8 + rnd() * 0.4),
        length: b.length * shrink,
        depth: b.depth + 1,
      },
    );
    if (b.depth === 1 && rnd() < 0.5) {
      queue.push({
        px: x,
        py: y,
        angle: b.angle + (rnd() - 0.5) * 14,
        length: b.length * 0.6,
        depth: b.depth + 1,
      });
    }
  }
  return [...cells.values()].sort((a, c) => a.order - c.order);
}

const ESCAPE: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

/** 先頭から upTo 個のセルまでを、行ごとに同じ種類の連なりを1つの span にまとめた HTML にする。 */
export function renderPlantHtml(
  cells: PlantCell[],
  cols: number,
  rows: number,
  upTo = cells.length,
): string {
  const grid: (PlantCell | null)[][] = Array.from({ length: rows }, () =>
    Array<PlantCell | null>(cols).fill(null),
  );
  for (let i = 0; i < Math.min(upTo, cells.length); i++) {
    const c = cells[i];
    grid[c.y][c.x] = c;
  }
  const lines: string[] = [];
  for (const row of grid) {
    let html = "";
    let run = "";
    let runKind: string | null = null;
    const flush = () => {
      if (run === "") return;
      html +=
        runKind && runKind !== "space"
          ? `<span class="${runKind}">${run}</span>`
          : run;
      run = "";
    };
    for (const cell of row) {
      const kind = cell ? (cell.kind === "flower" ? "plant-flower" : "plant-green") : "space";
      const ch = cell ? (ESCAPE[cell.ch] ?? cell.ch) : " ";
      if (kind !== runKind) {
        flush();
        runKind = kind;
      }
      run += ch;
    }
    flush();
    lines.push(html);
  }
  return lines.join("\n");
}
