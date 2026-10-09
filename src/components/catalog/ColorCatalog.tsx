"use client";

import styles from "./ColorCatalog.module.css";
import { CatalogView } from "./CatalogView";
import { ColorPreview } from "./ColorPreview";
import { ActionLink } from "@/components/hud/ActionLink";
import { ColorSwatch } from "@/components/hud/ColorSwatch";
import { IconArrowRight, IconPalette, IconPlus, IconRefresh } from "@/components/icons/Icons";
import { EXAM_QUESTIONS } from "@/data/exam-questions";
import { COLOR_CATEGORY_ORDER, COLOR_SUBCATEGORIES_BY_CATEGORY } from "@/lib/color-categories";
import { slugFromLevel } from "@/lib/exam-levels";
import type { ColorMeta } from "@/lib/content/colors";

type ColorCatalogProps = {
  colors: ColorMeta[];
  featuredId: string;
};

/** 色エントリごとの、最初に出題する問題(「クイズに出す」の飛び先)。 */
const FIRST_QUESTION_BY_ENTRY = new Map(
  [...EXAM_QUESTIONS].reverse().map((q) => [q.explanationRef, q]),
);

/** HEX値でも検索できるようにする(「#EB6238」「eb6238」のどちらも可)。参照が安定するようモジュール定数にする。 */
const colorSearchFields = (color: ColorMeta): string[] =>
  color.colorValue ? [color.colorValue.hex, color.colorValue.hex.replace("#", "")] : [];

/**
 * 色図鑑のカタログ。左=検索+チップ+一覧(行=見本の丸+名前+英字の副題+HEX)、
 * 中央=選択した色の大きな見本と数値、下=操作(詳細・比較に追加・クイズに出す)。
 */
export function ColorCatalog({ colors, featuredId }: ColorCatalogProps) {
  return (
    <CatalogView
      items={colors}
      featuredId={featuredId}
      categoryOrder={COLOR_CATEGORY_ORDER}
      subcategoriesByCategory={COLOR_SUBCATEGORIES_BY_CATEGORY}
      eyebrow="CATALOG"
      title="色図鑑"
      titleEn="Color Encyclopedia"
      lead="色相・彩度・明度といった色のモチーフを数値データとして体系化した図鑑です。行を選ぶと、中央に大きな見本とHEX・RGB・HSV・Labが並びます。"
      countLabel="件の色・配色理論を収録"
      searchPlaceholder="色名・英字名・HEX・カテゴリで検索(例: 暖色、Vermilion、EB6238)"
      visualizedLabel="可視化対応"
      listLabel="色の一覧"
      extraSearchFields={colorSearchFields}
      renderLead={(color) =>
        color.colorValue ? (
          <ColorSwatch hex={color.colorValue.hex} size={14} />
        ) : (
          <span className={styles.conceptMark}>
            <IconPalette />
          </span>
        )
      }
      renderValue={(color) => color.colorValue?.hex ?? color.examLevel ?? ""}
      renderPreview={(color) => <ColorPreview color={color} />}
      renderActions={(color) => {
        const question = FIRST_QUESTION_BY_ENTRY.get(color.id);
        return (
          <>
            <ActionLink href={`/colors/${color.id}`} icon={<IconArrowRight />}>
              詳細を見る
            </ActionLink>
            <ActionLink href={`/compare?ids=${color.id}`} icon={<IconPlus />}>
              比較に追加
            </ActionLink>
            <ActionLink
              href={question ? `/exam/${slugFromLevel(question.level)}#${question.id}` : "/exam"}
              icon={<IconRefresh />}
              disabled={!question}
              title={question ? undefined : "この項目に対応する問題はまだありません"}
            >
              クイズに出す
            </ActionLink>
          </>
        );
      }}
    />
  );
}
