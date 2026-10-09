"use client";

import { CatalogView } from "./CatalogView";
import { ShapePreview } from "./ShapePreview";
import { ActionLink } from "@/components/hud/ActionLink";
import { IconArrowRight, IconPlus } from "@/components/icons/Icons";
import { SHAPE_CATEGORY_ORDER, SHAPE_SUBCATEGORIES_BY_CATEGORY } from "@/lib/shape-categories";
import type { ShapeMeta } from "@/lib/content/shapes";

type ShapeCatalogProps = {
  shapes: ShapeMeta[];
  featuredId: string;
};

/** ColorCatalogと同じCatalogViewを図形向けの語彙で使う。行の右端には可視化の有無を出す。 */
export function ShapeCatalog({ shapes, featuredId }: ShapeCatalogProps) {
  return (
    <CatalogView
      items={shapes}
      featuredId={featuredId}
      categoryOrder={SHAPE_CATEGORY_ORDER}
      subcategoriesByCategory={SHAPE_SUBCATEGORIES_BY_CATEGORY}
      eyebrow="CATALOG"
      title="図形図鑑"
      titleEn="Shape Encyclopedia"
      lead="黄金比・テセレーション・対称群といった図形理論を、作図手順を動かしながら学べる図鑑です。行を選ぶと、中央で作図手順を再生できます。"
      countLabel="件の図形理論を収録"
      searchPlaceholder="図形名・英字名・カテゴリで検索(例: 黄金比、Symmetry)"
      visualizedLabel="可視化対応"
      listLabel="図形の一覧"
      renderValue={(shape) => (shape.hasVisualizer ? "可視化" : "")}
      renderPreview={(shape) => <ShapePreview shape={shape} />}
      renderActions={(shape) => (
        <>
          <ActionLink href={`/shapes/${shape.id}`} icon={<IconArrowRight />}>
            詳細を見る
          </ActionLink>
          <ActionLink href={`/compare/shapes?ids=${shape.id}`} icon={<IconPlus />}>
            比較に追加
          </ActionLink>
        </>
      )}
    />
  );
}
