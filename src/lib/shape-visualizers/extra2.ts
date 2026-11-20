import type { ShapeElement, ShapeFrame } from "./base.ts";
import { circle, circlePts, dist, dot, f1, f3, fitTransform, frame, label, line, mid, path, poly, polar, rect, type Pt } from "./helpers.ts";

/**
 * 第3弾で追加した図形(作図・定理・曲線・平面充填・立体・対称性・フラクタル)の作図ジェネレータ。
 * 座標は 0〜100 の正方形(y は下向き)。数値は座標から計算した値を説明文に出す。
 */

const lerp2 = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const centroid = (pts: Pt[]): Pt => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
const deg2rad = (d: number) => (d * Math.PI) / 180;

/** 点 P から、直線 AB へ下ろした垂線の足。 */
function foot(P: Pt, A: Pt, B: Pt): Pt {
  const dx = B[0] - A[0];
  const dy = B[1] - A[1];
  const t = ((P[0] - A[0]) * dx + (P[1] - A[1]) * dy) / (dx * dx + dy * dy);
  return [A[0] + dx * t, A[1] + dy * t];
}

// ---------------------------------------------------------------------------
// 作図・定理
// ---------------------------------------------------------------------------

/** メネラウスの定理: 1本の直線が3辺(またはその延長)を切る点について、辺の比の積が1。 */
export function menelausSteps(): ShapeFrame[] {
  const A: Pt = [46, 10];
  const B: Pt = [84, 84];
  const C: Pt = [24, 84];
  const tri = poly([A, B, C], "guide");
  const frames: ShapeFrame[] = [frame([poly([A, B, C], "final"), label(44, 7, "A"), label(86, 90, "B"), label(18, 90, "C")], "三角形 ABC。1本の直線が、3つの辺(またはその延長)と、D・E・F で交わる")];
  for (const [a, b] of [
    [0.5, 0.5],
    [3, 3],
  ]) {
    // F: AB 上で AF/FB=a、E: CA 上で CE/EA=b。D は直線 EF と直線 BC の交点
    const F = lerp2(A, B, a / (1 + a));
    const E = lerp2(C, A, b / (1 + b));
    const dx = F[0] - E[0];
    const dy = F[1] - E[1];
    const t = (84 - E[1]) / dy;
    const D: Pt = [E[0] + dx * t, 84];
    const r1 = dist(B, D) / dist(D, C);
    const r2 = dist(C, E) / dist(E, A);
    const r3 = dist(A, F) / dist(F, B);
    // D から E・F を通って、少し先まで延ばす
    const far1: Pt = lerp2(D, E[1] < F[1] ? E : F, 1.25);
    const far2: Pt = D;
    frames.push(
      frame(
        [tri, line(far1, far2, "active"), line(C, D, "guide", true), dot(D, "final", 1.6), dot(E, "final", 1.6), dot(F, "final", 1.6), label(D[0] - 2, D[1] + 6, "D"), label(E[0] - 5, E[1], "E"), label(F[0] + 2, F[1], "F")],
        `BD/DC=${f3(r1)}、CE/EA=${f3(r2)}、AF/FB=${f3(r3)}。積は ${f3(r1 * r2 * r3)}(=1)。D は辺 BC の延長上にある`,
      ),
    );
  }
  return frames;
}

/** 余弦定理: c²=a²+b²−2ab·cosC。C=90° で三平方の定理。 */
export function lawOfCosinesSteps(): ShapeFrame[] {
  const C: Pt = [30, 72];
  const a = 50;
  const b = 36;
  const B: Pt = [C[0] + a, C[1]];
  const frames: ShapeFrame[] = [];
  for (const g of [60, 90, 120]) {
    const A: Pt = [C[0] + b * Math.cos(deg2rad(g)), C[1] - b * Math.sin(deg2rad(g))];
    const c2 = (a * a + b * b - 2 * a * b * Math.cos(deg2rad(g))) / 100;
    const cDist = dist(A, B) / 10;
    frames.push(
      frame(
        [poly([A, B, C], "final"), label(A[0] - 2, A[1] - 3, "A"), label(B[0] + 1, B[1] + 5, "B"), label(C[0] - 4, C[1] + 5, "C"), label(46, 80, "a"), label(C[0] + b * 0.4 * Math.cos(deg2rad(g)) - 4, C[1] - b * 0.5 * Math.sin(deg2rad(g)), "b")],
        `C=${g}°。a=${f1(a / 10)}、b=${f1(b / 10)} のとき、c²=${f1(a / 10)}²+${f1(b / 10)}²−2×${f1(a / 10)}×${f1(b / 10)}×cos${g}°=${f1(c2)}。作図した辺の長さ c=${f1(cDist)} の2乗(${f1(cDist * cDist)})と一致する${g === 90 ? "(C=90° は三平方の定理)" : ""}`,
      ),
    );
  }
  return frames;
}

/** シムソン線: 外接円上の点から3辺へ下ろした垂線の足は、一直線上に並ぶ。 */
export function simsonLineSteps(): ShapeFrame[] {
  const O: Pt = [50, 50];
  const R = 38;
  const A = polar(O[0], O[1], R, 0);
  const B = polar(O[0], O[1], R, 130);
  const C = polar(O[0], O[1], R, 235);
  const make = (deg: number, text: string): ShapeFrame => {
    const P = polar(O[0], O[1], R, deg);
    const f1p = foot(P, B, C);
    const f2p = foot(P, C, A);
    const f3p = foot(P, A, B);
    const cross = (f2p[0] - f1p[0]) * (f3p[1] - f1p[1]) - (f2p[1] - f1p[1]) * (f3p[0] - f1p[0]);
    return frame(
      [
        circle(O[0], O[1], R, "guide"),
        poly([A, B, C], "final"),
        line(P, f1p, "guide", true),
        line(P, f2p, "guide", true),
        line(P, f3p, "guide", true),
        dot(P, "active", 1.8),
        dot(f1p, "final", 1.4),
        dot(f2p, "final", 1.4),
        dot(f3p, "final", 1.4),
        line(f1p, f2p, "active"),
        line(f2p, f3p, "active"),
        label(P[0] + 2, P[1] - 2, "P"),
      ],
      `${text}。3つの垂線の足は一直線上にある(3点がつくる三角形の面積の目安: ${f3(Math.abs(cross) / 2)}≒0)`,
    );
  };
  return [
    frame([circle(O[0], O[1], R, "guide"), poly([A, B, C], "final"), label(A[0] + 2, A[1] - 2, "A"), label(B[0] + 2, B[1] + 5, "B"), label(C[0] - 6, C[1] + 5, "C")], "三角形 ABC と、その外接円"),
    make(60, "外接円上の点 P(弧 AB の上)から、3辺(またはその延長)へ垂線を下ろす"),
    make(185, "P を別の位置へ動かしても同じ"),
    make(300, "さらに別の位置。P が外接円の上にあれば、いつでも成り立つ"),
  ];
}

/** ナポレオンの定理: 各辺の外側に正三角形を作り、重心を結ぶと正三角形。 */
export function napoleonSteps(): ShapeFrame[] {
  const A0: Pt = [30, 58];
  const B0: Pt = [72, 64];
  const C0: Pt = [44, 30];
  const sign = (P: Pt, Q: Pt, R: Pt) => (Q[0] - P[0]) * (R[1] - P[1]) - (Q[1] - P[1]) * (R[0] - P[0]);
  const apex = (P: Pt, Q: Pt, third: Pt): Pt => {
    const m = mid(P, Q);
    const h = (Math.sqrt(3) / 2) * dist(P, Q);
    const nx = -(Q[1] - P[1]) / dist(P, Q);
    const ny = (Q[0] - P[0]) / dist(P, Q);
    const s = sign(P, Q, third) > 0 ? -1 : 1;
    return [m[0] + s * nx * h, m[1] + s * ny * h];
  };
  const Ap = apex(B0, C0, A0);
  const Bp = apex(C0, A0, B0);
  const Cp = apex(A0, B0, C0);
  const cA = centroid([B0, C0, Ap]);
  const cB = centroid([C0, A0, Bp]);
  const cC = centroid([A0, B0, Cp]);
  const all = [A0, B0, C0, Ap, Bp, Cp, cA, cB, cC];
  const tf = fitTransform(all, 9);
  const T = (pts: Pt[]) => pts.map(tf);
  const [A, B, C, A2, B2, C2, g1, g2, g3] = all.map(tf);
  const sides = [dist(g1, g2), dist(g2, g3), dist(g3, g1)];
  return [
    frame([poly(T([A0, B0, C0]), "final")], "もとの三角形 ABC(どんな形でもよい)"),
    frame([poly(T([A0, B0, C0]), "final"), poly([B, C, A2], "guide"), poly([C, A, B2], "guide"), poly([A, B, C2], "guide")], "各辺の外側に、その辺を一辺とする正三角形を作る"),
    frame(
      [poly([A, B, C], "guide"), poly([B, C, A2], "guide"), poly([C, A, B2], "guide"), poly([A, B, C2], "guide"), dot(g1, "final", 1.6), dot(g2, "final", 1.6), dot(g3, "final", 1.6), poly([g1, g2, g3], "active")],
      `3つの正三角形の重心を結ぶと、正三角形ができる。3辺の長さは ${f1(sides[0])}・${f1(sides[1])}・${f1(sides[2])} で、等しい`,
    ),
  ];
}

/** ヴァリニョンの平行四辺形: 四角形の辺の中点を結ぶと平行四辺形。面積は半分。 */
export function varignonSteps(): ShapeFrame[] {
  const A: Pt = [14, 70];
  const B: Pt = [66, 88];
  const C: Pt = [90, 36];
  const D: Pt = [32, 12];
  const M = [mid(A, B), mid(B, C), mid(C, D), mid(D, A)];
  const area = (pts: Pt[]) => Math.abs(pts.reduce((s, p, i) => s + (p[0] * pts[(i + 1) % pts.length][1] - pts[(i + 1) % pts.length][0] * p[1]), 0)) / 2;
  const ratio = area(M) / area([A, B, C, D]);
  return [
    frame([poly([A, B, C, D], "final")], "任意の四角形 ABCD"),
    frame([poly([A, B, C, D], "guide"), ...M.map((p) => dot(p, "final", 1.6))], "4つの辺の中点を、とる"),
    frame([poly([A, B, C, D], "guide"), poly(M, "active"), ...M.map((p) => dot(p, "final", 1.4))], "中点を順に結ぶと、向かい合う辺が平行な四角形(平行四辺形)になる"),
    frame([poly([A, B, C, D], "guide"), poly(M, "active"), line(A, C, "guide", true), line(B, D, "guide", true)], `辺は対角線に平行で、長さは対角線の半分。面積は、もとの四角形の ${f3(ratio)} 倍(=1/2)`),
  ];
}

/** 角の二等分線の定理: BD:DC=AB:AC。 */
export function angleBisectorSteps(): ShapeFrame[] {
  const make = (A: Pt, B: Pt, C: Pt, intro: string): ShapeFrame[] => {
    const ab = dist(A, B);
    const ac = dist(A, C);
    const D = lerp2(B, C, ab / (ab + ac));
    const bd = dist(B, D);
    const dc = dist(D, C);
    return [
      frame([poly([A, B, C], "final"), label(A[0] - 2, A[1] - 3, "A"), label(B[0] - 4, B[1] + 5, "B"), label(C[0] + 1, C[1] + 5, "C")], intro),
      frame([poly([A, B, C], "guide"), line(A, D, "active"), dot(D, "final", 1.6), label(D[0], D[1] + 5, "D")], "角 A の二等分線を引き、辺 BC との交点を D とする"),
      frame([poly([A, B, C], "guide"), line(A, D, "active"), dot(D, "final", 1.6)], `AB=${f1(ab / 10)}、AC=${f1(ac / 10)}、BD=${f1(bd / 10)}、DC=${f1(dc / 10)}。BD/DC=${f3(bd / dc)}、AB/AC=${f3(ab / ac)}。2つの比が等しい`),
    ];
  };
  return [
    ...make([30, 15], [12, 82], [92, 82], "三角形 ABC(AB と AC の長さが違う)"),
    ...make([66, 14], [10, 82], [90, 82], "別の三角形でも、同じ関係が成り立つ").slice(1),
  ];
}

// ---------------------------------------------------------------------------
// 曲線
// ---------------------------------------------------------------------------

/** 双曲線: 2つの焦点からの距離の差が一定。 */
export function hyperbolaSteps(): ShapeFrame[] {
  const cx = 50;
  const cy = 50;
  const a = 16;
  const b = 12;
  const c = Math.sqrt(a * a + b * b);
  const right: Pt[] = [];
  const left: Pt[] = [];
  for (let i = 0; i <= 60; i++) {
    const t = -1.4 + (2.8 * i) / 60;
    right.push([cx + a * Math.cosh(t), cy + b * Math.sinh(t)]);
    left.push([cx - a * Math.cosh(t), cy + b * Math.sinh(t)]);
  }
  const F1: Pt = [cx - c, cy];
  const F2: Pt = [cx + c, cy];
  const axes = [line([6, cy], [94, cy], "guide", true), line([cx, 8], [cx, 92], "guide", true)];
  const asym = [line([cx - 44, cy - (b / a) * 44], [cx + 44, cy + (b / a) * 44], "guide", true), line([cx - 44, cy + (b / a) * 44], [cx + 44, cy - (b / a) * 44], "guide", true)];
  const withPoint = (t: number): ShapeFrame => {
    const P: Pt = [cx + a * Math.cosh(t), cy + b * Math.sinh(t)];
    const d1 = dist(P, F1);
    const d2 = dist(P, F2);
    return frame([...axes, path(right, "final"), path(left, "final"), dot(F1, "active", 1.6), dot(F2, "active", 1.6), dot(P, "final", 1.8), line(P, F1, "active"), line(P, F2, "active")], `曲線上の点 P。焦点までの距離は ${f1(d1)} と ${f1(d2)}。その差は ${f1(Math.abs(d1 - d2))}(=2a=${f1(2 * a)})`);
  };
  return [
    frame([...axes, dot(F1, "active", 1.6), dot(F2, "active", 1.6), dot([cx - a, cy], "final", 1.4), dot([cx + a, cy], "final", 1.4)], `2つの焦点(±c、c²=a²+b²=${f1(c * c)})と、頂点(±a)`),
    withPoint(0.9),
    withPoint(-0.4),
    frame([...axes, ...asym, path(right, "final"), path(left, "final")], "遠くへいくほど、曲線は2本の直線(漸近線 y=±(b/a)x)に近づくが、交わらない"),
  ];
}

/** 対数螺旋: r=a·e^(bθ)。1回転ごとに一定倍。 */
export function logarithmicSpiralSteps(): ShapeFrame[] {
  const a0 = 3;
  const b = 0.2;
  const spiral = (turns: number): Pt[] => {
    const pts: Pt[] = [];
    const n = Math.round(turns * 72);
    for (let i = 0; i <= n; i++) {
      const th = (turns * 2 * Math.PI * i) / n;
      pts.push(polar(50, 50, a0 * Math.exp(b * th), (th * 180) / Math.PI));
    }
    return pts;
  };
  const rAt = (turn: number) => a0 * Math.exp(b * turn * 2 * Math.PI);
  const ratio = Math.exp(b * 2 * Math.PI);
  return [
    frame([path(spiral(1), "active"), dot([50, 50], "final", 1.2)], `r=${a0}·e^(${b}θ) を1回転ぶん描く。中心からの距離は ${f1(a0)} から ${f1(rAt(1))} へ`),
    frame([path(spiral(2), "active"), dot([50, 50], "final", 1.2)], `2回転目。距離は ${f1(rAt(2))} へ。1回転ごとの倍率は ${f1(ratio)} 倍`),
    frame(
      [path(spiral(2), "final"), line([50, 50], polar(50, 50, rAt(0), 0), "guide", true), line([50, 50], polar(50, 50, rAt(1), 0), "guide", true), line([50, 50], polar(50, 50, rAt(2), 0), "guide", true)],
      `真上への半直線との交点は、中心から ${f1(rAt(0))}・${f1(rAt(1))}・${f1(rAt(2))}。隣どうしの比が、いつも ${f1(ratio)} 倍(間隔ではなく倍率が一定)`,
    ),
  ];
}

/** 円のインボリュート: 円に巻いた糸をほどくときの端の軌跡。 */
export function involuteSteps(): ShapeFrame[] {
  const r = 6;
  const P = (t: number): Pt => [50 + r * (Math.cos(t) + t * Math.sin(t)), 50 - r * (Math.sin(t) - t * Math.cos(t))];
  const trace = (tEnd: number): Pt[] => Array.from({ length: 81 }, (_, i) => P((tEnd * i) / 80));
  const T = (t: number): Pt => [50 + r * Math.cos(t), 50 - r * Math.sin(t)];
  const step = (t: number, text: string): ShapeFrame =>
    frame([circle(50, 50, r, "guide"), path(trace(t), "final"), line(T(t), P(t), "active"), dot(T(t), "active", 1.2), dot(P(t), "final", 1.6)], `${text}。糸の長さ(接点から端まで)は ${f1(dist(T(t), P(t)))}、r×t=${f1(r * t)}`);
  return [
    frame([circle(50, 50, r, "final"), dot(P(0), "final", 1.6)], `半径 ${r} の円に、糸を巻きつけ、端を円周上に置く`),
    step(1.5, "糸をぴんと張ったまま、1.5 ラジアン(約86°)ほどいた"),
    step(3.5, "さらにほどいた(3.5 ラジアン)。端は、円から離れていく"),
    step(6.2, "ほぼ1周ほどいた。糸はいつも円の接線の方向を向く"),
  ];
}

/** デルトイド: 半径3rの円の内側を、半径rの円が転がるときの軌跡。 */
export function deltoidSteps(): ShapeFrame[] {
  const r = 13;
  const R = 3 * r;
  const P = (t: number): Pt => [50 + 2 * r * Math.cos(t) + r * Math.cos(2 * t), 50 + 2 * r * Math.sin(t) - r * Math.sin(2 * t)];
  const trace = (tEnd: number): Pt[] => Array.from({ length: 91 }, (_, i) => P((tEnd * i) / 90));
  const step = (t: number, text: string): ShapeFrame => {
    const center: Pt = [50 + 2 * r * Math.cos(t), 50 + 2 * r * Math.sin(t)];
    return frame([circle(50, 50, R, "guide"), circle(center[0], center[1], r, "idle"), path(trace(t), "final"), dot(P(t), "active", 1.8), line(center, P(t), "guide", true)], text);
  };
  return [
    frame([circle(50, 50, R, "guide"), circle(50 + 2 * r, 50, r, "idle"), dot(P(0), "active", 1.8)], `半径 ${R}(=3r)の円の内側に、半径 ${r}(=r)の円を置く。小さい円の円周上の点を追う`),
    step((2 * Math.PI) / 3, "小さい円を、滑らずに転がす。1/3周で、点は最初の尖点から次の尖点へ着く"),
    step((4 * Math.PI) / 3, "さらに転がすと、2つ目の尖点へ"),
    frame([circle(50, 50, R, "guide"), path(trace(2 * Math.PI), "final")], `1周すると閉じる。尖点は3つ。長さは 16r=${16 * r}、囲む面積は 2πr²=${f1(2 * Math.PI * r * r)}`),
  ];
}

// ---------------------------------------------------------------------------
// 立体(ワイヤーフレーム)
// ---------------------------------------------------------------------------

type V3 = [number, number, number];

/** 3次元の点を、真上から少し傾けた向きで、0〜100 の平面に投影する(平行投影)。 */
function project(v: V3, scale: number, yaw = 30, pitch = 22): Pt {
  const cy = Math.cos(deg2rad(yaw));
  const sy = Math.sin(deg2rad(yaw));
  const cp = Math.cos(deg2rad(pitch));
  const sp = Math.sin(deg2rad(pitch));
  const x1 = v[0] * cy + v[2] * sy;
  const z1 = -v[0] * sy + v[2] * cy;
  const y2 = v[1] * cp - z1 * sp;
  return [50 + x1 * scale, 50 - y2 * scale];
}

function edgesByDistance(vs: V3[], d: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < vs.length; i++) {
    for (let j = i + 1; j < vs.length; j++) {
      const dd = Math.hypot(vs[i][0] - vs[j][0], vs[i][1] - vs[j][1], vs[i][2] - vs[j][2]);
      if (Math.abs(dd - d) < 1e-6) out.push([i, j]);
    }
  }
  return out;
}

/** 菱形十二面体: 立方体の各面に四角錐を貼った形。 */
export function rhombicDodecahedronSteps(): ShapeFrame[] {
  const s = 17;
  const cube: V3[] = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) cube.push([x, y, z]);
  const apexes: V3[] = [[2, 0, 0], [-2, 0, 0], [0, 2, 0], [0, -2, 0], [0, 0, 2], [0, 0, -2]];
  const cubeEdges = edgesByDistance(cube, 2);
  const proj = (v: V3) => project(v, s);
  const cubeLines = (state: "final" | "guide", dashed = false) => cubeEdges.map(([i, j]) => line(proj(cube[i]), proj(cube[j]), state, dashed));
  const apexLines: ShapeElement[] = [];
  const rdEdges: ShapeElement[] = [];
  for (const ap of apexes) {
    for (const cv of cube) {
      // 頂点(±2,0,0)などは、同じ側の立方体の頂点4つと結ぶ
      const axis = ap[0] !== 0 ? 0 : ap[1] !== 0 ? 1 : 2;
      if (cv[axis] === ap[axis] / 2) {
        apexLines.push(line(proj(ap), proj(cv), "active"));
        rdEdges.push(line(proj(ap), proj(cv), "final"));
      }
    }
  }
  return [
    frame(cubeLines("final"), "立方体(正方形6枚・頂点8・辺12)から始める"),
    frame([...cubeLines("guide", true), ...apexLines, ...apexes.map((p) => dot(proj(p), "final", 1.4))], "6つの面それぞれに、四角錐を貼る(頂点を面の外へ、辺の長さの半分だけ持ち上げる)"),
    frame(rdEdges, "もとの立方体の辺を消すと、菱形12枚の多面体になる。頂点 8+6=14、辺 4×6=24、面12。V−E+F=14−24+12=2"),
  ];
}

/** 切頂八面体: 正八面体の頂点を切り落とした立体。 */
export function truncatedOctahedronSteps(): ShapeFrame[] {
  const s = 11;
  const proj = (v: V3) => project(v, s);
  const oct: V3[] = [[3, 0, 0], [-3, 0, 0], [0, 3, 0], [0, -3, 0], [0, 0, 3], [0, 0, -3]];
  const octEdges = edgesByDistance(oct, Math.sqrt(18));
  const perms: V3[] = [];
  const base = [0, 1, 2];
  const permute = (arr: number[]): number[][] => (arr.length <= 1 ? [arr] : arr.flatMap((x, i) => permute([...arr.slice(0, i), ...arr.slice(i + 1)]).map((p) => [x, ...p])));
  for (const p of permute(base)) {
    for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) {
      // 値 1 に s1、値 2 に s2 の符号をつける(値 0 は符号なし)
      const sg = (x: number) => (x === 1 ? s1 : x === 2 ? s2 : 1);
      const v: V3 = [p[0] * sg(p[0]), p[1] * sg(p[1]), p[2] * sg(p[2])];
      // 0 は符号を持たないので、重複を除く
      if (!perms.some((q) => q[0] === v[0] && q[1] === v[1] && q[2] === v[2])) perms.push(v);
    }
  }
  const edges = edgesByDistance(perms, Math.SQRT2);
  return [
    frame(octEdges.map(([i, j]) => line(proj(oct[i]), proj(oct[j]), "final")), "正八面体(正三角形8枚・頂点6・辺12)から始める"),
    frame([...octEdges.map(([i, j]) => line(proj(oct[i]), proj(oct[j]), "guide", true)), ...perms.map((p) => dot(proj(p), "active", 1.2))], "各辺の 1/3 のところに印をつける(24 か所)。この印で、6つの頂点を切り落とす"),
    frame(edges.map(([i, j]) => line(proj(perms[i]), proj(perms[j]), "final")), `切り口に正方形6枚、もとの面は正六角形8枚になる。頂点 ${perms.length}、辺 ${edges.length}、面 14。V−E+F=${perms.length}−${edges.length}+14=${perms.length - edges.length + 14}`),
  ];
}

/** トーラス: 円を、軸のまわりに回してできるドーナツ形。 */
export function torusSteps(): ShapeFrame[] {
  const R = 22;
  const r = 9;
  const el = 62;
  const pt = (u: number, v: number): Pt => {
    const x = (R + r * Math.cos(v)) * Math.cos(u);
    const y = (R + r * Math.cos(v)) * Math.sin(u);
    const z = r * Math.sin(v);
    return [50 + x, 50 - (y * Math.sin(deg2rad(el)) + z * Math.cos(deg2rad(el)))];
  };
  const meridian = (u: number): Pt[] => Array.from({ length: 33 }, (_, i) => pt(u, (2 * Math.PI * i) / 32));
  const parallel = (v: number): Pt[] => Array.from({ length: 65 }, (_, i) => pt((2 * Math.PI * i) / 64, v));
  const meridians = (n: number, state: "final" | "guide") => Array.from({ length: n }, (_, k) => path(meridian((2 * Math.PI * k) / n), state));
  const parallels = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((v) => path(parallel(v), "guide"));
  return [
    frame([...meridians(1, "final"), ...parallels.slice(0, 0)], `輪の中心から管の中心までの距離 R=${R}、管の断面の円の半径 r=${r}。この円(断面)を、軸のまわりに回す`),
    frame([...meridians(12, "final")], "断面の円を、軸のまわりに少しずつ回して並べる。回転でできる輪の列"),
    frame([...meridians(12, "guide"), ...parallels.map((p) => p), path(parallel(Math.PI / 2), "final")], `輪を、なめらかにつなぐと、ドーナツ形になる。体積 2π²Rr²=${f1(2 * Math.PI * Math.PI * R * r * r)}、表面積 4π²Rr=${f1(4 * Math.PI * Math.PI * R * r)}(この図の単位)`),
  ];
}

// ---------------------------------------------------------------------------
// 対称性・フラクタル
// ---------------------------------------------------------------------------

/** キラリティ: 鏡像が、回転では重ならない。 */
export function chiralitySteps(): ShapeFrame[] {
  const F: Pt[] = [[0, 0], [1, 0], [1, 2.5], [3, 2.5], [3, 3.5], [1, 3.5], [1, 5], [4, 5], [4, 6], [0, 6]];
  const place = (cx: number, cy: number, f: (p: Pt) => Pt): Pt[] => F.map((p) => {
    const q = f([p[0] - 2, p[1] - 3]);
    return [cx + q[0] * 6, cy + q[1] * 6] as Pt;
  });
  const same = (p: Pt): Pt => p;
  const mirror = (p: Pt): Pt => [-p[0], p[1]];
  const rot180 = (p: Pt): Pt => [-p[0], -p[1]];
    const pentagon = (cx: number, cy: number, flip: boolean): Pt[] => Array.from({ length: 5 }, (_, i) => polar(cx, cy, 14, 72 * i)).map((p) => (flip ? ([2 * cx - p[0], p[1]] as Pt) : p));
  return [
    frame([poly(place(30, 50, same), "final")], "「F」の字。線対称の軸をもたない図形"),
    frame([poly(place(25, 50, same), "final"), poly(place(75, 50, mirror), "active"), line([50, 14], [50, 86], "guide", true)], "鏡に映した形(右)。もとの形(左)と、左右が入れ替わっている"),
    frame([poly(place(25, 50, rot180), "final"), poly(place(75, 50, mirror), "active")], "もとの形を、回しても(図は 180° 回転)、鏡像とは重ならない。このような図形が「キラル」"),
    frame([poly(pentagon(25, 50, false), "final"), poly(pentagon(75, 50, true), "active"), line([50, 14], [50, 86], "guide", true)], "比べて、線対称の図形(正五角形)は、鏡に映しても、もとと同じ形。キラルではない"),
  ];
}

/** メンガーのスポンジ: 前から見た面(シェルピンスキーのカーペット)と、残る立方体の数。 */
export function mengerSpongeSteps(): ShapeFrame[] {
  const carpet = (level: number): ShapeElement[] => {
    const out: ShapeElement[] = [];
    const size = 3 ** level;
    const cell = 76 / size;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        let hole = false;
        let a = i;
        let b = j;
        for (let k = 0; k < level; k++) {
          if (a % 3 === 1 && b % 3 === 1) hole = true;
          a = Math.floor(a / 3);
          b = Math.floor(b / 3);
        }
        if (!hole) out.push(rect(12 + i * cell, 12 + j * cell, cell, cell, level === 3 ? "guide" : "final"));
      }
    }
    return out;
  };
  const text = (n: number) => `${n} 段階。残る小さな立方体は 20^${n}=${20 ** n} 個、体積は (20/27)^${n}=${((20 / 27) ** n).toFixed(3)}`;
  return [
    frame([rect(12, 12, 76, 76, "final")], `0 段階: 立方体(前から見ると正方形)。${text(0)}`),
    frame(carpet(1), `前から見た面の変化(各面の中心と、立方体の中心の計7個を取り除く)。${text(1)}`),
    frame(carpet(2), `残った20個それぞれに、同じ操作をする。前から見ると、シェルピンスキーのカーペットの形。${text(2)}`),
    frame(carpet(3), `さらに繰り返す。${text(3)}。体積は0へ近づき、表面積は増え続ける`),
  ];
}

// ---------------------------------------------------------------------------
// 平面充填(半正則タイリング)
// ---------------------------------------------------------------------------

type Face = { n: number; pts: Pt[] };

/** 一辺1の正n角形(頂点の角度 rotDeg から反時計回り)。 */
function regularFace(cx: number, cy: number, n: number, rotDeg: number): Face {
  const R = 1 / (2 * Math.sin(Math.PI / n));
  return { n, pts: Array.from({ length: n }, (_, k) => [cx + R * Math.cos(deg2rad(rotDeg) + (2 * Math.PI * k) / n), cy + R * Math.sin(deg2rad(rotDeg) + (2 * Math.PI * k) / n)] as Pt) };
}

/** 頂点の集まりから、辺の長さ1の三角形を探す(ほかの多角形には、1辺ずつ隣り合う3頂点がないので、三角形だけが見つかる)。 */
function trianglesFrom(faces: Face[]): Face[] {
  const key = (p: Pt) => `${Math.round(p[0] * 1e4)},${Math.round(p[1] * 1e4)}`;
  const map = new Map<string, Pt>();
  for (const f of faces) for (const p of f.pts) map.set(key(p), p);
  const pts = [...map.values()];
  const nb: number[][] = pts.map(() => []);
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      if (Math.abs(Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) - 1) < 1e-3) {
        nb[i].push(j);
        nb[j].push(i);
      }
    }
  }
  const out: Face[] = [];
  for (let i = 0; i < pts.length; i++) {
    for (const j of nb[i]) {
      if (j <= i) continue;
      for (const k of nb[j]) {
        if (k > j && nb[i].includes(k)) out.push({ n: 3, pts: [pts[i], pts[j], pts[k]] });
      }
    }
  }
  return out;
}

function latticeFaces(spec: { tiling: string }): { faces: Face[]; window: number; center: number } {
  const s3 = Math.sqrt(3);
  const faces: Face[] = [];
  const range = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
  const lat = (L: number, ang: number, i: number, j: number): Pt => [
    i * L * Math.cos(deg2rad(ang)) + j * L * Math.cos(deg2rad(ang + 60)),
    i * L * Math.sin(deg2rad(ang)) + j * L * Math.sin(deg2rad(ang + 60)),
  ];
  switch (spec.tiling) {
    case "snub-square": {
      const d = (1 + s3) / Math.SQRT2;
      for (const i of range.concat([-8, -7, -6, -5, 5, 6, 7, 8])) for (const j of range.concat([-8, -7, -6, -5, 5, 6, 7, 8])) {
        if ((i + j) % 2 !== 0) continue;
        faces.push(regularFace((i * d) / 2, (j * d) / 2, 4, 45 + (Math.abs(i) % 2 === 0 ? 15 : -15)));
      }
      return { faces: [...faces, ...trianglesFrom(faces)], window: 4.4, center: 0 };
    }
    case "snub-hexagonal": {
      const L = Math.sqrt(7);
      const phi = (Math.atan(s3 / 5) * 180) / Math.PI;
      for (const i of range) for (const j of range) {
        const p = lat(L, 0, i, j);
        faces.push(regularFace(p[0], p[1], 6, phi));
      }
      return { faces: [...faces, ...trianglesFrom(faces)], window: 5.2, center: 0 };
    }
    case "truncated-hexagonal": {
      const L = 2 + s3;
      for (const i of range) for (const j of range) {
        const p = lat(L, 0, i, j);
        faces.push(regularFace(p[0], p[1], 12, 15));
      }
      return { faces: [...faces, ...trianglesFrom(faces)], window: 6.2, center: 0 };
    }
    case "rhombitrihexagonal": {
      const L = 1 + s3;
      for (const i of range) for (const j of range) {
        const p = lat(L, 0, i, j);
        faces.push(regularFace(p[0], p[1], 6, 30));
        for (const ang of [0, 60, 120]) {
          const q = lat(L, 0, 1, 0);
          void q;
          const dir: Pt = [Math.cos(deg2rad(ang)) * L, Math.sin(deg2rad(ang)) * L];
          faces.push(regularFace(p[0] + dir[0] / 2, p[1] + dir[1] / 2, 4, ang + 45));
        }
      }
      return { faces: [...faces, ...trianglesFrom(faces)], window: 5.6, center: 0 };
    }
    default: {
      // 4.6.12
      const L = 3 + s3;
      for (const i of range) for (const j of range) {
        const p = lat(L, 0, i, j);
        faces.push(regularFace(p[0], p[1], 12, 15));
        for (const ang of [0, 60, 120]) {
          const dir: Pt = [Math.cos(deg2rad(ang)) * L, Math.sin(deg2rad(ang)) * L];
          faces.push(regularFace(p[0] + dir[0] / 2, p[1] + dir[1] / 2, 4, ang + 45));
        }
        const up = [lat(L, 0, i, j), lat(L, 0, i + 1, j), lat(L, 0, i, j + 1)];
        const down = [lat(L, 0, i + 1, j), lat(L, 0, i, j + 1), lat(L, 0, i + 1, j + 1)];
        for (const t of [up, down]) {
          const c = centroid(t);
          faces.push(regularFace(c[0], c[1], 6, 0));
        }
      }
      return { faces, window: 6.2, center: 0 };
    }
  }
}

const POLY_NAME: Record<number, string> = { 3: "正三角形", 4: "正方形", 6: "正六角形", 12: "正十二角形" };

function tilingSteps(tiling: string, config: string, angleSum: string, focusN: number, focusText: string): ShapeFrame[] {
  const { faces, window } = latticeFaces({ tiling });
  const key = (p: Pt) => `${Math.round(p[0] * 1e3)},${Math.round(p[1] * 1e3)}`;
  const shown = faces.filter((f) => Math.hypot(...centroid(f.pts)) < window);
  // 重複(同じ多角形が2回入る)を除く
  const seen = new Set<string>();
  const uniq = shown.filter((f) => {
    const k = f.pts.map(key).sort().join("|");
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const tf = fitTransform(uniq.flatMap((f) => f.pts), 6);
  const toPoly = (f: Face, state: "final" | "guide" | "active") => poly(f.pts.map(tf), state);
  // 原点にいちばん近い頂点のまわりの多角形
  const allPts = uniq.flatMap((f) => f.pts);
  const v = allPts.reduce((best, p) => (Math.hypot(...p) < Math.hypot(...best) ? p : best), allPts[0]);
  const around = uniq.filter((f) => f.pts.some((p) => Math.hypot(p[0] - v[0], p[1] - v[1]) < 1e-3));
  const counts = new Map<number, number>();
  for (const f of uniq) counts.set(f.n, (counts.get(f.n) ?? 0) + 1);
  const countText = [...counts.entries()].sort((a, b) => a[0] - b[0]).map(([n, c]) => `${POLY_NAME[n]}${c}枚`).join("・");
  const focus = uniq.filter((f) => f.n === focusN).sort((a, b) => Math.hypot(...centroid(a.pts)) - Math.hypot(...centroid(b.pts)))[0];
  return [
    frame(focus ? [toPoly(focus, "active")] : [], focusText),
    frame([...uniq.map((f) => toPoly(f, "guide")), ...around.map((f) => toPoly(f, "active"))], `1つの頂点のまわりに、${config} の順で集まる。角の和は ${angleSum}`),
    frame(uniq.map((f) => toPoly(f, "final")), `全体に広げると、すき間も重なりもなく平面が埋まる(この図: ${countText})`),
  ];
}

export const snubSquareTilingSteps = () => tilingSteps("snub-square", "三角形・三角形・正方形・三角形・正方形(3.3.4.3.4)", "60°+60°+90°+60°+90°=360°", 4, "正方形を、少しずつ傾けて並べる。隣り合う正方形は、頂点で接する");
export const snubHexagonalTilingSteps = () => tilingSteps("snub-hexagonal", "三角形4つ・正六角形(3.3.3.3.6)", "60°×4+120°=360°", 6, "正六角形のまわりを、正三角形が渦を巻くように囲む");
export const truncatedHexagonalTilingSteps = () => tilingSteps("truncated-hexagonal", "三角形・十二角形・十二角形(3.12.12)", "60°+150°+150°=360°", 12, "正十二角形を、辺で隣り合うように並べる(内角150°)");
export const rhombitrihexagonalTilingSteps = () => tilingSteps("rhombitrihexagonal", "三角形・正方形・六角形・正方形(3.4.6.4)", "60°+90°+120°+90°=360°", 6, "正六角形の、6つの辺に、正方形を貼りつける");
export const truncatedTrihexagonalTilingSteps = () => tilingSteps("truncated-trihexagonal", "正方形・正六角形・正十二角形(4.6.12)", "90°+120°+150°=360°", 12, "正十二角形の12の辺に、正方形と正六角形が、交互に接する");

export const EXTRA2_VISUALIZERS: Record<string, () => ShapeFrame[]> = {
  "menelaus-theorem": menelausSteps,
  "law-of-cosines": lawOfCosinesSteps,
  "simson-line": simsonLineSteps,
  "napoleon-theorem": napoleonSteps,
  "varignon-parallelogram": varignonSteps,
  "angle-bisector-theorem": angleBisectorSteps,
  hyperbola: hyperbolaSteps,
  "logarithmic-spiral": logarithmicSpiralSteps,
  "involute-of-circle": involuteSteps,
  deltoid: deltoidSteps,
  "rhombic-dodecahedron": rhombicDodecahedronSteps,
  "truncated-octahedron": truncatedOctahedronSteps,
  torus: torusSteps,
  chirality: chiralitySteps,
  "menger-sponge": mengerSpongeSteps,
  "snub-square-tiling": snubSquareTilingSteps,
  "snub-hexagonal-tiling": snubHexagonalTilingSteps,
  "truncated-hexagonal-tiling": truncatedHexagonalTilingSteps,
  "rhombitrihexagonal-tiling": rhombitrihexagonalTilingSteps,
  "truncated-trihexagonal-tiling": truncatedTrihexagonalTilingSteps,
};

void circlePts;
