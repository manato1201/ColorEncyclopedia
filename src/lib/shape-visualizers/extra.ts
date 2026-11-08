import type { ShapeElement, ShapeFrame } from "./base.ts";
import { circle, circlePts, dist, dot, f1, f3, fitTransform, frame, label, line, mid, path, poly, polar, rect, regularPolygon, type Pt } from "./helpers.ts";
import { solidHull } from "../geometry3d/hull.ts";

/**
 * 追加した図形(立体・作図定理・フラクタル・曲線・平面充填・対称性)の作図ジェネレータ。
 * 座標は 0〜100 の正方形(y は下向き)。数値は座標から計算した値を説明文に出す。
 */

const PHI = (1 + Math.sqrt(5)) / 2;
const sub2 = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];

/** 辺 A→B を1辺とする正n角形(polygonを A→B の左側に置く: 画面では y 下向きなので side=-1 が上側)。 */
function polygonOnEdge(a: Pt, b: Pt, n: number, side: 1 | -1): Pt[] {
  const pts: Pt[] = [a, b];
  let dx = b[0] - a[0];
  let dy = b[1] - a[1];
  const turn = ((2 * Math.PI) / n) * side;
  let cur = b;
  for (let i = 2; i < n; i++) {
    const nx = dx * Math.cos(turn) - dy * Math.sin(turn);
    const ny = dx * Math.sin(turn) + dy * Math.cos(turn);
    dx = nx;
    dy = ny;
    cur = [cur[0] + dx, cur[1] + dy];
    pts.push(cur);
  }
  return pts;
}

const centroid = (pts: Pt[]): Pt => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];

/** 多角形を、辺の外側へ向けて辺 i に正m角形を貼る。 */
function attachOutside(base: Pt[], i: number, m: number): Pt[] {
  const a = base[i];
  const b = base[(i + 1) % base.length];
  const c = centroid(base);
  for (const side of [1, -1] as const) {
    const cand = polygonOnEdge(a, b, m, side);
    const cc = centroid(cand);
    // 外側 = 元の多角形の中心とは反対側
    if (dist(cc, c) > dist(a, c)) return cand;
  }
  return polygonOnEdge(a, b, m, 1);
}

// ---------------------------------------------------------------------------
// 立体・多面体
// ---------------------------------------------------------------------------

/** 切頂二十面体: 五角形1枚と、そのまわりの六角形5枚。平らに並べると12°のすき間(だから丸まる)。 */
export function truncatedIcosahedronSteps(): ShapeFrame[] {
  const side = 11;
  const pent = regularPolygon(50, 50, side / (2 * Math.sin(Math.PI / 5)), 5, 0);
  const hexes = pent.map((_, i) => attachOutside(pent, i, 6));
  return [
    frame([poly(pent, "active")], "切頂二十面体の面は、正五角形が12枚と、正六角形が20枚。まず、五角形を1枚"),
    frame([poly(pent, "final"), ...hexes.slice(0, 2).map((h) => poly(h, "active"))], "五角形の辺ごとに、正六角形が接する(どの頂点にも、五角形1つと六角形2つが集まる)"),
    frame([poly(pent, "final"), ...hexes.map((h) => poly(h, "active"))], "五角形のまわりに六角形5枚。平らに置くと、六角形どうしの間に、すき間ができる"),
    frame(
      [poly(pent, "guide"), ...hexes.map((h) => poly(h, "guide")), label(8, 10, "108°+120°+120°=348°")],
      "頂点のまわりの内角の和は 108°+120°+120°=348° で、360° に 12° たりない。そのすき間を閉じるように丸まり、立体(サッカーボールの形)になる",
    ),
  ];
}

/** 立方八面体: 正方形の角を辺の中点まで切り落とす。 */
export function cuboctahedronSteps(): ShapeFrame[] {
  const sq: Pt[] = [[22, 22], [78, 22], [78, 78], [22, 78]];
  const mids = sq.map((p, i) => mid(p, sq[(i + 1) % 4]));
  return [
    frame([poly(sq, "active")], "立方体の1つの面(正方形)から始める"),
    frame([poly(sq, "guide"), ...mids.map((m) => dot(m, "active", 1.8))], "各辺の中点に印をつける"),
    frame([poly(sq, "guide"), poly(mids, "active"), ...sq.map((p, i) => poly([mids[(i + 3) % 4], p, mids[i]], "final"))], "中点どうしを結ぶと、角が三角形として切り離される。残るのは、45°回った正方形(立方八面体の四角形の面)"),
    frame([poly(mids, "final"), label(8, 10, "三角形 8 + 四角形 6")], "立方体の8つの角を切ると、三角形の面が8枚。もとの6つの面は四角形として残り、立方八面体は 8+6=14 面になる"),
  ];
}

/** 半正多面体: 頂点のまわりの正多角形の並び(頂点配置)と、内角の和。 */
export function archimedeanSolidsSteps(): ShapeFrame[] {
  const cases: { sides: number[]; name: string }[] = [
    { sides: [3, 4, 3, 4], name: "立方八面体" },
    { sides: [3, 6, 6], name: "切頂四面体" },
    { sides: [4, 6, 6], name: "切頂八面体" },
    { sides: [5, 6, 6], name: "切頂二十面体" },
    { sides: [3, 5, 3, 5], name: "二十・十二面体" },
  ];
  return cases.map(({ sides, name }) => {
    const o: Pt = [50, 54];
    const s = 17;
    const els: ShapeElement[] = [];
    let heading = 0;
    let total = 0;
    for (const n of sides) {
      const interior = ((n - 2) * 180) / n;
      total += interior;
      // 頂点 o から heading の向きに始まる正n角形
      const pts: Pt[] = [];
      let pos: Pt = [o[0], o[1]];
      let h = heading;
      for (let i = 0; i < n; i++) {
        pts.push([pos[0], pos[1]]);
        pos = [pos[0] + s * Math.cos((h * Math.PI) / 180), pos[1] - s * Math.sin((h * Math.PI) / 180)];
        h += 360 / n;
      }
      els.push(poly(pts, "final"));
      heading += interior;
    }
    els.push(dot(o, "active", 1.6), label(6, 10, `${sides.join(".")} → 合計 ${f1(total)}°`));
    return frame(els, `${name}: 頂点のまわりに ${sides.map((n) => `正${n}角形`).join("・")} が集まる(頂点配置 ${sides.join(".")})。内角の和は ${f1(total)}° で、360° 未満なので、折れて立体になる`);
  });
}

/** 双対: 多角形の辺の中点を結ぶと、同じ数の辺の多角形(平面の双対)。立体では面の中心を結ぶ。 */
export function dualPolyhedraSteps(): ShapeFrame[] {
  const make = (n: number, name: string): ShapeFrame => {
    const outer = regularPolygon(50, 50, 38, n, 0);
    const mids = outer.map((p, i) => mid(p, outer[(i + 1) % n]));
    return frame([poly(outer, "guide"), poly(mids, "active"), ...mids.map((m) => dot(m, "final", 1.4))], `${name}: 辺の中点を結ぶと、同じ辺の数の正多角形ができる(平面の「双対」の考え方)。立体では、面の中心を頂点として結ぶと、頂点と面が入れ替わる`);
  };
  const cube = solidHull("cube");
  const octa = solidHull("octahedron");
  const counts = (h: typeof cube) => `頂点${h.vertices.length}・辺${h.edges.length}・面${h.faces.length}`;
  return [
    make(4, "正方形"),
    make(5, "正五角形"),
    frame([label(10, 40, `立方体: ${counts(cube)}`), label(10, 60, `正八面体: ${counts(octa)}`)], "立方体と正八面体は、頂点と面の数が入れ替わり、辺の数は同じ。面の中心を結ぶと、立方体の中に正八面体ができる(逆も同じ)"),
  ];
}

/** 回転体: 軸のまわりに図形を回すと、輪郭(側面図)は、図形と、その鏡像になる。 */
export function solidsOfRevolutionSteps(): ShapeFrame[] {
  const axisX = 50;
  const mk = (pts: Pt[], text: string, extra: ShapeElement[] = []): ShapeFrame => {
    const mirror = pts.map(([x, y]): Pt => [2 * axisX - x, y]);
    return frame([line([axisX, 8], [axisX, 92], "guide", true), path(pts, "active"), path(mirror, "final"), ...extra], text);
  };
  const ell = (cy: number, rx: number): ShapeElement => ({ kind: "polyline", points: circlePts(50, cy, rx, 48).map(([x, y]): Pt => [x, cy + (y - cy) * 0.28]), state: "guide" });
  return [
    mk([[50, 20], [76, 20], [76, 80], [50, 80]], "長方形を軸のまわりに回すと円柱。側面図は、長方形が2つ(軸の両側)つながった形", [ell(20, 26), ell(80, 26)]),
    mk([[50, 14], [78, 84], [50, 84]], "直角三角形を回すと円錐。底面の半径と高さが、三角形の2辺になる", [ell(84, 28)]),
    mk(Array.from({ length: 33 }, (_, i): Pt => polar(50, 50, 34, 0 + (180 * i) / 32)), "半円を、直径を軸にして回すと球。側面図は、どの向きから見ても円"),
    mk([[50, 22], [66, 22], [80, 80], [50, 80]], "台形を回すと円錐台。上の面と下の面の半径が違う", [ell(22, 16), ell(80, 30)]),
    mk(Array.from({ length: 33 }, (_, i): Pt => [50 + (i / 32) * 28, 22 + 58 * (1 - Math.pow(i / 32, 2))]), "放物線(y が r² に比例する曲線)を回すと、お椀の形の回転放物体。パラボラアンテナの形"),
  ];
}

/** アルキメデス: 同じ半径・高さ2rの円錐・球・円柱の側面図(三角形・円・長方形)と体積の比 1:2:3。 */
export function sphereVolumeSteps(): ShapeFrame[] {
  const r = 12;
  const cy = 50;
  const cones = (cx: number): ShapeElement[] => [poly([[cx, cy - r], [cx + r, cy + r], [cx - r, cy + r]], "final")];
  const sph = (cx: number): ShapeElement[] => [circle(cx, cy, r, "final")];
  const cyl = (cx: number): ShapeElement[] => [rect(cx - r, cy - r, 2 * r, 2 * r, "final")];
  return [
    frame([...cones(22), ...sph(50), ...cyl(78)], "同じ半径 r で、高さが 2r(球の直径)の円錐・球・円柱を、真横から見た図(三角形・円・正方形)"),
    frame([...cones(22), ...sph(50), ...cyl(78), label(10, 80, "円錐 2πr³/3"), label(40, 80, "球 4πr³/3"), label(68, 80, "円柱 2πr³")], "体積は、円錐 (1/3)πr²·2r=2πr³/3、球 4πr³/3、円柱 πr²·2r=2πr³"),
    frame([...cones(22), ...sph(50), ...cyl(78), label(34, 20, "1 : 2 : 3")], "分子をそろえると、円錐 : 球 : 円柱 = 1 : 2 : 3。つまり、円柱の体積 = 球の体積 + 円錐の体積"),
  ];
}

/** カヴァリエリの原理(平面版): 同じ高さの断面の長さが等しければ、面積も等しい。 */
export function cavalieriSteps(): ShapeFrame[] {
  const slices = (shift: (i: number) => number): ShapeElement[] =>
    Array.from({ length: 10 }, (_, i) => rect(30 + shift(i), 20 + i * 6, 40, 5, "final"));
  return [
    frame(slices(() => 0), "長方形を、同じ幅の細い帯10本に分ける(帯の幅=40、積み重なり)"),
    frame(slices((i) => i * 2.6), "帯を横にずらしても(積み方を変えても)、帯の長さ・数は変わらない。形は平行四辺形になる"),
    frame([...slices((i) => (i % 2 === 0 ? -6 : 6)), label(10, 92, "底辺と高さが等しい → 面積は等しい")], "どの高さでも断面の長さが等しいので、面積は等しい(カヴァリエリの原理)。立体では、断面積が等しければ体積が等しい"),
  ];
}

/** 空間充填の平面版: 正方形と正六角形は、同じ形だけで平面をすき間なく埋められる。 */
export function spaceFillingSteps(): ShapeFrame[] {
  const squares: ShapeElement[] = [];
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) squares.push(rect(15 + i * 14, 15 + j * 14, 14, 14, "final"));
  const hexes: ShapeElement[] = [];
  const R = 9;
  for (let c = -1; c < 6; c++) {
    for (let r = -1; r < 6; r++) {
      const cx = 14 + c * R * 1.5;
      const cy = 14 + r * R * Math.sqrt(3) + (c % 2 === 0 ? 0 : (R * Math.sqrt(3)) / 2);
      if (cx < 6 || cx > 94 || cy < 6 || cy > 94) continue;
      hexes.push(poly(regularPolygon(cx, cy, R, 6, 90), "final"));
    }
  }
  return [
    frame(squares, "平面では、正方形を並べるとすき間なく埋められる(立体の立方体に対応)"),
    frame(hexes, "正六角形も、すき間なく平面を埋める(ハチの巣)。立体では、切頂八面体や菱形十二面体が、同じ形だけで空間を埋められる"),
  ];
}

// ---------------------------------------------------------------------------
// 作図・定理
// ---------------------------------------------------------------------------

const triangle: Pt[] = [[50, 12], [90, 84], [10, 84]];

/** チェバの定理: 3本の線(チェバ線)が1点で交わるとき、辺の比の積が1。 */
export function cevaSteps(): ShapeFrame[] {
  const [A, B, C] = triangle;
  const cases: [number, number, number][] = [
    [1 / 3, 1 / 3, 1 / 3],
    [0.2, 0.5, 0.3],
    [0.6, 0.25, 0.15],
  ];
  const frames: ShapeFrame[] = [frame([poly(triangle, "final"), label(48, 9, "A"), label(92, 88, "B"), label(4, 88, "C")], "三角形 ABC。頂点から向かいの辺へ引く線を、チェバ線という")];
  for (const [wa, wb, wc] of cases) {
    // 重心座標 (wa,wb,wc) の点 P。D は AP と BC の交点など
    const P: Pt = [wa * A[0] + wb * B[0] + wc * C[0], wa * A[1] + wb * B[1] + wc * C[1]];
    const D: Pt = [(wb * B[0] + wc * C[0]) / (wb + wc), (wb * B[1] + wc * C[1]) / (wb + wc)];
    const E: Pt = [(wa * A[0] + wc * C[0]) / (wa + wc), (wa * A[1] + wc * C[1]) / (wa + wc)];
    const F: Pt = [(wa * A[0] + wb * B[0]) / (wa + wb), (wa * A[1] + wb * B[1]) / (wa + wb)];
    const r1 = dist(B, D) / dist(D, C);
    const r2 = dist(C, E) / dist(E, A);
    const r3 = dist(A, F) / dist(F, B);
    frames.push(
      frame(
        [poly(triangle, "guide"), line(A, D, "active"), line(B, E, "active"), line(C, F, "active"), dot(P, "final", 1.8)],
        `3本が1点 P で交わる。BD/DC=${f3(r1)}、CE/EA=${f3(r2)}、AF/FB=${f3(r3)}。その積は ${f3(r1 * r2 * r3)}(=1)`,
      ),
    );
  }
  return frames;
}

/** 方べきの定理: 点 P を通る2本の直線が円と交わる点について、PA·PB = PC·PD。 */
export function powerOfPointSteps(): ShapeFrame[] {
  const O: Pt = [50, 50];
  const R = 28;
  const onCircle = (deg: number): Pt => polar(O[0], O[1], R, deg);
  const inter = (P: Pt, deg: number): [Pt, Pt] => {
    // P から角度 deg の直線と円の交点(2つ)
    const dir: Pt = [Math.sin((deg * Math.PI) / 180), -Math.cos((deg * Math.PI) / 180)];
    const w = sub2(P, O);
    const b = w[0] * dir[0] + w[1] * dir[1];
    const c = w[0] * w[0] + w[1] * w[1] - R * R;
    const disc = Math.sqrt(Math.max(0, b * b - c));
    return [[P[0] + dir[0] * (-b - disc), P[1] + dir[1] * (-b - disc)], [P[0] + dir[0] * (-b + disc), P[1] + dir[1] * (-b + disc)]];
  };
  const make = (P: Pt, d1: number, d2: number, text: (a: number, b: number) => string): ShapeFrame => {
    const [A, B] = inter(P, d1);
    const [C, D] = inter(P, d2);
    const p1 = dist(P, A) * dist(P, B);
    const p2 = dist(P, C) * dist(P, D);
    return frame([circle(O[0], O[1], R, "guide"), line(A, B, "active"), line(C, D, "active"), dot(P, "final", 1.8), dot(A, "final", 1.2), dot(B, "final", 1.2), dot(C, "final", 1.2), dot(D, "final", 1.2), label(P[0] + 2, P[1] - 2, "P")], text(p1, p2));
  };
  const outside: Pt = [92, 52];
  const inside: Pt = [44, 58];
  void onCircle;
  return [
    make(outside, 265, 290, (a, b) => `P が円の外: PA·PB=${f1(a / 10)}、PC·PD=${f1(b / 10)}(単位 10²)。どの直線を引いても同じ値`),
    make(inside, 20, 120, (a, b) => `P が円の内側: PA·PB=${f1(a / 10)}、PC·PD=${f1(b / 10)}(単位 10²)。内側でも同じ形の等式が成り立つ`),
    make(outside, 270, 250, (a, b) => `別の2本の直線: PA·PB=${f1(a / 10)}、PC·PD=${f1(b / 10)}。この値は、P から円までの「べき」(|PO|²−R²)に等しい`),
  ];
}

/** トレミーの定理: 円に内接する四角形で、対角線の積 = 向かい合う辺の積の和。 */
export function ptolemySteps(): ShapeFrame[] {
  const O: Pt = [50, 50];
  const R = 38;
  const make = (degs: [number, number, number, number], text: string): ShapeFrame => {
    const [A, B, C, D] = degs.map((d) => polar(O[0], O[1], R, d));
    const ac = dist(A, C);
    const bd = dist(B, D);
    const sum = dist(A, B) * dist(C, D) + dist(B, C) * dist(D, A);
    return frame(
      [circle(O[0], O[1], R, "guide"), poly([A, B, C, D], "final"), line(A, C, "active"), line(B, D, "active"), label(A[0] - 4, A[1] - 2, "A"), label(B[0] + 1, B[1] - 2, "B"), label(C[0] + 1, C[1] + 4, "C"), label(D[0] - 5, D[1] + 4, "D")],
      `${text} AC·BD=${f1(ac)}×${f1(bd)}=${f1(ac * bd)}、AB·CD+BC·DA=${f1(sum)}。等しい`,
    );
  };
  return [
    make([20, 100, 200, 290], "円に内接する四角形 ABCD。対角線 AC・BD を引く。"),
    make([0, 70, 170, 250], "別の形の内接四角形でも成り立つ。"),
    make([10, 130, 190, 300], "頂点の位置を変えても、等式は変わらない。"),
  ];
}

/** ヘロンの公式: 3辺 a,b,c から面積 √(s(s−a)(s−b)(s−c))(s=周の半分)。 */
export function heronSteps(): ShapeFrame[] {
  const make = (a: number, b: number, c: number, text: string): ShapeFrame => {
    // 辺 c を底辺にして、頂点 C を求める
    const x = (b * b + c * c - a * a) / (2 * c);
    const h = Math.sqrt(Math.max(0, b * b - x * x));
    const pts: Pt[] = [[0, 0], [c, 0], [x, -h]];
    const tf = fitTransform(pts, 14);
    const [A, B, C] = pts.map(tf);
    const s = (a + b + c) / 2;
    const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
    return frame([poly([A, B, C], "final"), label((A[0] + B[0]) / 2 - 2, A[1] + 8, `c=${a === b ? f1(c) : f1(c)}`), label(B[0] + 1, (B[1] + C[1]) / 2, `a=${f1(a)}`), label(A[0] - 6, (A[1] + C[1]) / 2, `b=${f1(b)}`)], `${text} s=(a+b+c)/2=${f1(s)}、面積 √(s(s−a)(s−b)(s−c))=${f3(area)}(底辺×高さ÷2=${f3((c * h) / 2)} と一致)`);
  };
  return [make(5, 5, 6, "二等辺三角形(辺 5, 5, 6)。"), make(3, 4, 5, "直角三角形(辺 3, 4, 5)。"), make(7, 8, 9, "3辺が 7, 8, 9 の三角形。高さを求めなくても、3辺だけから面積が出る。")];
}

// ---------------------------------------------------------------------------
// フラクタル
// ---------------------------------------------------------------------------

/** シェルピンスキーの三角形。 */
export function sierpinskiTriangleSteps(): ShapeFrame[] {
  const A: Pt = [50, 10];
  const B: Pt = [92, 86];
  const C: Pt = [8, 86];
  const build = (n: number): Pt[][] => {
    let tris: Pt[][] = [[A, B, C]];
    for (let i = 0; i < n; i++) {
      const next: Pt[][] = [];
      for (const [p, q, r] of tris) {
        const pq = mid(p, q);
        const qr = mid(q, r);
        const rp = mid(r, p);
        next.push([p, pq, rp], [pq, q, qr], [rp, qr, r]);
      }
      tris = next;
    }
    return tris;
  };
  return [0, 1, 2, 3, 4, 5].map((n) => frame(build(n).map((t) => poly(t, "final")), `${n}段: 三角形 ${3 ** n} 個。各三角形を、辺の中点を結んで4つに分け、真ん中を抜くことを繰り返す。残る面積は元の (3/4)^${n}=${f3(0.75 ** n)}`));
}

/** マンデルブロ集合: z→z²+c を繰り返して、発散しない c の集合。 */
export function mandelbrotSteps(): ShapeFrame[] {
  const N = 34;
  const x0 = -2.1;
  const x1 = 0.9;
  const y0 = -1.2;
  const y1 = 1.2;
  const count = (c: [number, number], maxIter: number): boolean => {
    let zr = 0;
    let zi = 0;
    for (let i = 0; i < maxIter; i++) {
      const nr = zr * zr - zi * zi + c[0];
      zi = 2 * zr * zi + c[1];
      zr = nr;
      if (zr * zr + zi * zi > 4) return false;
    }
    return true;
  };
  const cellW = (100 - 20) / N;
  const make = (iter: number): ShapeFrame => {
    const els: ShapeElement[] = [];
    let inside = 0;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < Math.round(N * 0.8); j++) {
        const cr = x0 + ((i + 0.5) / N) * (x1 - x0);
        const ci = y0 + ((j + 0.5) / Math.round(N * 0.8)) * (y1 - y0);
        if (count([cr, ci], iter)) {
          inside++;
          els.push(rect(10 + i * cellW, 14 + j * ((100 - 28) / Math.round(N * 0.8)), cellW, (100 - 28) / Math.round(N * 0.8), "final"));
        }
      }
    }
    return frame(els, `${iter}回繰り返して、まだ |z|≤2 の c(${inside}マス)。回数を増やすほど、集合の縁が細かく切り出され、渦やくびれが現れる`);
  };
  return [1, 2, 3, 5, 10, 30].map(make);
}

/** レヴィのC曲線: 線分を、直角の二等辺三角形の2辺に置き換える。 */
export function levyCSteps(): ShapeFrame[] {
  const build = (n: number): Pt[] => {
    let pts: Pt[] = [[0, 0], [1, 0]];
    for (let i = 0; i < n; i++) {
      const next: Pt[] = [pts[0]];
      for (let k = 0; k < pts.length - 1; k++) {
        const [p, q] = [pts[k], pts[k + 1]];
        const m: Pt = [(p[0] + q[0]) / 2 - (q[1] - p[1]) / 2, (p[1] + q[1]) / 2 + (q[0] - p[0]) / 2];
        next.push(m, q);
      }
      pts = next;
    }
    return pts;
  };
  const tf = fitTransform(build(12), 10);
  return [0, 1, 2, 4, 8, 12].map((n) => frame([path(build(n).map(tf), "final")], `${n}回: 線分 ${2 ** n} 本。各線分を、直角二等辺三角形の斜辺とみなして、その直角を挟む2辺に置き換える。長さは √2 倍ずつ増える(${f1(Math.SQRT2 ** n)}倍)`));
}

/** アポロニウスの詰め込み: 互いに接する3円に接する円を、次々に描く(デカルトの円定理)。 */
export function apollonianSteps(): ShapeFrame[] {
  // k=曲率(外側の円は負)、(x,y)=中心
  type C = { k: number; x: number; y: number };
  type Q = [C, C, C, C];
  const R = 44;
  const cx = 50;
  const cy = 50;
  const outer: C = { k: -1, x: 0, y: 0 };
  const a: C = { k: 2, x: -0.5, y: 0 };
  const b: C = { k: 2, x: 0.5, y: 0 };
  const c: C = { k: 3, x: 0, y: 2 / 3 };
  const d: C = { k: 3, x: 0, y: -2 / 3 };
  // 3円に接する別の円: k′ = 2(k1+k2+k3) − k、中心も同じ形の線形式(デカルトの円定理の、置き換えの形)
  const replace = (t: [C, C, C], old: C): C => {
    const k = 2 * (t[0].k + t[1].k + t[2].k) - old.k;
    return {
      k,
      x: (2 * (t[0].k * t[0].x + t[1].k * t[1].x + t[2].k * t[2].x) - old.k * old.x) / k,
      y: (2 * (t[0].k * t[0].y + t[1].k * t[1].y + t[2].k * t[2].y) - old.k * old.y) / k,
    };
  };
  const levels: C[][] = [[outer, a, b, c, d]];
  let frontier: Q[] = [
    [outer, a, b, c],
    [outer, a, b, d],
  ];
  for (let depth = 1; depth <= 4; depth++) {
    const added: C[] = [];
    const next: Q[] = [];
    for (const q of frontier) {
      // 最後の円(いま作ったばかり)以外の3つを、それぞれ置き換える
      for (let j = 0; j < 3; j++) {
        const others = q.filter((_, i) => i !== j) as [C, C, C];
        const nc = replace(others, q[j]);
        added.push(nc);
        next.push([...others, nc] as Q);
      }
    }
    levels.push(added);
    frontier = next;
  }
  const drawn = (upTo: number): ShapeElement[] => {
    const els: ShapeElement[] = [];
    for (let i = 0; i <= upTo; i++) {
      for (const ci of levels[i]) els.push(circle(cx + ci.x * R, cy - ci.y * R, Math.abs(1 / ci.k) * R, ci.k < 0 ? "guide" : i === upTo ? "active" : "final"));
    }
    return els;
  };
  return [0, 1, 2, 3, 4].map((n) => {
    const els = drawn(n);
    return frame(els, `${n}段: 円 ${els.length - 1} 個(外側の円は除く)。互いに接する3つの円のすき間に、その3円に接する円を入れる。曲率は k′=2(k₁+k₂+k₃)−k(デカルトの円定理)で次々に求まる`);
  });
}

// ---------------------------------------------------------------------------
// 曲線
// ---------------------------------------------------------------------------

/** 懸垂線 y=a·cosh(x/a) と放物線の比較。 */
export function catenarySteps(): ShapeFrame[] {
  const mk = (a: number, parabola: boolean): ShapeElement[] => {
    const xs = Array.from({ length: 61 }, (_, i) => -2.4 + (i * 4.8) / 60);
    const tf = (x: number, y: number): Pt => [50 + x * 17, 18 + (y - 1) * 17];
    const cat = path(xs.map((x) => tf(x, a * Math.cosh(x / a))), "final");
    const els: ShapeElement[] = [line([8, 14], [92, 14], "guide", true), cat];
    if (parabola) els.push(path(xs.map((x) => tf(x, a + (x * x) / (2 * a))), "guide"));
    return els;
  };
  return [
    frame(mk(1, false), "両端を同じ高さでつるした鎖の形は懸垂線 y=a·cosh(x/a)(a=1)。cosh は (eˣ+e⁻ˣ)/2 の双曲線関数"),
    frame(mk(1, true), "底の近くでは、放物線 y=a+x²/(2a)(灰色)とほとんど同じ。離れるほど、懸垂線のほうが急に立ち上がる"),
    frame(mk(1.8, true), "a を大きくすると、たるみが浅くなる。放物線とは別の曲線で、ケーブルの形は荷重で決まる(吊り橋は放物線に近い)"),
  ];
}

/** アステロイド: 半径 R の円の内側を、半径 R/4 の円が転がるときの点の軌跡。 */
export function astroidSteps(): ShapeFrame[] {
  const R = 36;
  const r = R / 4;
  const pt = (t: number): Pt => [50 + R * Math.pow(Math.cos(t), 3), 50 - R * Math.pow(Math.sin(t), 3)];
  const trace = (t1: number): Pt[] => Array.from({ length: 80 }, (_, i) => pt((t1 * i) / 79));
  return [Math.PI / 4, Math.PI / 2, Math.PI, 2 * Math.PI].map((t, i) => {
    const centre: Pt = [50 + (R - r) * Math.cos(t), 50 - (R - r) * Math.sin(t)];
    return frame(
      [circle(50, 50, R, "guide"), path(trace(t), "final"), circle(centre[0], centre[1], r, "active"), dot(pt(t), "active", 1.6)],
      i === 3 ? "1周: 尖った点(カスプ)が4つある星形。x^(2/3)+y^(2/3)=R^(2/3)。大きな円の半径が、転がる円の半径のちょうど4倍" : `転がる円(半径 R/4)の円周上の点の軌跡。回転角 ${Math.round((t * 180) / Math.PI)}°`,
    );
  });
}

/** レムニスケート: 2つの焦点からの距離の積が一定。極方程式 r²=a²cos2θ。 */
export function lemniscateSteps(): ShapeFrame[] {
  const a = 38;
  const curve = (t1: number): Pt[] => Array.from({ length: 100 }, (_, i) => {
    const t = (t1 * i) / 99;
    const d = 1 + Math.sin(t) ** 2;
    return [50 + (a * Math.cos(t)) / d, 50 - (a * Math.sin(t) * Math.cos(t)) / d] as Pt;
  });
  const F1: Pt = [50 - a / Math.SQRT2, 50];
  const F2: Pt = [50 + a / Math.SQRT2, 50];
  const t = 0.9;
  const d = 1 + Math.sin(t) ** 2;
  const P: Pt = [50 + (a * Math.cos(t)) / d, 50 - (a * Math.sin(t) * Math.cos(t)) / d];
  const c2 = (a * a) / 2;
  return [
    frame([path(curve(Math.PI / 2), "active")], "8の字(∞)の右半分から描く。原点を通る"),
    frame([path(curve(2 * Math.PI), "final"), dot(F1, "guide", 1.4), dot(F2, "guide", 1.4)], "全体は8の字。左右の2点が焦点 F₁・F₂(原点から a/√2 の距離)"),
    frame([path(curve(2 * Math.PI), "final"), dot(F1, "guide", 1.4), dot(F2, "guide", 1.4), line(F1, P, "active"), line(F2, P, "active"), dot(P, "final", 1.8)], `曲線上のどの点でも、焦点までの距離の積が一定: PF₁×PF₂=${f1(dist(P, F1) * dist(P, F2))}(=a²/2=${f1(c2)})`),
  ];
}

/** つる巻き線: 真上から見ると円、真横から見ると正弦波。 */
export function helixSteps(): ShapeFrame[] {
  const cx = 28;
  const cy = 50;
  const R = 18;
  const wave = (t1: number): Pt[] => Array.from({ length: 70 }, (_, i) => {
    const t = (t1 * i) / 69;
    return [58 + (t / (4 * Math.PI)) * 38, 50 - R * Math.sin(t)] as Pt;
  });
  const top = (t1: number): Pt[] => Array.from({ length: 70 }, (_, i) => polar(cx, cy, R, ((t1 * i) / 69) * (180 / Math.PI)));
  void top;
  return [Math.PI / 2, Math.PI, 2 * Math.PI, 4 * Math.PI].map((t1) => {
    const p: Pt = [cx + R * Math.cos(t1), cy - R * Math.sin(t1)];
    const side: Pt = [58 + (t1 / (4 * Math.PI)) * 38, 50 - R * Math.sin(t1)];
    return frame(
      [circle(cx, cy, R, "guide"), dot(p, "active", 1.8), path(wave(t1), "final"), dot(side, "active", 1.8), line(p, [58, p[1]], "guide", true), line([58, 50], [96, 50], "guide", true)],
      `左: 真上から見ると円(半径が一定)。右: 真横から見ると、高さ方向に一定の割合で進むので、正弦波。回転角 ${Math.round((t1 * 180) / Math.PI)}°`,
    );
  });
}

// ---------------------------------------------------------------------------
// 平面充填
// ---------------------------------------------------------------------------

/** 菱形タイリング(ロンビル): 正六角形を3つの菱形に分けた敷き詰め。立方体を積んだ絵に見える。 */
export function rhombilleSteps(): ShapeFrame[] {
  const R = 10;
  const hexRhombi = (cx: number, cy: number): Pt[][] => {
    const v = regularPolygon(cx, cy, R, 6, 0); // 真上から時計回り
    const c: Pt = [cx, cy];
    return [[c, v[0], v[1], v[2]], [c, v[2], v[3], v[4]], [c, v[4], v[5], v[0]]];
  };
  const centers: Pt[] = [];
  for (let col = -1; col < 6; col++) {
    for (let row = -1; row < 6; row++) {
      const cx = 14 + col * R * Math.sqrt(3);
      const cy = 18 + row * R * 1.5 + 0;
      const shifted: Pt = [cx + (row % 2 === 0 ? 0 : (R * Math.sqrt(3)) / 2), cy];
      if (shifted[0] < 4 + R || shifted[0] > 96 - R || shifted[1] < 4 + R || shifted[1] > 96 - R) continue;
      centers.push(shifted);
    }
  }
  return [
    frame(hexRhombi(50, 50).map((q) => poly(q, "final")), "正六角形を、中心から1つおきの頂点に線を引いて、3つの同じ菱形に分ける"),
    frame(centers.flatMap((c) => hexRhombi(c[0], c[1])).map((q) => poly(q, "final")), "これを敷き詰めたのが菱形タイリング。3方向の向きの菱形が並び、立方体を積んだ(アイソメトリックな)絵に見える。3D表示の「等角」の視点と同じ"),
  ];
}

/** 長い三角形タイリング(3.3.3.4.4): 正三角形の列と正方形の列が交互に並ぶ。 */
export function elongatedTriangularSteps(): ShapeFrame[] {
  const s = 14;
  const h = (s * Math.sqrt(3)) / 2;
  const sqRows: ShapeElement[] = [];
  const triRows: ShapeElement[] = [];
  const cols = 5;
  let y = 10;
  for (let r = 0; r < 3; r++) {
    // 三角形の列の底辺が、次の正方形の列と合うよう、1列ごとに半分ずらす
    const x0 = 6 + (r % 2) * (s / 2);
    for (let c = 0; c < cols; c++) sqRows.push(rect(x0 + c * s, y, s, s, "final"));
    y += s;
    for (let c = 0; c < cols; c++) {
      triRows.push(poly([[x0 + c * s, y], [x0 + (c + 1) * s, y], [x0 + c * s + s / 2, y + h]], "active"));
      triRows.push(poly([[x0 + c * s + s / 2, y + h], [x0 + c * s + (3 * s) / 2, y + h], [x0 + (c + 1) * s, y]], "active"));
    }
    y += h;
  }
  return [
    frame(sqRows, "正方形の列を、すき間をあけて、1列ごとに半分ずらして並べる"),
    frame([...sqRows, ...triRows], "すき間を、正三角形の列で埋める。どの頂点のまわりも、正三角形3つと正方形2つ(3.3.3.4.4)。内角の和 3×60°+2×90°=360°"),
  ];
}

// ---------------------------------------------------------------------------
// 対称性
// ---------------------------------------------------------------------------

/** 立方体を、4回軸・3回軸・2回軸の向きから見た図(辺を平行投影)。 */
export function polyhedralSymmetrySteps(): ShapeFrame[] {
  const hull = solidHull("cube");
  const view = (axis: [number, number, number]): Pt[][] => {
    const len = Math.hypot(...axis);
    const z: [number, number, number] = [axis[0] / len, axis[1] / len, axis[2] / len];
    const helper: [number, number, number] = Math.abs(z[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const u: [number, number, number] = [helper[1] * z[2] - helper[2] * z[1], helper[2] * z[0] - helper[0] * z[2], helper[0] * z[1] - helper[1] * z[0]];
    const ul = Math.hypot(...u);
    const ux: [number, number, number] = [u[0] / ul, u[1] / ul, u[2] / ul];
    const vy: [number, number, number] = [z[1] * ux[2] - z[2] * ux[1], z[2] * ux[0] - z[0] * ux[2], z[0] * ux[1] - z[1] * ux[0]];
    const proj = (p: [number, number, number]): Pt => [50 + 38 * (p[0] * ux[0] + p[1] * ux[1] + p[2] * ux[2]), 50 - 38 * (p[0] * vy[0] + p[1] * vy[1] + p[2] * vy[2])];
    return hull.edges.map(([a, b]) => [proj(hull.vertices[a]), proj(hull.vertices[b])]);
  };
  const make = (axis: [number, number, number], n: number, text: string): ShapeFrame =>
    frame([...view(axis).map(([a, b]) => line(a, b, "final")), dot([50, 50], "active", 1.8), label(6, 10, `${n}回対称`)], text);
  return [
    make([0, 0, 1], 4, "立方体を、面の中心を通る軸の向き(4回軸)から見ると、正方形。90°回すと、元と重なる(軸は3本)"),
    make([1, 1, 1], 3, "頂点を通る軸の向き(3回軸)から見ると、正六角形に見える。120°回すと重なる(軸は4本)"),
    make([1, 1, 0], 2, "辺の中点を通る軸の向き(2回軸)から見ると、長方形に見える。180°回すと重なる(軸は6本)"),
    frame([label(10, 40, "3 本 × (4−1) = 9"), label(10, 52, "4 本 × (3−1) = 8"), label(10, 64, "6 本 × (2−1) = 6"), label(10, 80, "1 + 9 + 8 + 6 = 24")], "回転の数は、恒等(1)に、各軸の (n−1) 個を足して 1+9+8+6=24。立方体の回転群の位数は24"),
  ];
}

/** ロゼット群: 1つの模様を、回転(C_n)や回転+鏡映(D_n)で増やす。 */
export function rosetteGroupsSteps(): ShapeFrame[] {
  const motif: Pt[] = [[0, -8], [10, -8], [10, -22], [16, -22], [16, -30], [0, -30]];
  const place = (deg: number, mirror: boolean): Pt[] => {
    const rad = (deg * Math.PI) / 180;
    return motif.map(([x, y]) => {
      const mx = mirror ? -x : x;
      return [50 + mx * Math.cos(rad) - y * Math.sin(rad), 50 + mx * Math.sin(rad) + y * Math.cos(rad)] as Pt;
    });
  };
  const make = (n: number, mirror: boolean): ShapeFrame => {
    const els: ShapeElement[] = [];
    for (let k = 0; k < n; k++) {
      els.push(poly(place((360 * k) / n, false), k === 0 ? "active" : "final"));
      if (mirror) els.push(poly(place((360 * k) / n, true), "final"));
    }
    els.push(dot([50, 50], "guide", 1.2));
    return frame(els, mirror ? `D${n}: ${n}回回転 と 鏡映の組み合わせ。模様は ${2 * n} 個(位数 ${2 * n})` : `C${n}: 中心のまわりの ${360 / n}° 回転だけ。模様は ${n} 個(位数 ${n})`);
  };
  return [make(1, false), make(3, false), make(3, true), make(5, true)];
}

/** 雪の結晶: 六回対称と鏡映(D6)で、1本の枝から全体を作る。 */
export function snowflakeSymmetrySteps(): ShapeFrame[] {
  const branch = (deg: number, mirror: boolean): Pt[][] => {
    const rad = (deg * Math.PI) / 180;
    const tf = ([x, y]: Pt): Pt => {
      const mx = mirror ? -x : x;
      return [50 + mx * Math.cos(rad) - y * Math.sin(rad), 50 + mx * Math.sin(rad) + y * Math.cos(rad)];
    };
    // 中心から外へ伸びる幹と、2段の小枝(片側。鏡映側は mirror で)
    const stem: Pt[] = [[0, 0], [0, -40]];
    const sub1: Pt[] = [[0, -16], [9, -26]];
    const sub2: Pt[] = [[0, -28], [7, -35]];
    return [stem, sub1, sub2].map((p) => p.map(tf));
  };
  const paths = (n: number, mirror: boolean): ShapeElement[] => {
    const els: ShapeElement[] = [];
    for (let k = 0; k < n; k++) {
      for (const p of branch((360 * k) / n, false)) els.push(path(p, "final"));
      if (mirror) for (const p of branch((360 * k) / n, true)) els.push(path(p, "final"));
    }
    return els;
  };
  return [
    frame([...branch(0, false).map((p) => path(p, "active"))], "1本の枝(幹と小枝)から始める"),
    frame(paths(6, false), "60° ずつ回して6本に増やす(六回対称。C6)"),
    frame([...paths(6, true), ...Array.from({ length: 6 }, (_, k) => line([50, 50], polar(50, 50, 44, 30 + 60 * k), "guide", true))], "さらに、枝を左右に鏡映して、小枝を両側につける(D6)。結晶は、水分子が六方晶に並ぶので、六回対称になる。ただし、雪の結晶は個々に形が違う"),
  ];
}

export const EXTRA_VISUALIZERS: Record<string, () => ShapeFrame[]> = {
  "truncated-icosahedron": truncatedIcosahedronSteps,
  cuboctahedron: cuboctahedronSteps,
  "archimedean-solids": archimedeanSolidsSteps,
  "dual-polyhedra": dualPolyhedraSteps,
  "solids-of-revolution": solidsOfRevolutionSteps,
  "sphere-volume": sphereVolumeSteps,
  "cavalieri-principle": cavalieriSteps,
  "space-filling": spaceFillingSteps,
  "ceva-theorem": cevaSteps,
  "power-of-a-point": powerOfPointSteps,
  "ptolemy-theorem": ptolemySteps,
  "heron-formula": heronSteps,
  "sierpinski-triangle": sierpinskiTriangleSteps,
  "mandelbrot-set": mandelbrotSteps,
  "levy-c-curve": levyCSteps,
  "apollonian-gasket": apollonianSteps,
  catenary: catenarySteps,
  astroid: astroidSteps,
  lemniscate: lemniscateSteps,
  helix: helixSteps,
  "rhombille-tiling": rhombilleSteps,
  "elongated-triangular-tiling": elongatedTriangularSteps,
  "polyhedral-symmetry": polyhedralSymmetrySteps,
  "rosette-groups": rosetteGroupsSteps,
  "snowflake-symmetry": snowflakeSymmetrySteps,
};

void PHI;
