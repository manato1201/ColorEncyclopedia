# 第 2 回 人の見え方に近い色空間(Lab)

> 所要時間の目安: 3 時間 / 前提: 第 1 回・行列の積(足し算と掛け算でよい)

## この回のゴール

- sRGB → 線形 RGB → XYZ → Lab の**変換の道筋**を説明できる。
- **ΔE**(色の距離)の意味と、CIE76 の限界を説明できる。
- **同じ明度・色相で、sRGB に収まる最大の彩度**が、色相で大きく違うことを確かめられる。

## 1. なぜ Lab か

RGB や HSV の「数の差」は、**人の感じる色の差と、一致しない**(RGB で同じ 10 の差でも、見え方の差は色ごとに違う)。**CIE L\*a\*b\***(Lab)は、数の距離が**見た目の差に近くなる**ように作られた色空間です。

| 軸 | 意味 |
|---|---|
| L\* | 明度(0 = 黒 〜 100 = 白) |
| a\* | 緑(−)〜赤(+) |
| b\* | 青(−)〜黄(+) |

## 2. 変換の道筋

```typescript
// 抜粋ファイル: src/lib/color-math.ts
export function rgbToLab({ r, g, b }: Rgb): Lab {
  const rl = srgbChannelToLinear(r);
  const x = rl * 0.4124 + gl * 0.3576 + bl * 0.1805;
  const y = rl * 0.2126 + gl * 0.7152 + bl * 0.0722;
  const z = rl * 0.0193 + gl * 0.1192 + bl * 0.9505;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
```

1. **ガンマを外す**: sRGB の値(0〜255)を、光の強さに比例する**線形**の値にする(`c ≤ 0.04045` なら `c/12.92`、そうでなければ `((c+0.055)/1.055)^2.4`)。
2. **XYZ へ**: 標準の行列(D65 の白色点)で、3 つの値を混ぜる。
3. **白色点で割って、`f(t)`**(立方根。暗い所は直線)にかけ、`L*`・`a*`・`b*` を作る。

**独自の近似は含まない**(標準の式のまま)。LCh は、Lab の `a*`・`b*` を**円筒座標**にしたもの(`C*` = 彩度に相当する距離、`h` = 色相角)。

```javascript
// 実行できる
(async () => {
  const m = await import("./src/lib/color-math.ts");
  const fmt = (lab) => [lab.l, lab.a, lab.b].map((v) => v.toFixed(1)).join(", ");

  console.log("白 Lab:", fmt(m.hexToLab("#FFFFFF")));
  console.log("黒 Lab:", fmt(m.hexToLab("#000000")));
  console.log("朱色(#E60012) Lab:", fmt(m.hexToLab("#E60012")));
  const lch = m.labToLch(m.hexToLab("#E60012"));
  console.log("朱色 LCh:", lch.l.toFixed(1), lch.c.toFixed(1), lch.h.toFixed(1));

  console.log("同じ色の ΔE:", m.deltaE76(m.hexToLab("#E60012"), m.hexToLab("#E60012")));
  console.log("黒と白の ΔE:", m.deltaE76(m.hexToLab("#000000"), m.hexToLab("#FFFFFF")).toFixed(1));
  const red = m.hexToLab("#E60012");
  console.log("朱と近い赤の ΔE:", m.deltaE76(red, m.hexToLab("#E8101F")).toFixed(2));
  console.log("朱と青の ΔE:", m.deltaE76(red, m.hexToLab("#0000FF")).toFixed(1));
})();
```

```text
# 出力
白 Lab: 100.0, 0.0, -0.0
黒 Lab: 0.0, 0.0, 0.0
朱色(#E60012) Lab: 48.1, 74.2, 56.8
朱色 LCh: 48.1 93.5 37.4
同じ色の ΔE: 0
黒と白の ΔE: 100.0
朱と近い赤の ΔE: 4.73
朱と青の ΔE: 165.5
```

- **ΔE76**は、Lab 上の**直線距離**。小さいほど、近い色に見える。**厳密な知覚差の式(ΔE2000 など)ではなく**、「近い色の並べ替え」や比較表示に使う**簡易な指標**(コードのコメントにも書いてある)。

## 3. sRGB に収まる最大の彩度(ガマット)

画面で出せる色(sRGB)は、Lab 全体の一部。**同じ明度 L\*・色相 h で、彩度 C\* を上げていくと、いつか sRGB から出てしまう**。その限界を、**二分探索**で求める(`maxChromaInGamut`)。

```javascript
// 実行できる
(async () => {
  const m = await import("./src/lib/color-math.ts");

  // 同じ明度 50 で、色相ごとの最大彩度(色相によって、余地は大きく違う)
  for (const [name, h] of [["赤みの橙(30°)", 30], ["黄緑(140°)", 140], ["青(270°)", 270]]) {
    console.log(name, "→ 最大の彩度 C*:", m.maxChromaInGamut(50, h).toFixed(1));
  }

  // 範囲外の彩度を求めると、収まる最大の彩度に抑えられ、clipped で知らせる
  const r = m.lchToHex({ l: 50, c: 200, h: 30 });
  console.log("C*=200 を求める:", r.hex, "抑えた:", r.clipped, "実際の彩度:", r.chroma.toFixed(1));
  const ok = m.lchToHex({ l: 50, c: 20, h: 30 });
  console.log("C*=20 を求める:", ok.hex, "抑えた:", ok.clipped);
})();
```

```text
# 出力
赤みの橙(30°) → 最大の彩度 C*: 88.7
黄緑(140°) → 最大の彩度 C*: 69.2
青(270°) → 最大の彩度 C*: 47.4
C*=200 を求める: #EE0031 抑えた: true 実際の彩度: 88.7
C*=20 を求める: #996C67 抑えた: false
```

- 二分探索を **24 回**(0〜160 の範囲)で、十分な精度。「収まる」の判定には、**わずかな許容(0.5)**を持たせる(丸めで、境界が揺れないように)。
- 比較画面の「CHROMA」は、この計算で、**その明度・色相で出せる上限**を並べて見せる。

## 確認問題

1. HSV の距離ではなく、Lab の距離を使う理由は何ですか。
2. `deltaE76` が「簡易な指標」なのは、なぜですか。
3. `lchToHex` に、sRGB に収まらない彩度を渡すと、どうなりますか。
4. 同じ明度でも、色相によって出せる最大の彩度が違うのは、なぜだと思いますか。

## 解答

1. Lab は、数の距離が、人の感じる色の差に近くなるように作られているから。
2. 色空間の直線距離で、ΔE2000 など、人の知覚の偏りを補正した式ではないから。
3. 同じ明度・色相で収まる最大の彩度に抑えた色を返し、`clipped: true` で知らせる。
4. sRGB が出せる色の範囲(ガマット)が、Lab の中で偏った形をしているから(色相によって、外側までの余地が違う)。

## まとめ

- Lab は、**距離が見た目の差に近い**。道筋は sRGB → 線形 → XYZ → Lab。
- ΔE76 は簡易な指標。**ガマットの限界は色相ごとに違う**ので、二分探索で求める。
- 次の回は、**読める色か**(コントラスト比)。
