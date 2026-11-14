# 5. テストの書き方と実行

## 実行

```bash
npm run verify              # コンテンツ・計算・可視化・検定問題の検査(これが、このリポジトリの主なテスト)
npm run lint                # ESLint
npm run build               # 型検査とビルド
python tools/check_docs.py  # 文書の検査(node が要る)
python -m pytest -q tests/test_docs.py
```

`verify` の出力の例(件数は、そのときの収録数):

```text
colors: 129件を検証
shapes: 92件を検証
exam-questions: 34問を検証
term-notes: 全エントリの定型項目を検証
visualizers: 図形 92/92件、色 129/129件が可視化に対応
3d: 図形 36/92件、色 116/129件が立体(3D)表示に対応
OK: 全エントリのfrontmatter検証をパスしました
```

## 何が、どのように確かめられているか

| 守りたいこと | 確かめ方(`verify`) |
|---|---|
| 色の数値が、HEX と矛盾しない | HEX から**再計算して突き合わせる**(丸めの許容差つき) |
| 分類・級・フィールドの混入 | 表との照合・「あってはいけない項目」の検出 |
| 検定問題が壊れていない | id の重複・答えの範囲・参照先の実在 |
| 可視化が壊れていない | **全フレームの座標が有限で範囲内**・参照先の実在 |
| 3D の幾何が正しい | **不変条件**(オイラー標数・立方体の展開図 11 種・ヒルベルト曲線の連続性・V−E+F=2・回転群の位数) |

## よく使う型

1. **不変条件で守る**: 幾何は「正しい答え」を持たないことが多いので、**常に成り立つ性質**(V−E+F=2 など)を確かめる。
2. **再計算で突き合わせる**: 書き写した値は、計算できるなら、計算して比べる。
3. **「あってはいけない」も確かめる**: 図形に `colorValue` が混ざっていない、など。
4. **失敗は全部集めてから終了する**(1 件ごとに止まらない)。
5. **許容差は、丸めの幅に合わせる**(ゼロにしない)。

## 新しい検査を足す手順

1. 守りたいことを **1 行で**、`verify-content.mjs` の先頭の一覧に書く。
2. `fail(file, message)` で、**どのファイルの何が悪いか**が分かる文面にする。
3. わざとデータを壊して、**落ちる**ことを確かめる。
4. 直したら、**通る**ことを確かめる。

```javascript
// 実行できる
(async () => {
  const m = await import("./src/lib/color-math.ts");
  // 検査の型: 変換の往復が、許容差の中に収まる(Lab → LCh → Lab)
  const lab = m.hexToLab("#2E7D32");
  const lch = m.labToLch(lab);
  const rad = (lch.h * Math.PI) / 180;
  const back = { l: lch.l, a: lch.c * Math.cos(rad), b: lch.c * Math.sin(rad) };
  const error = Math.max(Math.abs(back.a - lab.a), Math.abs(back.b - lab.b));
  console.log("Lab → LCh → Lab の最大の誤差が 1e-9 未満:", error < 1e-9);
  // 性質: 白と黒のコントラスト比は 21、同じ色は 1
  console.log("白黒 21:", m.contrastRatio("#000000", "#FFFFFF") === 21, " 同色 1:", m.contrastRatio("#2E7D32", "#2E7D32") === 1);
})();
```

```text
# 出力
Lab → LCh → Lab の最大の誤差が 1e-9 未満: true
白黒 21: true  同色 1: true
```

## 文書の検査

```bash
python tools/check_docs.py             # 検査
python tools/check_docs.py --update    # 引用の更新・実行例の出力の作り直し
python tools/check_mermaid.py          # Mermaid が描画できるか(mmdc が要る)
python tools/make_diagrams.py          # 構成図(SVG)を作り直す
```

実行例は、**リポジトリのルートで、`node --experimental-strip-types`**(TypeScript をそのまま読み込む)で動かし、**2 回動かして出力が一致**することを確かめる。**`@/` のパス別名を使うファイル**(例: `deriveThemeFromColor.ts`・`related-colors.ts`)は、Node から直接読み込めないので、例に使えない。

## 確かめていないこと(正直に)

- **画面(React のコンポーネント)の自動テストは無い**。表示・操作は、`npm run dev` で目で確かめる。
- **`deriveThemeFromColor`(テーマ色の導出)は、`verify` の対象外**(パス別名のため Node から読めない)。
- **見た目**(ライト・ダークでの読みやすさ・3D の描画)の自動検査は無い。
- **色彩検定の公式範囲との対応**は確認していない(README にも明記)。
- **数値の正しさの、外部の基準との照合**(例: 他のツールの Lab の値との一致)は、していない。標準の式に従っていることだけが根拠。
