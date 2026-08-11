/**
 * 図形作図手順の可視化(ShapeConstructionVisualizer)向けフレーム生成。
 * The-Algorithm-Illustrated の geometry-visualizers.ts と同じ「フレーム列を手続き的に構築する」設計を踏襲し、
 * SHAPE_VISUALIZERSレジストリ(id -> フレーム生成関数)に対応エントリのみ登録する(has-visualizer.tsパターン)。
 * 座標系は0〜100の正方形空間(ShapeConstructionVisualizer側でcanvasにアスペクト比を保って投影する)。
 */

export type ShapeElementState = "idle" | "guide" | "active" | "final";

export type ShapeElement =
  | { kind: "rect"; x: number; y: number; w: number; h: number; state: ShapeElementState }
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number; state: ShapeElementState; dashed?: boolean }
  | { kind: "circle"; cx: number; cy: number; r: number; state: ShapeElementState }
  | { kind: "polygon"; points: [number, number][]; state: ShapeElementState }
  | { kind: "polyline"; points: [number, number][]; state: ShapeElementState }
  | { kind: "label"; x: number; y: number; text: string };

export type ShapeFrame = {
  elements: ShapeElement[];
  description: string;
};

const PHI = (1 + Math.sqrt(5)) / 2;

type Rect = { x: number; y: number; w: number; h: number };

function cutSquare(rect: Rect, dir: 0 | 1 | 2 | 3): { square: Rect; remainder: Rect } {
  const { x, y, w, h } = rect;
  const side = Math.min(w, h);
  if (dir === 0) {
    // 左端から切り出す
    return {
      square: { x, y, w: side, h: side },
      remainder: { x: x + side, y, w: w - side, h },
    };
  }
  if (dir === 1) {
    // 下端から切り出す
    return {
      square: { x, y: y + h - side, w: side, h: side },
      remainder: { x, y, w, h: h - side },
    };
  }
  if (dir === 2) {
    // 右端から切り出す
    return {
      square: { x: x + w - side, y, w: side, h: side },
      remainder: { x, y, w: w - side, h },
    };
  }
  // 上端から切り出す
  return {
    square: { x, y, w: side, h: side },
    remainder: { x, y: y + side, w, h: h - side },
  };
}

/** 黄金比(約1:1.618)の矩形から正方形を渦巻き状に切り出していく「風車型分割」。 */
export function goldenRatioSteps(): ShapeFrame[] {
  const frames: ShapeFrame[] = [];
  let rect: Rect = { x: 5, y: 5 + (50 - 45 / PHI) / 2, w: 90, h: 90 / PHI };
  const finalSquares: ShapeElement[] = [];

  frames.push({
    elements: [{ kind: "rect", x: rect.x, y: rect.y, w: rect.w, h: rect.h, state: "guide" }],
    description: `縦横比が1:${PHI.toFixed(3)}(黄金比)の矩形から始める`,
  });

  for (let i = 0; i < 6; i++) {
    const dir = (i % 4) as 0 | 1 | 2 | 3;
    const { square, remainder } = cutSquare(rect, dir);
    finalSquares.push({ kind: "rect", ...square, state: "final" });
    frames.push({
      elements: [
        ...finalSquares,
        { kind: "rect", x: remainder.x, y: remainder.y, w: remainder.w, h: remainder.h, state: "guide" },
      ],
      description: `一辺${square.w.toFixed(1)}の正方形を切り出す。残った矩形の縦横比も同じ1:${PHI.toFixed(3)}になる(自己相似性)`,
    });
    rect = remainder;
  }

  frames.push({
    elements: [...finalSquares],
    description:
      "この操作は理論上いつまでも繰り返せる——黄金比の矩形は、正方形を切り出しても常に同じ比率の矩形が残るという自己相似な性質を持つ",
  });

  return frames;
}

function hexVertices(cx: number, cy: number, r: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return pts;
}

/** 正六角形7枚(中心+周囲6枚)によるテセレーション(平面充填)の構築。 */
export function regularTessellationSteps(): ShapeFrame[] {
  const size = 13;
  const centerX = 50;
  const centerY = 50;
  const directions: [number, number][] = [
    [1, 0],
    [1, -1],
    [0, -1],
    [-1, 0],
    [-1, 1],
    [0, 1],
  ];
  const axialToPixel = (q: number, rAxial: number): [number, number] => [
    centerX + size * Math.sqrt(3) * (q + rAxial / 2),
    centerY + size * 1.5 * rAxial,
  ];

  const frames: ShapeFrame[] = [];
  const placed: ShapeElement[] = [];

  const [cx0, cy0] = axialToPixel(0, 0);
  placed.push({ kind: "polygon", points: hexVertices(cx0, cy0, size), state: "final" });
  frames.push({
    elements: [...placed],
    description: "正六角形をひとつ置く(内角はすべて120°)",
  });

  for (const [q, r] of directions) {
    const [cx, cy] = axialToPixel(q, r);
    placed.push({ kind: "polygon", points: hexVertices(cx, cy, size), state: "final" });
    frames.push({
      elements: [...placed],
      description: "隣に同じ正六角形を接続する。隙間も重なりも生じない",
    });
  }

  const [meetX, meetY] = axialToPixel(0.5, -0.5);
  frames.push({
    elements: [
      ...placed,
      { kind: "circle", cx: meetX, cy: meetY, r: 2, state: "active" },
      { kind: "label", x: meetX + 6, y: meetY - 4, text: "120°×3=360°" },
    ],
    description:
      "1つの頂点に正六角形が3枚集まり、内角120°×3枚=360°でぴったり埋まる。正三角形・正方形・正六角形だけが正多角形単独でテセレーション(平面充填)できる理由がこれ",
  });

  return frames;
}

/** 非対称な旗形モチーフ(P字型)。対称変換の効果が見た目にわかりやすいよう意図的に非対称にしている。 */
const MOTIF: [number, number][] = [
  [0, 0],
  [0, 18],
  [12, 18],
  [12, 11],
  [5, 11],
  [5, 0],
];

function translatePts(points: [number, number][], dx: number, dy: number): [number, number][] {
  return points.map(([x, y]) => [x + dx, y + dy]);
}

function rotatePts(points: [number, number][], deg: number): [number, number][] {
  const rad = (deg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return points.map(([x, y]) => [x * c - y * s, x * s + y * c]);
}

function rotateAboutPoint(points: [number, number][], cx: number, cy: number, deg: number): [number, number][] {
  return translatePts(rotatePts(translatePts(points, -cx, -cy), deg), cx, cy);
}

function reflectThroughPoint(points: [number, number][], cx: number, cy: number): [number, number][] {
  return points.map(([x, y]) => [2 * cx - x, 2 * cy - y]);
}

function reflectAcrossVerticalLine(points: [number, number][], lineX: number): [number, number][] {
  return points.map(([x, y]) => [2 * lineX - x, y]);
}

function connectorLines(a: [number, number][], b: [number, number][], dashed = true): ShapeElement[] {
  return a.map((p, i) => ({
    kind: "line" as const,
    x1: p[0],
    y1: p[1],
    x2: b[i][0],
    y2: b[i][1],
    state: "guide" as const,
    dashed,
  }));
}

/** 点対称(180°回転対称)。中心点Oを軸に図形を180°回転させると元と同じ形になる。 */
export function pointSymmetrySteps(): ShapeFrame[] {
  const center: [number, number] = [50, 50];
  const base = translatePts(MOTIF, 25, 30);
  const mirrored = reflectThroughPoint(base, center[0], center[1]);

  return [
    {
      elements: [{ kind: "polygon", points: base, state: "active" }],
      description: "基準となる図形を配置する",
    },
    {
      elements: [
        { kind: "polygon", points: base, state: "active" },
        { kind: "circle", cx: center[0], cy: center[1], r: 1.5, state: "guide" },
        { kind: "label", x: center[0] + 3, y: center[1] - 3, text: "O" },
      ],
      description: "対称の中心点Oを定める",
    },
    {
      elements: [
        { kind: "polygon", points: base, state: "active" },
        { kind: "polygon", points: mirrored, state: "final" },
        { kind: "circle", cx: center[0], cy: center[1], r: 1.5, state: "guide" },
        ...connectorLines(base, mirrored),
      ],
      description: "各頂点をOから同じ距離だけ反対側に写すと、180°回転させた図形(点対称)が得られる",
    },
  ];
}

/** 線対称(鏡映対称)。対称軸を挟んで図形を反転させると元と同じ形になる。 */
export function lineSymmetrySteps(): ShapeFrame[] {
  const axisX = 50;
  const base = translatePts(MOTIF, 12, 30);
  const mirrored = reflectAcrossVerticalLine(base, axisX);

  return [
    {
      elements: [{ kind: "polygon", points: base, state: "active" }],
      description: "基準となる図形を配置する",
    },
    {
      elements: [
        { kind: "polygon", points: base, state: "active" },
        { kind: "line", x1: axisX, y1: 5, x2: axisX, y2: 95, state: "guide" },
      ],
      description: "対称軸(直線)を定める",
    },
    {
      elements: [
        { kind: "polygon", points: base, state: "active" },
        { kind: "polygon", points: mirrored, state: "final" },
        { kind: "line", x1: axisX, y1: 5, x2: axisX, y2: 95, state: "guide" },
        ...connectorLines(base, mirrored),
      ],
      description: "対称軸に対して鏡に映したように反転させると、線対称な図形が得られる",
    },
  ];
}

/** 回転対称(位数4)。中心のまわりに90°ずつ回転させても同じ形が重なる。 */
export function rotationalSymmetrySteps(): ShapeFrame[] {
  const center: [number, number] = [50, 50];
  const base = translatePts(MOTIF, 44, 14);
  const copy90 = rotateAboutPoint(base, center[0], center[1], 90);
  const copy180 = rotateAboutPoint(base, center[0], center[1], 180);
  const copy270 = rotateAboutPoint(base, center[0], center[1], 270);
  const radius = Math.hypot(base[0][0] - center[0], base[0][1] - center[1]) + 6;
  const guideCircle: ShapeElement = { kind: "circle", cx: center[0], cy: center[1], r: radius, state: "guide" };

  return [
    {
      elements: [{ kind: "polygon", points: base, state: "active" }, guideCircle],
      description: "基準となる図形を、中心点から一定の距離に配置する",
    },
    {
      elements: [
        { kind: "polygon", points: base, state: "active" },
        { kind: "polygon", points: copy90, state: "final" },
        guideCircle,
      ],
      description: "中心のまわりに90°回転させたコピーを追加する",
    },
    {
      elements: [
        { kind: "polygon", points: base, state: "active" },
        { kind: "polygon", points: copy90, state: "final" },
        { kind: "polygon", points: copy180, state: "final" },
        guideCircle,
      ],
      description: "さらに90°(合計180°)回転させたコピーを追加する",
    },
    {
      elements: [
        { kind: "polygon", points: base, state: "active" },
        { kind: "polygon", points: copy90, state: "final" },
        { kind: "polygon", points: copy180, state: "final" },
        { kind: "polygon", points: copy270, state: "final" },
        guideCircle,
      ],
      description: "90°刻みで4枚並べると元の配置に戻る——これが位数4の回転対称",
    },
  ];
}

function pentagonVertices(cx: number, cy: number, r: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI / 180) * (-90 + 72 * i);
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return pts;
}

/** 星型正多角形(五芒星、{5/2})。正五角形の頂点を1つ飛ばしに結んで星形を作る。 */
export function starPolygonSteps(): ShapeFrame[] {
  const center: [number, number] = [50, 52];
  const pts = pentagonVertices(center[0], center[1], 40);
  // {5/2}: 0→2→4→1→3→0 の順に結ぶ
  const order = [0, 2, 4, 1, 3, 0];
  const frames: ShapeFrame[] = [];
  const dots: ShapeElement[] = pts.map((p) => ({ kind: "circle", cx: p[0], cy: p[1], r: 2, state: "guide" }));

  frames.push({ elements: [...dots], description: "正五角形の頂点を5つ配置する" });

  const lines: ShapeElement[] = [];
  for (let i = 0; i < order.length - 1; i++) {
    const from = pts[order[i]];
    const to = pts[order[i + 1]];
    lines.push({ kind: "line", x1: from[0], y1: from[1], x2: to[0], y2: to[1], state: "final" });
    frames.push({
      elements: [...dots, ...lines],
      description: `頂点P${order[i]}から1つ飛ばしにP${order[i + 1]}へ結ぶ(五芒星 {5/2})`,
    });
  }

  frames.push({
    elements: [...dots, ...lines],
    description: "完成。対角線同士が交わる比率には黄金比が随所に現れる",
  });

  return frames;
}

/** 黄金螺旋(対数螺旋)。角度が90°増えるごとに半径がφ倍になる曲線を段階的に描く。 */
export function goldenSpiralSteps(): ShapeFrame[] {
  const center: [number, number] = [58, 56];
  const a = 0.9;
  const b = Math.log(PHI) / (Math.PI / 2);
  const totalTheta = 4 * Math.PI; // 2周
  const totalSamples = 72;
  const allPoints: [number, number][] = [];
  for (let i = 0; i <= totalSamples; i++) {
    const theta = (totalTheta * i) / totalSamples;
    const r = a * Math.exp(b * theta);
    allPoints.push([center[0] + r * Math.cos(theta), center[1] + r * Math.sin(theta)]);
  }

  const stepCount = 6;
  const frames: ShapeFrame[] = [];
  const centerDot: ShapeElement = { kind: "circle", cx: center[0], cy: center[1], r: 1.5, state: "guide" };

  frames.push({ elements: [centerDot], description: "螺旋の起点を定める" });

  for (let s = 1; s <= stepCount; s++) {
    const upto = Math.round((totalSamples * s) / stepCount);
    const turns = ((totalTheta * upto) / totalSamples / (2 * Math.PI)).toFixed(2);
    frames.push({
      elements: [centerDot, { kind: "polyline", points: allPoints.slice(0, upto + 1), state: "final" }],
      description: `角度が90°増えるごとに半径がφ(約1.618)倍になるよう伸ばしていく(現在${turns}周)`,
    });
  }

  return frames;
}

function midpoint(p1: [number, number], p2: [number, number]): [number, number] {
  return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
}

function sierpinskiTriangles(
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  depth: number,
): [number, number][][] {
  if (depth === 0) return [[p1, p2, p3]];
  const m12 = midpoint(p1, p2);
  const m23 = midpoint(p2, p3);
  const m31 = midpoint(p3, p1);
  return [
    ...sierpinskiTriangles(p1, m12, m31, depth - 1),
    ...sierpinskiTriangles(m12, p2, m23, depth - 1),
    ...sierpinskiTriangles(m31, m23, p3, depth - 1),
  ];
}

/** シェルピンスキーの三角形。中央の三角形を取り除く操作を繰り返し、自己相似なフラクタルを構築する。 */
export function fractalSelfSimilaritySteps(): ShapeFrame[] {
  const p1: [number, number] = [50, 6];
  const p2: [number, number] = [6, 90];
  const p3: [number, number] = [94, 90];
  const maxDepth = 4;
  const frames: ShapeFrame[] = [];

  for (let depth = 0; depth <= maxDepth; depth++) {
    const triangles = sierpinskiTriangles(p1, p2, p3, depth);
    const elements: ShapeElement[] = triangles.map((points) => ({ kind: "polygon", points, state: "final" }));
    const count = triangles.length;
    const description =
      depth === 0
        ? "元になる正三角形(0回操作)"
        : `${depth}回操作: 各三角形の中央を取り除く操作を繰り返す(残り${count}個 = 3^${depth})`;
    frames.push({ elements, description });
  }

  frames.push({
    elements: sierpinskiTriangles(p1, p2, p3, maxDepth).map((points) => ({
      kind: "polygon",
      points,
      state: "final",
    })),
    description: `完成。フラクタル次元は log(3)/log(2) ≈ ${(Math.log(3) / Math.log(2)).toFixed(3)}(1次元と2次元の間の非整数次元)`,
  });

  return frames;
}

function reflectAboutLineThroughPoint(
  points: [number, number][],
  cx: number,
  cy: number,
  angleDeg: number,
): [number, number][] {
  const theta = (angleDeg * Math.PI) / 180;
  const cos2 = Math.cos(2 * theta);
  const sin2 = Math.sin(2 * theta);
  return points.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    return [cx + dx * cos2 + dy * sin2, cy + dx * sin2 - dy * cos2];
  });
}

/** 万華鏡対称(二面体群D4、位数8)。回転対称(C4)に鏡映を組み合わせた対称性。 */
export function kaleidoscopeSymmetrySteps(): ShapeFrame[] {
  const center: [number, number] = [50, 50];
  const base = translatePts(MOTIF, 60, 20);
  const copy90 = rotateAboutPoint(base, center[0], center[1], 90);
  const copy180 = rotateAboutPoint(base, center[0], center[1], 180);
  const copy270 = rotateAboutPoint(base, center[0], center[1], 270);

  const axisGuides: ShapeElement[] = [0, 45, 90, 135].map((angleDeg) => {
    const rad = (angleDeg * Math.PI) / 180;
    const len = 48;
    return {
      kind: "line",
      x1: center[0] - len * Math.cos(rad),
      y1: center[1] - len * Math.sin(rad),
      x2: center[0] + len * Math.cos(rad),
      y2: center[1] + len * Math.sin(rad),
      state: "guide",
    };
  });
  const centerDot: ShapeElement = { kind: "circle", cx: center[0], cy: center[1], r: 1.5, state: "guide" };

  const rotational = [base, copy90, copy180, copy270];

  return [
    {
      elements: [...axisGuides, centerDot, { kind: "polygon", points: base, state: "active" }],
      description: "中心点Oと4本の鏡映軸(万華鏡の鏡)を配置する",
    },
    {
      elements: [
        ...axisGuides,
        centerDot,
        { kind: "polygon", points: base, state: "active" },
        { kind: "polygon", points: copy90, state: "final" },
      ],
      description: "中心のまわりに90°回転させたコピーを追加する",
    },
    {
      elements: [
        ...axisGuides,
        centerDot,
        ...rotational.slice(0, 3).map((points): ShapeElement => ({ kind: "polygon", points, state: "final" })),
      ],
      description: "さらに90°回転させたコピーを追加する",
    },
    {
      elements: [
        ...axisGuides,
        centerDot,
        ...rotational.map((points): ShapeElement => ({ kind: "polygon", points, state: "final" })),
      ],
      description: "90°刻みで4枚並べる(回転対称C4が完成)",
    },
    {
      elements: [
        ...axisGuides,
        centerDot,
        ...rotational.map((points): ShapeElement => ({ kind: "polygon", points, state: "final" })),
        ...rotational.map(
          (points): ShapeElement => ({
            kind: "polygon",
            points: reflectAboutLineThroughPoint(points, center[0], center[1], 0),
            state: "final",
          }),
        ),
      ],
      description:
        "この4枚を1本の鏡(軸)に対して反転させると、万華鏡のように8枚の像が現れる(二面体群D4、位数8=2×4)",
    },
  ];
}

export const SHAPE_VISUALIZERS: Record<string, () => ShapeFrame[]> = {
  "golden-ratio": goldenRatioSteps,
  "regular-tessellation": regularTessellationSteps,
  "point-symmetry": pointSymmetrySteps,
  "line-symmetry": lineSymmetrySteps,
  "rotational-symmetry": rotationalSymmetrySteps,
  "star-polygon": starPolygonSteps,
  "golden-spiral": goldenSpiralSteps,
  "fractal-self-similarity": fractalSelfSimilaritySteps,
  "kaleidoscope-symmetry": kaleidoscopeSymmetrySteps,
};
