import type { ColorSpace } from "./geometry3d/color-solids.ts";
import { COLOR_DEMO_HEX, COLOR_HUE_DIFFERENCE, COLOR_PALETTE_VISUALIZERS, HUE_WHEEL_VISUALIZERS } from "./color-visualizers.ts";

/**
 * 色の「色立体で見る」(3D)の対応表。
 * - 数値(colorValue)を持つ色: 代表値を、色立体の1点として示す。
 * - パレットを持つ用語: すべての色を点として並べ、色立体の中での散らばりを見せる。
 * - 色の三属性・色相環・混色・彩度/明度の対比: その概念に合う空間を最初に出す。
 * 空間は、数式で決まるRGB立方体・HSV円柱・Labだけ。PCCS・マンセルは対応表が要るため計算していない。
 */
export type Color3DInfo = {
  /** 最初に出す空間。 */
  space: ColorSpace;
  /** 点の元: HEX(自身の色)/ palette(パレットの全色)/ demo(デモ用の色)/ none(点なし)。 */
  markers: "hex" | "palette" | "demo" | "none" | "harmony";
  /** 3D表示の見出し。 */
  title: string;
  /** 何を見るかの一文。 */
  note: string;
};

/** 概念エントリごとの、最初に見せる空間と一文。 */
const CONCEPT_3D: Record<string, Omit<Color3DInfo, "markers"> & { markers?: Color3DInfo["markers"] }> = {
  "three-attributes": {
    space: "hsv",
    title: "三属性を、立体で見る(HSV円柱)",
    note: "色相は角度、彩度は中心からの距離、明度は高さ。切り口を出すと、同じ色相の「彩度×明度」のページが見えます。",
    markers: "demo",
  },
  "hue-circle": {
    space: "hsv",
    title: "色相環を、立体の上から見る",
    note: "「真上」にすると、HSV円柱の上面が色相環になります。色相環は、色立体の1つの輪切りです。",
    markers: "demo",
  },
  "additive-mixing": {
    space: "rgb",
    title: "加法混色を、RGB立方体で見る",
    note: "R・G・Bの量が各軸です。原点(黒)から、3つの光を足していくと、頂点で白に届きます。",
    markers: "none",
  },
  "subtractive-mixing": {
    space: "rgb",
    title: "減法混色を、同じ立方体で見る",
    note: "白から、C・M・Yの色材で光を引いていくと黒に近づきます。立方体の向かい合う角が補色の関係です。",
    markers: "none",
  },
  "chroma-contrast": {
    space: "lab",
    title: "彩度の違いを、Labで見る",
    note: "sRGBで出せる色の範囲(色域)を、Labに並べた点群です。中心の軸から離れるほど、彩度が高くなります。",
    markers: "none",
  },
  "lightness-contrast": {
    space: "lab",
    title: "明度の違いを、Labで見る",
    note: "縦軸が明るさ(L*)です。同じ高さにある色は、同じ明るさに見えます。",
    markers: "none",
  },
};

/** 配色の概念エントリで、デモ用の色から色相を回して作る点(基準色からの色相差、度)。 */
const HARMONY_OFFSETS: Record<string, number[]> = {
  "complementary-harmony": [0, 180],
  "psychological-complementary": [0, 180],
  "analogous-harmony": [-30, 0, 30],
  "triadic-harmony": [0, 120, 240],
  "split-complementary-harmony": [0, 150, 210],
  "tetrad-harmony": [0, 90, 180, 270],
  ...Object.fromEntries(Object.entries(COLOR_HUE_DIFFERENCE).map(([id, step]) => [id, [0, step * 15]])),
};

export function harmonyOffsets(colorId: string): number[] | null {
  return HARMONY_OFFSETS[colorId] ?? null;
}

const DEFAULT_NOTE =
  "この色の代表値を、色立体の中の1点として示します。空間を切り替えると、同じ色の位置が変わって見えます。";

export function getColor3D(colorId: string): Color3DInfo | null {
  const concept = CONCEPT_3D[colorId];
  if (concept) return { ...concept, markers: concept.markers ?? "demo" };
  if (colorId in HARMONY_OFFSETS && colorId in COLOR_DEMO_HEX) {
    return {
      space: "hsv",
      markers: "harmony",
      title: "配色の色を、色立体の中で見る",
      note: "色相だけを回した色の位置です。HSV円柱を「真上」から見ると、色相環上の角度の関係がそのまま見えます。デモ用の色で示しています。",
    };
  }
  if (colorId in COLOR_PALETTE_VISUALIZERS) {
    return {
      space: "hsv",
      markers: "palette",
      title: "パレットを、色立体の中で見る",
      note: "パレットの各色を点で示します。色が色立体のどこに散らばるか(同じ色相か、明度だけが違うか)を見ます。",
    };
  }
  if (colorId in HUE_WHEEL_VISUALIZERS) {
    return { space: "hsv", markers: "hex", title: "色立体の中の位置", note: DEFAULT_NOTE };
  }
  return null;
}

export function hasColor3D(colorId: string): boolean {
  return getColor3D(colorId) !== null;
}

/** 3D表示の共通の注意書き(PCCS・マンセルではない)。 */
export const COLOR_3D_DISCLAIMER =
  "ここで使う空間(RGB立方体・HSV円柱・Lab)は、数式で決まるものです。PCCSやマンセルの色立体とは別物で、それらの値は計算していません。";
