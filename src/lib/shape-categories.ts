/**
 * カタログ画面のカテゴリ・サブカテゴリ階層(色側の color-categories.ts と対になる図形版)。
 * content/shapes/*.md の frontmatter category/subcategory はこの表のいずれかの値と一致させること。
 */
export const SHAPE_CATEGORY_TAXONOMY = [
  {
    category: "図形理論",
    subcategories: ["比例・分割", "対称性", "平面充填"],
  },
] as const;

export const SHAPE_CATEGORY_ORDER = SHAPE_CATEGORY_TAXONOMY.map((c) => c.category);

export const SHAPE_SUBCATEGORIES_BY_CATEGORY: Record<string, readonly string[]> =
  Object.fromEntries(SHAPE_CATEGORY_TAXONOMY.map((c) => [c.category, c.subcategories]));
