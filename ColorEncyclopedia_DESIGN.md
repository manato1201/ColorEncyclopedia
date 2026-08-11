# ColorEncyclopedia(色彩図鑑) 設計書

**設計指標: 色彩理論・図形理論の数値化と可視化による学習体験の構築(色彩検定対策+一般教養)**
作成日: 2026-08-11 / 想定規模: 小〜中規模(The-Algorithm-Illustratedと同一スタック、色/図形の2コンテンツカテゴリ)

---

## Phase 0: コンセプト・要件定義

### 目的
CEDEC講演で語られた「アルゴリズム図鑑」の構成(コンテンツをMarkdown+frontmatterで数値データ化し、カタログ・詳細・可視化の3層で見せる)を色彩・図形分野に転用する。色相・彩度・明度・配色理論といったモチーフを数値データとして体系化し、色彩検定(色彩検定協会)の過去問対策学習と、配色/図形理論の一般教養的な可視化学習を同時に提供する。加えて「選択した色に応じてサイト自体のテーマが変化する」インタラクティブ要素を独自機能として持つ。

### アーキテクチャ選定
**`The-Algorithm-Illustrated`のスタックをそのまま新規プロジェクトとして流用する。** Next.js 16.2.10(App Router)+ React 19.2.4 + TypeScript、依存は`gray-matter`(frontmatter解析)/`marked`(Markdown→HTML)/`pixi.js`(可視化canvas描画)の3点構成を踏襲し、パッケージマネージャはnpm(移植元`package-lock.json`に準拠)。移植元から具体的にコピー・改変するファイルを以下に名指しする。

- `src/lib/content/algorithms.ts`(102行、`AlgorithmFrontmatter`型・`getAllAlgorithmsMeta`/`getAlgorithmDetail`)→ Phase 1で`createContentLoader<T>`に汎化
- `src/components/catalog/AlgorithmCatalog.tsx`(347行)+ `.module.css`(361行)→ Phase 2で`ColorCatalog.tsx`に移植
- `src/components/compare/CompareView.tsx` → Phase 2で`ColorCompareView.tsx`に移植
- `src/components/visualizer/*`(`useStepPlayer.ts`/`useWorkerFrames.ts`含む)→ Phase 3で新規ビジュアライザの基盤に再利用
- `scripts/verify-visualizations.mjs`(1346行)→ Phase 1・3でfrontmatter検証/可視化検証に転用
- `src/app/basics/`(「アルゴリズムとは」イントロページ)→ Phase 5で「色彩図鑑とは」に転用

移植元にならい`AGENTS.md`相当の注記(「これはあなたの知っているNext.jsではない」)も新規リポジトリに引き継ぎ、Next.js 16の破壊的変更を推測実装しない運用を継続する。

### コンテンツモデル
移植元は`algorithms`という単一コンテンツ種別を前提に設計されていたが、本プロジェクトは**色理論**と**図形/幾何理論**という2つの独立コンテンツカテゴリを扱う。そのため単一目的だった`algorithms.ts`のロード処理を`createContentLoader<T>(contentDir, contentType)`というジェネリック関数に汎化し、`colors`/`shapes`の両コンテンツディレクトリで共有する。**これが移植元からの唯一の意図的なアーキテクチャ改良点である**(それ以外はPhase 1〜5を通じ直接移植を基本方針とする)。

### 要求機能
- カタログ/詳細/比較ビュー(色・図形それぞれ)
- 色相環インタラクション、配色理論(補色・類似色・トライアド・スプリットコンプリメンタリ)の可視化
- WCAGコントラスト比のライブ計算・可視化
- 図形理論(黄金比・テセレーション・対称群等)の可視化
- 選択色に応じたサイト全体のテーマ動的変化
- 色彩検定過去問コンテンツ、「色彩図鑑とは」イントロセクション
- レスポンシブデザイン

### 非機能要件
- 静的優先(SSG、サーバDBなし)。移植元と同じくNode `fs`ベースのビルド時ロードのみで、実行時DBアクセスを持たない。
- レスポンシブ(モバイル1列→タブレット2列→デスクトップauto-fillグリッド、移植元`AlgorithmCatalog.module.css`のブレークポイント踏襲)。
- **色駆動テーマ機能を持ってもWCAG AAコントラストを維持する**という制約を明記する(Phase 4に直結。ユーザーが任意の色を選ぶ以上、可読性を静的デザインでは保証できないため、動的フォールバックが必須要件になる)。

### 前提・制約
- 新規リポジトリとして独立させ、`The-Algorithm-Illustrated`本体には手を加えない(コピー元として参照するのみ)。
- 色彩検定の級・出題範囲は色彩検定協会(旧AFT)の公開情報に準拠し、著作権保護された過去問の全文転載は避け、要旨・自作問題ベースで構成する。
- pixi.jsのcanvas描画は移植元と同じ標準構成を前提とし、新規描画ライブラリは追加しない。

### アンチパターン(全フェーズ共通)
- 新カテゴリ・新サブカテゴリの追加を`createContentLoader`呼び出し側の決め打ち配列に重複させない。移植元の`CATEGORY_TAXONOMY`一元管理の思想を踏襲する。
- `hasVisualizer`をfrontmatterに直書きしない。移植元同様、可視化対応の有無は`*-visualizers.ts`相当のレジストリキー登録で表現し、ビルド時に真偽値を導出する。
- 色理論・図形理論を単一の`content/`ディレクトリに混在させない。`content/colors/`と`content/shapes/`を分離し、`createContentLoader`の`contentType`引数で明示的に切り替える。
- WCAGコントラスト計算式を独自に再実装・近似しない(既知の公式をそのまま使う。Phase 4参照)。

**検証チェックリスト:**
- [ ] `content/colors/`と`content/shapes/`の分離方針が全フェーズの設計に反映されている
- [ ] 移植元ファイルパス(`algorithms.ts`/`AlgorithmCatalog.tsx`/`CompareView.tsx`/`verify-visualizations.mjs`/`basics/`)がPhase 1〜5の各実装内容に対応付けられている
- [ ] `createContentLoader<T>`汎化が「唯一の意図的改良点」として設計方針に明記されている
- [ ] WCAG AA維持という非機能要件がPhase 4のフォールバック設計に直結している

---

## Phase 1: コンテンツ基盤(frontmatterスキーマ+ローダー汎化)(最優先・移植の核)

**方針:** `content/colors/*.md` + `content/shapes/*.md`をフラット構成で持つ(移植元`content/algorithms/*.md`のフラット配置を踏襲)。frontmatterは移植元の`name`/`category`/`subcategory`/`complexity`/`summary`の5項目のうち、`complexity`枠を色/図形ドメイン向けに差し替える。

**実装内容:**
1. frontmatterスキーマを定義する。
   ```yaml
   # content/colors/shuiro.md
   ---
   name: 朱色(しゅいろ)
   category: 色相
   subcategory: 暖色
   colorValue:
     hex: "#EB6238"
     hsv: { h: 14, s: 76, v: 92 }
     lab: { l: 58.2, a: 52.1, b: 48.3 }
   examLevel: 3級
   summary: JIS慣用色名の一つ。朱肉の色に由来し、暖色相の代表例として配色理論の説明に頻出する。
   ---
   ## 概要
   ## 数値データ(HSV/Lab)
   ## 配色理論での位置づけ
   ## 出題実績
   ```
   ```yaml
   # content/shapes/golden-ratio.md
   ---
   name: 黄金比(黄金分割)
   category: 図形理論
   subcategory: 比例・分割
   summary: 約1:1.618の比率。均衡の取れた構図として建築・デザインで多用される古典的な幾何学的性質。
   ---
   ## 概要 / ## 数値データ(比率の導出) / ## 応用例
   ```
   `colorValue`と`examLevel`は`colors`専用のオプショナル項目とし、`shapes`側では持たない(型レベルで区別、下記2参照)。
2. `src/lib/content/createContentLoader.ts` — `algorithms.ts`の`getAllAlgorithmsMeta`/`getAlgorithmDetail`をジェネリック化する。
   ```typescript
   // src/lib/content/createContentLoader.ts
   export interface ContentFrontmatterBase {
     name: string;
     category: string;
     subcategory: string;
     summary: string;
   }
   export interface ColorFrontmatter extends ContentFrontmatterBase {
     colorValue?: { hex: string; hsv: { h: number; s: number; v: number }; lab: { l: number; a: number; b: number } };
     examLevel?: "1級" | "2級" | "3級" | "UC級";
   }
   export type ShapeFrontmatter = ContentFrontmatterBase;
   export function createContentLoader<T extends ContentFrontmatterBase>(
     contentDir: string, // "content/colors" | "content/shapes"
   ) {
     return {
       getAllMeta: (): (T & { id: string })[] => { /* fs.readdirSync + gray-matter、algorithms.tsの実装を踏襲 */ throw new Error("todo"); },
       getDetail: (id: string): { meta: T; html: string } => { /* gray-matter + marked、算出済みhasVisualizerを付与 */ throw new Error("todo"); },
     };
   }
   export const colorLoader = createContentLoader<ColorFrontmatter>("content/colors");
   export const shapeLoader = createContentLoader<ShapeFrontmatter>("content/shapes");
   ```
3. `verify-visualizations.mjs`をビルド時frontmatter検証に転用する。`scripts/verify-content.mjs`として、`colorValue`のhex表記(`#RRGGBB`)/`hsv`/`lab`の型整合と、`examLevel`が色彩検定の実在する級(1級/2級/3級/UC級)のいずれかであることを機械的にチェックする。`package.json`に`"verify": "node --experimental-strip-types scripts/verify-content.mjs"`を追加する。

**検証チェックリスト:**
- [ ] `content/colors/*.md`と`content/shapes/*.md`が`createContentLoader`の同一実装で正しくロードできる
- [ ] `colorValue.hex`が`#RRGGBB`形式でない、または`examLevel`が定義外の値のエントリを`verify`スクリプトが検出する
- [ ] `shapes`側エントリに`colorValue`/`examLevel`が誤って混入していないことを型レベル(TypeScript)で防止できている
- [ ] `npm run verify`が全エントリに対してエラーなく完走する

---

## Phase 2: カタログ・詳細・比較ビュー(既存コンポーネント移植)

**方針:** 移植元のカタログ・比較UIは色/図形どちらにも転用可能な汎用構造(絞り込みチップ+一覧+詳細ページ)であり、UIロジックはほぼ無改造で移植する。

**実装内容:**
1. `src/components/catalog/ColorCatalog.tsx` — `AlgorithmCatalog.tsx`(347行)の直接移植。カテゴリ/サブカテゴリ絞り込みチップの語彙を「色相/彩度/明度/配色理論」「図形理論/比例・分割/対称性」に差し替える以外はロジック互換を維持する。`AlgorithmCatalog.module.css`のグリッドパターン(`grid-template-columns: repeat(auto-fill, minmax(22rem, 1fr))`)もそのまま踏襲する。
2. `src/app/colors/[id]/page.tsx` / `src/app/shapes/[id]/page.tsx` — 詳細ページ。`colorLoader.getDetail(id)`で取得したMarkdown本文(概要/数値データ/配色理論での位置づけ/出題実績)を描画し、`colorValue`があるエントリはヘッダ部にカラースウォッチとHSV/Lab数値を並べて表示する。
3. `src/components/compare/ColorCompareView.tsx` — `CompareView.tsx`の直接移植。2〜3件の色エントリを並列カードで比較し、各ペアのWCAGコントラスト比(Phase 4の計算式を共有)をカード間に表示する。図形側は数値属性(比率・角度・対称数)の並列比較に転用する。

**検証チェックリスト:**
- [ ] `ColorCatalog.tsx`の絞り込みチップが色/図形カテゴリ双方で破綻なく機能する
- [ ] 詳細ページで`colorValue`未設定のエントリ(図形など)でもレイアウトが崩れない
- [ ] `ColorCompareView.tsx`で2件比較・3件比較の両方でコントラスト比表示が正しく計算される
- [ ] モバイル幅でカタログ・比較ビューがそれぞれ1列に折り返される

---

## Phase 3: インタラクティブ可視化(PixiJS踏襲)(図鑑としての目玉)

**方針:** 移植元の`useStepPlayer.ts`/`useWorkerFrames.ts`によるステッププレイヤーパターン(アニメーションをフレーム列として生成しWorkerで計算、再生制御は`PlaybackControls.tsx`相当)を、配色理論・図形構成の手順再生に転用する。`hasVisualizer`ビルド時真偽値パターン(SSGブロック回避)も踏襲する。

**実装内容:**
1. `src/components/visualizer/HueWheelVisualizer.tsx` — 色相環(0〜360度)をpixi.jsで描画し、選択色の位置をインタラクティブにハイライトする基盤コンポーネント。以降のビジュアライザが共通で利用する。
2. `src/components/visualizer/HarmonyVisualizer.tsx` — 補色(complementary)/類似色(analogous)/トライアド(triadic)/スプリットコンプリメンタリ(split-complementary)を色相環上に線で結んで描画する。配色理論の実在する用語をそのまま用いる。
3. `src/components/visualizer/ContrastVisualizer.tsx` — WCAGコントラスト比のライブ計算を可視化する。2色を選ぶとリアルタイムに比率を再計算し、AA/AAA基準の達成・未達成を色分け表示する(計算式はPhase 4の`contrastRatio`関数を共有)。
4. `src/components/visualizer/ShapeConstructionVisualizer.tsx` — 黄金比の矩形分割、テセレーション(平面充填)、対称群(点対称・線対称・回転対称)の作図手順を`useStepPlayer.ts`のステップ再生パターンで段階的に描画する。
5. `src/lib/has-color-visualizer.ts`(移植元`has-visualizer.ts`の踏襲) — `*-visualizers.ts`相当のレジストリ(`HUE_WHEEL_VISUALIZERS`/`HARMONY_VISUALIZERS`/`SHAPE_VISUALIZERS`)に対しエントリidを`in`演算子で照合し、ビルド時に`hasVisualizer`真偽値を導出する。frontmatterには書き込まない(Phase 0のアンチパターン参照)。

**検証チェックリスト:**
- [ ] `HueWheelVisualizer`が0〜360度の色相入力に対し正しい角度位置を描画する
- [ ] `HarmonyVisualizer`の4種の配色理論(補色/類似色/トライアド/スプリットコンプリメンタリ)がそれぞれ正しい色相角度差で線を結ぶ
- [ ] `ContrastVisualizer`のライブ計算結果が`ContrastVisualizer`単体テストと`deriveThemeFromColor`側(Phase 4)の計算結果で一致する
- [ ] `hasVisualizer`未対応エントリの詳細ページがビジュアライザ欠落時もSSGビルドをブロックしない

---

## Phase 4: 選択色による動的サイトテーマ(CSS custom properties)(独自機能)

**方針:** 移植元にはない独自機能。選択した任意の色からサイト全体のテーマ(プライマリ/アクセント/背景/文字色)を配色理論に基づき導出し、CSS custom propertiesとしてルート要素に反映する。WCAG AAコントラスト計算は既に確立された公式であり、新規研究要素はない。

**実装内容:**
1. `src/lib/theme/deriveThemeFromColor.ts` — 選択色(hex/HSV)から`primary`/`accent`/`bgTint`/`textOn`を導出する純関数。
   ```typescript
   // src/lib/theme/deriveThemeFromColor.ts
   export interface DerivedTheme {
     primary: string;
     accent: string;
     bgTint: string;
     textOn: "light" | "dark";
   }
   const SAFE_FALLBACK_THEME: DerivedTheme = {
     primary: "#2B2B2B", accent: "#5B8DEF", bgTint: "#F5F5F5", textOn: "dark",
   };
   export function deriveThemeFromColor(hex: string): DerivedTheme {
     const { h, s, v } = hexToHsv(hex);
     const accent = hsvToHex({ h: (h + 180) % 360, s, v }); // 補色回転
     const bgTint = hsvToHex({ h, s: Math.min(s, 18), v: 96 }); // 彩度クランプで淡色背景に
     const textOn = contrastRatio(hex, "#FFFFFF") >= 4.5 ? "light" : "dark";
     // WCAG AA(コントラスト比4.5:1)未達ならセーフフォールバックへ
     if (contrastRatio(hex, bgTint) < 4.5) return SAFE_FALLBACK_THEME;
     return { primary: hex, accent, bgTint, textOn };
   }
   // WCAG 2.x 相対輝度による標準コントラスト比計算(既知の公式、研究要素なし)
   function contrastRatio(hexA: string, hexB: string): number {
     const l1 = relativeLuminance(hexA);
     const l2 = relativeLuminance(hexB);
     const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
     return (lighter + 0.05) / (darker + 0.05);
   }
   ```
2. `src/components/theme/ThemeFromColorProvider.tsx` — 戻り値をCSS custom propertiesとしてルート要素に反映する。
   ```typescript
   // src/components/theme/ThemeFromColorProvider.tsx
   useEffect(() => {
     const theme = deriveThemeFromColor(selectedHex);
     const root = document.documentElement;
     root.style.setProperty("--theme-primary", theme.primary);
     root.style.setProperty("--theme-accent", theme.accent);
     root.style.setProperty("--theme-bg-tint", theme.bgTint);
     root.style.setProperty("--theme-text-on", theme.textOn);
   }, [selectedHex]);
   ```
   グローバルCSS側(`globals.css`)は`var(--theme-primary, #EB6238)`のようにフォールバック値付きで参照し、テーマ未選択時(初回ロード時)も既定色で崩れず表示される。
3. 極端な色(純白`#FFFFFF`/純黒`#000000`/低彩度グレー)選択時は`bgTint`とのコントラストが不足しやすいため、`SAFE_FALLBACK_THEME`への切り替えを必ず通す設計とし、Phase 3の`ContrastVisualizer`で同じ`contrastRatio`関数を共有してユーザーにも判定根拠を可視化する。

**検証チェックリスト:**
- [ ] `deriveThemeFromColor`が主要色相12点(色相環30度刻み)で正しい補色を算出する
- [ ] 純白・純黒・低彩度グレーの3ケースで`SAFE_FALLBACK_THEME`に正しくフォールバックする
- [ ] CSS custom propertiesが未設定の初回ロード時も`globals.css`側のフォールバック値で崩れない
- [ ] `ContrastVisualizer`(Phase 3)と`deriveThemeFromColor`(Phase 4)の`contrastRatio`計算結果が完全一致する

---

## Phase 5: 検定対策コンテンツ+イントロ

**方針:** 色彩検定の過去問(要旨・自作問題ベース)を独立コンテンツ種別として持ち、解説は既存の`content/colors/*.md`エントリへの参照で表現しコンテンツの二重管理を避ける。

**実装内容:**
1. `content/exam-questions/*.md`(または`src/data/exam-questions.ts`)に以下のスキーマで格納する。
   ```typescript
   interface ExamQuestion {
     id: string;
     level: "1級" | "2級" | "3級" | "UC級";
     year: number;
     questionText: string;
     choices: string[];
     answerIndex: number;
     explanationRef: string; // 対応する content/colors/*.md のid(例: "shuiro")
   }
   ```
2. `src/app/exam/[level]/page.tsx` — 級別に問題一覧を表示し、解答後に`explanationRef`先の色エントリ詳細ページへリンクする。
3. `src/app/basics/page.tsx`パターン(移植元「アルゴリズムとは」イントロ)を「色彩図鑑とは」イントロに転用する。色彩図鑑の目的・色彩検定との関係・数値データ(HSV/Lab)の読み方を解説する固定ページとして`src/app/basics/page.tsx`に配置する。

**検証チェックリスト:**
- [ ] 全`ExamQuestion`の`explanationRef`が対応する`content/colors/*.md`のidに解決できる(未解決参照がない)
- [ ] `level`が4区分(1級/2級/3級/UC級)の範囲内に収まっている
- [ ] 級別問題一覧ページで年度・級による絞り込みが機能する
- [ ] 「色彩図鑑とは」イントロページが`basics/page.tsx`パターンを踏襲しレスポンシブに表示される

---

## Final Phase: 統合検証

- [ ] 1つの共有`createContentLoader`実装で`content/colors/`と`content/shapes/`の両方が正しくロードできる
- [ ] カタログのカテゴリ絞り込み・比較ビューのレイアウトが色/図形どちらのコンテンツでも崩れない
- [ ] 新規ビジュアライザ(`HueWheelVisualizer`/`HarmonyVisualizer`/`ContrastVisualizer`/`ShapeConstructionVisualizer`)が`hasVisualizer`未対応エントリを含めてもSSGビルドをブロックしない
- [ ] 極端な色(純白/純黒/低彩度)選択時に`deriveThemeFromColor`のコントラストフォールバックが機能する
- [ ] 過去問エントリ(`ExamQuestion.explanationRef`)が対応する色エントリへ正しくリンクする
- [ ] `npm run lint` / `npx tsc --noEmit` / `npm run verify` / `npm run build`が全パスする

---

## 相互参照ドキュメント

`The-Algorithm-Illustrated`(本ワークスペース姉妹プロジェクト)は本設計書の直接の移植元である。スタック(Next.js 16.2.10 + React 19.2.4 + `gray-matter` + `marked` + `pixi.js`)、コンテンツモデル(`src/lib/content/algorithms.ts`のfrontmatter方式)、カタログ・比較UI(`src/components/catalog/AlgorithmCatalog.tsx`/`src/components/compare/CompareView.tsx`)、可視化基盤(`src/components/visualizer/useStepPlayer.ts`/`useWorkerFrames.ts`)、検証スクリプト(`scripts/verify-visualizations.mjs`)を具体的な引用元として全面的に流用する。`The-Algorithm-Illustrated/IMPROVEMENT_PLAN.md`側にも本文書への相互参照が既に記載されており(Phase 1のグリッド化・Phase 3のCI/CD設計をColorEncyclopedia初期実装に持ち越す旨)、双方が対応関係にある。

本文書は他の全設計書と実行時依存を持たない。全13文書のうち、独立した新規プロジェクトとして完結するという意味で最も自己完結した文書である。

**優先度注記:** 低リスク。アーキテクチャの大部分が同一ワークスペース内の姉妹プロジェクトからの実証済みコピーであり、新規エンジニアリングが必要なのはPhase 4(配色調和・コントラスト安全テーマ)のみ。WCAGコントラスト計算は既に確立された公式(相対輝度ベースの比率計算)であり、研究要素を含まない。
