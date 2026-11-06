import type * as ThreeNS from "three";
import type { SceneBuilder, SceneContext } from "./Viewport3D";
import {
  addLights,
  clearGroup,
  geometryFromMeshData,
  instancedSegments,
  instancedSpheres,
  makeLabel,
  rainbow,
} from "./scene-utils";
import {
  BEZIER_CONTROL_POINTS,
  bezierCurve,
  conicSection,
  deCasteljau,
  doubleConeMesh,
  goldenRectangles,
  hyperboloidLines,
  icosahedronEdges,
  lissajous3d,
  phyllotaxisSphere,
  shellSurface,
  spherePacking,
  type PackingKind,
} from "@/lib/geometry3d/curves";
import {
  fractalTree3d,
  hilbert3dPath,
  sierpinskiTetrahedra,
  subdividedCubes,
  TETRA_VERTICES,
  type CubeVariant,
} from "@/lib/geometry3d/fractals";
import type { Vec3 } from "@/lib/geometry3d/mesh-data";
import {
  CUBE_NETS,
  netFoldTree,
  PHI,
  type PolyhedronId,
} from "@/lib/geometry3d/polyhedra";

/** 図形の3D表示のシーン。どれも「ルートのグループを作り、パラメータが変わるたびに中身を作り直す」形。 */

export type SolidsParams = { solid: PolyhedronId };
export type CubeNetParams = { net: number; fold: number };
export type FractalCubesParams = { variant: CubeVariant; level: number };
export type SierpinskiParams = { level: number };
export type HilbertParams = { order: number };
export type PhyllotaxisParams = { angle: number; count: number };
export type ShellParams = { growth: number };
export type LissajousParams = { preset: number };
export type ConicParams = { tilt: number };
export type PackingParams = { kind: PackingKind; layers: number };
export type HyperboloidParams = { twist: number };
export type TreeParams = { depth: number; spread: number };
export type BezierParams = { t: number };
export type GoldenParams = { icosahedron: boolean };

type Build<P> = (ctx: SceneContext, root: ThreeNS.Group, params: P) => void;

/** ルートのグループに build の結果を載せ、パラメータが変わったら作り直すシーンにする。 */
function rebuildScene<P>(build: Build<P>): SceneBuilder<P> {
  return (ctx, params) => {
    const root = new ctx.THREE.Group();
    ctx.scene.add(root);
    addLights(ctx);
    build(ctx, root, params);
    return {
      update: (p) => {
        clearGroup(root);
        build(ctx, root, p);
        ctx.requestRender();
      },
      dispose: () => clearGroup(root),
    };
  };
}

// ---------------------------------------------------------------------------
// 多面体(正多面体・オイラーの多面体定理)
// ---------------------------------------------------------------------------

function solidGeometry(
  THREE: SceneContext["THREE"],
  solid: PolyhedronId,
): ThreeNS.BufferGeometry {
  switch (solid) {
    case "tetrahedron":
      return new THREE.TetrahedronGeometry(1.5);
    case "cube":
      return new THREE.BoxGeometry(1.7, 1.7, 1.7);
    case "octahedron":
      return new THREE.OctahedronGeometry(1.5);
    case "dodecahedron":
      return new THREE.DodecahedronGeometry(1.4);
    case "icosahedron":
      return new THREE.IcosahedronGeometry(1.45);
    case "triangular-prism":
      return new THREE.CylinderGeometry(1.2, 1.2, 1.8, 3, 1);
    case "square-pyramid":
      return new THREE.ConeGeometry(1.3, 1.8, 4, 1);
  }
}

export const solidsScene: SceneBuilder<SolidsParams> = rebuildScene(
  (ctx, root, { solid }) => {
    const { THREE, theme } = ctx;
    const geo = solidGeometry(THREE, solid);
    root.add(
      new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color: theme.accent,
          flatShading: true,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
        }),
      ),
    );
    const edges = new THREE.EdgesGeometry(geo, 1);
    root.add(
      new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: theme.ink }),
      ),
    );
    // 頂点(重なる頂点は1つにまとめる)
    const pos = geo.getAttribute("position");
    const seen = new Set<string>();
    const verts: Vec3[] = [];
    for (let i = 0; i < pos.count; i++) {
      const p: Vec3 = [pos.getX(i), pos.getY(i), pos.getZ(i)];
      const k = p.map((n) => Math.round(n * 1000)).join(",");
      if (!seen.has(k)) {
        seen.add(k);
        verts.push(p);
      }
    }
    root.add(
      instancedSpheres(
        THREE,
        verts,
        0.06,
        new THREE.MeshBasicMaterial({ color: theme.ink }),
      ),
    );
  },
);

// ---------------------------------------------------------------------------
// 立方体の展開図を折る
// ---------------------------------------------------------------------------

function numberTexture(
  THREE: SceneContext["THREE"],
  n: number,
  fill: string,
  ink: string,
): ThreeNS.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = fill;
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = ink;
  g.font = '600 72px "Noto Sans JP", sans-serif';
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(String(n), 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.LinearFilter;
  return t;
}

export const cubeNetScene: SceneBuilder<CubeNetParams> = (ctx, params) => {
  const { THREE, theme } = ctx;
  const root = new THREE.Group();
  ctx.scene.add(root);
  addLights(ctx);
  let hinges: { group: ThreeNS.Group; axis: ThreeNS.Vector3 }[] = [];
  let builtNet = -1;

  const apply = (fold: number) => {
    for (const h of hinges)
      h.group.quaternion.setFromAxisAngle(h.axis, fold * (Math.PI / 2));
  };

  const build = (netIndex: number) => {
    clearGroup(root);
    hinges = [];
    const cells = CUBE_NETS[netIndex];
    const tree = netFoldTree(cells);
    const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
    const cy = cells.reduce((s, c) => s + c[1], 0) / cells.length;
    const groups = cells.map(() => new THREE.Group());
    cells.forEach((_, i) => {
      const front = new THREE.Mesh(
        new THREE.PlaneGeometry(0.97, 0.97),
        new THREE.MeshBasicMaterial({
          map: numberTexture(THREE, i + 1, theme.paper, theme.ink),
          side: THREE.FrontSide,
        }),
      );
      front.rotation.x = -Math.PI / 2;
      const back = new THREE.Mesh(
        new THREE.PlaneGeometry(0.97, 0.97),
        new THREE.MeshBasicMaterial({
          color: theme.accent,
          side: THREE.BackSide,
        }),
      );
      back.rotation.x = -Math.PI / 2;
      const outline = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.97, 0.97)),
        new THREE.LineBasicMaterial({ color: theme.ink }),
      );
      outline.rotation.x = -Math.PI / 2;
      groups[i].add(front, back, outline);
    });
    for (const h of tree.hinges) {
      const hinge = new THREE.Group();
      hinge.position.set(h.dc * 0.5, 0, h.dr * 0.5);
      groups[h.parent].add(hinge);
      groups[h.child].position.set(h.dc * 0.5, 0, h.dr * 0.5);
      hinge.add(groups[h.child]);
      // 下向きに折る軸: y × d
      hinges.push({ group: hinge, axis: new THREE.Vector3(h.dr, 0, -h.dc) });
    }
    const rc = cells[tree.root];
    groups[tree.root].position.set(-(cx - rc[0]), 0.4, -(cy - rc[1]));
    root.add(groups[tree.root]);
    builtNet = netIndex;
  };

  build(params.net);
  apply(params.fold);
  return {
    update: (p) => {
      if (p.net !== builtNet) build(p.net);
      apply(p.fold);
      ctx.requestRender();
    },
    dispose: () => clearGroup(root),
  };
};

// ---------------------------------------------------------------------------
// フラクタル(メンガーのスポンジ・カントール塵・シェルピンスキーの四面体)
// ---------------------------------------------------------------------------

export const fractalCubesScene: SceneBuilder<FractalCubesParams> = rebuildScene(
  (ctx, root, { variant, level }) => {
    const { THREE, theme } = ctx;
    const cubes = subdividedCubes(level, variant);
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({
        color: theme.accent,
        flatShading: true,
      }),
      cubes.length,
    );
    const m = new THREE.Matrix4();
    cubes.forEach((c, i) => {
      m.compose(
        new THREE.Vector3(c.x, c.y, c.z),
        new THREE.Quaternion(),
        new THREE.Vector3(c.size, c.size, c.size),
      );
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    root.add(mesh);
    // 一番外の立方体の輪郭(何を分けたのかが分かるように)
    root.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(2, 2, 2)),
        new THREE.LineBasicMaterial({ color: theme.inkMuted }),
      ),
    );
  },
);

export const sierpinskiScene: SceneBuilder<SierpinskiParams> = rebuildScene(
  (ctx, root, { level }) => {
    const { THREE, theme } = ctx;
    const items = sierpinskiTetrahedra(level);
    const geo = new THREE.BufferGeometry();
    const v = TETRA_VERTICES;
    const faces = [
      [0, 1, 2],
      [0, 3, 1],
      [0, 2, 3],
      [1, 3, 2],
    ];
    const arr: number[] = [];
    for (const f of faces) for (const i of f) arr.push(...v[i]);
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(arr), 3),
    );
    geo.computeVertexNormals();
    const mesh = new THREE.InstancedMesh(
      geo,
      new THREE.MeshStandardMaterial({
        color: theme.accent,
        flatShading: true,
        side: THREE.DoubleSide,
      }),
      items.length,
    );
    const m = new THREE.Matrix4();
    items.forEach((it, i) => {
      m.compose(
        new THREE.Vector3(...it.center),
        new THREE.Quaternion(),
        new THREE.Vector3(it.scale, it.scale, it.scale),
      );
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.scale.setScalar(0.85);
    root.add(mesh);
  },
);

// ---------------------------------------------------------------------------
// 3次元ヒルベルト曲線
// ---------------------------------------------------------------------------

export const hilbertScene: SceneBuilder<HilbertParams> = rebuildScene(
  (ctx, root, { order }) => {
    const { THREE, theme } = ctx;
    const path = hilbert3dPath(order);
    const step = 2 / 2 ** order;
    const pairs: [Vec3, Vec3][] = [];
    for (let i = 1; i < path.length; i++) pairs.push([path[i - 1], path[i]]);
    const radius = step * 0.13;
    // 始点から終点へ、色相が変わる(つなぎ方の順序が見える)
    const colorAt = (i: number) =>
      rainbow(THREE, 0.02 + (0.85 * i) / Math.max(1, pairs.length));
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    root.add(instancedSegments(THREE, pairs, radius, material, colorAt));
    root.add(
      instancedSpheres(
        THREE,
        path,
        radius * 1.15,
        material,
        (i) => rainbow(THREE, 0.02 + (0.85 * i) / Math.max(1, path.length - 1)),
        8,
      ),
    );
    root.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(2, 2, 2)),
        new THREE.LineBasicMaterial({ color: theme.line }),
      ),
    );
  },
);

// ---------------------------------------------------------------------------
// 黄金角のひまわり(球面)
// ---------------------------------------------------------------------------

export const phyllotaxisScene: SceneBuilder<PhyllotaxisParams> = rebuildScene(
  (ctx, root, { angle, count }) => {
    const { THREE } = ctx;
    const pts = phyllotaxisSphere(count, angle).map((p): Vec3 => [
      p[0] * 1.5,
      p[1] * 1.5,
      p[2] * 1.5,
    ]);
    const spacing = Math.sqrt((4 * Math.PI * 1.5 * 1.5) / count);
    // 並べた順に色相が変わる(らせんの腕が見える)
    root.add(
      instancedSpheres(
        THREE,
        pts,
        spacing * 0.34,
        new THREE.MeshStandardMaterial({ color: 0xffffff }),
        (i) => rainbow(THREE, i / count, 0.6, 0.55),
        10,
      ),
    );
  },
);

// ---------------------------------------------------------------------------
// 巻き貝(対数らせん)
// ---------------------------------------------------------------------------

export const shellScene: SceneBuilder<ShellParams> = rebuildScene(
  (ctx, root, { growth }) => {
    const { THREE } = ctx;
    const data = shellSurface({ turns: 3.2, growth });
    const geo = geometryFromMeshData(THREE, data);
    geo.center();
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        roughness: 0.8,
      }),
    );
    mesh.scale.setScalar(2.2);
    mesh.rotation.x = 0.2;
    root.add(mesh);
  },
);

// ---------------------------------------------------------------------------
// 3次元リサジュー曲線
// ---------------------------------------------------------------------------

export const LISSAJOUS_PRESETS: { label: string; freq: Vec3; phase: Vec3 }[] = [
  { label: "3 : 2 : 1", freq: [3, 2, 1], phase: [Math.PI / 2, 0, 0] },
  { label: "3 : 4 : 5", freq: [3, 4, 5], phase: [Math.PI / 2, 0, Math.PI / 4] },
  { label: "2 : 3 : 5", freq: [2, 3, 5], phase: [0, Math.PI / 3, Math.PI / 5] },
  { label: "1 : 1 : 2", freq: [1, 1, 2], phase: [Math.PI / 2, 0, 0] },
];

export const lissajousScene: SceneBuilder<LissajousParams> = rebuildScene(
  (ctx, root, { preset }) => {
    const { THREE } = ctx;
    const p = LISSAJOUS_PRESETS[preset] ?? LISSAJOUS_PRESETS[0];
    const pts = lissajous3d(p.freq, p.phase, 720).map((q): Vec3 => [
      q[0] * 1.4,
      q[1] * 1.4,
      q[2] * 1.4,
    ]);
    const pairs: [Vec3, Vec3][] = [];
    for (let i = 1; i < pts.length; i++) pairs.push([pts[i - 1], pts[i]]);
    root.add(
      instancedSegments(
        THREE,
        pairs,
        0.035,
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
        (i) => rainbow(THREE, i / pairs.length, 0.7, 0.55),
      ),
    );
  },
);

// ---------------------------------------------------------------------------
// 円錐曲線(円錐を平面で切る)
// ---------------------------------------------------------------------------

export const conicScene: SceneBuilder<ConicParams> = rebuildScene(
  (ctx, root, { tilt }) => {
    const { THREE, theme } = ctx;
    const cone = new THREE.Mesh(
      geometryFromMeshData(THREE, doubleConeMesh(1.5)),
      new THREE.MeshBasicMaterial({
        color: theme.inkMuted,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    root.add(cone);
    // 母線(奥行きの手がかり)
    const rulings: [Vec3, Vec3][] = [];
    for (let k = 0; k < 24; k++) {
      const phi = (k / 24) * 2 * Math.PI;
      rulings.push(
        [
          [0, 0, 0],
          [1.5 * Math.cos(phi), 1.5, 1.5 * Math.sin(phi)],
        ],
        [
          [0, 0, 0],
          [1.5 * Math.cos(phi), -1.5, 1.5 * Math.sin(phi)],
        ],
      );
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array(rulings.flatMap(([a, b]) => [...a, ...b])),
        3,
      ),
    );
    root.add(
      new THREE.LineSegments(
        g,
        new THREE.LineBasicMaterial({ color: theme.line }),
      ),
    );

    // 切る平面(軸上の高さ 0.8 を通り、水平から tilt 度傾ける)
    const beta = (tilt * Math.PI) / 180;
    const normal = new THREE.Vector3(Math.sin(beta), Math.cos(beta), 0);
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 3.4),
      new THREE.MeshBasicMaterial({
        color: theme.accent,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    plane.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    plane.position.set(0, 0.8, 0);
    root.add(plane);
    const frame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(3.4, 3.4)),
      new THREE.LineBasicMaterial({ color: theme.accent }),
    );
    frame.quaternion.copy(plane.quaternion);
    frame.position.copy(plane.position);
    root.add(frame);

    // 切り口の曲線
    for (const run of conicSection(tilt, 0.8)) {
      const pairs: [Vec3, Vec3][] = [];
      for (let i = 1; i < run.length; i++) pairs.push([run[i - 1], run[i]]);
      root.add(
        instancedSegments(
          THREE,
          pairs,
          0.03,
          new THREE.MeshBasicMaterial({ color: theme.ink }),
        ),
      );
    }
  },
);

// ---------------------------------------------------------------------------
// 球の詰め込み
// ---------------------------------------------------------------------------

const LAYER_COLORS = ["#d9694f", "#4f9fd9", "#6cc27a"];

export const packingScene: SceneBuilder<PackingParams> = rebuildScene(
  (ctx, root, { kind, layers }) => {
    const { THREE } = ctx;
    const pts = spherePacking(kind, layers);
    const perLayer = pts.length / layers;
    const cy = ((layers - 1) * 2 * Math.sqrt(2 / 3)) / 2;
    const centered = pts.map((p): Vec3 => [p[0] - 1, p[1] - cy, p[2]]);
    const mesh = instancedSpheres(
      THREE,
      centered,
      1,
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 }),
      (i) =>
        new THREE.Color(
          LAYER_COLORS[Math.floor(i / perLayer) % (kind === "fcc" ? 3 : 2)],
        ),
      20,
    );
    mesh.scale.setScalar(0.3);
    root.add(mesh);
  },
);

// ---------------------------------------------------------------------------
// 一葉双曲面(糸かけ)
// ---------------------------------------------------------------------------

export const hyperboloidScene: SceneBuilder<HyperboloidParams> = rebuildScene(
  (ctx, root, { twist }) => {
    const { THREE, theme } = ctx;
    const lines = hyperboloidLines(60, twist);
    root.add(
      instancedSegments(
        THREE,
        lines,
        0.012,
        new THREE.MeshBasicMaterial({ color: theme.accent }),
      ),
    );
    for (const y of [-0.8, 0.8]) {
      const ring: [Vec3, Vec3][] = [];
      for (let i = 0; i < 72; i++) {
        const a = (i / 72) * 2 * Math.PI;
        const b = ((i + 1) / 72) * 2 * Math.PI;
        ring.push([
          [Math.cos(a), y, Math.sin(a)],
          [Math.cos(b), y, Math.sin(b)],
        ]);
      }
      root.add(
        instancedSegments(
          THREE,
          ring,
          0.025,
          new THREE.MeshBasicMaterial({ color: theme.ink }),
        ),
      );
    }
    root.scale.setScalar(1.35);
  },
);

// ---------------------------------------------------------------------------
// 3次元のフラクタルツリー
// ---------------------------------------------------------------------------

export const treeScene: SceneBuilder<TreeParams> = rebuildScene(
  (ctx, root, { depth, spread }) => {
    const { THREE } = ctx;
    const branches = fractalTree3d(depth, spread);
    const pairs = branches.map((b): [Vec3, Vec3] => [b.from, b.to]);
    const trunk = new THREE.Color("#7a5230");
    const leaf = new THREE.Color("#4f9a4a");
    root.add(
      instancedSegments(
        THREE,
        pairs,
        (i) => 0.05 * Math.pow(0.72, branches[i].depth),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
        (i) => trunk.clone().lerp(leaf, branches[i].depth / Math.max(1, depth)),
      ),
    );
    root.position.y = -0.1;
  },
);

// ---------------------------------------------------------------------------
// 3次元ベジェ曲線
// ---------------------------------------------------------------------------

export const bezierScene: SceneBuilder<BezierParams> = rebuildScene(
  (ctx, root, { t }) => {
    const { THREE, theme } = ctx;
    const cp = BEZIER_CONTROL_POINTS;
    const seg = (pts: Vec3[]): [Vec3, Vec3][] =>
      pts.slice(1).map((p, i) => [pts[i], p]);
    const mat = (color: string) => new THREE.MeshBasicMaterial({ color });
    const full = bezierCurve(cp, 80);
    root.add(instancedSegments(THREE, seg(full), 0.014, mat(theme.line)));
    const traced = bezierCurve(cp, 80).filter((_, i) => i / 80 <= t + 1e-9);
    if (traced.length > 1)
      root.add(instancedSegments(THREE, seg(traced), 0.035, mat(theme.accent)));
    const levels = deCasteljau(cp, t);
    const shades = [theme.inkMuted, "#4f9fd9", "#6cc27a"];
    levels.forEach((pts, li) => {
      if (pts.length > 1)
        root.add(
          instancedSegments(
            THREE,
            seg(pts),
            0.018,
            mat(shades[Math.min(li, shades.length - 1)]),
          ),
        );
      root.add(
        instancedSpheres(
          THREE,
          pts,
          li === 0 ? 0.07 : 0.05,
          mat(li === 0 ? theme.ink : shades[Math.min(li, shades.length - 1)]),
        ),
      );
    });
    const tip = levels[levels.length - 1][0];
    root.add(instancedSpheres(THREE, [tip], 0.09, mat(theme.accent)));
    root.scale.setScalar(1.25);
  },
);

// ---------------------------------------------------------------------------
// 黄金長方形と正二十面体
// ---------------------------------------------------------------------------

const RECT_COLORS = ["#d9694f", "#4f9fd9", "#6cc27a"];

export const goldenScene: SceneBuilder<GoldenParams> = rebuildScene(
  (ctx, root, { icosahedron }) => {
    const { THREE, theme } = ctx;
    const rects = goldenRectangles();
    const k = 0.95;
    rects.forEach((r, i) => {
      const color = RECT_COLORS[i];
      const pts = r.map((p): Vec3 => [p[0] * k, p[1] * k, p[2] * k]);
      const fill = new THREE.Mesh(
        geometryFromMeshData(THREE, {
          positions: new Float32Array(pts.flat()),
          indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
        }),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.28,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      root.add(fill);
      const loop: [Vec3, Vec3][] = pts.map((p, j) => [p, pts[(j + 1) % 4]]);
      root.add(
        instancedSegments(
          THREE,
          loop,
          0.022,
          new THREE.MeshBasicMaterial({ color }),
        ),
      );
    });
    const verts = rects.flat().map((p): Vec3 => [p[0] * k, p[1] * k, p[2] * k]);
    root.add(
      instancedSpheres(
        THREE,
        verts,
        0.07,
        new THREE.MeshBasicMaterial({ color: theme.ink }),
      ),
    );
    if (icosahedron) {
      const edges = icosahedronEdges().map(([a, b]): [Vec3, Vec3] => [
        [a[0] * k, a[1] * k, a[2] * k],
        [b[0] * k, b[1] * k, b[2] * k],
      ]);
      root.add(
        instancedSegments(
          THREE,
          edges,
          0.012,
          new THREE.MeshBasicMaterial({ color: theme.inkMuted }),
        ),
      );
    }
    const label = makeLabel(
      THREE,
      `短辺 : 長辺 = 1 : ${PHI.toFixed(3)}`,
      theme.ink,
      { size: 0.3 },
    );
    label.position.set(0, 2.2, 0);
    root.add(label);
    root.scale.setScalar(0.85);
  },
);
