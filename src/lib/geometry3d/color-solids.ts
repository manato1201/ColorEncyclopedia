import { hexToRgb, hsvToRgb, rgbToLab, type Rgb } from "../color-math.ts";
import { gridSurface, mergeMeshData, type MeshData, type Vec3 } from "./mesh-data.ts";

/**
 * 色立体(色の空間)の幾何データ。
 * 3つの空間はどれも、見かけの大きさがほぼ [-1, 1] に収まるよう揃えてある(y が上)。
 * - RGB立方体: R→x, G→y, B→z(各0〜255)
 * - HSV円柱: 色相=角度(赤が+x、上から見て反時計回り)、彩度=半径、明度=高さ
 * - Lab: a*→x、b*→-z(HSVの色相の向きと揃える)、L*→高さ
 * PCCS・マンセルの色立体は、対応表が要るため計算していない(ここにあるのは数式で決まる空間だけ)。
 */

export type ColorSpace = "rgb" | "hsv" | "lab";

export const COLOR_SPACES: readonly ColorSpace[] = ["rgb", "hsv", "lab"];

export const COLOR_SPACE_LABEL: Record<ColorSpace, string> = {
  rgb: "RGB立方体",
  hsv: "HSV円柱",
  lab: "Lab(L*a*b*)",
};

/** HSV円柱の高さ(底〜上面。半径は1)。 */
const HSV_HEIGHT = 1.6;
/** Labで、a*・b*の1.0に相当する値と、L*の100に相当する高さ。 */
const LAB_RADIUS = 110;
const LAB_HEIGHT = 1.6;

function unit(rgb: Rgb): Vec3 {
  return [rgb.r / 255, rgb.g / 255, rgb.b / 255];
}

/** 色(HEX)の、各空間での位置。 */
export function colorPosition(space: ColorSpace, hex: string): Vec3 {
  const rgb = hexToRgb(hex);
  if (space === "rgb") return [rgb.r / 255 * 2 - 1, rgb.g / 255 * 2 - 1, rgb.b / 255 * 2 - 1];
  if (space === "hsv") {
    // 丸めなしで求める(rgbToHsvは整数丸めのため、位置が少しずれる)
    const rn = rgb.r / 255;
    const gn = rgb.g / 255;
    const bn = rgb.b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === rn) h = ((gn - bn) / d) % 6;
      else if (max === gn) h = (bn - rn) / d + 2;
      else h = (rn - gn) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    const s = max === 0 ? 0 : d / max;
    const rad = (h * Math.PI) / 180;
    return [s * Math.cos(rad), (max - 0.5) * HSV_HEIGHT, -s * Math.sin(rad)];
  }
  const lab = rgbToLab(rgb);
  return [lab.a / LAB_RADIUS, ((lab.l - 50) / 100) * LAB_HEIGHT, -lab.b / LAB_RADIUS];
}

/** HSV(h:度, s・v:0〜1)の色を 0〜1 の sRGB にする。 */
function hsv01(h: number, s: number, v: number): Vec3 {
  const rgb = hsvToRgb({ h: ((h % 360) + 360) % 360, s: s * 100, v: v * 100 });
  return unit(rgb);
}

/**
 * HSV円柱。cutSpan>0 のとき、cutStart度から cutSpan度ぶんの扇形を切り取り、
 * 切り口に「同じ色相の、彩度×明度のページ」(等色相面)を出す。
 */
export function hsvSolidMesh(options: { cutStart: number; cutSpan: number; segments?: number }): MeshData {
  const { cutStart, cutSpan } = options;
  const seg = options.segments ?? 96;
  const visibleSpan = 360 - cutSpan;
  const angleOf = (u: number) => cutStart + cutSpan + u * visibleSpan; // 度
  const polar = (hueDeg: number, s: number, v: number): Vec3 => {
    const rad = (hueDeg * Math.PI) / 180;
    return [s * Math.cos(rad), (v - 0.5) * HSV_HEIGHT, -s * Math.sin(rad)];
  };

  const parts: MeshData[] = [
    // 上面(明度100%): u=角度, v=半径(彩度)
    gridSurface(
      seg,
      12,
      (u, v) => polar(angleOf(u), v, 1),
      (u, v) => hsv01(angleOf(u), v, 1),
    ),
    // 側面(彩度100%): u=角度, v=高さ(明度)
    gridSurface(
      seg,
      12,
      (u, v) => polar(angleOf(u), 1, v),
      (u, v) => hsv01(angleOf(u), 1, v),
    ),
  ];
  if (cutSpan > 0) {
    for (const hue of [cutStart, cutStart + cutSpan]) {
      // 切り口(等色相面): u=彩度(中心→外), v=明度
      parts.push(
        gridSurface(
          12,
          12,
          (u, v) => polar(hue, u, v),
          (u, v) => hsv01(hue, u, v),
        ),
      );
    }
  }
  return mergeMeshData(parts);
}

/** RGB立方体の表面(各面を格子に分割し、位置をそのままRGBにする)。 */
export function rgbCubeMesh(divisions = 8): MeshData {
  const face = (fix: 0 | 1 | 2, value: 0 | 1): MeshData => {
    const axes = [0, 1, 2].filter((a) => a !== fix) as [number, number];
    const at = (u: number, v: number): Vec3 => {
      const c: Vec3 = [0, 0, 0];
      c[fix] = value;
      c[axes[0]] = u;
      c[axes[1]] = v;
      return c;
    };
    return gridSurface(
      divisions,
      divisions,
      (u, v) => {
        const c = at(u, v);
        return [c[0] * 2 - 1, c[1] * 2 - 1, c[2] * 2 - 1];
      },
      (u, v) => at(u, v),
    );
  };
  return mergeMeshData([face(0, 0), face(0, 1), face(1, 0), face(1, 1), face(2, 0), face(2, 1)]);
}

/** RGB立方体の8つの角(ラベル用)。 */
export const RGB_CORNERS: { label: string; rgb: Vec3 }[] = [
  { label: "K 黒", rgb: [0, 0, 0] },
  { label: "R 赤", rgb: [1, 0, 0] },
  { label: "G 緑", rgb: [0, 1, 0] },
  { label: "B 青", rgb: [0, 0, 1] },
  { label: "Y 黄", rgb: [1, 1, 0] },
  { label: "M マゼンタ", rgb: [1, 0, 1] },
  { label: "C シアン", rgb: [0, 1, 1] },
  { label: "W 白", rgb: [1, 1, 1] },
];

/**
 * sRGBの色域(RGB立方体の表面)を Lab に写した点群。色域は、立方体ではなく、色相ごとに出っ張りの違う形になる。
 * 面ごとに n×n 個(辺の重複は気にしない)。
 */
export function labGamutCloud(n = 24): { positions: Float32Array; colors: Float32Array } {
  const pts: number[] = [];
  const cols: number[] = [];
  const last = n - 1;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const u = (i / last) * 255;
      const v = (j / last) * 255;
      for (const edge of [0, 255]) {
        for (const rgb of [
          { r: edge, g: u, b: v },
          { r: u, g: edge, b: v },
          { r: u, g: v, b: edge },
        ]) {
          const lab = rgbToLab(rgb);
          pts.push(lab.a / LAB_RADIUS, ((lab.l - 50) / 100) * LAB_HEIGHT, -lab.b / LAB_RADIUS);
          cols.push(rgb.r / 255, rgb.g / 255, rgb.b / 255);
        }
      }
    }
  }
  return { positions: new Float32Array(pts), colors: new Float32Array(cols) };
}

/** HSV円柱の高さ(目盛り・ラベルの置き場所用)。 */
export const HSV_SOLID_HEIGHT = HSV_HEIGHT;
export const LAB_SOLID_HEIGHT = LAB_HEIGHT;
