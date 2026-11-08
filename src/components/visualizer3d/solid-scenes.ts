import type * as ThreeNS from "three";
import type { SceneBuilder, SceneContext, Three } from "./Viewport3D";
import {
  addLights,
  clearGroup,
  instancedSegments,
  instancedSpheres,
  makeLabel,
} from "./scene-utils";
import {
  dualHull,
  rotationAxes,
  solidHull,
  spaceFillingCenters,
  type Hull,
  type HullSolidId,
  type SpaceFiller,
} from "@/lib/geometry3d/hull";
import type { Vec3 } from "@/lib/geometry3d/mesh-data";

/** 凸包から作る立体(半正多面体・双対・回転軸・空間充填)と、回転体・体積・断面・アイソメのシーン。 */

/** 面の辺の数ごとの色(三角=暖色、四角=青、五角=緑、六角=黄、八角=紫)。画面には凡例を出す。 */
export const SIDES_COLOR: Record<number, string> = {
  3: "#d9694f",
  4: "#4f9fd9",
  5: "#6cc27a",
  6: "#e0b84a",
  8: "#9a6cc2",
  10: "#c27a9a",
};
export const FOLD_COLOR: Record<number, string> = {
  2: "#4f9fd9",
  3: "#6cc27a",
  4: "#d9694f",
  5: "#9a6cc2",
};

export type HullSolidParams = {
  solid: HullSolidId;
  dual: boolean;
  axes: boolean;
};

export type SpaceFillingParams = {
  kind: SpaceFiller;
  gap: number;
  cluster: boolean;
};
export type RevolveParams = { profile: RevolveProfile; sweep: number };
export type ArchimedesParams = { nested: boolean };
export type CavalieriParams = { h: number };
export type BoxDiagonalParams = { a: number; b: number; c: number };
export type CatenoidParams = { a: number };
export type HelixParams = { pitch: number; turns: number };
export type IsometricParams = { size: number };

export type RevolveProfile =
  "cylinder" | "cone" | "sphere" | "frustum" | "paraboloid";

type Build<P> = (ctx: SceneContext, root: ThreeNS.Group, params: P) => void;

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

/** 凸包の面を、辺の数ごとの色の三角形(平らな陰影)にする。 */
function hullGeometry(
  THREE: Three,
  hull: Hull,
  scale = 1,
): ThreeNS.BufferGeometry {
  const pos: number[] = [];
  const col: number[] = [];
  const color = new THREE.Color();
  for (const f of hull.faces) {
    color.set(SIDES_COLOR[f.length] ?? "#999999");
    for (let i = 1; i < f.length - 1; i++) {
      for (const idx of [f[0], f[i], f[i + 1]]) {
        const v = hull.vertices[idx];
        pos.push(v[0] * scale, v[1] * scale, v[2] * scale);
        col.push(color.r, color.g, color.b);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(pos), 3),
  );
  g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(col), 3));
  g.computeVertexNormals();
  return g;
}

function edgePairs(hull: Hull, scale = 1): [Vec3, Vec3][] {
  return hull.edges.map(([a, b]) => [
    [
      hull.vertices[a][0] * scale,
      hull.vertices[a][1] * scale,
      hull.vertices[a][2] * scale,
    ],
    [
      hull.vertices[b][0] * scale,
      hull.vertices[b][1] * scale,
      hull.vertices[b][2] * scale,
    ],
  ]);
}

// ---------------------------------------------------------------------------
// 凸包の立体(半正多面体・双対・回転軸)
// ---------------------------------------------------------------------------

export const hullSolidScene: SceneBuilder<HullSolidParams> = rebuildScene(
  (ctx, root, { solid, dual, axes }) => {
    const { THREE, theme } = ctx;
    const hull = solidHull(solid);
    const S = 1.7;
    root.add(
      new THREE.Mesh(
        hullGeometry(THREE, hull, S),
        new THREE.MeshStandardMaterial({
          vertexColors: true,
          flatShading: true,
          transparent: dual || axes,
          opacity: dual || axes ? 0.55 : 1,
          side: THREE.DoubleSide,
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
        }),
      ),
    );
    root.add(
      instancedSegments(
        THREE,
        edgePairs(hull, S),
        0.014,
        new THREE.MeshBasicMaterial({ color: theme.ink }),
      ),
    );
    if (dual) {
      const d = dualHull(hull);
      // 双対の頂点は、元の面の中心。辺を、元の面と直交するように結ぶ
      root.add(
        instancedSegments(
          THREE,
          edgePairs(d, S),
          0.022,
          new THREE.MeshBasicMaterial({ color: theme.accent }),
        ),
      );
      root.add(
        instancedSpheres(
          THREE,
          d.vertices.map((v): Vec3 => [v[0] * S, v[1] * S, v[2] * S]),
          0.05,
          new THREE.MeshBasicMaterial({ color: theme.accent }),
        ),
      );
    }
    if (axes) {
      const ax = rotationAxes(hull);
      const pairs: [Vec3, Vec3][] = [];
      const colors: string[] = [];
      for (const a of ax) {
        const d = a.direction;
        pairs.push([
          [-d[0] * 2.25, -d[1] * 2.25, -d[2] * 2.25],
          [d[0] * 2.25, d[1] * 2.25, d[2] * 2.25],
        ]);
        colors.push(FOLD_COLOR[a.fold] ?? "#999999");
      }
      root.add(
        instancedSegments(
          THREE,
          pairs,
          0.022,
          new THREE.MeshBasicMaterial({ color: 0xffffff }),
          (i) => new THREE.Color(colors[i]),
        ),
      );
    }
  },
);

// ---------------------------------------------------------------------------
// 空間充填
// ---------------------------------------------------------------------------

export const spaceFillingScene: SceneBuilder<SpaceFillingParams> = rebuildScene(
  (ctx, root, { kind, gap, cluster }) => {
    const { THREE } = ctx;
    const hull = solidHull(kind);
    const geo = hullGeometry(THREE, hull, 1);
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: true,
      side: THREE.DoubleSide,
    });
    if (!cluster) {
      const m = new THREE.Mesh(geo, material);
      m.scale.setScalar(1.7);
      root.add(m);
      return;
    }
    // 中心から近い順に並べた塊(原点のまわりの球の内側)
    const radius =
      kind === "cube" ? 2.4 : kind === "truncated-octahedron" ? 3.4 : 3.1;
    const centers = spaceFillingCenters(kind, radius);
    const mesh = new THREE.InstancedMesh(geo, material, centers.length);
    const mat = new THREE.Matrix4();
    centers.forEach((c, i) => {
      mat.compose(
        new THREE.Vector3(c[0] * gap, c[1] * gap, c[2] * gap),
        new THREE.Quaternion(),
        new THREE.Vector3(1, 1, 1),
      );
      mesh.setMatrixAt(i, mat);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.scale.setScalar(0.62);
    root.add(mesh);
  },
);

// ---------------------------------------------------------------------------
// 回転体
// ---------------------------------------------------------------------------

/** 半平面の輪郭 (r, y)。回転軸は y 軸。 */
export function revolveProfile(profile: RevolveProfile): [number, number][] {
  const pts: [number, number][] = [];
  const N = 48;
  if (profile === "cylinder") {
    pts.push([0, -1], [1, -1], [1, 1], [0, 1]);
  } else if (profile === "cone") {
    pts.push([0, -1], [1, -1], [0, 1]);
  } else if (profile === "frustum") {
    pts.push([0, -1], [1, -1], [0.5, 1], [0, 1]);
  } else if (profile === "sphere") {
    for (let i = 0; i <= N; i++) {
      const t = -Math.PI / 2 + (Math.PI * i) / N;
      pts.push([Math.cos(t), Math.sin(t)]);
    }
  } else {
    // 回転放物体(お椀の形): y = 2r² − 1(r: 0→1)。上のふたは、軸まで戻る線
    pts.push([0, -1]);
    for (let i = 1; i <= N; i++) {
      const r = i / N;
      pts.push([r, 2 * r * r - 1]);
    }
    pts.push([0, 1]);
  }
  return pts;
}

export const revolveScene: SceneBuilder<RevolveParams> = rebuildScene(
  (ctx, root, { profile, sweep }) => {
    const { THREE, theme } = ctx;
    const prof = revolveProfile(profile);
    const phi = Math.max(0.001, sweep) * 2 * Math.PI;
    const points = prof.map(([r, y]) => new THREE.Vector2(r, y));
    const lathe = new THREE.Mesh(
      new THREE.LatheGeometry(points, 64, 0, phi),
      new THREE.MeshStandardMaterial({
        color: theme.accent,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        flatShading: false,
      }),
    );
    lathe.position.x = 0;
    root.add(lathe);
    // 元の平面図形(半平面)を、回転の始まりの位置に出す
    const shape: [Vec3, Vec3][] = [];
    const closed = [...prof, prof[0]];
    for (let i = 1; i < closed.length; i++)
      shape.push([
        [closed[i - 1][0], closed[i - 1][1], 0],
        [closed[i][0], closed[i][1], 0],
      ]);
    root.add(
      instancedSegments(
        THREE,
        shape,
        0.03,
        new THREE.MeshBasicMaterial({ color: theme.ink }),
      ),
    );
    // 回転軸
    root.add(
      instancedSegments(
        THREE,
        [
          [
            [0, -1.3, 0],
            [0, 1.3, 0],
          ],
        ],
        0.012,
        new THREE.MeshBasicMaterial({ color: theme.inkMuted }),
      ),
    );
    root.scale.setScalar(1.45);
  },
);

// ---------------------------------------------------------------------------
// アルキメデスの円柱・球・円錐(体積 3 : 2 : 1)
// ---------------------------------------------------------------------------

export const archimedesScene: SceneBuilder<ArchimedesParams> = rebuildScene((ctx, root, { nested }) => {
  const { THREE, theme } = ctx;
  const mat = (color: string, opacity = 0.85) => new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.6 });
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2, 48), mat(theme.inkMuted, nested ? 0.18 : 0.85));
  const sph = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), mat("#d9694f"));
  root.add(cyl, sph);
  if (nested) {
    // 重ねる: 円柱の中に、球がちょうど収まる。円柱の体積の 2/3 が球、残り 1/3 が円錐1つぶん
    cyl.position.x = 0;
    sph.position.x = 0;
  } else {
    // 円錐は、底面の半径 1・高さ 2(頂点を上に)
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 48), mat("#4f9fd9"));
    cone.position.x = -2.3;
    cyl.position.x = 2.3;
    root.add(cone);
    for (const [text, x] of [["円錐 1", -2.3], ["球 2", 0], ["円柱 3", 2.3]] as [string, number][]) {
      const s = makeLabel(THREE, text, theme.ink, { size: 0.32 });
      s.position.set(x, -1.55, 0);
      root.add(s);
    }
  }
  root.scale.setScalar(nested ? 1.2 : 0.62);
});

// ---------------------------------------------------------------------------
// カヴァリエリの原理(半球と、円柱から円錐をくり抜いた立体)
// ---------------------------------------------------------------------------

export const cavalieriScene: SceneBuilder<CavalieriParams> = rebuildScene(
  (ctx, root, { h }) => {
    const { THREE, theme } = ctx;
    const glass = (color: string) =>
      new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
    const x0 = -1.35;
    const x1 = 1.35;
    // 左: 半球(半径1、平らな面が下)
    const hemi = new THREE.Mesh(
      new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
      glass(theme.accent),
    );
    hemi.position.set(x0, 0, 0);
    root.add(hemi);
    // 右: 円柱(半径1・高さ1)から、頂点が底の中心にある円錐をくり抜いたもの
    const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 1, 48, 1, true),
      glass(theme.inkMuted),
    );
    cyl.position.set(x1, 0.5, 0);
    root.add(cyl);
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(1, 1, 48, 1, true),
      glass("#d9694f"),
    );
    cone.rotation.x = Math.PI; // 頂点を下に
    cone.position.set(x1, 0.5, 0);
    root.add(cone);
    // 切る高さ h の円板 / 円環
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(Math.sqrt(Math.max(0, 1 - h * h)), 64),
      new THREE.MeshBasicMaterial({
        color: theme.accent,
        side: THREE.DoubleSide,
      }),
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(x0, h, 0);
    root.add(disc);
    if (h > 0.001) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(h, 1, 64),
        new THREE.MeshBasicMaterial({
          color: "#d9694f",
          side: THREE.DoubleSide,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x1, h, 0);
      root.add(ring);
    }
    // 底の面
    for (const x of [x0, x1]) {
      const base = new THREE.Mesh(
        new THREE.CircleGeometry(1, 64),
        new THREE.MeshBasicMaterial({
          color: theme.line,
          side: THREE.DoubleSide,
        }),
      );
      base.rotation.x = -Math.PI / 2;
      base.position.set(x, -0.001, 0);
      root.add(base);
    }
    root.position.y = -0.4;
    root.scale.setScalar(1.35);
  },
);

// ---------------------------------------------------------------------------
// 直方体の対角線(三平方の定理の空間版)
// ---------------------------------------------------------------------------

export const boxDiagonalScene: SceneBuilder<BoxDiagonalParams> = rebuildScene(
  (ctx, root, { a, b, c }) => {
    const { THREE, theme } = ctx;
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(a, c, b),
      new THREE.MeshStandardMaterial({
        color: theme.accent,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    root.add(box);
    root.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(box.geometry),
        new THREE.LineBasicMaterial({ color: theme.ink }),
      ),
    );
    const P = (x: number, y: number, z: number): Vec3 => [
      x * a - a / 2,
      y * c - c / 2,
      z * b - b / 2,
    ];
    const base: [Vec3, Vec3] = [P(0, 0, 0), P(1, 0, 1)]; // 底面の対角線
    const diag: [Vec3, Vec3] = [P(0, 0, 0), P(1, 1, 1)]; // 空間の対角線
    const rise: [Vec3, Vec3] = [P(1, 0, 1), P(1, 1, 1)];
    root.add(
      instancedSegments(
        THREE,
        [base],
        0.03,
        new THREE.MeshBasicMaterial({ color: "#4f9fd9" }),
      ),
    );
    root.add(
      instancedSegments(
        THREE,
        [rise],
        0.03,
        new THREE.MeshBasicMaterial({ color: "#6cc27a" }),
      ),
    );
    root.add(
      instancedSegments(
        THREE,
        [diag],
        0.04,
        new THREE.MeshBasicMaterial({ color: "#d9694f" }),
      ),
    );
    root.add(
      instancedSpheres(
        THREE,
        [diag[0], diag[1]],
        0.06,
        new THREE.MeshBasicMaterial({ color: theme.ink }),
      ),
    );
    root.scale.setScalar(1.1);
  },
);

// ---------------------------------------------------------------------------
// 懸垂面(カテノイド)
// ---------------------------------------------------------------------------

export const catenoidScene: SceneBuilder<CatenoidParams> = rebuildScene(
  (ctx, root, { a }) => {
    const { THREE, theme } = ctx;
    const zMax = 1.3;
    const pts: ThreeNS.Vector2[] = [];
    for (let i = 0; i <= 48; i++) {
      const z = -zMax + (2 * zMax * i) / 48;
      pts.push(new THREE.Vector2(a * Math.cosh(z / a), z));
    }
    const surface = new THREE.Mesh(
      new THREE.LatheGeometry(pts, 64),
      new THREE.MeshStandardMaterial({
        color: theme.accent,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      }),
    );
    root.add(surface);
    const curve: [Vec3, Vec3][] = [];
    for (let i = 1; i < pts.length; i++)
      curve.push([
        [pts[i - 1].x, pts[i - 1].y, 0],
        [pts[i].x, pts[i].y, 0],
      ]);
    root.add(
      instancedSegments(
        THREE,
        curve,
        0.03,
        new THREE.MeshBasicMaterial({ color: theme.ink }),
      ),
    );
    root.add(
      instancedSegments(
        THREE,
        [
          [
            [0, -1.6, 0],
            [0, 1.6, 0],
          ],
        ],
        0.012,
        new THREE.MeshBasicMaterial({ color: theme.inkMuted }),
      ),
    );
    root.scale.setScalar(1.15);
  },
);

// ---------------------------------------------------------------------------
// つる巻き線(ヘリックス)
// ---------------------------------------------------------------------------

export const helixScene: SceneBuilder<HelixParams> = rebuildScene(
  (ctx, root, { pitch, turns }) => {
    const { THREE, theme } = ctx;
    const R = 1;
    const total = turns * 2 * Math.PI;
    const pts: Vec3[] = [];
    const n = Math.round(turns * 64);
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * total;
      pts.push([
        R * Math.cos(t),
        (pitch * t) / (2 * Math.PI) - (pitch * turns) / 2,
        R * Math.sin(t),
      ]);
    }
    const pairs: [Vec3, Vec3][] = pts.slice(1).map((p, i) => [pts[i], p]);
    root.add(
      instancedSegments(
        THREE,
        pairs,
        0.04,
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
        (i) =>
          new THREE.Color().setHSL(0.02 + (0.6 * i) / pairs.length, 0.65, 0.55),
      ),
    );
    // 円柱(ガイド)
    const height = pitch * turns;
    const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(R, R, height, 48, 1, true),
      new THREE.MeshBasicMaterial({
        color: theme.inkMuted,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    root.add(cyl);
    root.add(
      instancedSegments(
        THREE,
        [
          [
            [0, -height / 2 - 0.2, 0],
            [0, height / 2 + 0.2, 0],
          ],
        ],
        0.012,
        new THREE.MeshBasicMaterial({ color: theme.inkMuted }),
      ),
    );
    root.scale.setScalar(Math.min(1.3, 2.6 / Math.max(height, 2)));
  },
);

// ---------------------------------------------------------------------------
// 立方体の積み木(アイソメトリック)
// ---------------------------------------------------------------------------

export const isometricScene: SceneBuilder<IsometricParams> = rebuildScene(
  (ctx, root, { size }) => {
    const { THREE } = ctx;
    // 階段状に積む: 列 (i,j) の高さ = size − max(i,j)
    const cubes: Vec3[] = [];
    for (let i = 0; i < size; i++)
      for (let j = 0; j < size; j++)
        for (let k = 0; k < size - Math.max(i, j); k++) cubes.push([i, k, j]);
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.98, 0.98, 0.98),
      new THREE.MeshLambertMaterial({ color: "#e8e4dc" }),
      cubes.length,
    );
    const m = new THREE.Matrix4();
    cubes.forEach((c, i) => {
      m.setPosition(
        c[0] - (size - 1) / 2,
        c[1] - (size - 1) / 2,
        c[2] - (size - 1) / 2,
      );
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    root.add(mesh);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.98, 0.98, 0.98)),
      new THREE.LineBasicMaterial({ color: 0x333333 }),
    );
    for (const c of cubes) {
      const e = edges.clone();
      e.position.set(
        c[0] - (size - 1) / 2,
        c[1] - (size - 1) / 2,
        c[2] - (size - 1) / 2,
      );
      root.add(e);
    }
    root.scale.setScalar(1.6 / Math.max(1, size * 0.6));
  },
);
