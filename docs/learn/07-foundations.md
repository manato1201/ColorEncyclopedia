# 7. 基礎の補強(言語・設計思想・アルゴリズム・用語)

講義と学習資料の**前提になっている知識**を、ここで補います。「TypeScript・React・Next.js の基本」と、色・Web の用語を、**このリポジトリのコードで実際に使われている形**で、動かして確かめます。

## 1. 言語の基礎: TypeScript・React・Next.js

### 1.1 TypeScript の型: `type`・`interface`・ユニオン・`as const`

TypeScript は、JavaScript に**型**を足したもの(実行時には消える)。`type Hsv = { h: number; s: number; v: number }` は**形の約束**。`"1級" | "2級" | "3級" | "UC級"` のような**ユニオン型**は、**取りうる値の列挙**。`as const` は、**配列やオブジェクトを、書き換え不能・値そのものを型に**する。

```javascript
// 実行できる
(async () => {
  const { BOX_INTERVAL_DAYS, MAX_BOX } = await import("./src/lib/spaced-repetition.ts");
  // TypeScript では: export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30] as const;
  console.log("間隔(日):", BOX_INTERVAL_DAYS, " 最大の箱:", MAX_BOX);
  console.log("箱の数と間隔の数が合う:", BOX_INTERVAL_DAYS.length === MAX_BOX + 1);
})();
```

```text
# 出力
間隔(日): [ 0, 1, 3, 7, 14, 30 ]  最大の箱: 5
箱の数と間隔の数が合う: true
```

### 1.2 不変(immutable)な更新: スプレッド `{ ...state }`

`recordAnswer` は、**元の状態を書き換えず、新しい状態を返す**。`{ ...state, [id]: next }` は、「`state` をコピーして、`id` だけ差し替える」。React は「**変わったか**」を、**参照が別かどうか**で判断するので、**元を書き換えると、変化に気づけない**。

```javascript
// 実行できる
(async () => {
  const { recordAnswer } = await import("./src/lib/spaced-repetition.ts");
  const before = {};
  const after = recordAnswer(before, "q1", true, 0);
  console.log("別の参照(変化に気づける):", before !== after);
  console.log("元は空のまま:", JSON.stringify(before));

  // スプレッドの基本
  const base = { a: 1, b: 2 };
  const changed = { ...base, b: 20 };
  console.log(base, changed, "元は変わらない:", base.b === 2);
})();
```

```text
# 出力
別の参照(変化に気づける): true
元は空のまま: {}
{ a: 1, b: 2 } { a: 1, b: 20 } 元は変わらない: true
```

### 1.3 配列の `map` / `filter` / `reduce` と `sort`

ループを書かずに、**変換(`map`)・絞り込み(`filter`)・まとめ(`reduce`)**。`sort` は、**元の配列を書き換える**ので、**コピーしてから**使う(`[...list].sort(...)`)。

```javascript
// 実行できる
const colors = [
  { name: "朱色", l: 48 },
  { name: "空色", l: 72 },
  { name: "紺色", l: 20 },
];
console.log("名前だけ:", colors.map((c) => c.name));
console.log("明るい色:", colors.filter((c) => c.l > 40).map((c) => c.name));
console.log("明度の合計:", colors.reduce((sum, c) => sum + c.l, 0));

const sorted = [...colors].sort((a, b) => a.l - b.l);          // コピーしてから並べる
console.log("暗い順:", sorted.map((c) => c.name), " 元の先頭:", colors[0].name);
```

```text
# 出力
名前だけ: [ '朱色', '空色', '紺色' ]
明るい色: [ '朱色', '空色' ]
明度の合計: 140
暗い順: [ '紺色', '朱色', '空色' ]  元の先頭: 朱色
```

### 1.4 React・Next.js の考え方(コードを読むための地図)

| 概念 | 意味 | このリポジトリでの例 |
|---|---|---|
| **コンポーネント** | 画面の部品。**関数**が、見た目(JSX)を返す | `src/components/` |
| **props / state** | 外から渡す値 / 部品が持つ状態(変わると再描画) | 比較の選択・解答 |
| **フック(`use…`)** | 関数コンポーネントに、状態や機能を足す仕組み | `useSyncExternalStore` |
| **サーバーコンポーネント / `"use client"`** | サーバーで描く部品 / ブラウザで動く部品(ファイルの先頭に書く) | ページはサーバー、`review-store.ts` はクライアント |
| **App Router** | **フォルダがそのまま URL** になる Next.js のルーティング | `src/app/colors/[id]/page.tsx` |
| **静的生成(SSG)** | ビルド時にページを作っておく | `content/` から全件 |
| **ハイドレーション** | サーバーで作った HTML に、ブラウザで機能をつなぐ | 最初の描画は「履歴なし」 |
| **動的 import** | 必要になったとき初めて読み込む | `import("three")` |

## 2. 設計思想

| 原則 | 意味 | このリポジトリのどこに出るか | 破るとどうなるか |
|---|---|---|---|
| **データの正本を 1 つに** | 同じ事実を、複数の場所に手で書かない | HEX が正本、HSV・Lab は計算 | 値が食い違う |
| **書いたものは、機械で検査する** | 転記ミスを、毎回検出 | `verify-content.mjs` | 画面に、間違った値が出る |
| **計算は純粋関数** | 画面・保存と分ける | `color-math.ts`・`spaced-repetition.ts` | テストできない・画面ごとに結果が違う |
| **色だけで意味を伝えない** | 名前・値・形を併記 | `ui-rules.md` | 色覚の違う人に伝わらない |
| **読める色かを、数で保証する** | コントラスト比 4.5 以上 | `deriveThemeFromColor` | 読めないテーマになる |
| **軽く始める(遅延読み込み)** | 重いもの(three.js)は、選んだときだけ | 動的 import | 最初のページが重い |
| **保存データを疑う** | 保存された値を、検証して取り込む | `sanitizeRecords` | 古い・壊れた値で、画面が壊れる |
| **確認していないことを、確認済みと書かない** | 範囲の限界を明記 | 検定の出題範囲・PCCS の目安 | 誤った情報を広める |

## 3. 関数・アルゴリズム

| 名前 | 場所 | 何をする | 計算量・注意 |
|---|---|---|---|
| **色空間の変換** | `color-math.ts` | sRGB ↔ HSV ↔ Lab | O(1) |
| **二分探索(最大の彩度)** | `maxChromaInGamut` | 範囲を半分ずつ狭めて、sRGB に収まる限界を探す | O(log(範囲 / 精度))。24 回 |
| **近い色の順位づけ** | `findRelatedColors` | 全件との ΔE を計算し、小さい順に並べる | O(n log n) |
| **ライトナー式の間隔反復** | `spaced-repetition.ts` | 正解で箱が上がり、次の出題が遠のく | O(1) / 回答 |
| **再計算での突き合わせ** | `verify-content.mjs` | 書いてある値と、計算した値の差が許容内か | O(件数) |

```javascript
// 実行できる
(async () => {
  const m = await import("./src/lib/color-math.ts");

  // 二分探索の動き: 同じ明度・色相で、sRGB に収まる最大の彩度を、範囲を半分ずつ狭めて探す
  const l = 50, h = 30;
  let lo = 0, hi = 160, steps = 0;
  while (steps < 24) {
    const mid = (lo + hi) / 2;
    if (m.lchInGamut({ l, c: mid, h })) lo = mid; else hi = mid;
    steps++;
  }
  console.log("自分で書いた二分探索:", lo.toFixed(3), " ライブラリ:", m.maxChromaInGamut(l, h).toFixed(3));

  // 全件を、基準の色に近い順に並べる(ΔE76)
  const base = m.hexToLab("#E60012");
  const candidates = ["#E8101F", "#0000FF", "#FF6600", "#CC0033"];
  const ranked = candidates.map((hex) => ({ hex, de: m.deltaE76(base, m.hexToLab(hex)) })).sort((a, b) => a.de - b.de);
  console.log(ranked.map((r) => `${r.hex}(${r.de.toFixed(1)})`).join(" < "));
})();
```

```text
# 出力
自分で書いた二分探索: 88.730  ライブラリ: 88.730
#E8101F(4.7) < #CC0033(24.7) < #FF6600(28.0) < #0000FF(165.5)
```

- **二分探索は、答えが「ある境目より下は収まり、上は収まらない」と単調に変わる**ときに使える(ここでは、彩度を上げると、いつか sRGB から出る)。

## 4. 色・Web の用語の補強

| 用語 | 意味 | このリポジトリでの出番 |
|---|---|---|
| **色相・彩度・明度(三属性)** | 色の種類・鮮やかさ・明るさ | 色の基礎 |
| **トーン(PCCS)** | 明度と彩度を合わせた色の調子 | 色図鑑 |
| **配色(補色・トライアド・類似色)** | 色の組み合わせの型 | 配色理論 |
| **ユニバーサルデザイン / 色覚多様性** | 誰にも見やすい設計 / 色の見え方の違い | UC 級・色覚のシミュレーション |
| **アクセシビリティ(a11y)/ WCAG** | 誰でも使える設計 / その指針 | コントラスト比 |
| **色温度 / ガンマ / 白色点** | 光の色合い / 明るさの特性 / 白の基準 | 色空間の変換 |
| **カラーグレーディング / ハイキー・ローキー** | 映像の色の調整 / 明るい・暗い調子 | 実務の用語 |
| **レスポンシブ / ダークモード** | 画面幅への対応 / 暗い配色 | `ui-rules.md` |
| **SSR・SSG / ハイドレーション** | サーバーで描く / ビルド時に作る / つなぎ込み | Next.js |
| **CSP / セキュリティヘッダ** | 読み込んでよいものを制限する仕組み | `next.config.ts` |
| **OGP / PWA / マニフェスト** | 共有時の表示 / アプリのように入れる Web / その設定 | アイコン・`manifest.ts` |
| **three.js / WebGL / canvas** | 3D 描画のライブラリ / その仕組み / 2D 描画の領域 | 色立体・可視化 |
| **間隔反復 / ライトナー式** | 忘れる頃に再出題する学習法 | 検定の復習 |

## 確認問題

1. `recordAnswer` が、元の状態を書き換えず、新しい状態を返すのは、なぜですか。
2. `[...list].sort(...)` と、コピーしてから並べるのは、なぜですか。
3. 二分探索が使える条件は何ですか。
4. 「データの正本を 1 つにする」を、このリポジトリで説明してください。

## 解答

1. React が「変わったか」を参照の違いで判断するため。元を書き換えると、変化に気づけず、再描画されない。
2. `sort` は元の配列を書き換えるので、元の順序を保ちたいときは、コピーを並べる。
3. 判定が、ある境目で「はい / いいえ」に単調に切り替わること(ここでは、彩度を上げると、いつか sRGB から出る)。
4. HEX が唯一の正本で、HSV・Lab・コントラスト比は、そこから計算する。frontmatter の記載値は、`verify` が再計算と突き合わせる。
