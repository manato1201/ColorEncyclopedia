/**
 * 色彩検定対策の自作問題データ。ColorEncyclopedia_DESIGN.md Phase 5参照。
 * 著作権保護された過去問の全文転載は避け、要旨・自作問題ベースで構成する(Phase 0の前提・制約)。
 * explanationRefはcontent/colors/*.mdのidを指し、解答後にそのエントリの詳細ページへリンクする。
 */

export type ExamLevel = "1級" | "2級" | "3級" | "UC級";

export interface ExamQuestion {
  id: string;
  level: ExamLevel;
  year: number;
  questionText: string;
  choices: string[];
  answerIndex: number;
  /** content/colors/*.md のid。詳細ページへのリンク先。 */
  explanationRef: string;
}

export const EXAM_QUESTIONS: ExamQuestion[] = [
  {
    id: "q-3-shuiro-01",
    level: "3級",
    year: 2023,
    questionText: "朱色のトーン分類として最も適切なものはどれか。",
    choices: ["p(ペール)", "v(ビビッド)", "dk(ダーク)", "ltg(ライトグレイッシュ)"],
    answerIndex: 1,
    explanationRef: "shuiro",
  },
  {
    id: "q-3-beniiro-01",
    level: "3級",
    year: 2023,
    questionText: "紅色の染料の原料となる植物として正しいものはどれか。",
    choices: ["藍", "紅花", "茜", "紫根"],
    answerIndex: 1,
    explanationRef: "beniiro",
  },
  {
    id: "q-3-daidaiiro-01",
    level: "3級",
    year: 2024,
    questionText: "橙色の補色に最も近い色相はどれか。",
    choices: ["黄緑", "青", "赤紫", "緑"],
    answerIndex: 1,
    explanationRef: "daidaiiro",
  },
  {
    id: "q-3-ruriiro-01",
    level: "3級",
    year: 2024,
    questionText: "寒色が持つとされる心理効果として正しいものはどれか。",
    choices: ["膨張して見える", "進出して見える", "収縮・後退して見える", "無彩色化して見える"],
    answerIndex: 2,
    explanationRef: "ruriiro",
  },
  {
    id: "q-3-asagiiro-01",
    level: "3級",
    year: 2022,
    questionText: "浅葱色の色相分類として適切なものはどれか。",
    choices: ["緑", "青緑", "青", "青紫"],
    answerIndex: 1,
    explanationRef: "asagiiro",
  },
  {
    id: "q-3-wakakusairo-01",
    level: "3級",
    year: 2022,
    questionText: "若草色が分類される色彩心理上のグループはどれか。",
    choices: ["暖色", "寒色", "中性色", "無彩色"],
    answerIndex: 2,
    explanationRef: "wakakusairo",
  },
  {
    id: "q-2-gunjouiro-01",
    level: "2級",
    year: 2023,
    questionText: "瑠璃色と群青色の主な違いを説明する色の属性として適切なものはどれか。",
    choices: ["色相", "彩度", "補色", "色相番号"],
    answerIndex: 1,
    explanationRef: "gunjouiro",
  },
  {
    id: "q-2-uguisuiro-01",
    level: "2級",
    year: 2024,
    questionText: "鶯色のトーンの特徴として適切なものはどれか。",
    choices: ["高彩度・高明度", "低彩度・低明度", "高彩度・低明度", "無彩色"],
    answerIndex: 1,
    explanationRef: "uguisuiro",
  },
  {
    id: "q-2-gofunniro-01",
    level: "2級",
    year: 2023,
    questionText: "色の三属性のうち、無彩色にも共通して存在する属性はどれか。",
    choices: ["色相", "彩度", "明度", "トーン"],
    answerIndex: 2,
    explanationRef: "gofunniro",
  },
  {
    id: "q-2-complementary-01",
    level: "2級",
    year: 2022,
    questionText: "24色相環において、補色の関係にある2色の色相差はどれか。",
    choices: ["6", "9", "12", "18"],
    answerIndex: 2,
    explanationRef: "complementary-harmony",
  },
  {
    id: "q-2-tone-on-tone-01",
    level: "2級",
    year: 2024,
    questionText: "トーンオントーン配色の説明として最も適切なものはどれか。",
    choices: ["色相を揃えトーンを変える配色", "トーンを揃え色相を変える配色", "無彩色のみの配色", "補色同士の配色"],
    answerIndex: 0,
    explanationRef: "tone-on-tone-harmony",
  },
  {
    id: "q-1-rikyunezumi-01",
    level: "1級",
    year: 2023,
    questionText: "彩度が極めて低い色が分類されるトーン区分として適切なものはどれか。",
    choices: ["v(ビビッド)", "s(ストロング)", "grayish(グレイッシュ)", "dp(ディープ)"],
    answerIndex: 2,
    explanationRef: "rikyunezumi",
  },
  {
    id: "q-1-triadic-01",
    level: "1級",
    year: 2024,
    questionText: "24色相環においてトライアド配色を構成する色相差はどれか。",
    choices: ["4", "8", "12", "16"],
    answerIndex: 1,
    explanationRef: "triadic-harmony",
  },
  {
    id: "q-1-split-01",
    level: "1級",
    year: 2022,
    questionText: "スプリットコンプリメンタリ配色の説明として適切なものはどれか。",
    choices: [
      "補色そのものを使う配色",
      "補色の両隣2色を使う配色",
      "隣接色のみを使う配色",
      "無彩色のみの配色",
    ],
    answerIndex: 1,
    explanationRef: "split-complementary-harmony",
  },
  {
    id: "q-uc-contrast-01",
    level: "UC級",
    year: 2023,
    questionText: "WCAGにおける通常テキストのAA基準のコントラスト比として正しいものはどれか。",
    choices: ["3:1以上", "4.5:1以上", "7:1以上", "10:1以上"],
    answerIndex: 1,
    explanationRef: "accessible-color-design",
  },
  {
    id: "q-uc-design-01",
    level: "UC級",
    year: 2024,
    questionText: "色のユニバーサルデザインにおいて、色の違いだけに頼らず併用が推奨される要素はどれか。",
    choices: ["彩度のみ", "模様・形・パターン", "色相のみ", "明度を極端に下げることのみ"],
    answerIndex: 1,
    explanationRef: "accessible-color-design",
  },
];

export function getQuestionsByLevel(level: ExamLevel): ExamQuestion[] {
  return EXAM_QUESTIONS.filter((q) => q.level === level);
}
