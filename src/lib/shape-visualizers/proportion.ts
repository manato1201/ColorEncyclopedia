import type { ShapeFrame } from "./base.ts";
import {
  PHI,
  arcPts,
  circle,
  dot,
  dist,
  f1,
  f3,
  fitTransform,
  frame,
  label,
  lerpPt,
  line,
  path,
  polar,
  poly,
  rect,
  type Pt,
} from "./helpers.ts";

/** 比例・分割カテゴリの作図ジェネレータ。 */

type Box = { x: number; y: number; w: number; h: number };

/** ブロンズ比 σ=(3+√13)/2。3つの正方形を切り出しても、残りが同じ比の矩形になる。 */
export function bronzeRatioSteps(): ShapeFrame[] {
  const sigma = (3 + Math.sqrt(13)) / 2;
  let box: Box = { x: 5, y: 50 - 90 / sigma / 2, w: 90, h: 90 / sigma };
  const frames: ShapeFrame[] = [
    frame([rect(box.x, box.y, box.w, box.h, "guide")], `縦横比 1:${f3(sigma)}(ブロンズ比)の矩形から始める`),
  ];
  const done: ReturnType<typeof rect>[] = [];
  for (let round = 0; round < 2; round++) {
    const horizontal = box.w > box.h;
    const side = horizontal ? box.h : box.w;
    for (let i = 0; i < 3; i++) {
      const sq: Box = horizontal
        ? { x: box.x + i * side, y: box.y, w: side, h: side }
        : { x: box.x, y: box.y + i * side, w: side, h: side };
      done.push(rect(sq.x, sq.y, sq.w, sq.h, "final"));
      const rest: Box = horizontal
        ? { x: box.x + (i + 1) * side, y: box.y, w: box.w - (i + 1) * side, h: box.h }
        : { x: box.x, y: box.y + (i + 1) * side, w: box.w, h: box.h - (i + 1) * side };
      frames.push(
        frame(
          [...done, rect(rest.x, rest.y, rest.w, rest.h, "guide")],
          `一辺${f1(side)}の正方形を${i + 1}つ目切り出す${i === 2 ? `。残りは縦横比 1:${f3(Math.max(rest.w, rest.h) / Math.min(rest.w, rest.h))} で、元と相似` : ""}`,
        ),
      );
    }
    box = horizontal
      ? { x: box.x + 3 * side, y: box.y, w: box.w - 3 * side, h: box.h }
      : { x: box.x, y: box.y + 3 * side, w: box.w, h: box.h - 3 * side };
  }
  return frames;
}

/** 黄金角 137.5°。360°を黄金比で分けた角で、点が重ならずに散らばる。 */
export function goldenAngleSteps(): ShapeFrame[] {
  const GOLDEN_ANGLE = 360 * (1 - 1 / PHI);
  const c = 50;
  const r = 38;
  const ring = path(arcPts(c, c, r, 0, 360, 90), "guide");
  const pts = (n: number, step: number): Pt[] => Array.from({ length: n }, (_, k) => polar(c, c, r, k * step));
  const dots = (list: Pt[]) => list.map((p, i) => dot(p, i === 0 ? "active" : "final", 1.8));
  return [
    frame([ring, dot(polar(c, c, r, 0), "active", 1.8), label(52, 8, "0°")], "円周上の1点(0°)から始める"),
    frame(
      [ring, ...dots(pts(3, GOLDEN_ANGLE)), line([c, c], polar(c, c, r, GOLDEN_ANGLE), "guide", true)],
      `${f1(GOLDEN_ANGLE)}(=360°×(1−1/φ))ずつ回して点を打つ。3つ目まで`,
    ),
    frame([ring, ...dots(pts(21, GOLDEN_ANGLE))], `21個まで。どの点も近くの点と重ならずに散らばる`),
    frame(
      [ring, ...dots(pts(21, 120))],
      "比べて、120°ずつ(360°の整数分の1)だと、21個打っても3か所に重なるだけで、散らばらない",
    ),
  ];
}

/** 葉序(ひまわりの種の配列)。黄金角で点を並べるフォーゲルのモデル。 */
export function phyllotaxisSteps(): ShapeFrame[] {
  const GOLDEN_ANGLE = 360 * (1 - 1 / PHI);
  const c = 2.9;
  const make = (n: number): Pt[] =>
    Array.from({ length: n }, (_, k) => {
      const rr = c * Math.sqrt(k + 0.5);
      return polar(50, 50, rr, k * GOLDEN_ANGLE);
    });
  const draw = (n: number) => make(n).map((p, k) => circle(p[0], p[1], 0.9 + (k / n) * 0.6, k === n - 1 ? "active" : "final"));
  return [
    frame(draw(8), "n番目の点を、中心から√nに比例する距離・n×137.5°の向きに置く(8個)"),
    frame(draw(21), "21個。中心から外へ、点が詰まりながら広がっていく"),
    frame(draw(55), "55個。右回りと左回りの2種類の螺旋が見え始める"),
    frame(draw(144), "144個。見える螺旋の本数は、フィボナッチ数(例: 8と13、13と21)になりやすい"),
    frame(draw(233), "233個。種や花びらの配列でよく見られる形(実際の植物は個体差があり、ぴったり同じにはならない)"),
  ];
}

/** パスカルの三角形。隣り合う2つの和が下の段になる。奇数だけを塗るとシェルピンスキーの三角形に近づく。 */
export function pascalTriangleSteps(): ShapeFrame[] {
  const rows: number[][] = [[1]];
  for (let r = 1; r <= 8; r++) {
    const prev = rows[r - 1];
    rows.push(Array.from({ length: r + 1 }, (_, k) => (prev[k - 1] ?? 0) + (prev[k] ?? 0)));
  }
  const pos = (r: number, k: number): Pt => [50 + (k - r / 2) * 10.5, 9 + r * 10.5];
  const numbers = (upto: number) =>
    rows.slice(0, upto + 1).flatMap((row, r) =>
      row.map((v, k) => {
        const [x, y] = pos(r, k);
        return label(x - 1.1 * String(v).length, y + 1.4, String(v));
      }),
    );
  const odd = (upto: number) =>
    rows.slice(0, upto + 1).flatMap((row, r) =>
      row.flatMap((v, k) => (v % 2 === 1 ? [circle(pos(r, k)[0], pos(r, k)[1], 4, "final")] : [])),
    );
  return [
    frame(numbers(2), "上から順に並べる。両端は1、内側の数は、すぐ上の左右2つの和(1+1=2)"),
    frame(numbers(4), "4段目まで。1+3=4、3+3=6 のように、すぐ上の2つを足していく"),
    frame(numbers(8), "8段目まで。各段の合計は 1, 2, 4, 8, …(2の累乗)になる"),
    frame([...odd(8), ...numbers(8)], "奇数のところだけを丸で囲むと、三角形が入れ子になった模様(シェルピンスキーの三角形)に近づく"),
  ];
}

/** ヴェシカ・パイシス。互いの中心を通る2つの円が作るレンズ形。高さと幅の比は√3:1。 */
export function vesicaPiscisSteps(): ShapeFrame[] {
  const r = 26;
  const a: Pt = [37, 52];
  const b: Pt = [63, 52];
  const hh = (Math.sqrt(3) / 2) * r;
  const top: Pt = [50, 52 - hh];
  const bottom: Pt = [50, 52 + hh];
  const ca = path(arcPts(a[0], a[1], r, 0, 360, 72), "final");
  const cb = path(arcPts(b[0], b[1], r, 0, 360, 72), "final");
  return [
    frame([ca, dot(a, "active")], `半径${r}の円を1つ描く(中心A)`),
    frame([ca, cb, dot(a, "active"), dot(b, "active"), line(a, b, "guide", true)], "もう1つ、Aを通る円(中心B)を描く。AB間の距離は半径と同じ"),
    frame(
      [ca, cb, dot(top, "active"), dot(bottom, "active"), line(top, bottom, "guide", true), line(a, b, "guide", true)],
      `2円の交点が上下に2つできる。交点を結ぶ長さは ${f1(2 * hh)}(=√3×半径)`,
    ),
    frame(
      [ca, cb, poly([a, b, top], "active"), line(top, bottom, "guide", true), dot(bottom, "final")],
      `A・B・交点は正三角形(3辺とも半径)。レンズの高さ:幅 = √3 : 1(約1:${f3(1 / Math.sqrt(3))})`,
    ),
  ];
}

/** 算術・幾何・調和平均。半円の中に3つの平均が長さとして現れる。 */
export function meansSteps(): ShapeFrame[] {
  const a = 30;
  const b = 60;
  const y = 72;
  const A: Pt = [5, y];
  const P: Pt = [5 + a, y];
  const B: Pt = [5 + a + b, y];
  const R = (a + b) / 2;
  const O: Pt = [5 + R, y];
  const gm = Math.sqrt(a * b);
  const Q: Pt = [P[0], y - gm];
  const S: Pt = [O[0], y - R];
  // Pから線分OQへ下ろした垂線の足 F。QF が調和平均
  const ux = (O[0] - Q[0]) / dist(O, Q);
  const uy = (O[1] - Q[1]) / dist(O, Q);
  const t = (P[0] - Q[0]) * ux + (P[1] - Q[1]) * uy;
  const F: Pt = [Q[0] + ux * t, Q[1] + uy * t];
  const hm = (2 * a * b) / (a + b);
  const semi = path(arcPts(O[0], O[1], R, -90, 90, 60), "final");
  const base = [line(A, P, "final"), line(P, B, "guide"), dot(P, "active"), label(A[0], y + 6, `a=${a}`), label(P[0] + 8, y + 6, `b=${b}`)];
  return [
    frame(base, `線分を a=${a} と b=${b} に分けて並べる(全体の長さ ${a + b})`),
    frame([...base, semi], `全体を直径とする半円を描く。半径 = (a+b)/2 = ${R}(算術平均)`),
    frame([...base, semi, line(O, S, "active"), label(S[0] + 2, S[1] + 2, `AM ${R}`)], `中心から真上の半径が算術平均(AM) ${R}`),
    frame([...base, semi, line(P, Q, "active"), label(Q[0] + 2, Q[1] + 6, `GM ${f1(gm)}`)], `分け目から半円まで垂直に立てた長さが幾何平均(GM) √(ab)=${f1(gm)}`),
    frame(
      [...base, semi, line(O, Q, "guide", true), line(P, F, "guide", true), line(Q, F, "active"), label(F[0] + 2, F[1] + 4, `HM ${f1(hm)}`)],
      `Pから半径OQへ垂線を下ろすと、QからFまでが調和平均(HM) 2ab/(a+b)=${f1(hm)}。HM ≤ GM ≤ AM が長さで見える`,
    ),
  ];
}

/** ピタゴラスの定理(3:4:5の直角三角形)。斜辺上の正方形の面積 = 他の2辺上の正方形の面積の和。 */
export function pythagoreanTheoremSteps(): ShapeFrame[] {
  const C: Pt = [36, 62];
  const B: Pt = [64, 62];
  const A: Pt = [36, 41];
  const tri = poly([A, B, C], "active");
  const sqBC = poly([C, B, [64, 90], [36, 90]], "final");
  const sqAC = poly([A, C, [15, 62], [15, 41]], "final");
  const sqAB = poly([A, B, [43, 34], [15, 13]], "final");
  return [
    frame([tri, label(30, 66, "C"), label(65, 66, "B"), label(30, 40, "A")], "直角三角形(辺の比 3:4:5)。直角はC。辺ACは21、辺BCは28、斜辺ABは35"),
    frame([tri, sqBC, label(44, 80, "28²=784")], "辺BC(28)を一辺とする正方形を外側に描く。面積は 28²=784"),
    frame([tri, sqBC, sqAC, label(44, 80, "784"), label(17, 54, "441")], "辺AC(21)を一辺とする正方形も描く。面積は 21²=441"),
    frame(
      [tri, sqBC, sqAC, sqAB, label(44, 80, "784"), label(17, 54, "441"), label(30, 32, "1225")],
      "斜辺AB(35)の正方形の面積は 35²=1225。784+441=1225 で、2つの正方形の面積の和と等しい(a²+b²=c²)",
    ),
  ];
}

/** 相似(拡大・縮小)。中心から各点へ引いた線上で一定の倍率にすると、形は同じで大きさだけ変わる。 */
export function similaritySteps(): ShapeFrame[] {
  const O: Pt = [50, 62];
  const base: Pt[] = [
    [34, 50],
    [66, 50],
    [50, 32],
  ];
  const scale = (k: number): Pt[] => base.map((p) => [O[0] + (p[0] - O[0]) * k, O[1] + (p[1] - O[1]) * k]);
  const rays = (k: number) => base.map((p) => line(O, [O[0] + (p[0] - O[0]) * k, O[1] + (p[1] - O[1]) * k], "guide", true));
  return [
    frame([poly(base, "active"), dot(O, "guide")], "もとの三角形と、拡大・縮小の中心Oを決める"),
    frame([poly(base, "active"), dot(O, "guide"), ...rays(1.6), poly(scale(0.5), "final")], "Oから各頂点へ引いた線上で、Oまでの距離を 0.5倍にした点を結ぶ(縮小)"),
    frame([poly(base, "active"), dot(O, "guide"), ...rays(1.6), poly(scale(0.5), "final"), poly(scale(1.6), "final")], "1.6倍の点を結ぶと拡大。3つの三角形は、角がすべて等しく、対応する辺の比が一定(相似)"),
    frame([poly(base, "active"), poly(scale(0.5), "final"), poly(scale(1.6), "final"), label(36, 90, "辺の比 0.5 : 1 : 1.6"), label(36, 96, "面積の比 0.25 : 1 : 2.56")], "辺の比が k のとき、面積の比は k² になる"),
  ];
}

/** 画面比(アスペクト比)。同じ幅で、縦の比率だけが違う長方形を重ねる。 */
export function aspectRatiosSteps(): ShapeFrame[] {
  const w = 90;
  const items: { name: string; ratio: number }[] = [
    { name: "1:1", ratio: 1 },
    { name: "4:3", ratio: 4 / 3 },
    { name: "3:2", ratio: 3 / 2 },
    { name: "16:9", ratio: 16 / 9 },
    { name: "21:9", ratio: 21 / 9 },
  ];
  const draw = (upto: number) =>
    items.slice(0, upto + 1).map((it, i) => {
      const h = w / it.ratio;
      return rect(5, 50 - h / 2, w, h, i === upto ? "active" : "final");
    });
  return items.map((it, i) =>
    frame(
      [...draw(i), label(8, 50 - w / it.ratio / 2 - 1.5, `${it.name} = ${f3(it.ratio)}`)],
      `${it.name}(幅:高さ=${f3(it.ratio)}:1)。幅をそろえると、比が大きいほど横に平たくなる`,
    ),
  );
}

/** 12カラムのグリッド。12は 2・3・4・6 で割り切れるので、段組みを自由に分けられる。 */
export function gridSystemSteps(): ShapeFrame[] {
  const gutter = 1.6;
  const colW = (90 - gutter * 11) / 12;
  const colX = (i: number) => 5 + i * (colW + gutter);
  const cols = Array.from({ length: 12 }, (_, i) => rect(colX(i), 8, colW, 36, "guide"));
  const groups = (n: number, y: number) =>
    Array.from({ length: 12 / n }, (_, g) =>
      rect(colX(g * n), y, colW * n + gutter * (n - 1), 11, g % 2 === 0 ? "final" : "active"),
    );
  const rows = [
    { n: 6, y: 52, text: "6列ずつで2分割(12÷2)" },
    { n: 4, y: 67, text: "4列ずつで3分割(12÷3)" },
    { n: 3, y: 82, text: "3列ずつで4分割(12÷4)" },
  ];
  const frames: ShapeFrame[] = [frame(cols, "幅を12の列(カラム)に分け、列の間に一定のすき間(ガター)を置く")];
  for (let i = 0; i < rows.length; i++) {
    frames.push(
      frame([...cols, ...rows.slice(0, i + 1).flatMap((r) => groups(r.n, r.y))], `${rows[i].text}。2列ずつの6分割も作れる——12は2・3・4・6で割り切れる`),
    );
  }
  return frames;
}

/** フィボナッチ螺旋。1,1,2,3,5,8,13,21 の正方形を渦巻き状に並べ、四分円をつなぐ。 */
export function fibonacciSpiralSteps(): ShapeFrame[] {
  const fib = [1, 1, 2, 3, 5, 8, 13, 21];
  type Sq = { x: number; y: number; s: number };
  const squares: Sq[] = [{ x: 0, y: 0, s: 1 }];
  let minX = 0;
  let maxX = 1;
  let minY = 0;
  let maxY = 1;
  for (let i = 1; i < fib.length; i++) {
    const s = fib[i];
    const dir = (i - 1) % 4; // 右・上・左・下(数学座標で、y は上向き)
    let sq: Sq;
    if (dir === 0) sq = { x: maxX, y: minY, s };
    else if (dir === 1) sq = { x: minX, y: maxY, s };
    else if (dir === 2) sq = { x: minX - s, y: minY, s };
    else sq = { x: minX, y: minY - s, s };
    squares.push(sq);
    minX = Math.min(minX, sq.x);
    maxX = Math.max(maxX, sq.x + s);
    minY = Math.min(minY, sq.y);
    maxY = Math.max(maxY, sq.y + s);
  }
  // 各正方形の中の四分円(反時計回りにつなぐ)。始点は直前の終点
  type MathPt = [number, number];
  const arcs: MathPt[][] = [];
  let start: MathPt = [0, 1];
  for (const sq of squares) {
    const corners: MathPt[] = [
      [sq.x, sq.y],
      [sq.x + sq.s, sq.y],
      [sq.x + sq.s, sq.y + sq.s],
      [sq.x, sq.y + sq.s],
    ];
    const adjacent = corners.filter((c) => Math.abs(Math.hypot(c[0] - start[0], c[1] - start[1]) - sq.s) < 1e-6);
    let chosen: { centre: MathPt; end: MathPt } | null = null;
    for (const centre of adjacent) {
      const vx = start[0] - centre[0];
      const vy = start[1] - centre[1];
      const end: MathPt = [centre[0] - vy, centre[1] + vx]; // 反時計回りに90°
      const inside = end[0] >= sq.x - 1e-6 && end[0] <= sq.x + sq.s + 1e-6 && end[1] >= sq.y - 1e-6 && end[1] <= sq.y + sq.s + 1e-6;
      if (inside) {
        chosen = { centre, end };
        break;
      }
    }
    if (!chosen) break;
    const a0 = Math.atan2(start[1] - chosen.centre[1], start[0] - chosen.centre[0]);
    const pts: MathPt[] = Array.from({ length: 21 }, (_, k) => {
      const a = a0 + ((Math.PI / 2) * k) / 20;
      return [chosen!.centre[0] + sq.s * Math.cos(a), chosen!.centre[1] + sq.s * Math.sin(a)];
    });
    arcs.push(pts);
    start = chosen.end;
  }
  // 数学座標(y上)→画面座標(y下)へ。全体を箱に収める
  const flip = (p: MathPt): Pt => [p[0], -p[1]];
  const all: Pt[] = squares.flatMap((sq) => [flip([sq.x, sq.y]), flip([sq.x + sq.s, sq.y + sq.s])]);
  const fit = fitTransform(all, 7);
  const frames: ShapeFrame[] = [];
  for (let n = 1; n <= squares.length; n++) {
    const els = squares.slice(0, n).map((sq, i) => {
      const p = fit(flip([sq.x, sq.y + sq.s]));
      const q = fit(flip([sq.x + sq.s, sq.y]));
      return rect(p[0], p[1], q[0] - p[0], q[1] - p[1], i === n - 1 ? "active" : "final");
    });
    const curve = arcs.slice(0, n).flatMap((arc) => arc.map((p) => fit(flip(p))));
    frames.push(
      frame(
        [...els, ...(curve.length > 1 ? [path(curve, "final")] : [])],
        n === 1
          ? "一辺1の正方形から始める"
          : `一辺${fib[n - 1]}の正方形を追加(${fib[n - 3] ?? 1}+${fib[n - 2]}=${fib[n - 1]}。直前の2つの和)し、四分円でつなぐ`,
      ),
    );
  }
  return frames;
}

/** 黄金三角形。底角72°の二等辺三角形で、底角の二等分線が自己相似な分割を作る。 */
export function goldenTriangleSteps(): ShapeFrame[] {
  const L = 88;
  const base = L / PHI;
  const hgt = Math.sqrt(L * L - (base / 2) ** 2);
  const A: Pt = [50, 6];
  const B: Pt = [50 - base / 2, 6 + hgt];
  const C: Pt = [50 + base / 2, 6 + hgt];
  const outline = poly([A, B, C], "guide");
  const frames: ShapeFrame[] = [
    frame([poly([A, B, C], "active")], `頂角36°・底角72°の二等辺三角形。脚:底辺 = ${f3(PHI)}:1(黄金比)`),
  ];
  let P = A;
  let Q = B;
  let R = C;
  const gnomons: ReturnType<typeof poly>[] = [];
  for (let i = 0; i < 4; i++) {
    const S = lerpPt(P, R, 1 / PHI);
    gnomons.push(poly([P, Q, S], "final"));
    frames.push(
      frame(
        [outline, ...gnomons, poly([Q, R, S], "active"), line(Q, S, "active")],
        i === 0
          ? "底角Bの二等分線を引くと、三角形ABD(36°-36°-108°、黄金グノモン)と三角形BCD(36°-72°-72°)に分かれる。BCDはもとと相似な黄金三角形"
          : `小さくなった黄金三角形でも、同じ操作を繰り返せる(${i + 1}回目)。${f3(PHI)}:1 の比が保たれる`,
      ),
    );
    [P, Q, R] = [Q, R, S];
  }
  return frames;
}

/** 平方根矩形。正方形の対角線を長辺に写して、1:√2、1:√3、1:2、1:√5 の矩形を順に作る。 */
export function rootRectangleSteps(): ShapeFrame[] {
  const k = 40;
  const x0 = 6;
  const yb = 90;
  const top = yb - k;
  const frames: ShapeFrame[] = [frame([rect(x0, top, k, k, "active")], "一辺1(=40)の正方形から始める")];
  for (let n = 1; n <= 4; n++) {
    const w = Math.sqrt(n) * k;
    const diag = Math.hypot(w, k);
    const angle = (Math.atan2(w, k) * 180) / Math.PI;
    frames.push(
      frame(
        [rect(x0, top, w, k, "final"), line([x0, yb], [x0 + w, top], "active", true), path(arcPts(x0, yb, diag, angle, 90, 24), "guide")],
        `縦横比 1:√${n} の矩形の対角線(長さ √${n + 1})を、コンパスで底辺の延長上に写す`,
      ),
    );
    const nw = Math.sqrt(n + 1) * k;
    frames.push(frame([rect(x0, top, nw, k, "active")], `縦横比 1:√${n + 1}(約1:${f3(Math.sqrt(n + 1))})の矩形ができた`));
  }
  return frames;
}

/** 白銀比(1:√2)。長辺を半分に折ると、同じ比の矩形ができる(A判・B判用紙の考え方)。 */
export function silverRatioSteps(): ShapeFrame[] {
  const R = Math.SQRT2;
  const h0 = 60;
  const w0 = h0 * R;
  const x0 = 50 - w0 / 2;
  const y0 = 20;
  const frames: ShapeFrame[] = [frame([rect(x0, y0, w0, h0, "active")], `縦横比 1:√2(約1:${f3(R)})の長方形(例: A4用紙)`)];
  type Box2 = { x: number; y: number; w: number; h: number };
  const pieces: Box2[] = [{ x: x0, y: y0, w: w0, h: h0 }];
  for (let level = 0; level < 3; level++) {
    const target = pieces.pop()!;
    const horizontal = target.w > target.h;
    const half: Box2[] = horizontal
      ? [
          { x: target.x, y: target.y, w: target.w / 2, h: target.h },
          { x: target.x + target.w / 2, y: target.y, w: target.w / 2, h: target.h },
        ]
      : [
          { x: target.x, y: target.y, w: target.w, h: target.h / 2 },
          { x: target.x, y: target.y + target.h / 2, w: target.w, h: target.h / 2 },
        ];
    pieces.push(...half.reverse());
    frames.push(
      frame(
        pieces.map((p, i) => rect(p.x, p.y, p.w, p.h, i === pieces.length - 1 ? "active" : "final")),
        `長辺を半分に折る(${level + 1}回目)。できた長方形の縦横比も 1:${f3(Math.max(half[0].w, half[0].h) / Math.min(half[0].w, half[0].h))} で、もとと相似`,
      ),
    );
  }
  return frames;
}

/** 三分割法。縦横を3等分する線の交点付近に、主題を置く。 */
export function ruleOfThirdsSteps(): ShapeFrame[] {
  const x0 = 6;
  const y0 = 22;
  const w = 88;
  const h = 56;
  const vx = [x0 + w / 3, x0 + (2 * w) / 3];
  const hy = [y0 + h / 3, y0 + (2 * h) / 3];
  const frameEl = rect(x0, y0, w, h, "final");
  const grid = [
    ...vx.map((x) => line([x, y0], [x, y0 + h], "guide")),
    ...hy.map((y) => line([x0, y], [x0 + w, y], "guide")),
  ];
  const points = vx.flatMap((x) => hy.map((y) => circle(x, y, 2, "active")));
  const horizonY = hy[1];
  return [
    frame([frameEl], "画面(矩形)を用意する"),
    frame([frameEl, ...grid], "縦と横を、それぞれ3等分する線を引く(分割比は 1:1:1)"),
    frame([frameEl, ...grid, ...points], "線が交わる4つの点(パワーポイント)が、主題を置く目安の位置"),
    frame(
      [frameEl, ...grid, line([x0, horizonY], [x0 + w, horizonY], "final"), circle(vx[0], hy[0], 6, "final"), label(x0 + 3, y0 + h + 8, "地平線は下の線に、主題は交点に")],
      "例: 地平線を下の3分割線に、太陽や主役を左上の交点に置く。中心に置くより、動きのある構図になりやすい",
    ),
  ];
}

export const PROPORTION_VISUALIZERS: Record<string, () => ShapeFrame[]> = {
  "bronze-ratio": bronzeRatioSteps,
  "golden-angle": goldenAngleSteps,
  phyllotaxis: phyllotaxisSteps,
  "pascal-triangle": pascalTriangleSteps,
  "vesica-piscis": vesicaPiscisSteps,
  "means-geometry": meansSteps,
  "pythagorean-theorem": pythagoreanTheoremSteps,
  similarity: similaritySteps,
  "aspect-ratios": aspectRatiosSteps,
  "grid-system": gridSystemSteps,
  "fibonacci-spiral": fibonacciSpiralSteps,
  "golden-triangle": goldenTriangleSteps,
  "root-rectangle": rootRectangleSteps,
  "silver-ratio": silverRatioSteps,
  "rule-of-thirds": ruleOfThirdsSteps,
};
