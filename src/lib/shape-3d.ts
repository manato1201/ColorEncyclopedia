import type { HullSolidId } from "./geometry3d/hull.ts";
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
  | { kind: "golden" }
  | { kind: "hull-solids"; solids: HullSolidId[]; initial: HullSolidId; dual: boolean; axes: boolean }
  | { kind: "space-filling" }
  | { kind: "revolve" }
  | { kind: "archimedes" }
  | { kind: "cavalieri" }
  | { kind: "box-diagonal" }
  | { kind: "catenoid" }
  | { kind: "helix" }
  | { kind: "isometric" };

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

const PLATONIC_HULL: HullSolidId[] = ["tetrahedron", "cube", "octahedron", "dodecahedron", "icosahedron"];

Object.assign(SHAPE_3D, {
  "truncated-icosahedron": {
    kind: "hull-solids",
    solids: ["truncated-icosahedron", "icosahedron", "dodecahedron"],
    initial: "truncated-icosahedron",
    dual: false,
    axes: false,
    title: "サッカーボールの形を回して見る",
    note: "正二十面体の12個の角を切り落とすと、五角形12枚と六角形20枚が残ります。頂点・辺・面を数え直しても、V−E+F=2 になります。",
  },
  cuboctahedron: {
    kind: "hull-solids",
    solids: ["cuboctahedron", "cube", "octahedron"],
    initial: "cuboctahedron",
    dual: false,
    axes: false,
    title: "立方体の角を辺の中点まで切り落とす",
    note: "立方体(または正八面体)の角を、辺の中点まで切り落とした形。三角形8枚と四角形6枚で、どの頂点も同じ並びです。",
  },
  "archimedean-solids": {
    kind: "hull-solids",
    solids: ["cuboctahedron", "truncated-tetrahedron", "truncated-cube", "truncated-octahedron", "rhombicuboctahedron", "icosidodecahedron", "truncated-icosahedron"],
    initial: "truncated-octahedron",
    dual: false,
    axes: false,
    title: "半正多面体を切り替えて見る",
    note: "2種類以上の正多角形でできて、どの頂点のまわりも同じ並びの立体です(正多面体を切り落とした形が多い)。面の色は辺の数の違いです。",
  },
  "dual-polyhedra": {
    kind: "hull-solids",
    solids: ["cube", "octahedron", "dodecahedron", "icosahedron", "tetrahedron", "cuboctahedron"],
    initial: "cube",
    dual: true,
    axes: false,
    title: "双対: 面の中心を結ぶ",
    note: "各面の中心を頂点にして結ぶと、頂点と面の数が入れ替わった立体になります。立方体の双対は正八面体、正四面体の双対は正四面体です。",
  },
  "space-filling": {
    kind: "space-filling",
    title: "同じ立体で空間を埋める",
    note: "立方体のほかに、切頂八面体と菱形十二面体も、同じ立体だけで空間をすき間なく埋められます。すき間を広げて、1個ずつの形を見てください。",
  },
  "solids-of-revolution": {
    kind: "revolve",
    title: "平面図形を回して立体にする",
    note: "図形を軸のまわりに回すと、立体が生まれます。回転の角度を動かして、途中の形を見てください。",
  },
  "sphere-volume": {
    kind: "archimedes",
    title: "円錐・球・円柱の体積の比",
    note: "同じ半径で高さが直径の円錐・球・円柱は、体積の比が 1 : 2 : 3 になります。アルキメデスが墓に刻ませたとされる関係です。",
  },
  "cavalieri-principle": {
    kind: "cavalieri",
    title: "どの高さでも断面積が等しい",
    note: "半球と、円柱から円錐をくり抜いた立体を、同じ高さで切った断面の面積は、いつも等しくなります。だから体積も等しい(カヴァリエリの原理)。",
  },
  "polyhedral-symmetry": {
    kind: "hull-solids",
    solids: PLATONIC_HULL,
    initial: "cube",
    dual: false,
    axes: true,
    title: "正多面体の回転対称の軸",
    note: "面の中心・頂点・辺の中点を通る軸のまわりに回して、元と重なる回転を数えます。立方体と正八面体は24、正十二面体と正二十面体は60通りです。",
  },
  "rotational-symmetry": {
    kind: "hull-solids",
    solids: PLATONIC_HULL,
    initial: "icosahedron",
    dual: false,
    axes: true,
    title: "立体の回転対称",
    note: "平面の回転対称(中心のまわりに回して重なる)を、立体に拡げます。軸の色は、何回転で元に戻るか(2・3・4・5回軸)の違いです。",
  },
  "point-symmetry": {
    kind: "hull-solids",
    solids: PLATONIC_HULL,
    initial: "tetrahedron",
    dual: false,
    axes: false,
    title: "立体の点対称(中心対称)",
    note: "中心について、すべての頂点の反対側にも頂点があるものが点対称です。正四面体は点対称ではなく、立方体・正八面体・正十二面体・正二十面体は点対称です。",
  },
  "pythagorean-theorem": {
    kind: "box-diagonal",
    title: "空間に拡げた三平方の定理",
    note: "直方体の空間の対角線は、三平方の定理を2回使うと求められます。縦・横・高さを動かして確かめてください。",
  },
  "sierpinski-triangle": {
    kind: "sierpinski",
    title: "立体にすると: シェルピンスキーの四面体",
    note: "正三角形を3つの小さな正三角形に分け続けるように、四面体を4つの小さな四面体に分け続けます。段が増えると体積は 1/2 ずつ減ります。",
  },
  catenary: {
    kind: "catenoid",
    title: "懸垂線を回すとカテノイド",
    note: "鎖を両端でつるしたときの曲線(懸垂線)を、軸のまわりに回してできる曲面。石けん膜がつくる最小曲面の形です。",
  },
  helix: {
    kind: "helix",
    title: "円柱に巻きつくつる巻き線",
    note: "円柱のまわりを、一定の割合で上りながら回る曲線。ピッチと巻き数を動かして、長さの変わり方を見てください。",
  },
  "rhombille-tiling": {
    kind: "isometric",
    title: "菱形タイリングは、積み木を等角で見た形",
    note: "立方体の積み木を斜め上から見ると、3方向の面がすべて同じ菱形に見えます。「等角」の視点で、ひし形の敷き詰めに見える位置を探してください。",
  },
} satisfies Record<string, Shape3DEntry>);

export function hasShape3D(shapeId: string): boolean {
  return shapeId in SHAPE_3D;
}
