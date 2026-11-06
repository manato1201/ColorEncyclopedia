import type { ShapeElement, ShapeFrame } from "./base.ts";
import { arcPts, circle, dist, dot, f1, frame, label, lerpPt, line, path, polar, poly, regularPolygon, type Pt } from "./helpers.ts";

/** 作図・定理カテゴリの作図ジェネレータ。定規とコンパスの手順を順に見せる。 */

/** 点Pを、中心Cから見た「polar の向き(真上0°・時計回り)」の角度にして返す。 */
const angleOf = (c: Pt, p: Pt) => (Math.atan2(p[0] - c[0], -(p[1] - c[1])) * 180) / Math.PI;

/** 正五角形の作図。円と、中点・円弧だけで、辺の長さ(=黄金比に関係する長さ)を取り出す。 */
export function pentagonConstructionSteps(): ShapeFrame[] {
  const O: Pt = [50, 52];
  const r = 38;
  const A: Pt = [50, 52 - r];
  const right: Pt = [50 + r, 52];
  const M: Pt = lerpPt(O, right, 0.5);
  const MA = dist(M, A);
  const D: Pt = [M[0] - MA, 52];
  const side = dist(A, D);
  const ring = path(arcPts(O[0], O[1], r, 0, 360, 90), "final");
  const verts = regularPolygon(O[0], O[1], r, 5, 0);
  const aM = angleOf(M, A);
  const arcM = path(arcPts(M[0], M[1], MA, aM, -90, 24), "guide");
  return [
    frame([ring, dot(O, "active"), dot(A, "active"), line(O, A, "guide"), line(O, right, "guide")], "円を描き、中心Oから真上の点Aと、右の点Bへ、互いに直角な2本の半径を引く"),
    frame([ring, dot(O, "guide"), dot(A, "active"), dot(M, "active"), line(O, right, "guide"), line(M, A, "guide", true), label(M[0] - 2, M[1] + 7, "M")], `OBの中点Mを取り、MとAを結ぶ。MAの長さは ${f1(MA)}(=半径×√5/2)`),
    frame([ring, dot(M, "guide"), dot(A, "active"), dot(D, "active"), arcM, line(M, A, "guide", true), label(D[0] - 2, D[1] + 7, "D")], `Mを中心に、半径MAの円弧を描き、Oから左へ伸ばした線との交点をDとする。OD=${f1(dist(O, D))}(=半径÷黄金比)`),
    frame([ring, dot(A, "active"), dot(D, "active"), line(A, D, "active"), label(14, 10, `AD = ${f1(side)}`)], `線分ADの長さ ${f1(side)} が、この円に内接する正五角形の一辺になる`),
    frame([ring, poly(verts, "final"), ...verts.map((v) => dot(v, "active", 1.4))], `コンパスの幅をADにして、Aから順に円周を区切る。5つの点を結ぶと、正五角形が完成する`),
  ];
}

const TRI: [Pt, Pt, Pt] = [[12, 72], [88, 62], [58, 16]];

function triangleCenters() {
  const [A, B, C] = TRI;
  const G: Pt = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
  const d = 2 * (A[0] * (B[1] - C[1]) + B[0] * (C[1] - A[1]) + C[0] * (A[1] - B[1]));
  const ux = ((A[0] ** 2 + A[1] ** 2) * (B[1] - C[1]) + (B[0] ** 2 + B[1] ** 2) * (C[1] - A[1]) + (C[0] ** 2 + C[1] ** 2) * (A[1] - B[1])) / d;
  const uy = ((A[0] ** 2 + A[1] ** 2) * (C[0] - B[0]) + (B[0] ** 2 + B[1] ** 2) * (A[0] - C[0]) + (C[0] ** 2 + C[1] ** 2) * (B[0] - A[0])) / d;
  const O: Pt = [ux, uy];
  const R = dist(O, A);
  const a = dist(B, C);
  const b = dist(C, A);
  const c = dist(A, B);
  const I: Pt = [(a * A[0] + b * B[0] + c * C[0]) / (a + b + c), (a * A[1] + b * B[1] + c * C[1]) / (a + b + c)];
  const s = (a + b + c) / 2;
  const area = Math.abs((B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1])) / 2;
  const inr = area / s;
  const H: Pt = [A[0] + B[0] + C[0] - 2 * O[0], A[1] + B[1] + C[1] - 2 * O[1]];
  return { A, B, C, G, O, R, I, inr, H };
}

const foot = (p: Pt, a: Pt, b: Pt): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
  return [a[0] + dx * t, a[1] + dy * t];
};

/** 三角形の五心(重心・外心・内心・垂心)とオイラー線。 */
export function triangleCentersSteps(): ShapeFrame[] {
  const { A, B, C, G, O, R, I, inr, H } = triangleCenters();
  const tri = poly([A, B, C], "final");
  const mids: Pt[] = [lerpPt(B, C, 0.5), lerpPt(C, A, 0.5), lerpPt(A, B, 0.5)];
  return [
    frame([tri, ...[A, B, C].map((v, i) => line(v, mids[i], "guide")), dot(G, "active", 1.8), label(G[0] + 2, G[1] - 2, "G")], "重心G: 3本の中線(頂点と向かい合う辺の中点を結ぶ線)の交点。どの中線も 2:1 に分ける"),
    frame([tri, path(arcPts(O[0], O[1], R, 0, 360, 90), "guide"), dot(O, "active", 1.8), label(O[0] + 2, O[1] - 2, "O"), ...mids.map((m) => dot(m, "guide", 1))], "外心O: 3辺の垂直二等分線の交点。3つの頂点から等しい距離(外接円の中心)"),
    frame([tri, circle(I[0], I[1], inr, "guide"), dot(I, "active", 1.8), label(I[0] + 2, I[1] - 2, "I")], "内心I: 3つの角の二等分線の交点。3辺から等しい距離(内接円の中心)"),
    frame([tri, line(A, foot(A, B, C), "guide"), line(B, foot(B, C, A), "guide"), line(C, foot(C, A, B), "guide"), dot(H, "active", 1.8), label(H[0] + 2, H[1] - 2, "H")], "垂心H: 3つの頂点から向かい合う辺へ下ろした垂線(高さ)の交点"),
    frame([tri, line(H, O, "active"), dot(G, "active", 1.8), dot(O, "active", 1.8), dot(H, "active", 1.8), label(G[0] + 2, G[1] + 6, "G"), label(O[0] + 2, O[1] - 2, "O"), label(H[0] + 2, H[1] - 2, "H")], "重心G・外心O・垂心Hは一直線上にある(オイラー線)。GはOHを 1:2 に分ける。正三角形ではこの3点が一致する"),
  ];
}

/** 九点円。辺の中点・垂線の足・垂心と頂点の中点の9点が、同じ円の上に並ぶ。 */
export function ninePointCircleSteps(): ShapeFrame[] {
  const { A, B, C, O, R, H } = triangleCenters();
  const tri = poly([A, B, C], "final");
  const mids: Pt[] = [lerpPt(B, C, 0.5), lerpPt(C, A, 0.5), lerpPt(A, B, 0.5)];
  const feet: Pt[] = [foot(A, B, C), foot(B, C, A), foot(C, A, B)];
  const hm: Pt[] = [lerpPt(H, A, 0.5), lerpPt(H, B, 0.5), lerpPt(H, C, 0.5)];
  const N: Pt = lerpPt(O, H, 0.5);
  const ring = path(arcPts(N[0], N[1], R / 2, 0, 360, 72), "guide");
  const pts = (list: Pt[], state: "active" | "final") => list.map((p) => dot(p, state, 1.6));
  return [
    frame([tri, ...pts(mids, "active")], "3辺の中点(3点)を取る"),
    frame([tri, ...pts(mids, "final"), ...feet.map((f, i) => line([A, B, C][i], f, "guide")), ...pts(feet, "active")], "各頂点から向かい合う辺へ下ろした垂線の足(3点)を取る"),
    frame([tri, ...pts(mids, "final"), ...pts(feet, "final"), dot(H, "guide", 1.4), ...pts(hm, "active")], "垂心Hと各頂点を結ぶ線分の中点(3点)を取る"),
    frame([tri, ring, ...pts(mids, "final"), ...pts(feet, "final"), ...pts(hm, "final"), dot(N, "active", 1.8)], `9つの点が、すべて同じ円の上に乗る(九点円)。半径は外接円の半分(${f1(R / 2)})で、中心はOとHの中点`),
  ];
}

/** 円周角の定理。同じ弧に対する円周角は等しく、中心角の半分。 */
export function inscribedAngleSteps(): ShapeFrame[] {
  const O: Pt = [50, 54];
  const r = 36;
  const a0 = 215;
  const a1 = 325;
  const A = polar(O[0], O[1], r, a0);
  const B = polar(O[0], O[1], r, a1);
  const ring = path(arcPts(O[0], O[1], r, 0, 360, 90), "final");
  const central = a1 - a0;
  const at = (deg: number) => polar(O[0], O[1], r, deg);
  const withP = (deg: number, state: "active" | "final" = "active"): ShapeElement[] => {
    const P = at(deg);
    return [line(A, P, state), line(B, P, state), dot(P, state, 1.6)];
  };
  return [
    frame([ring, line(O, A, "guide"), line(O, B, "guide"), dot(O, "guide")], `円の弧ABを選ぶ。中心Oから見た角(中心角)は ${central}°`),
    frame([ring, line(O, A, "guide"), line(O, B, "guide"), ...withP(90)], `円周上の点Pから見た角APB(円周角)は ${central / 2}°。中心角の半分`),
    frame([ring, line(O, A, "guide"), line(O, B, "guide"), ...withP(90, "final"), ...withP(40), ...withP(145, "final")], `Pを同じ側の円周上で動かしても、角APBはずっと ${central / 2}°のまま(同じ弧に対する円周角は等しい)`),
  ];
}

/** タレスの定理。直径を見込む円周角は直角。 */
export function thalesTheoremSteps(): ShapeFrame[] {
  const O: Pt = [50, 55];
  const r = 38;
  const A: Pt = [O[0] - r, O[1]];
  const B: Pt = [O[0] + r, O[1]];
  const ring = path(arcPts(O[0], O[1], r, 0, 360, 90), "final");
  const diameter = line(A, B, "guide");
  const withC = (deg: number): ShapeElement[] => {
    const C = polar(O[0], O[1], r, deg);
    const u: Pt = [(A[0] - C[0]) / dist(A, C), (A[1] - C[1]) / dist(A, C)];
    const v: Pt = [(B[0] - C[0]) / dist(B, C), (B[1] - C[1]) / dist(B, C)];
    const k = 5;
    const mark = path([[C[0] + u[0] * k, C[1] + u[1] * k], [C[0] + (u[0] + v[0]) * k, C[1] + (u[1] + v[1]) * k], [C[0] + v[0] * k, C[1] + v[1] * k]], "active");
    return [line(A, C, "active"), line(B, C, "active"), dot(C, "active", 1.6), mark];
  };
  return [
    frame([ring, diameter, dot(A, "active"), dot(B, "active"), label(A[0] - 2, A[1] + 7, "A"), label(B[0] - 2, B[1] + 7, "B")], "円の直径ABを引く"),
    frame([ring, diameter, ...withC(20)], "円周上の点Cを取り、AとBに結ぶ。角ACBは直角(印)になる"),
    frame([ring, diameter, ...withC(310)], "Cを別の位置に動かしても、角ACBはやはり直角"),
    frame([ring, diameter, ...withC(70)], "直径に対する円周角は、中心角が180°なので、その半分の90°。円周上のどこに取っても変わらない"),
  ];
}

/** 基本作図: 垂直二等分線と角の二等分線。 */
export function basicConstructionsSteps(): ShapeFrame[] {
  const A: Pt = [14, 70];
  const B: Pt = [58, 70];
  const mid = lerpPt(A, B, 0.5);
  const rad = 32;
  const h = Math.sqrt(rad * rad - ((B[0] - A[0]) / 2) ** 2);
  const P: Pt = [mid[0], mid[1] - h];
  const Q: Pt = [mid[0], mid[1] + h];
  // 角の二等分線: 頂点O、辺の向きは 10° と 70°(polar 基準)
  const O: Pt = [40, 90];
  const arcR = 22;
  const p1 = polar(O[0], O[1], arcR, 15);
  const p2 = polar(O[0], O[1], arcR, 75);
  const bis = (deg: number) => polar(O[0], O[1], 46, deg);
  return [
    frame([line(A, B, "final"), dot(A, "active"), dot(B, "active")], "垂直二等分線: 線分ABを用意する"),
    frame([line(A, B, "final"), path(arcPts(A[0], A[1], rad, 30, 150, 20), "guide"), path(arcPts(B[0], B[1], rad, -150, -30, 20), "guide"), dot(P, "active"), dot(Q, "active")], "AとBを中心に、ABの半分より長い同じ半径の円弧を描く。上下の交点が2つできる"),
    frame([line(A, B, "final"), dot(P, "active"), dot(Q, "active"), line(P, Q, "active"), dot(mid, "final")], "2つの交点を結ぶ。この直線は、ABの中点を通り、ABに垂直(垂直二等分線)"),
    frame([line(O, polar(O[0], O[1], 46, 15), "final"), line(O, polar(O[0], O[1], 46, 75), "final"), path(arcPts(O[0], O[1], arcR, 15, 75, 20), "guide"), dot(p1, "active"), dot(p2, "active")], "角の二等分線: 頂点Oを中心に円弧を描き、2辺との交点を取る"),
    frame([line(O, polar(O[0], O[1], 46, 15), "final"), line(O, polar(O[0], O[1], 46, 75), "final"), dot(p1, "final"), dot(p2, "final"), line(O, bis(45), "active"), dot(polar(O[0], O[1], 34, 45), "active")], "2つの交点を中心に、同じ半径の円弧を描いて交点を取り、Oと結ぶ。この直線が角を2等分する(2つの角が等しい)"),
  ];
}

export const CONSTRUCTION_VISUALIZERS: Record<string, () => ShapeFrame[]> = {
  "pentagon-construction": pentagonConstructionSteps,
  "triangle-centers": triangleCentersSteps,
  "nine-point-circle": ninePointCircleSteps,
  "inscribed-angle": inscribedAngleSteps,
  "thales-theorem": thalesTheoremSteps,
  "basic-constructions": basicConstructionsSteps,
};
