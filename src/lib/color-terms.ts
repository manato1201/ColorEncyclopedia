/** 数値ラベル(HEX・RGB・HSV・Lab)の短い説明。ツールチップで表示する。 */
export const COLOR_VALUE_TERMS = {
  HEX: "赤・緑・青を16進数2桁ずつで並べた、画面用の色コード(#RRGGBB)。",
  RGB: "赤(R)・緑(G)・青(B)の光の強さを0〜255で表した値。光を足して色を作る加法混色。",
  HSV: "色相H(0〜360°)・彩度S(0〜100%)・明度V(0〜100%)で色を表す方式。",
  Lab: "CIE L*a*b*。L*は明るさ(0〜100)、a*は緑〜赤、b*は青〜黄。人の見え方に近づけた色空間。",
  "ΔE": "Lab空間での2色の距離(CIE76)。小さいほど近い色に見える。",
} as const;

export type ColorValueTerm = keyof typeof COLOR_VALUE_TERMS;
