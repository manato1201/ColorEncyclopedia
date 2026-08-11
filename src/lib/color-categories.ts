/**
 * カタログ画面のカテゴリ・サブカテゴリ階層(The-Algorithm-Illustrated の algorithm-categories.ts を踏襲)。
 * content/colors/*.md の frontmatter category/subcategory はこの表のいずれかの値と一致させること。
 * 新カテゴリ・新サブカテゴリの追加はこの配列への追記だけで完結する。
 */
export const COLOR_CATEGORY_TAXONOMY = [
  { category: "色相", subcategories: ["暖色", "寒色", "中性色"] },
  { category: "彩度", subcategories: ["高彩度", "低彩度"] },
  { category: "明度", subcategories: ["高明度", "低明度"] },
  {
    category: "配色理論",
    subcategories: [
      "補色",
      "類似色",
      "トライアド",
      "スプリットコンプリメンタリ",
      "トーン配色",
      "その他技法",
      "ユニバーサルデザイン",
    ],
  },
] as const;

export const COLOR_CATEGORY_ORDER = COLOR_CATEGORY_TAXONOMY.map((c) => c.category);

export const COLOR_SUBCATEGORIES_BY_CATEGORY: Record<string, readonly string[]> =
  Object.fromEntries(COLOR_CATEGORY_TAXONOMY.map((c) => [c.category, c.subcategories]));
