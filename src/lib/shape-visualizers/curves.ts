import type { ShapeElement, ShapeFrame } from "./base.ts";
import { circle, dot, f1, fitTransform, frame, label, lerpPt, line, path, type Pt } from "./helpers.ts";

/** 曲線カテゴリの作図ジェネレータ。パラメータを少しずつ進めた段階を見せる。 */

const sample = (n: number, from: number, to: number, fn: (t: number) => Pt): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => fn(from + ((to - from) * i) / n));

/** アルキメデスの螺旋 r=aθ。1周ごとの間隔が一定。 */
export function archimedeanSpiralSteps(): ShapeFrame[] {
  const a = 44 / (6 * Math.PI);
  const pts = (turns: number) => sample(60 * turns, 0, 2 * Math.PI * turns, (t) => [50 + a * t * Math.cos(t), 50 - a * t * Math.sin(t)]);
  const gap = 2 * Math.PI * a;
  const rings = (turns: number) => Array.from({ length: turns }, (_, k) => circle(50, 50, gap * (k + 1), "guide"));
  return [1, 2, 3].map((turns) =>
    frame([...rings(turns), path(pts(turns), "final"), dot([50, 50], "active")], `${turns}周: 距離 r が角度 θ に比例して増える(r=aθ)。1周ごとに外側へ ${f1(gap)} ずつ、等間隔に広がる`),
  );
}

/** リサジュー図形。横と縦で周波数の違う2つの振動を合わせた軌跡。 */
export function lissajousFigureSteps(): ShapeFrame[] {
  const cases: [number, number, number][] = [
    [1, 2, Math.PI / 2],
    [3, 2, Math.PI / 2],
    [3, 4, Math.PI / 2],
    [5, 4, Math.PI / 4],
  ];
  return cases.map(([a, b, d]) =>
    frame(
      [path(sample(400, 0, 2 * Math.PI, (t) => [50 + 40 * Math.sin(a * t + d), 50 - 40 * Math.sin(b * t)]), "final")],
      `x=sin(${a}t+δ), y=sin(${b}t): 横${a}・縦${b}の周波数比。この比が整数比だと、軌跡は閉じた曲線になる`,
    ),
  );
}

/** サイクロイド。円が直線上を転がるとき、円周上の1点が描く曲線。 */
export function cycloidSteps(): ShapeFrame[] {
  const R = 7;
  const x0 = 6;
  const ground = 62;
  const at = (t: number): Pt => [x0 + R * (t - Math.sin(t)), ground - R * (1 - Math.cos(t))];
  const frames: ShapeFrame[] = [];
  const base = line([2, ground], [98, ground], "guide");
  for (const [t, text] of [
    [Math.PI / 2, "転がり始め。円周上の点(印)が持ち上がる"],
    [Math.PI, "半回転。印は一番高い位置(円の直径の分、2R)に来る"],
    [(3 * Math.PI) / 2, "3/4回転。印は降りてくる"],
    [2 * Math.PI, "1回転。印は再び地面に着く。ここまでが1つの弧"],
    [4 * Math.PI, "2回転。同じ弧が続く。1つの弧の長さは 8R、弧の下の面積は 3πR²(円の面積の3倍)"],
  ] as [number, string][]) {
    const els: ShapeElement[] = [base, path(sample(120, 0, t, at), "final")];
    const cx = x0 + R * t;
    if (t <= 2 * Math.PI + 0.01) els.push(circle(cx, ground - R, R, "guide"), dot(at(t), "active", 1.4));
    frames.push(frame(els, text));
  }
  return frames;
}

/** カージオイド(心臓形)。r=a(1+cosθ)。同じ大きさの円のまわりを円が転がるときの、円周上の点の軌跡。 */
export function cardioidSteps(): ShapeFrame[] {
  const a = 22;
  const full = sample(240, 0, 2 * Math.PI, (t) => [a * (1 + Math.cos(t)) * Math.cos(t), -a * (1 + Math.cos(t)) * Math.sin(t)]);
  const fit = fitTransform(full, 10);
  const part = (t: number) => sample(120, 0, t, (u) => [a * (1 + Math.cos(u)) * Math.cos(u), -a * (1 + Math.cos(u)) * Math.sin(u)]).map(fit);
  return [
    [Math.PI / 2, "θ=90°: 原点(とがった点)から測る距離 r=a(1+cosθ) が、角度とともに変わる"],
    [Math.PI, "θ=180°: r=0。原点に戻る。ここが「へこみ」(尖点)"],
    [(3 * Math.PI) / 2, "θ=270°: 下側をまわって戻ってくる"],
    [2 * Math.PI, "1周して閉じる。ハート(心臓)に似た形。同じ半径の円のまわりを円が転がるときの、円周上の点の軌跡でもある"],
  ].map(([t, text]) => frame([path(part(t as number), "final")], text as string));
}

/** バラ曲線 r=cos(kθ)。kによって花びらの数が変わる。 */
export function roseCurveSteps(): ShapeFrame[] {
  return [2, 3, 4, 5].map((k) => {
    const pts = sample(480, 0, 2 * Math.PI, (t) => [50 + 42 * Math.cos(k * t) * Math.cos(t), 50 - 42 * Math.cos(k * t) * Math.sin(t)]);
    const petals = k % 2 === 0 ? 2 * k : k;
    return frame([path(pts, "final")], `r=cos(${k}θ): 花びら ${petals} 枚。k が奇数なら k 枚、偶数なら 2k 枚になる`);
  });
}

/** 楕円。2つの焦点までの距離の和が一定の点の集まり。 */
export function ellipseSteps(): ShapeFrame[] {
  const a = 40;
  const c = 22;
  const b = Math.sqrt(a * a - c * c);
  const F1: Pt = [50 - c, 50];
  const F2: Pt = [50 + c, 50];
  const at = (t: number): Pt => [50 + a * Math.cos(t), 50 - b * Math.sin(t)];
  const curve = path(sample(120, 0, 2 * Math.PI, at), "final");
  const foci = [dot(F1, "active", 1.8), dot(F2, "active", 1.8), label(F1[0] - 2, F1[1] + 7, "F1"), label(F2[0] - 2, F2[1] + 7, "F2")];
  const string = (t: number): ShapeElement[] => {
    const P = at(t);
    const d1 = Math.hypot(P[0] - F1[0], P[1] - F1[1]);
    const d2 = Math.hypot(P[0] - F2[0], P[1] - F2[1]);
    return [line(F1, P, "guide"), line(F2, P, "guide"), dot(P, "active", 1.5), label(4, 8, `d1+d2 = ${f1(d1)}+${f1(d2)} = ${f1(d1 + d2)}`)];
  };
  return [
    frame(foci, "2つの焦点 F1・F2 に、ひもの両端を留める(ひもの長さは 2a=80。焦点の間隔より長い)"),
    frame([...foci, ...string(0.8)], "ひもをぴんと張ったまま、ペン先 P を動かす。F1までとF2までの距離の和は、いつも 80"),
    frame([...foci, ...string(2.3), path(sample(40, 0, 2.3, at), "final")], "ペン先を動かし続けると、その軌跡が楕円になる。距離の和は変わらない"),
    frame([...foci, curve, ...string(4.2)], `一周すると楕円が完成。長い半径 a=${a}、短い半径 b=√(a²−c²)=${f1(b)}(c は中心から焦点までの距離 ${c})`),
  ];
}

/** 放物線。焦点と準線から等しい距離にある点の集まり。 */
export function parabolaSteps(): ShapeFrame[] {
  const p = 8;
  const vertex: Pt = [50, 85];
  const F: Pt = [50, vertex[1] - p];
  const directrixY = vertex[1] + p;
  const at = (u: number): Pt => [50 + u, vertex[1] - (u * u) / (4 * p)];
  const curve = path(sample(80, -38, 38, at), "final");
  const base = [dot(F, "active", 1.8), label(F[0] + 3, F[1] - 2, "焦点F"), line([4, directrixY], [96, directrixY], "guide", true), label(60, directrixY - 2, "準線")];
  const probe = (u: number): ShapeElement[] => {
    const P = at(u);
    return [line(F, P, "guide"), line(P, [P[0], directrixY], "guide"), dot(P, "active", 1.5), label(4, 10, `PF=${f1(Math.hypot(P[0] - F[0], P[1] - F[1]))}  P〜準線=${f1(directrixY - P[1])}`)];
  };
  return [
    frame(base, "焦点F(点)と準線(直線)を決める。頂点は、この2つの真ん中"),
    frame([...base, ...probe(14)], "焦点までの距離と、準線までの距離が等しい点Pを探す(どちらも同じ値)"),
    frame([...base, curve, ...probe(-26)], "そのような点をすべて集めると放物線になる。どこに取っても、2つの距離は等しい"),
    frame([...base, curve, ...probe(30)], "焦点に向かう光(軸に平行な光)は、放物線で反射すると焦点に集まる——パラボラアンテナの原理"),
  ];
}

/** ベジェ曲線(3次)。制御点を、同じ割合で順に内分して作る(ド・カステリョのアルゴリズム)。 */
export function bezierCurveSteps(): ShapeFrame[] {
  const P: Pt[] = [
    [10, 86],
    [18, 14],
    [80, 10],
    [90, 80],
  ];
  const at = (t: number): Pt => {
    const a = lerpPt(P[0], P[1], t);
    const b = lerpPt(P[1], P[2], t);
    const c = lerpPt(P[2], P[3], t);
    return lerpPt(lerpPt(a, b, t), lerpPt(b, c, t), t);
  };
  const control = [line(P[0], P[1], "guide"), line(P[1], P[2], "guide"), line(P[2], P[3], "guide"), ...P.map((p) => dot(p, "active", 1.8))];
  const construct = (t: number): ShapeElement[] => {
    const a = lerpPt(P[0], P[1], t);
    const b = lerpPt(P[1], P[2], t);
    const c = lerpPt(P[2], P[3], t);
    const d = lerpPt(a, b, t);
    const e = lerpPt(b, c, t);
    const q = lerpPt(d, e, t);
    return [line(a, b, "active"), line(b, c, "active"), line(d, e, "active"), dot(q, "final", 1.8), label(4, 8, `t = ${t}`)];
  };
  return [
    frame(control, "4つの制御点 P0〜P3 を置く。曲線はP0からP3まで、制御点に引き寄せられるように進む"),
    ...[0.25, 0.5, 0.75].map((t) =>
      frame([...control, ...construct(t), path(sample(40, 0, t, at), "final")], `各線分を同じ割合 t=${t} で内分した点を結ぶ(2段目)、さらにその線分を t で内分する(3段目)。最後の点が曲線上の点`),
    ),
    frame([...control, path(sample(80, 0, 1, at), "final")], "t を 0 から 1 まで動かすと、点が曲線を描く。デザインツールのパスや、アニメーションのイージングで使われる"),
  ];
}

/** ストリングアート(包絡線)。2本の軸上の点を順に結ぶ直線が、放物線の輪郭を作る。 */
export function stringArtSteps(): ShapeFrame[] {
  const o: Pt = [10, 90];
  const L = 80;
  const lines = (n: number): ShapeElement[] =>
    Array.from({ length: n + 1 }, (_, k) => line([o[0], o[1] - (k / n) * L], [o[0] + (1 - k / n) * L, o[1]], "final"));
  const axes = [line(o, [o[0], o[1] - L], "guide"), line(o, [o[0] + L, o[1]], "guide")];
  return [5, 10, 20, 40].map((n) =>
    frame([...axes, ...lines(n)], `縦の軸の点と横の軸の点を、順番を逆にして直線で結ぶ(${n + 1}本)。本数を増やすと、直線の集まりの輪郭が滑らかな曲線(放物線)に見えてくる`),
  );
}

export const CURVE_VISUALIZERS: Record<string, () => ShapeFrame[]> = {
  "archimedean-spiral": archimedeanSpiralSteps,
  "lissajous-figure": lissajousFigureSteps,
  cycloid: cycloidSteps,
  cardioid: cardioidSteps,
  "rose-curve": roseCurveSteps,
  ellipse: ellipseSteps,
  parabola: parabolaSteps,
  "bezier-curve": bezierCurveSteps,
  "string-art": stringArtSteps,
};
