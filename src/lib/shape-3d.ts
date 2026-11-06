import type { PolyhedronId } from "./geometry3d/polyhedra.ts";

/**
 * 図形の「立体で見る」(3D)の対応表。2D の作図手順(shape-visualizers)とは別に持つ。
 * 立体にすると意味が増えるものだけを登録する(2Dを立体に変えただけのものは入れない)。
 * kind がシーンの種類、title・note が3D表示の見出しと「何を見るか」の一文。
 * has-visualizer と同じく、サーバー・ビルド時・verify から安全に import できるよう、three.js には依存しない。
 */
export type Shape3DSpec =
  | { kind: "solids"; initial: PolyhedronId; solids: PolyhedronId[] }
  | { kind: "cube-net" }
  | { kind: "fractal-cubes"; variant: "menger" | "cantor" }
  | { kind: "sierpinski" }
  | { kind: "hilbert" }
  | { kind: "phyllotaxis"; angle: number }
  | { kind: "shell" }
  | { kind: "lissajous" }
  | { kind: "conic"; tilt: number }
  | { kind: "packing" }
  | { kind: "hyperboloid"; twist: number }
  | { kind: "tree" }
  | { kind: "bezier" }
  | { kind: "golden" };

export type Shape3DEntry = Shape3DSpec & {
  /** 3D表示の見出し(「〜を立体で見る」)。 */
  title: string;
  /** 何を見る・動かすかの一文。 */
  note: string;
};

const PLATONIC: PolyhedronId[] = ["tetrahedron", "cube", "octahedron", "dodecahedron", "icosahedron"];
const ALL_SOLIDS: PolyhedronId[] = [...PLATONIC, "triangular-prism", "square-pyramid"];

export const SHAPE_3D: Record<string, Shape3DEntry> = {
  "platonic-solids": {
    kind: "solids",
    initial: "dodecahedron",
    solids: PLATONIC,
    title: "正多面体を回して見る",
    note: "5種類を切り替えて、どの頂点にも同じ数の同じ正多角形が集まっていることを確かめます。",
  },
  "euler-polyhedron": {
    kind: "solids",
    initial: "cube",
    solids: ALL_SOLIDS,
    title: "頂点・辺・面を数える",
    note: "多面体を切り替えても、頂点 − 辺 + 面 はいつも 2 になります(凸多面体)。",
  },
  "pentagon-construction": {
    kind: "solids",
    initial: "dodecahedron",
    solids: PLATONIC,
    title: "正五角形でできる立体",
    note: "正五角形12枚で正十二面体ができます。正五角形は、この立体の面のかたちです。",
  },
  "cube-net": {
    kind: "cube-net",
    title: "展開図を折りたたむ",
    note: "11種類の展開図を選び、スライダーで折ります。1〜6の面が、立方体の6面になります。",
  },
  "sierpinski-carpet": {
    kind: "fractal-cubes",
    variant: "menger",
    title: "立体にすると: メンガーのスポンジ",
    note: "カーペットの穴あけを立体に拡げたもの。段を増やすと、体積は (20/27)ⁿ 倍に減ります。",
  },
  "cantor-set": {
    kind: "fractal-cubes",
    variant: "cantor",
    title: "立体にすると: カントール塵",
    note: "線を3等分して真ん中を抜く操作を、3方向に行ったもの。8ⁿ 個の立方体が残ります。",
  },
  "fractal-self-similarity": {
    kind: "sierpinski",
    title: "立体で見る自己相似: シェルピンスキーの四面体",
    note: "部分を拡大すると全体と同じ形。四面体を、頂点ごとに1/2へ縮めた4つに分け続けます。",
  },
  "hilbert-curve": {
    kind: "hilbert",
    title: "3次元のヒルベルト曲線",
    note: "立方体の中を、すき間なく一筆でたどります。始点から終点へ色が変わり、順序が見えます。",
  },
  phyllotaxis: {
    kind: "phyllotaxis",
    angle: 137.5,
    title: "球面のひまわり",
    note: "点を、高さを等間隔にしつつ回転角ずつずらして並べます。角度を動かすと、黄金角のときだけ均一になります。",
  },
  "golden-angle": {
    kind: "phyllotaxis",
    angle: 137.5,
    title: "黄金角で球面を埋める",
    note: "黄金角(約137.5°)ずつ回して点を置くと、球面にむらなく広がります。角度を少しずらして比べてください。",
  },
  "golden-spiral": {
    kind: "shell",
    title: "巻き貝にすると",
    note: "1/4回転ごとに半径が黄金比倍になる対数らせんを、軸のまわりに巻いた形。真上から見ると輪郭が黄金らせんです。",
  },
  "fibonacci-spiral": {
    kind: "shell",
    title: "らせんを巻き貝にすると",
    note: "フィボナッチ数の比は黄金比に近づきます。その比で巻く対数らせんを、立体にしたものです。「真上」で輪郭を見てください。",
  },
  "lissajous-figure": {
    kind: "lissajous",
    title: "3方向のリサジュー曲線",
    note: "x・y・z をそれぞれ別の周波数で振動させた軌跡。周波数の比が整数なら、曲線は閉じます。",
  },
  ellipse: {
    kind: "conic",
    tilt: 25,
    title: "円錐を切ると楕円",
    note: "円錐を平面で切った切り口です。平面の傾きを変えると、円・楕円・放物線・双曲線に変わります。",
  },
  parabola: {
    kind: "conic",
    tilt: 45,
    title: "円錐を切ると放物線",
    note: "平面を円錐の母線と平行にすると、切り口が放物線になります。傾きを動かして、前後の違いを見てください。",
  },
  "circle-packing": {
    kind: "packing",
    title: "球の詰め込み",
    note: "平面の円の最密充填を、層にして積みます。どちらの積み方も、空間の約74.05%を占めます。",
  },
  "string-art": {
    kind: "hyperboloid",
    twist: 70,
    title: "糸かけの立体: 一葉双曲面",
    note: "上下の円を、ひねって直線で結ぶと、直線だけで曲面の輪郭ができます。ひねりを動かしてください。",
  },
  "fractal-tree": {
    kind: "tree",
    title: "3次元に枝分かれする木",
    note: "1本の枝が3本に分かれる規則を、段数だけ繰り返します。枝の数は 3 のべき乗で増えます。",
  },
  "bezier-curve": {
    kind: "bezier",
    title: "3次ベジェ曲線(3D)",
    note: "ド・カステリョのアルゴリズム。制御点の間を同じ割合 t で内分して、点を1つにしていきます。",
  },
  "golden-ratio": {
    kind: "golden",
    title: "黄金長方形と正二十面体",
    note: "互いに直交する3枚の黄金長方形の頂点12個が、そのまま正二十面体の頂点になります。",
  },
};

export function hasShape3D(shapeId: string): boolean {
  return shapeId in SHAPE_3D;
}
