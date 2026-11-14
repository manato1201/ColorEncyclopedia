# ColorEncyclopedia 講義(基礎から・実行して確かめる)

色の数値、コントラスト比、コンテンツの検証、間隔反復を、**コードを動かして**学ぶ講義です。各回の例は `node` で実行します(`tests/test_docs.py` が、ずれと出力を検査します)。色彩検定の内容そのものは、このリポジトリの図鑑(`content/`)と公式の情報を読んでください。

| 回 | 題 | 学ぶこと | 目安 |
|---|---|---|---|
| [0](00-introduction.md) | 全体の見取り図 | Markdown が図鑑になるまで・純粋関数に分ける理由 | 1 h |
| [1](01-color-spaces.md) | 色を数にする | HEX・RGB・HSV・HSL・**丸め**・色相の周期 | 2 h |
| [2](02-lab.md) | 人の見え方に近い色空間 | sRGB → 線形 → XYZ → Lab・ΔE・LCh・**sRGB に収まる最大の彩度** | 3 h |
| [3](03-contrast.md) | 読める色か(コントラスト比) | 相対輝度・WCAG の基準・テーマの自動調整 | 2 h |
| [4](04-content-and-verify.md) | コンテンツを機械で検査する | frontmatter・**転記ミスを再計算で見つける**・レジストリ | 2.5 h |
| [5](05-spaced-repetition.md) | 忘れる頃に出す(間隔反復) | ライトナー式の箱・不変の更新・保存データを疑う | 2.5 h |

例は、リポジトリのルートで `node --experimental-strip-types` が動かします(TypeScript をそのまま読み込めます。Node 22 以上)。先に `npm install` を済ませてください。講義のあとは [学習資料](../learn/index.md)。
