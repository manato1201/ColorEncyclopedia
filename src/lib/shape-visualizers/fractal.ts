import type { ShapeElement, ShapeFrame } from "./base.ts";
import { f3, fitTransform, frame, line, path, poly, rect, type Pt } from "./helpers.ts";

/** フラクタル・再帰カテゴリの作図ジェネレータ。操作を1回ずつ重ねた段階を、フレームとして並べる。 */

/** コッホ雪片。各辺を3等分して、中央に正三角形の山を足す操作を繰り返す。 */
export function kochSnowflakeSteps(): ShapeFrame[] {
  const side = 80;
  const h = (side * Math.sqrt(3)) / 2;
  const start: Pt[] = [
    [50 - side / 2, 50 + h / 3],
    [50 + side / 2, 50 + h / 3],
    [50, 50 - (2 * h) / 3],
  ];
  const step = (pts: Pt[]): Pt[] => {
    const out: Pt[] = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const q = pts[(i + 1) % pts.length];
      const dx = (q[0] - p[0]) / 3;
      const dy = (q[1] - p[1]) / 3;
      const a: Pt = [p[0] + dx, p[1] + dy];
      const b: Pt = [p[0] + 2 * dx, p[1] + 2 * dy];
      // 進行方向の右側(画面上で反時計回りに辿る図形の外側)へ、正三角形の頂点を作る
      const peak: Pt = [a[0] + dx * 0.5 - dy * (Math.sqrt(3) / 2), a[1] + dy * 0.5 + dx * (Math.sqrt(3) / 2)];
      out.push(p, a, peak, b);
    }
    return out;
  };
  const frames: ShapeFrame[] = [];
  let pts = start;
  for (let n = 0; n <= 4; n++) {
    frames.push(
      frame(
        [poly(pts, "final")],
        n === 0
          ? "正三角形から始める(辺の数 3)"
          : `${n}回操作: 各辺を3等分し、中央の1/3を外側に飛び出す小さな正三角形に置き換える(辺の数 ${3 * 4 ** n}、周の長さは (4/3)^${n} 倍)`,
      ),
    );
    if (n < 4) pts = step(pts);
  }
  frames.push(frame([poly(pts, "final")], "操作を無限に繰り返すと、周の長さは無限に伸びるが、囲む面積は有限のまま(フラクタル次元 log4/log3 ≈ 1.262)"));
  return frames;
}

/** ヒルベルト曲線。正方形を4分割して、同じ曲線を向きを変えてつなぐ、空間充填曲線。 */
export function hilbertCurveSteps(): ShapeFrame[] {
  const d2xy = (n: number, d: number): Pt => {
    let x = 0;
    let y = 0;
    let t = d;
    for (let s = 1; s < n; s *= 2) {
      const rx = 1 & (t >> 1);
      const ry = 1 & (t ^ rx);
      if (ry === 0) {
        if (rx === 1) {
          x = s - 1 - x;
          y = s - 1 - y;
        }
        [x, y] = [y, x];
      }
      x += s * rx;
      y += s * ry;
      t >>= 2;
    }
    return [x, y];
  };
  const frames: ShapeFrame[] = [];
  for (let order = 1; order <= 5; order++) {
    const n = 2 ** order;
    const pts: Pt[] = Array.from({ length: n * n }, (_, d) => {
      const [x, y] = d2xy(n, d);
      return [8 + ((x + 0.5) / n) * 84, 8 + ((y + 0.5) / n) * 84];
    });
    frames.push(frame([path(pts, "final")], `${order}次: ${n}×${n}のマスを、隣どうしを一筆でたどる(${n * n}点)。前の次数の曲線を4つ、向きを変えてつないでいる`));
  }
  return frames;
}

/** シェルピンスキーのカーペット。正方形を9等分し、中央を抜く操作を繰り返す。 */
export function sierpinskiCarpetSteps(): ShapeFrame[] {
  const carpet = (x: number, y: number, size: number, depth: number): ShapeElement[] => {
    if (depth === 0) return [rect(x, y, size, size, "final")];
    const s = size / 3;
    const out: ShapeElement[] = [];
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) if (!(i === 1 && j === 1)) out.push(...carpet(x + i * s, y + j * s, s, depth - 1));
    return out;
  };
  const frames: ShapeFrame[] = [];
  for (let d = 0; d <= 3; d++) {
    frames.push(
      frame(
        carpet(8, 8, 84, d),
        d === 0 ? "正方形から始める" : `${d}回操作: 残った各正方形を9等分し、中央の1つを抜く(残り ${8 ** d} 個)。面積は元の (8/9)^${d} = ${f3((8 / 9) ** d)}`,
      ),
    );
  }
  return frames;
}

/** カントール集合。線分の中央1/3を取り除く操作を繰り返す。 */
export function cantorSetSteps(): ShapeFrame[] {
  const rows: [number, number][][] = [[[6, 94]]];
  for (let d = 1; d <= 5; d++) {
    rows.push(rows[d - 1].flatMap(([a, b]) => [[a, a + (b - a) / 3], [b - (b - a) / 3, b]] as [number, number][]));
  }
  const draw = (upto: number) =>
    rows.slice(0, upto + 1).flatMap((row, d) => row.map(([a, b]) => rect(a, 12 + d * 14, Math.max(b - a, 0.3), 6, d === upto ? "active" : "final")));
  return rows.map((row, d) =>
    frame(draw(d), d === 0 ? "長さ1の線分から始める" : `${d}回操作: 各線分の中央の1/3を取り除く(線分 ${row.length} 本、全長は (2/3)^${d} = ${f3((2 / 3) ** d)})`),
  );
}

/** ドラゴン曲線。紙を同じ向きに繰り返し折って開いたときにできる折れ線。 */
export function dragonCurveSteps(): ShapeFrame[] {
  const turnsFor = (iter: number): number[] => {
    let turns: number[] = [];
    for (let i = 0; i < iter; i++) turns = [...turns, 1, ...turns.slice().reverse().map((t) => -t)];
    return turns;
  };
  const walk = (turns: number[]): Pt[] => {
    let x = 0;
    let y = 0;
    let dir = 0;
    const pts: Pt[] = [[x, y]];
    x += 1;
    pts.push([x, y]);
    for (const t of turns) {
      dir = (dir + t + 4) % 4;
      x += [1, 0, -1, 0][dir];
      y += [0, 1, 0, -1][dir];
      pts.push([x, y]);
    }
    return pts;
  };
  const final = walk(turnsFor(11));
  const fit = fitTransform(final, 8);
  const frames: ShapeFrame[] = [];
  for (const it of [1, 3, 5, 8, 11]) {
    const pts = walk(turnsFor(it)).map(fit);
    frames.push(frame([path(pts, "final")], `${it}回折る: 折れ線の長さ ${2 ** it} 本。直角の曲がり方が、前の曲線を反転してつなぐ規則で決まる`));
  }
  return frames;
}

/** ピタゴラスの木。正方形の上に直角二等辺三角形を載せ、その2辺に小さな正方形を立てる。 */
export function pythagorasTreeSteps(): ShapeFrame[] {
  type V = [number, number];
  const squares: { depth: number; pts: V[] }[] = [];
  const grow = (p0: V, p1: V, depth: number, max: number) => {
    const d: V = [p1[0] - p0[0], p1[1] - p0[1]];
    const n: V = [-d[1], d[0]]; // 数学座標(y上向き)で左へ90°
    const tl: V = [p0[0] + n[0], p0[1] + n[1]];
    const tr: V = [p1[0] + n[0], p1[1] + n[1]];
    squares.push({ depth, pts: [p0, p1, tr, tl] });
    if (depth >= max) return;
    const dd: V = [tr[0] - tl[0], tr[1] - tl[1]];
    // 斜辺 TL→TR の上に立つ直角二等辺三角形の頂点 Q(TL から 45° 回して、長さを 1/√2 倍)
    const q: V = [
      tl[0] + (dd[0] * Math.cos(Math.PI / 4) - dd[1] * Math.sin(Math.PI / 4)) / Math.SQRT2,
      tl[1] + (dd[0] * Math.sin(Math.PI / 4) + dd[1] * Math.cos(Math.PI / 4)) / Math.SQRT2,
    ];
    grow(tl, q, depth + 1, max);
    grow(q, tr, depth + 1, max);
  };
  grow([-1, 0], [1, 0], 0, 9);
  const all = squares.flatMap((s) => s.pts.map(([x, y]) => [x, -y] as Pt));
  const fit = fitTransform(all, 6);
  const frames: ShapeFrame[] = [];
  for (const depth of [0, 1, 2, 4, 6, 9]) {
    const els = squares.filter((s) => s.depth <= depth).map((s) => poly(s.pts.map(([x, y]) => fit([x, -y])), s.depth === depth ? "active" : "final"));
    frames.push(
      frame(
        els,
        depth === 0
          ? "正方形を1つ置く"
          : `${depth}段: 各正方形の上に直角二等辺三角形を載せ、その斜辺以外の2辺を一辺とする正方形を2つ立てる(正方形 ${2 ** (depth + 1) - 1} 個)。3つの正方形の面積には a²+b²=c² の関係がある`,
      ),
    );
  }
  return frames;
}

/** フラクタルツリー(二分木)。枝が一定の角度と比率で2本に分かれることを繰り返す。 */
export function fractalTreeSteps(): ShapeFrame[] {
  const segs: { depth: number; a: Pt; b: Pt }[] = [];
  const grow = (x: number, y: number, len: number, angle: number, depth: number, max: number) => {
    const x2 = x + len * Math.sin(angle);
    const y2 = y - len * Math.cos(angle);
    segs.push({ depth, a: [x, y], b: [x2, y2] });
    if (depth >= max) return;
    const spread = (25 * Math.PI) / 180;
    grow(x2, y2, len * 0.72, angle - spread, depth + 1, max);
    grow(x2, y2, len * 0.72, angle + spread, depth + 1, max);
  };
  grow(50, 94, 22, 0, 0, 9);
  const frames: ShapeFrame[] = [];
  for (const depth of [0, 1, 2, 4, 6, 9]) {
    frames.push(
      frame(
        segs.filter((s) => s.depth <= depth).map((s) => line(s.a, s.b, s.depth === depth ? "active" : "final")),
        depth === 0 ? "幹を1本立てる" : `${depth}段: 枝の先から、長さを0.72倍にして ±25° の2本に分ける(枝 ${2 ** (depth + 1) - 1} 本)。一部を拡大すると全体とよく似た形になる(自己相似)`,
      ),
    );
  }
  return frames;
}

export const FRACTAL_VISUALIZERS: Record<string, () => ShapeFrame[]> = {
  "koch-snowflake": kochSnowflakeSteps,
  "hilbert-curve": hilbertCurveSteps,
  "sierpinski-carpet": sierpinskiCarpetSteps,
  "cantor-set": cantorSetSteps,
  "dragon-curve": dragonCurveSteps,
  "pythagoras-tree": pythagorasTreeSteps,
  "fractal-tree": fractalTreeSteps,
};
