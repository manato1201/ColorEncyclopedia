# 4. 拡張のレシピ

どのレシピも、**同じ順**で進めます: ①何を足すか決める → ②コンテンツ・データを書く → ③`npm run verify` を回す → ④必要なら可視化・分類を足す → ⑤文書。

## レシピ A: 色を 1 件足す

1. `content/colors/<id>.md` を作る。`<id>` は**英数字・ハイフン**(URL になる)。
2. frontmatter に `name`・`nameEn`・`category`・`subcategory`・`summary` を書く。**`category` と `subcategory` は、`COLOR_CATEGORY_TAXONOMY` の組み合わせと一致**させる。
3. 数値のある色は、`colorValue.hex` を書き、`hsv`・`lab` は**HEX から計算した値**を書く(丸め: HSV は整数、Lab は小数 1 桁)。値は `deriveColorValues` と同じ計算で出す。
4. 検定の範囲に確認できた色だけ `examLevel`(`1級`・`2級`・`3級`・`UC級`)を付ける。**確認していないものに、級を付けない**。実務の用語は `beyondExam: true`。
5. 本文は、見出しと箇条書き(`## 概要`・`## 見分け方`・`## 使いどころ`・`## 注意`)。
6. **用語の定型項目**を、`src/data/term-notes*.ts` に足す(`verify` が、全エントリにあることを要求する)。
7. `npm run verify`。

```javascript
// 実行できる
(async () => {
  const m = await import("./src/lib/color-math.ts");
  // frontmatter に書く値を、HEX から計算して出す(手で計算しない)
  const hex = "#5B8DEF";
  const hsv = m.hexToHsv(hex);
  const lab = m.hexToLab(hex);
  console.log(`hex: "${hex}"`);
  console.log(`hsv: { h: ${hsv.h}, s: ${hsv.s}, v: ${hsv.v} }`);
  console.log(`lab: { l: ${lab.l.toFixed(1)}, a: ${lab.a.toFixed(1)}, b: ${lab.b.toFixed(1)} }`);
})();
```

```text
# 出力
hex: "#5B8DEF"
hsv: { h: 220, s: 62, v: 94 }
lab: { l: 59.4, a: 13.1, b: -54.4 }
```

## レシピ B: 図形を 1 件足す

1. `content/shapes/<id>.md`(`name`・`nameEn`・`category`・`subcategory`・`summary`)。**図形には `colorValue`・`examLevel` を入れない**(`verify` が弾く)。
2. 作図の可視化があれば、`src/lib/shape-visualizers/` の該当カテゴリに、**フレーム列を作る関数**を書き、`index.ts` の `SHAPE_VISUALIZERS` に `id → 関数` を登録する。
3. 座標は **0〜100 の範囲**で、**全フレームで有限**にする(`verify` が検査)。
4. 立体にすると意味が増える図形は、`src/lib/shape-3d.ts` と `geometry3d/` に足す。**3D の幾何は純粋関数**で、不変条件(オイラー標数など)を `verify` に足す。

## レシピ C: 分類(カテゴリ)を足す

`src/lib/color-categories.ts`・`shape-categories.ts` の配列に、**追記するだけ**で、カタログのタブに反映される。足したら、そのカテゴリで 1 件以上のエントリを置く(空のカテゴリを作らない)。

## レシピ D: 検定問題を足す

1. `src/data/exam-questions.ts` の `EXAM_QUESTIONS` に、`id`・`level`・`year`・`questionText`・`choices`・`answerIndex`・`explanationRef` を足す。
2. `id` は**重複しない**。`answerIndex` は選択肢の範囲内。**`explanationRef` は、実在する色の id**。
3. **自作問題にする**(過去問の全文を転載しない)。
4. 問題文中の難しい用語は `glossary: [{ term, note }]`(`term` は問題文に含まれること)。
5. **問題の id を変える・消すと、保存済みの履歴の、その問題の記録が読み込まれなくなる**(知らない id は捨てられる)。直すときは、新しい id を使う。
6. `npm run verify`・`npm run exam-table`(README の表を更新する場合)。

## レシピ E: 色の可視化を足す

`src/lib/color-visualizers.ts` の**種類ごとの表**に、id を足す(色相環・混色・見え方の場面・パレット …)。**frontmatter には書かない**。新しい**種類**の可視化なら、表を新設して、`has-color-visualizer.ts` の `in` の連なりに足し、`verify` の検査にも足す。

## レシピ F: 間隔反復の設定を変える

`BOX_INTERVAL_DAYS`(`[0, 1, 3, 7, 14, 30]`)と `MAX_BOX`。**変えると、保存済みの履歴の `due`(期限)は、変えた設定では再計算されない**(次に答えたときから新しい間隔)。`REVIEW_VERSION` は、**保存形式を変えるとき**に上げる(古い版は読み込まれない)。

## 足したら、必ずやること

1. `npm run verify`(コンテンツ・計算・可視化)。
2. `npm run lint`・`npm run build`。
3. 数字を README に手書きしない(`verify`・`exam-table` の出力を使う)。
4. `python tools/check_docs.py`(文書の検査)。
