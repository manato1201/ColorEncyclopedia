# 3. 内側のしくみ

講義(第 1〜5 回)で扱った「色空間」「Lab とガマット」「コントラスト比」「frontmatter の再計算検査」「レジストリ」「間隔反復」は、繰り返しません。ここでは、**講義に出ない部分**を読みます。

## コンテンツローダー

```typescript
// 抜粋ファイル: src/lib/content/createContentLoader.ts
function getAllIds(): string[] {
.filter((file) => file.endsWith(".md"))
.sort();
function getAllMeta(): ContentMeta<T>[] {
bodyHtml: marked.parse(parsed.content, { async: false }) as string,
```

- `process.cwd()` から `content/<色 or 図形>` を読む(**ビルド・開発サーバーを、リポジトリのルートで動かす前提**)。
- `getAllIds` は **ファイル名順**にソート。`getAllMeta` は、全件の frontmatter を読む(本文の HTML 化はしない)ので、**カタログの一覧は軽い**。
- `getDetail` だけが、`marked` で本文を HTML にする。
- **ジェネリック**(`createContentLoader<T>`)で、色(`ColorFrontmatter`)と図形(`ShapeFrontmatter`)が共有する。**共通の項目**(`name`・`nameEn`・`category`・`subcategory`・`summary`)は、どちらにも必須。

## 検査(`verify-content.mjs`)

先頭に、検査の**番号つき一覧**がある。主なもの:

| 検査 | 内容 |
|---|---|
| frontmatter | `colorValue.hex` の形式・HSV・Lab の範囲・**HEX からの再計算との一致** |
| 分類 | `category` / `subcategory` が、`COLOR_CATEGORY_TAXONOMY`・`SHAPE_CATEGORY_TAXONOMY` に存在 |
| 級 | `examLevel` が 1級・2級・3級・UC級 のどれか。`beyondExam` と `examLevel` は同時に持てない |
| 検定問題 | id の重複なし・選択肢・答えの範囲・`explanationRef` が実在する色 |
| 定型項目 | 全エントリに、見るポイント・混同しやすい点・使うときの注意がある |
| 可視化 | レジストリが実在するエントリだけを指す・**作図の全フレームの座標が有限で、範囲に収まる** |
| 3D | 多面体のオイラー標数・立方体の展開図(35 種のうち 11 種)・ヒルベルト曲線の連続性・フラクタルの個数・円錐の切り口・凸包の V−E+F=2・回転群の位数・空間充填 など |

- 失敗は `[NG] <ファイル>: <理由>` と出し、**最後に件数で終了コード**を決める(全部を見てから落ちる)。
- **新しい検査を足すときも、「何を守るか」を 1 行で先頭の一覧に書く**。

## 可視化とレジストリ

- 色の可視化は**種類ごとの表**(色相環・デモの色・コントラストのデモ・混色・見え方の場面・パレット・色覚)。どれかにあれば「対応あり」(`hasColorVisualizer`)。
- 図形は `SHAPE_VISUALIZERS`(id → **フレーム列を作る関数**)。各フレームは `elements`(線・円・多角形 など)と `description` を持つ。**座標は 0〜100 の正方形空間**で、描く側が canvas に投影する。
- 状態(`idle`・`guide`・`active`・`final`)で、**作図の途中の線**(補助線・今引く線・完成)を見分ける。

## 3D(three.js)

- 幾何(`geometry3d/`)は**純粋関数**(three.js に依存しない)で、`verify` が検査。
- 描画(`visualizer3d/Viewport3D.tsx`)は、`import("three")` の**動的読み込み**で、「立体」を選んだときだけ three.js を読む(最初のページを軽くする)。
- 色立体は、数式で決まる **RGB 立方体・HSV 円柱・Lab** だけ(PCCS・マンセルは計算しない)。

## 復習の保存(`review-store.ts`)

- `useSyncExternalStore` で、localStorage を**外部のストア**として購読する(`storage` イベントで、別のタブの変更も反映)。
- **サーバー描画時と最初の描画は「履歴なし」**(`getServerSnapshot`)。保存値は、描画の後に反映される(サーバーとクライアントの描画がずれないように)。
- 保存できない環境(プライベートモードなど)では、**例外を握って**、その画面の間だけ有効な状態にする。
- 読み込みは `JSON.parse` を `try` で囲み、**壊れた値は捨てて空から**始める(`version` が違っても捨てる)。

## テーマ色(`deriveThemeFromColor`)

講義 第 3 回のとおり、**実際の地色とカードの両方**の上で AA を満たすよう、色相を保って明るさを調整する。**`verify` は、この関数を検査していない**(`@/` のパス別名を使うので、Node から直接は読み込めない。→ [トラブルと保守](06-troubleshooting-maintenance.md))。
