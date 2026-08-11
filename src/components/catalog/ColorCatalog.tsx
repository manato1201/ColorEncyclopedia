"use client";

import { CatalogView } from "./CatalogView";
import { ColorSwatch } from "@/components/hud/ColorSwatch";
import { ExamLevelBadge } from "@/components/hud/ExamLevelBadge";
import { COLOR_CATEGORY_ORDER, COLOR_SUBCATEGORIES_BY_CATEGORY } from "@/lib/color-categories";
import type { ColorMeta } from "@/lib/content/colors";

type ColorCatalogProps = {
  colors: ColorMeta[];
  featuredId: string;
};

/**
 * The-Algorithm-IllustratedのAlgorithmCatalog.tsxの直接移植。
 * 絞り込みチップの語彙を「色相/彩度/明度/配色理論」に差し替える以外はロジック互換を維持する。
 */
export function ColorCatalog({ colors, featuredId }: ColorCatalogProps) {
  return (
    <CatalogView
      items={colors}
      featuredId={featuredId}
      basePath="/colors"
      categoryOrder={COLOR_CATEGORY_ORDER}
      subcategoriesByCategory={COLOR_SUBCATEGORIES_BY_CATEGORY}
      eyebrow="■ CATALOG 色彩図鑑"
      titleLines={["色を、数値で読み解き、", "配色理論で組み立てる。"]}
      lead="色相・彩度・明度というモチーフを数値データとして体系化し、色彩検定対策と配色理論の可視化学習を同時に提供する図鑑です。"
      countLabel="件の色を収録"
      searchPlaceholder="色名・カテゴリで検索(例: 暖色、補色、朱色)"
      visualizedLabel="可視化対応"
      renderBadge={(item) => (item.examLevel ? <ExamLevelBadge level={item.examLevel} /> : null)}
      renderRowMeta={(item) => (item.colorValue ? <ColorSwatch hex={item.colorValue.hex} /> : null)}
    />
  );
}
