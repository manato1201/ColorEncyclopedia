# ColorEncyclopedia 学習資料(保守・拡張の実務編)

このフォルダは、**この図鑑を直す・足す人**のための資料です。基礎から順に学ぶ講義は [../lecture/index.md](../lecture/index.md)(第 0〜5 回・実行できる例つき)。収録・可視化・数値の詳細(旧 README)は [catalog-and-data-notes.md](../reference/catalog-and-data-notes.md)。UI の決めごとは [../ui-rules.md](../ui-rules.md)。

| # | 資料 | いつ読むか |
|---|---|---|
| 1 | [全体像](01-overview.md) | 部品・ページ・データの流れ・コマンド |
| 2 | [コードの読み方](02-code-tour.md) | どのファイルから読むか |
| 3 | [内側のしくみ](03-internals.md) | ローダー・検査・レジストリ・可視化・3D・復習の保存 |
| 4 | [拡張のレシピ](04-extend.md) | 色・図形・分類・検定問題・可視化を**足したい** |
| 5 | [テストの書き方と実行](05-testing.md) | `verify` を回す・足す・文書の検査・**確かめていないこと** |
| 6 | [トラブルと保守](06-troubleshooting-maintenance.md) | 動かない・**既知の問題**・定期の保守 |
| – | [用語集](glossary.md) | 分からない言葉が出た |

## 最初の 15 分

1. `npm install` のあと `npm run verify`(コンテンツと計算の検査が通ること)。
2. `npm run dev` で、`/colors`・`/atlas`・`/exam` を開く。
3. [構成図](../diagrams/architecture.svg)を見ながら、[全体像](01-overview.md)を読む。

## コードの地図

| 場所 | 役割 |
|---|---|
| `content/colors/`・`content/shapes/` | コンテンツ(Markdown + frontmatter。色 129・図形 92) |
| `src/lib/content/` | `createContentLoader`(メタ・本文 HTML)・色と図形のローダー |
| `src/lib/color-math.ts` | 色空間・コントラスト比・ΔE・ガマット |
| `src/lib/color-values.ts` | 画面に出す数値の**単一の変換**(`deriveColorValues`) |
| `src/lib/spaced-repetition.ts`・`review-store.ts` | 間隔反復(純粋関数)・保存(localStorage) |
| `src/lib/color-visualizers.ts`・`has-*-visualizer.ts` | 可視化のレジストリ |
| `src/lib/shape-visualizers/`・`geometry3d/`・`shape-3d.ts`・`color-3d.ts` | 作図フレーム・3D の幾何 |
| `src/lib/theme/` | テーマ色の導出(AA を満たす) |
| `src/data/` | 検定問題(`exam-questions.ts`)・用語の定型項目(`term-notes*.ts`) |
| `src/app/` | ページ(App Router) |
| `src/components/` | 画面の部品(`visualizer`・`visualizer3d`・`atlas`・`compare`・`exam` など) |
| `scripts/` | `verify-content.mjs`・`exam-coverage.mjs` |
