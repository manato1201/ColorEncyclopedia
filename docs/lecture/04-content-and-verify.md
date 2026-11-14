# 第 4 回 コンテンツを機械で検査する

> 所要時間の目安: 2.5 時間 / 前提: 第 1〜3 回

## この回のゴール

- 色の 1 件が、**Markdown + frontmatter** でどう書かれているかを説明できる。
- **転記ミス**を、再計算で見つける仕組みと、**許容差**の理由を説明できる。
- **レジストリ**(`id in …`)で、可視化の対応を一本化する理由を説明できる。

## 1. 1 件の書き方

```markdown
---
name: "朱色"
nameEn: "Vermilion"
category: 色相
subcategory: 暖色
colorValue:
  hex: "#E60012"
  hsv: { h: 355, s: 100, v: 90 }
  lab: { l: 48.1, a: 74.2, b: 56.8 }
examLevel: 3級
summary: "…"
---
## 概要
…
```

- **frontmatter**(`---` で囲む部分)が、**構造化データ**。本文は、見出しと箇条書きの Markdown。
- `category`・`subcategory` は、`COLOR_CATEGORY_TAXONOMY` の組み合わせのどれかと、**一致させる**(新しい分類は、この表に足す)。
- 数値を持たない**概念**(配色理論など)は `colorValue` を持たず、`palette`(複数色の見本)を持つことがある。
- `beyondExam: true` は、**検定の範囲として確認していない実務の用語**の印。`examLevel` とは**同時に持てない**。

## 2. 転記ミスを、再計算で見つける

`colorValue` の HSV・Lab は、HEX から**計算できる**のに、frontmatter にも**書いてある**(読みやすさのため)。書き写しを間違えると、**画面の数値と、計算が食い違う**。型と範囲の検査だけでは、**値の間違い**は見つからない。そこで `verify` は、HEX から**再計算して、突き合わせる**。

```javascript
// 実行できる
(async () => {
  const matter = (await import("gray-matter")).default;
  const m = await import("./src/lib/color-math.ts");

  const HSV_TOLERANCE = 1;     // frontmatter の HSV は整数に丸めてある
  const LAB_TOLERANCE = 0.2;   // Lab は小数 1 桁に丸めてある

  function check(source) {
    const { colorValue } = matter(source).data;
    const hsv = m.hexToHsv(colorValue.hex);
    const lab = m.hexToLab(colorValue.hex);
    // 色相は 0° と 360° が同じ色なので、円環上の差で比べる
    const hueDiff = Math.min(Math.abs(hsv.h - colorValue.hsv.h), 360 - Math.abs(hsv.h - colorValue.hsv.h));
    const problems = [];
    if (hueDiff > HSV_TOLERANCE || Math.abs(hsv.s - colorValue.hsv.s) > HSV_TOLERANCE || Math.abs(hsv.v - colorValue.hsv.v) > HSV_TOLERANCE) problems.push("HSV");
    if (Math.abs(lab.l - colorValue.lab.l) > LAB_TOLERANCE || Math.abs(lab.a - colorValue.lab.a) > LAB_TOLERANCE || Math.abs(lab.b - colorValue.lab.b) > LAB_TOLERANCE) problems.push("Lab");
    return problems.length ? "NG: " + problems.join("・") : "OK";
  }

  const good = `---
colorValue:
  hex: "#E60012"
  hsv: { h: 355, s: 100, v: 90 }
  lab: { l: 48.1, a: 74.2, b: 56.8 }
---`;
  console.log("正しい記載:", check(good));
  console.log("Lab の a* を書き間違え:", check(good.replace("a: 74.2", "a: 47.2")));
  console.log("HSV の明度を書き間違え:", check(good.replace("v: 90", "v: 80")));
  console.log("1 だけの丸め違いは許す:", check(good.replace("v: 90", "v: 91")));
  console.log("色相が 359 と 0 のように、円環の端でも近いと判定:", Math.min(Math.abs(359 - 0), 360 - Math.abs(359 - 0)));
})();
```

```text
# 出力
正しい記載: OK
Lab の a* を書き間違え: NG: Lab
HSV の明度を書き間違え: NG: HSV
1 だけの丸め違いは許す: OK
色相が 359 と 0 のように、円環の端でも近いと判定: 1
```

- **許容差**は、frontmatter 側の**丸め**に合わせる(HSV ±1・Lab ±0.2)。**厳密に比べると、丸めだけで落ちる**。
- 色相は**円環**で比べる(359° と 0° は、1° しか違わない)。
- `verify` は、これを**全件**に毎回行う(`npm run verify`)。**正本は HEX**(第 1 回)。

## 3. レジストリ: 対応を 1 か所に

「この色には可視化があるか」は、frontmatter に書かず、**コードの表**(レジストリ)で決める。

```typescript
// 抜粋ファイル: src/lib/has-color-visualizer.ts
export function hasColorVisualizer(colorId: string): boolean {
  return (
    colorId in HUE_WHEEL_VISUALIZERS ||
    colorId in COLOR_DEMO_HEX ||
```

- **`id in 表`** で調べる。**種類ごとの表**(色相環・混色・見え方の場面・パレット …)のどれかにあれば「対応あり」。
- 対応を**frontmatter に書かない**(書くと、コードとコンテンツの 2 か所で、食い違いうる)。
- `verify` が、**表が指す id が実在する**こと・**全フレームの座標が有限で範囲に収まる**ことを確かめる。

## 4. 本文は、ビルド時に HTML にする

`createContentLoader` は、一覧用の `getAllMeta`(**本文の HTML 化をしない**軽い版)と、詳細用の `getDetail`(`marked` で本文を HTML にする)を分ける。詳細ページが、その HTML を**そのまま埋め込む**(`dangerouslySetInnerHTML`)ので、**コンテンツは、信頼できる(リポジトリの中の)Markdown だけ**が前提。

## 確認問題

1. frontmatter の HSV・Lab を、HEX から再計算して比べるのは、なぜですか。
2. 許容差(HSV ±1・Lab ±0.2)を、ゼロにしてはいけないのは、なぜですか。
3. 可視化の対応を、frontmatter ではなくレジストリで持つ利点は何ですか。
4. 詳細ページで、Markdown から作った HTML を**そのまま**埋め込めるのは、どんな前提があるからですか。

## 解答

1. 書き写しの間違い(値の転記ミス)は、型と範囲の検査では見つからないから。
2. frontmatter の値は丸めてあるので、ゼロにすると、丸めの差だけで落ちるから。
3. 対応の情報を 1 か所に集め、コードとコンテンツで食い違わないようにするため。
4. コンテンツが、リポジトリの中の信頼できる Markdown だけで、外部の入力を含まないという前提。

## まとめ

- 1 件 = frontmatter(構造化データ)+ 本文。分類は表と一致させる。
- **書いてある数値は、再計算して突き合わせる**(丸めの許容差・色相は円環)。
- 対応は**レジストリで 1 か所**に。本文の HTML は、**信頼できる入力**が前提。
