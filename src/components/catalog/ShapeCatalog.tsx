import { CatalogView } from "./CatalogView";
import { SHAPE_CATEGORY_ORDER, SHAPE_SUBCATEGORIES_BY_CATEGORY } from "@/lib/shape-categories";
import type { ShapeMeta } from "@/lib/content/shapes";

type ShapeCatalogProps = {
  shapes: ShapeMeta[];
  featuredId: string;
};

/** ColorCatalog.tsxと同じCatalogViewを図形向けの語彙・カテゴリ表で使う。 */
export function ShapeCatalog({ shapes, featuredId }: ShapeCatalogProps) {
  return (
    <CatalogView
      items={shapes}
      featuredId={featuredId}
      basePath="/shapes"
      categoryOrder={SHAPE_CATEGORY_ORDER}
      subcategoriesByCategory={SHAPE_SUBCATEGORIES_BY_CATEGORY}
      eyebrow="■ CATALOG 図形図鑑"
      titleLines={["図形の比例と対称性を、", "作図しながら理解する。"]}
      lead="黄金比・テセレーション・対称群といった図形理論のモチーフを、実際に作図手順を動かしながら学べる図鑑です。"
      countLabel="件の図形理論を収録"
      searchPlaceholder="図形名・カテゴリで検索(例: 黄金比、対称性、テセレーション)"
      visualizedLabel="可視化対応"
    />
  );
}
