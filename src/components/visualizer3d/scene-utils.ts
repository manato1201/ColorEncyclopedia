import type * as ThreeNS from "three";
import type { MeshData, Vec3 } from "@/lib/geometry3d/mesh-data";
import type { SceneContext, Three } from "./Viewport3D";

/** シーン作りで共通して使う小さな部品(線・球・文字ラベル・後片付け)。 */

export function geometryFromMeshData(
  THREE: Three,
  data: MeshData,
): ThreeNS.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
  if (data.colors)
    g.setAttribute("color", new THREE.BufferAttribute(data.colors, 3));
  g.setIndex(new THREE.BufferAttribute(data.indices, 1));
  g.computeVertexNormals();
  return g;
}

/** 線分の集まり(2点ずつ)。 */
export function segmentsGeometry(
  THREE: Three,
  pairs: [Vec3, Vec3][],
): ThreeNS.BufferGeometry {
  const arr = new Float32Array(pairs.length * 6);
  pairs.forEach(([a, b], i) => arr.set([...a, ...b], i * 6));
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  return g;
}

/** グループの子を、後始末(geometry・material・textureのdispose)をして空にする。 */
export function clearGroup(group: ThreeNS.Object3D): void {
  for (const child of [...group.children]) {
    group.remove(child);
    child.traverse((obj) => {
      const m = obj as ThreeNS.Mesh;
      m.geometry?.dispose?.();
      const mats = Array.isArray(m.material)
        ? m.material
        : m.material
          ? [m.material]
          : [];
      for (const mat of mats) {
        (mat as ThreeNS.SpriteMaterial).map?.dispose();
        mat.dispose();
      }
      (m as ThreeNS.InstancedMesh).dispose?.();
    });
  }
}

/** 標準的な明かりを足す。 */
export function addLights(ctx: SceneContext): void {
  const { THREE, scene } = ctx;
  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(3, 5, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.5);
  fill.position.set(-4, -2, -3);
  scene.add(fill);
}

/** 文字のラベル(常にこちらを向く)。日本語はOSのフォントで描く。 */
export function makeLabel(
  THREE: Three,
  text: string,
  color: string,
  options: { size?: number; background?: string } = {},
): ThreeNS.Sprite {
  const size = options.size ?? 0.34;
  const px = 44;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const font = `600 ${px}px "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif`;
  ctx.font = font;
  const padX = 18;
  const w = Math.ceil(ctx.measureText(text).width) + padX * 2;
  const h = px + 22;
  canvas.width = w;
  canvas.height = h;
  ctx.font = font;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  if (options.background) {
    ctx.fillStyle = options.background;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, w / 2, h / 2 + 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    }),
  );
  sprite.scale.set((w / h) * size, size, 1);
  sprite.renderOrder = 10;
  return sprite;
}

/** 点列を結ぶ細い円柱の束(InstancedMesh)。線幅が使えないWebGLで、太さのある線を引くため。 */
export function instancedSegments(
  THREE: Three,
  pairs: [Vec3, Vec3][],
  radius: number | ((i: number) => number),
  material: ThreeNS.Material,
  colorAt?: (i: number) => ThreeNS.Color,
): ThreeNS.InstancedMesh {
  const geo = new THREE.CylinderGeometry(1, 1, 1, 8, 1);
  const mesh = new THREE.InstancedMesh(
    geo,
    material,
    Math.max(1, pairs.length),
  );
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const pos = new THREE.Vector3();
  const scale = new THREE.Vector3();
  pairs.forEach(([p, r], i) => {
    a.set(...p);
    b.set(...r);
    dir.subVectors(b, a);
    const length = dir.length();
    pos.addVectors(a, b).multiplyScalar(0.5);
    if (length > 1e-9) q.setFromUnitVectors(up, dir.divideScalar(length));
    else q.identity();
    const rad = typeof radius === "number" ? radius : radius(i);
    scale.set(rad, Math.max(length, 1e-6), rad);
    m.compose(pos, q, scale);
    mesh.setMatrixAt(i, m);
    if (colorAt) mesh.setColorAt(i, colorAt(i));
  });
  mesh.count = pairs.length;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

/** 球の束(InstancedMesh)。 */
export function instancedSpheres(
  THREE: Three,
  points: Vec3[],
  radius: number | ((i: number) => number),
  material: ThreeNS.Material,
  colorAt?: (i: number) => ThreeNS.Color,
  segments = 12,
): ThreeNS.InstancedMesh {
  const geo = new THREE.SphereGeometry(
    1,
    segments,
    Math.max(6, Math.round(segments / 2)),
  );
  const mesh = new THREE.InstancedMesh(
    geo,
    material,
    Math.max(1, points.length),
  );
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scale = new THREE.Vector3();
  points.forEach((p, i) => {
    pos.set(...p);
    const r = typeof radius === "number" ? radius : radius(i);
    scale.set(r, r, r);
    m.compose(pos, q, scale);
    mesh.setMatrixAt(i, m);
    if (colorAt) mesh.setColorAt(i, colorAt(i));
  });
  mesh.count = points.length;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

/** 0〜1 の位置を、虹色(色相)の色にする(順序を見せるため)。 */
export function rainbow(
  THREE: Three,
  t: number,
  s = 0.65,
  l = 0.55,
): ThreeNS.Color {
  const c = new THREE.Color();
  c.setHSL(((t % 1) + 1) % 1, s, l);
  return c;
}
