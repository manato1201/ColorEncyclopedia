"use client";

import Link from "next/link";
import styles from "./Compare.module.css";
import { useCompareSelection, useIdsFromQuery, MAX_COMPARE_SELECTED } from "./useCompareSelection";
import { ActionButton, ActionLink } from "@/components/hud/ActionLink";
import { IconArrowRight, IconRefresh } from "@/components/icons/Icons";
import { EntryList } from "@/components/explorer/EntryList";
import { useEntryFilter } from "@/components/explorer/useEntryFilter";
import { ShapeVisualizer, hasShapeVisualizer } from "@/components/visualizer/ShapeVisualizer";
import { SHAPE_CATEGORY_ORDER, SHAPE_SUBCATEGORIES_BY_CATEGORY } from "@/lib/shape-categories";
import type { ShapeMeta } from "@/lib/content/shapes";

type ShapeCompareViewProps = {
  shapes: ShapeMeta[];
};

/**
 * 図形の比較。ColorCompareViewと同じ型(左=チップと一覧 / 中央=比較 / 下=操作)。
 * 図形は数値属性を持たないため、カテゴリ・概要の並列比較と作図手順の可視化を見比べる構成。
 */
export function ShapeCompareView({ shapes }: ShapeCompareViewProps) {
  const initialIds = useIdsFromQuery();
  const filter = useEntryFilter(shapes, SHAPE_CATEGORY_ORDER);
  const { selected, isSelected, isFull, toggle, remove, clear } = useCompareSelection(shapes, initialIds);
  const visualized = selected.filter((s) => hasShapeVisualizer(s.id));
  const unsupported = selected.filter((s) => !hasShapeVisualizer(s.id));

  return (
    <div className={styles.view}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>COMPARE</span>
        <h1 className={styles.title}>図形を比較</h1>
        <p className="subtitle">Compare Shapes</p>
        <p className={styles.lead}>
          左の一覧から最大{MAX_COMPARE_SELECTED}件の図形を選ぶと、概要と作図手順を並べて確認できます。
        </p>
      </header>

      <div className={styles.explorer}>
        <div className={styles.listPane}>
          <EntryList
            filter={filter}
            categoryOrder={SHAPE_CATEGORY_ORDER}
            subcategoriesByCategory={SHAPE_SUBCATEGORIES_BY_CATEGORY}
            searchPlaceholder="図形名・英字名・カテゴリで検索"
            visualizedLabel="可視化対応"
            listLabel="比較に追加する図形の一覧"
            isSelected={isSelected}
            onSelect={toggle}
            isDisabled={(shape) => isFull && !isSelected(shape.id)}
            hint={isFull ? `(最大${MAX_COMPARE_SELECTED}件まで選択済み)` : `(${selected.length}/${MAX_COMPARE_SELECTED}件を選択中)`}
            renderValue={(shape) => (shape.hasVisualizer ? "可視化" : "")}
          />
        </div>

        <div className={styles.stagePane}>
          {selected.length === 0 ? (
            <div className={styles.emptyState}>左の一覧から図形を選ぶと、ここに比較が表示されます。</div>
          ) : (
            <ul className={styles.cards}>
              {selected.map((s) => (
                <li
                  key={s.id}
                  className={`${styles.card} stagger`}
                  style={{ "--i": selected.indexOf(s) } as React.CSSProperties}
                >
                  <div className={styles.cardHead}>
                    <Link href={`/shapes/${s.id}`} className={styles.cardName}>
                      {s.name}
                    </Link>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => remove(s.id)}
                      aria-label={`${s.name}を比較から外す`}
                    >
                      ✕ 外す
                    </button>
                  </div>
                  <span className="subtitle">{s.nameEn}</span>
                  <span className={styles.cardCategory}>
                    {s.category} ・ {s.subcategory}
                  </span>
                  <p className={styles.cardSummary}>{s.summary}</p>
                </li>
              ))}
            </ul>
          )}

          {visualized.length > 0 ? (
            <section className={styles.section} aria-labelledby="cmp-shape-visual">
              <h2 id="cmp-shape-visual" className={styles.sectionLabel}>
                VISUALIZE 作図手順を見比べる
              </h2>
              <div className={styles.visualGrid}>
                {visualized.map((s) => (
                  <div key={s.id} className={styles.visualPanel}>
                    <Link href={`/shapes/${s.id}`} className={styles.visualPanelTitle}>
                      {s.name}
                    </Link>
                    <ShapeVisualizer shapeId={s.id} />
                  </div>
                ))}
              </div>
              {unsupported.length > 0 ? (
                <p className={styles.visualNote}>可視化未対応: {unsupported.map((s) => s.name).join("、")}</p>
              ) : null}
            </section>
          ) : null}

          <div className={styles.actions}>
            <ActionButton icon={<IconRefresh />} onClick={clear} disabled={selected.length === 0}>
              選択をクリア
            </ActionButton>
            <ActionLink href="/compare" icon={<IconArrowRight />}>
              色を比較する
            </ActionLink>
          </div>
        </div>
      </div>
    </div>
  );
}
