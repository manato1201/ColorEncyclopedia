# ColorEncyclopedia

色彩検定の対策と学習のために、**色と図形の情報を図鑑のように**収録して見られるようにしたリポジトリ。Next.js 16(App Router)/ React 19 / TypeScript。コンテンツは `content/colors`・`content/shapes` の Markdown(frontmatter つき)です。

![全体の構成図](docs/diagrams/architecture.svg)

- **色図鑑 / 図形図鑑**: カタログと詳細(数値データ・方式の比較・コントラスト比・作図手順の可視化。立体は「平面 / 立体(3D)」を切り替え)。
- **色彩 Atlas**: 色相×彩度・色相×明度(2D)と、全収録色を色立体に置く 3D。
- **比較**: 最大 4 件を並べる(`?ids=a,b` で選択済みにできる)。
- **検定問題と復習**: 級別の**自作問題**と、間隔反復(ライトナー式)の復習。解答の履歴は**この端末のブラウザだけ**に保存。

## 主なページ

| パス | 内容 |
|---|---|
| `/` | 入口(収録数は実データから算出) |
| `/colors`・`/colors/[id]` | 色図鑑のカタログと詳細 |
| `/shapes`・`/shapes/[id]` | 図形図鑑のカタログと詳細 |
| `/atlas` | 色彩 Atlas(2D と色立体) |
| `/compare`・`/compare/shapes` | 最大 4 件の比較 |
| `/exam`・`/exam/[level]`・`/exam/review` | 級別の自作問題・復習 |
| `/basics` | 色の基礎(はじめに) |

## クイックスタート

```bash
npm install
npm run dev          # 開発サーバー
npm run verify       # コンテンツの検証(hex→HSV/Lab の再計算・検定問題・可視化の参照先など)
npm run exam-table   # 級ごとの問題と、参照している色エントリの表を出力
npm run lint
npm run build
```

## 大事な注意(数値と範囲)

- **収録数・可視化の数は、`npm run verify` が出力**します(README に手書きしません)。
- 色の数値(HEX・RGB・HSV・Lab)は、収録した HEX から**1 か所の変換**(`src/lib/color-math.ts`)で計算します。frontmatter の値との一致は `verify` が確かめます。
- **色彩検定の公式の出題範囲との対応は、確認していません**。問題は自作で、過去問の転載ではありません。範囲や改定は、公式の最新情報で確認してください。
- PCCS のトーンの見本は、HSV での**自作の目安**です(PCCS の正式な値ではありません)。色覚のシミュレーションも、一般的な近似の変換による目安です。
- 画面の色は、ディスプレイの設定や周囲の明るさで見え方が変わります。

## ドキュメント

| 読むもの | 内容 |
|---|---|
| [**講義資料**](docs/lecture/index.md) | **基礎から**(色空間・Lab とコントラスト比・コンテンツの検証・間隔反復・テスト)。全 6 回・実行できる例つき |
| [**学習資料**](docs/learn/index.md) | **保守・拡張の実務編**(コードの読み方・色や図形の足し方・テスト・トラブルと保守・用語集) |
| [収録・可視化・数値の詳細](docs/reference/catalog-and-data-notes.md) | 旧 README(可視化の一覧・数値の出し方・試験範囲との対応表) |
| [UI の決めごと](docs/ui-rules.md) | 画面の方針 |
| [設計書](ColorEncyclopedia_DESIGN.md) | なぜこの形か |
| [改善設計](IMPROVEMENT_DESIGN_2026-10.md)・[改善計画](IMPROVEMENT_PLAN_2026-10.md) | 2026-10 の改善 |
