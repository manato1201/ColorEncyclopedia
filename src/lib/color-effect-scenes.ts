import { kelvinToHex } from "./color-temperature.ts";

/**
 * 色の見え方(対比・残像・進出と後退・膨張と収縮・面積効果・色温度)を、場面(フレーム)の列で見せるデータ。
 * 各場面は、背景(bg)の上に中央の色(fg)を置いた「タイル」を並べる。fg が無いタイルは、1色だけの面。
 * 見え方の現象なので、数値(HEX)は同じで、背景によって見え方が変わることを確かめるために使う。
 */
export type EffectTile = {
  bg: string;
  bgName: string;
  fg?: string;
  fgName?: string;
  /** 中央の色の大きさ(タイル一辺に対する割合、%)。既定は 42。 */
  fgSize?: number;
  /** 中央の色の不透明度(残像のイメージなど)。 */
  fgOpacity?: number;
  /** 表示名を上書きする(色温度など)。 */
  caption?: string;
};

export type EffectScene = { description: string; tiles: EffectTile[] };

const GRAY = "#808080";
const warm = [2000, 2700, 3500, 4500];
const cool = [5500, 6500, 8000, 10000];
const kelvinNames: Record<number, string> = {
  2000: "ろうそくの炎のあたり",
  2700: "白熱電球のあたり",
  3500: "",
  4500: "",
  5500: "昼の太陽光のあたり",
  6500: "画面の標準の白(D65)",
  8000: "曇り・日陰のあたり",
  10000: "青空のあたり",
};
const kelvinTile = (k: number): EffectTile => ({
  bg: kelvinToHex(k),
  bgName: `${k}K`,
  caption: `${k}K${kelvinNames[k] ? `(${kelvinNames[k]})` : ""}`,
});

export const COLOR_EFFECT_SCENES: Record<string, EffectScene[]> = {
  "simultaneous-contrast": [
    {
      description: "同じ灰色(#808080)を、赤・緑・青の背景の上に置く。中央の色は同じなのに、背景の補色の方向にずれて見える",
      tiles: [
        { bg: "#C0392B", bgName: "赤の背景", fg: GRAY, fgName: "中央の灰(同じ色)" },
        { bg: "#2E8B57", bgName: "緑の背景", fg: GRAY, fgName: "中央の灰(同じ色)" },
        { bg: "#2B5FAE", bgName: "青の背景", fg: GRAY, fgName: "中央の灰(同じ色)" },
      ],
    },
    {
      description: "黄と紫の背景でも同じ。黄の上では青紫がかり、紫の上では黄がかって見えやすい",
      tiles: [
        { bg: "#E8C43A", bgName: "黄の背景", fg: GRAY, fgName: "中央の灰(同じ色)" },
        { bg: "#6A3FA0", bgName: "紫の背景", fg: GRAY, fgName: "中央の灰(同じ色)" },
      ],
    },
    {
      description: "比べるため、無彩色の背景(明るい灰)に置いたもの。色みの偏りが少ない",
      tiles: [{ bg: "#B0B0B0", bgName: "明るい灰の背景", fg: GRAY, fgName: "中央の灰(同じ色)" }],
    },
  ],
  "lightness-contrast": [
    {
      description: "同じ灰色(#808080)を、暗い背景と明るい背景に置く。暗い背景では明るく、明るい背景では暗く見える",
      tiles: [
        { bg: "#1E1E1E", bgName: "暗い背景", fg: GRAY, fgName: "中央の灰(同じ色)" },
        { bg: "#E6E6E6", bgName: "明るい背景", fg: GRAY, fgName: "中央の灰(同じ色)" },
      ],
    },
    {
      description: "有彩色でも起こる。同じ橙(#D9822B)が、暗い背景では明るく、明るい背景では暗く見える",
      tiles: [
        { bg: "#202020", bgName: "暗い背景", fg: "#D9822B", fgName: "中央の橙(同じ色)" },
        { bg: "#F0F0F0", bgName: "明るい背景", fg: "#D9822B", fgName: "中央の橙(同じ色)" },
      ],
    },
  ],
  "chroma-contrast": [
    {
      description: "同じ色(#B8665A)を、くすんだ灰色の背景と、鮮やかな赤の背景に置く。灰色の上では鮮やかに、赤の上ではくすんで見える",
      tiles: [
        { bg: "#909090", bgName: "低彩度の背景", fg: "#B8665A", fgName: "中央の色(同じ色)" },
        { bg: "#C5301F", bgName: "高彩度の背景", fg: "#B8665A", fgName: "中央の色(同じ色)" },
      ],
    },
    {
      description: "青でも同じ。低彩度の背景では鮮やかに、高彩度の背景(橙)ではくすんで見えやすい",
      tiles: [
        { bg: "#A0A0A0", bgName: "低彩度の背景", fg: "#4A90C2", fgName: "中央の青(同じ色)" },
        { bg: "#E07B1F", bgName: "高彩度の背景", fg: "#4A90C2", fgName: "中央の青(同じ色)" },
      ],
    },
  ],
  afterimage: [
    { description: "1. 赤(#D62A1F)の面を、動かずに15〜30秒ほど見つめる", tiles: [{ bg: "#D62A1F", bgName: "赤の面" }] },
    {
      description: "2. すぐに灰色(#BFBFBF)の面へ目を移すと、赤の補色に近い青緑(シアン寄り)の像が、うっすら見える。下の像はそのイメージ",
      tiles: [{ bg: "#BFBFBF", bgName: "灰色の面", fg: "#6FD3D6", fgName: "見える像のイメージ", fgOpacity: 0.75 }],
    },
    { description: "3. 青(#2B5FAE)の面を見つめた場合も同じ", tiles: [{ bg: "#2B5FAE", bgName: "青の面" }] },
    {
      description: "4. 青のあとは、黄に近い像が見える。像の色や見える時間には、個人差がある",
      tiles: [{ bg: "#BFBFBF", bgName: "灰色の面", fg: "#D9C25A", fgName: "見える像のイメージ", fgOpacity: 0.75 }],
    },
  ],
  "advancing-receding": [
    {
      description: "同じ大きさの赤と青を、同じ灰色の背景に置く。暖色の赤のほうが、手前に出て見える傾向がある",
      tiles: [
        { bg: "#BDBDBD", bgName: "灰色の背景", fg: "#D9482B", fgName: "赤(暖色)", fgSize: 50 },
        { bg: "#BDBDBD", bgName: "灰色の背景", fg: "#2B62C8", fgName: "青(寒色)", fgSize: 50 },
      ],
    },
    {
      description: "明るい色と暗い色でも同じ傾向。明るい黄のほうが、暗い藍より手前に見えやすい",
      tiles: [
        { bg: GRAY, bgName: "灰色の背景", fg: "#F2E27A", fgName: "明るい黄", fgSize: 50 },
        { bg: GRAY, bgName: "灰色の背景", fg: "#3A3F70", fgName: "暗い藍", fgSize: 50 },
      ],
    },
  ],
  "expansion-contraction": [
    {
      description: "同じ大きさの白い四角と黒い四角を、灰色の背景に置く。白のほうが、大きく見える傾向がある",
      tiles: [
        { bg: GRAY, bgName: "灰色の背景", fg: "#F2F2F2", fgName: "白い四角", fgSize: 50 },
        { bg: GRAY, bgName: "灰色の背景", fg: "#1A1A1A", fgName: "黒い四角(同じ大きさ)", fgSize: 50 },
      ],
    },
    {
      description: "有彩色でも、明るい色(黄)のほうが、暗い色(藍)より大きく見えやすい",
      tiles: [
        { bg: GRAY, bgName: "灰色の背景", fg: "#F2E27A", fgName: "明るい黄", fgSize: 50 },
        { bg: GRAY, bgName: "灰色の背景", fg: "#3A3F70", fgName: "暗い藍(同じ大きさ)", fgSize: 50 },
      ],
    },
  ],
  "area-effect": [
    {
      description: "同じ水色(#4FA3C7)を、小さい面と大きい面で並べる。大きい面のほうが、明るく鮮やかに見えやすい",
      tiles: [
        { bg: "#FFFFFF", bgName: "白の背景", fg: "#4FA3C7", fgName: "小さい面", fgSize: 18 },
        { bg: "#FFFFFF", bgName: "白の背景", fg: "#4FA3C7", fgName: "大きい面(同じ色)", fgSize: 88 },
      ],
    },
    {
      description: "橙(#D9822B)でも同じ。見本帳で選んだ色が、広い面では派手に見える理由",
      tiles: [
        { bg: "#FFFFFF", bgName: "白の背景", fg: "#D9822B", fgName: "小さい面", fgSize: 18 },
        { bg: "#FFFFFF", bgName: "白の背景", fg: "#D9822B", fgName: "大きい面(同じ色)", fgSize: 88 },
      ],
    },
  ],
  "color-temperature": [
    { description: "低い色温度(およそ2000〜4500K)。赤〜橙みの暖かい光。数値は近似", tiles: warm.map(kelvinTile) },
    { description: "高い色温度(およそ5500〜10000K)。白から、青みの冷たい光へ。数値は近似", tiles: cool.map(kelvinTile) },
  ],
};
