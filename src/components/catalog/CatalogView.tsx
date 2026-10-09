"use client";

import { useRef, useState, type ReactNode } from "react";
import styles from "./CatalogView.module.css";
import { EntryList } from "@/components/explorer/EntryList";
import { useEntryFilter, type Entry } from "@/components/explorer/useEntryFilter";

export type CatalogItem = Entry;

type CatalogViewProps<T extends CatalogItem> = {
  items: T[];
  /** 最初に中央へ表示する項目のid。 */
  featuredId: string;
  categoryOrder: readonly string[];
  subcategoriesByCategory: Record<string, readonly string[]>;
  eyebrow: string;
  title: string;
  titleEn: string;
  lead: string;
  countLabel: string;
  searchPlaceholder: string;
  visualizedLabel: string;
  listLabel: string;
  /** 一覧の行の先頭(色見本の丸など)。 */
  renderLead?: (item: T) => ReactNode;
  /** 一覧の行の右端(HEX値など)。 */
  renderValue?: (item: T) => ReactNode;
  /** 検索対象に加える文字列(HEX値など)。モジュール定数など、参照が安定した関数を渡すこと。 */
  extraSearchFields?: (item: T) => string[];
  /** 中央の「主役」(選択した項目の大きな見本と説明)。 */
  renderPreview: (item: T) => ReactNode;
  /** 下の「操作」(詳細へ・比較に追加・クイズへ など)。 */
  renderActions: (item: T) => ReactNode;
};

/** 「選択項目を中央に出す」画面幅の境目。これ以下では縦積みになるため、選択時に主役へスクロールさせる。 */
const STACKED_QUERY = "(max-width: 900px)";

/**
 * 色・図形の図鑑カタログの共通の型(IMPROVEMENT_DESIGN_2026-10 §4.2)。
 * 左=検索+チップ+一覧、中央=主役(選択した項目)、下=操作。ColorCatalog/ShapeCatalogがpropsだけ変えて使う。
 */
export function CatalogView<T extends CatalogItem>({
  items,
  featuredId,
  categoryOrder,
  subcategoriesByCategory,
  eyebrow,
  title,
  titleEn,
  lead,
  countLabel,
  searchPlaceholder,
  visualizedLabel,
  listLabel,
  renderLead,
  renderValue,
  extraSearchFields,
  renderPreview,
  renderActions,
}: CatalogViewProps<T>) {
  const filter = useEntryFilter(items, categoryOrder, { extraSearchFields });
  const [selectedId, setSelectedId] = useState(featuredId);
  const previewRef = useRef<HTMLElement>(null);

  const selected = items.find((item) => item.id === selectedId) ?? items[0];

  const handleSelect = (id: string) => {
    setSelectedId(id);
    // 縦積みの画面では主役が一覧の上にあり見えなくなるため、選んだら主役へ戻す
    if (window.matchMedia(STACKED_QUERY).matches) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      previewRef.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    }
  };

  if (!selected) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className="subtitle">{titleEn}</p>
        <p className={styles.lead}>{lead}</p>
        <p className={styles.countLine}>
          <span className={`num ${styles.countNumber}`}>{items.length}</span>
          <span className={styles.countLabel}>{countLabel}</span>
        </p>
      </header>

      {/* DOM順は「左の一覧 → 中央の主役」(キーボード・読み上げの順序を画面の左→右に揃える)。
          縦積みの画面ではCSSのorderで主役を一覧の上に出す。 */}
      <div className={styles.explorer}>
        <aside className={styles.listPane}>
          <EntryList
            filter={filter}
            categoryOrder={categoryOrder}
            subcategoriesByCategory={subcategoriesByCategory}
            searchPlaceholder={searchPlaceholder}
            visualizedLabel={visualizedLabel}
            isSelected={(id) => id === selected.id}
            onSelect={handleSelect}
            renderLead={renderLead}
            renderValue={renderValue}
            listLabel={listLabel}
          />
        </aside>

        <section className={styles.preview} ref={previewRef} aria-label="選択中の項目">
          <div className={styles.previewBody}>{renderPreview(selected)}</div>
          <div className={styles.actions}>{renderActions(selected)}</div>
        </section>
      </div>
    </div>
  );
}
