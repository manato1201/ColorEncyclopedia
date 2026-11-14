# 2. コードの読み方

## どこから読むか(おすすめの順)

| 順 | ファイル | 見るところ |
|---|---|---|
| 1 | `src/lib/color-math.ts` | 色の変換・コントラスト比(205 行。コメントが丁寧) |
| 2 | `src/lib/color-values.ts` | 画面に出す数値の単一の変換 |
| 3 | `src/lib/content/createContentLoader.ts` | frontmatter の型・メタと詳細の分離 |
| 4 | `content/colors/shuiro.md` など | 実際の 1 件の書き方 |
| 5 | `scripts/verify-content.mjs` | **何が検査されているか**(番号つきの一覧が先頭にある) |
| 6 | `src/lib/color-visualizers.ts`・`has-color-visualizer.ts` | レジストリ |
| 7 | `src/lib/spaced-repetition.ts` → `review-store.ts` | 純粋関数 → 保存 |
| 8 | `src/app/colors/[id]/page.tsx` | 詳細ページが、データと可視化をどう組み合わせるか |
| 9 | `src/lib/shape-visualizers/` → `geometry3d/` | 作図フレームと 3D の幾何(three.js に依存しない) |
| 10 | `src/lib/theme/deriveThemeFromColor.ts` | AA を満たすテーマ |

## 詳細ページが作られる流れ(色)

1. `createContentLoader("colors", hasColorVisualizer)` が、`content/colors/<id>.md` を読む。
2. `getDetail(id)` が、frontmatter と、**`marked` で HTML にした本文**を返す(`hasVisualizer` はレジストリから)。
3. ページが、`deriveColorValues(hex)` で**数値を計算**し、コントラスト比・近い色(`findRelatedColors`: ΔE76 の小さい順)・可視化・用語の定型項目(`term-notes`)を並べる。
4. 可視化は、**クライアント側**の部品。3D(three.js)は「立体」を選んだときに初めて読み込む。

## 流儀(このコードの約束)

- **数値は HEX から計算する**。画面に frontmatter の記載値を直接出さない(`ui-rules.md`)。
- **対応(可視化・立体)はレジストリに書く**。frontmatter に書かない。
- **幾何は three.js に依存しない純粋関数**で書き、`verify` で検査する。three.js は描画だけ。
- **UI の色は、決めたトークンだけ**(`globals.css`・`ui-rules.md`)。見本の周りは中立灰。
- **色だけで意味を伝えない**(見本には名前か値を併記)。
- **コメントに「なぜ」と設計書の参照(Phase・IMPROVEMENT の番号)を書く**。
