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

export const SHAPE_VISUALIZERS: Record<string, () => ShapeFrame[]> = {
  "golden-ratio": goldenRatioSteps,
  "regular-tessellation": regularTessellationSteps,
  "point-symmetry": pointSymmetrySteps,
  "line-symmetry": lineSymmetrySteps,
  "rotational-symmetry": rotationalSymmetrySteps,
};
