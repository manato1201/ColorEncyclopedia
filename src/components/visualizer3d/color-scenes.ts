import type * as ThreeNS from "three";
import type { SceneBuilder, SceneContext } from "./Viewport3D";
import { clearGroup, geometryFromMeshData, instancedSegments, instancedSpheres, makeLabel } from "./scene-utils";
import {
  colorPosition,
  HSV_SOLID_HEIGHT,
  hsvSolidMesh,
  labGamutCloud,
  LAB_SOLID_HEIGHT,
  RGB_CORNERS,
  rgbCubeMesh,
  type ColorSpace,
} from "@/lib/geometry3d/color-solids";
import type { Vec3 } from "@/lib/geometry3d/mesh-data";

export type ColorMarker = { name: string; hex: string };

export type ColorSpaceParams = {
  space: ColorSpace;
  markers: ColorMarker[];
  /** HSV円柱の扇形の切り取り(等色相面を出す)。 */
  cut: boolean;
  /** マーカーに名前のラベルを付けるか。 */
  labels: boolean;
};

export type AtlasParams = {
  space: ColorSpace;
  markers: ColorMarker[];
  /** 選択中の点の番号(なければ -1)。 */
  selected: number;
  /** 点をクリックしたときに呼ぶ(ドラッグで回しただけのときは呼ばない)。 */
  onPick: (index: number) => void;
};

/** 切り取りの位置(度)と幅(度)。 */
const CUT_START = 200;
const CUT_SPAN = 90;

/**
 * 色立体の背景(空間の形・軸・ラベル)を root に描く。色は、明かりの影響を受けない MeshBasic / Points で、値のまま出す。
 */
function drawBackdrop(ctx: SceneContext, root: ThreeNS.Group, space: ColorSpace, cut: boolean, opacity = 1): void {
  const { THREE, theme } = ctx;
  // 立体の内側にある点も見えるよう、不透明度を下げて描くことがある(面は奥行きを乱さないよう depthWrite を切る)
  const solidMaterial = () =>
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
  const axis = (a: Vec3, b: Vec3) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array([...a, ...b]), 3));
    root.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: theme.inkMuted })));
  };
  const label = (text: string, at: Vec3, size = 0.2) => {
    const s = makeLabel(THREE, text, theme.ink, { size });
    s.position.set(...at);
    root.add(s);
  };

  if (space === "rgb") {
    const geo = geometryFromMeshData(THREE, rgbCubeMesh(10));
    root.add(new THREE.Mesh(geo, solidMaterial()));
    root.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2, 2, 2)), new THREE.LineBasicMaterial({ color: theme.ink })));
    // 無彩色の軸(黒→白)
    axis([-1, -1, -1], [1, 1, 1]);
    for (const c of RGB_CORNERS) {
      const pos = c.rgb.map((n) => (n * 2 - 1) * 1.32) as Vec3;
      label(c.label, pos, 0.2);
    }
  } else if (space === "hsv") {
    const geo = geometryFromMeshData(THREE, hsvSolidMesh(cut ? { cutStart: CUT_START, cutSpan: CUT_SPAN } : { cutStart: 0, cutSpan: 0 }));
    root.add(new THREE.Mesh(geo, solidMaterial()));
    const h = HSV_SOLID_HEIGHT / 2;
    axis([0, -h, 0], [0, h, 0]);
    label("V 大(明るい)", [0, h + 0.22, 0]);
    label("V 小(暗い)", [0, -h - 0.22, 0]);
    label("H 色相は角度", [1.6, 0, 0], 0.17);
    label("S 彩度は中心から", [1.6, -0.22, 0], 0.17);
  } else {
    const cloud = labGamutCloud(26);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(cloud.positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(cloud.colors, 3));
    root.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 0.05, vertexColors: true, sizeAttenuation: true })));
    const h = LAB_SOLID_HEIGHT / 2;
    axis([0, -h, 0], [0, h, 0]);
    axis([-1.1, 0, 0], [1.1, 0, 0]);
    axis([0, 0, -1.1], [0, 0, 1.1]);
    label("L* 明るさ", [0, h + 0.2, 0]);
    label("+a* 赤み", [1.4, 0, 0], 0.17);
    label("−a* 緑み", [-1.4, 0, 0], 0.17);
    label("+b* 黄み", [0, 0, -1.4], 0.17);
    label("−b* 青み", [0, 0, 1.4], 0.17);
  }
}

/** 色立体のシーン(選んだ色を、輪郭付きの球で示す)。 */
export const colorSpaceScene: SceneBuilder<ColorSpaceParams> = (ctx, params) => {
  const { THREE, theme } = ctx;
  const root = new THREE.Group();
  ctx.scene.add(root);

  const build = (p: ColorSpaceParams) => {
    clearGroup(root);
    // 切り取りのとき以外は半透明にして、立体の内側の色の位置も見えるようにする
    drawBackdrop(ctx, root, p.space, p.cut, p.cut ? 1 : 0.42);

    for (const m of p.markers) {
      const pos = colorPosition(p.space, m.hex);
      const outer = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 14), new THREE.MeshBasicMaterial({ color: theme.ink, side: THREE.BackSide }));
      const inner = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), new THREE.MeshBasicMaterial({ color: m.hex }));
      outer.position.set(...pos);
      inner.position.set(...pos);
      outer.renderOrder = 5;
      inner.renderOrder = 6;
      root.add(outer, inner);
      if (p.labels) {
        const s = makeLabel(THREE, m.name, theme.ink, { size: 0.18, background: theme.paper });
        s.position.set(pos[0], pos[1] + 0.22, pos[2]);
        root.add(s);
      }
    }
    // 位置を目で追えるよう、マーカーから底の面へ細い線を下ろす(1色のときだけ)
    if (p.markers.length === 1 && p.space !== "rgb") {
      const pos = colorPosition(p.space, p.markers[0].hex);
      const floor = -(p.space === "hsv" ? HSV_SOLID_HEIGHT : LAB_SOLID_HEIGHT) / 2;
      root.add(instancedSegments(THREE, [[pos, [pos[0], floor, pos[2]]]], 0.008, new THREE.MeshBasicMaterial({ color: theme.inkMuted })));
    }
  };

  build(params);
  return {
    update: (p) => {
      build(p);
      ctx.requestRender();
    },
    dispose: () => clearGroup(root),
  };
};

/**
 * 色彩Atlasの3D版: 全収録色を点にして色立体の中に置く。点をクリックすると選べる
 * (ドラッグで回したときは選ばない)。選択中の点は大きく、名前を出す。
 */
export const atlasScene: SceneBuilder<AtlasParams> = (ctx, params) => {
  const { THREE, theme, dom, camera } = ctx;
  const root = new THREE.Group();
  ctx.scene.add(root);
  let current = params;
  let pickMesh: ThreeNS.InstancedMesh | null = null;

  const build = (p: AtlasParams) => {
    clearGroup(root);
    pickMesh = null;
    drawBackdrop(ctx, root, p.space, false, 0.28);
    const pts = p.markers.map((m) => colorPosition(p.space, m.hex));
    // 輪郭(墨)の球と、色の球を重ねる
    root.add(instancedSpheres(THREE, pts, 0.062, new THREE.MeshBasicMaterial({ color: theme.ink, side: THREE.BackSide }), undefined, 10));
    root.add(instancedSpheres(THREE, pts, 0.045, new THREE.MeshBasicMaterial({ color: 0xffffff }), (i) => new THREE.Color(p.markers[i].hex), 10));
    // クリックの判定用(見えない、少し大きい球)
    pickMesh = instancedSpheres(THREE, pts, 0.1, new THREE.MeshBasicMaterial({ visible: false }), undefined, 6);
    root.add(pickMesh);
    const sel = p.markers[p.selected];
    if (sel) {
      const pos = colorPosition(p.space, sel.hex);
      const ring = new THREE.Mesh(new THREE.SphereGeometry(0.125, 20, 14), new THREE.MeshBasicMaterial({ color: theme.accent, side: THREE.BackSide }));
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 14), new THREE.MeshBasicMaterial({ color: sel.hex }));
      ring.position.set(...pos);
      core.position.set(...pos);
      ring.renderOrder = 5;
      core.renderOrder = 6;
      root.add(ring, core);
      const s = makeLabel(THREE, sel.name, theme.ink, { size: 0.2, background: theme.paper });
      s.position.set(pos[0], pos[1] + 0.26, pos[2]);
      root.add(s);
    }
  };

  const raycaster = new THREE.Raycaster();
  let down: { x: number; y: number } | null = null;
  const onDown = (e: PointerEvent) => {
    down = { x: e.clientX, y: e.clientY };
  };
  const onUp = (e: PointerEvent) => {
    if (!down || !pickMesh) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    down = null;
    if (moved > 5) return; // ドラッグ(回転)
    const rect = dom.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -(((e.clientY - rect.top) / rect.height) * 2 - 1));
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(pickMesh, false)[0];
    if (hit && hit.instanceId !== undefined) current.onPick(hit.instanceId);
  };
  dom.addEventListener("pointerdown", onDown);
  dom.addEventListener("pointerup", onUp);

  build(params);
  return {
    update: (p) => {
      current = p;
      build(p);
      ctx.requestRender();
    },
    dispose: () => {
      dom.removeEventListener("pointerdown", onDown);
      dom.removeEventListener("pointerup", onUp);
      clearGroup(root);
    },
  };
};
