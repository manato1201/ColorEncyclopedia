"use client";

import type { CSSProperties, ReactNode } from "react";
import styles from "./EntryList.module.css";
import type { Entry, EntryFilter } from "./useEntryFilter";

type EntryListProps<T extends Entry> = {
  filter: EntryFilter<T>;
  categoryOrder: readonly string[];
  subcategoriesByCategory: Record<string, readonly string[]>;
  searchPlaceholder: string;
  visualizedLabel: string;
  /** 行が選択済み(カタログ: 中央に表示中 / 比較: 比較対象に入っている)かどうか。 */
  isSelected: (id: string) => boolean;
  onSelect: (id: string) => void;
  /** 選べない行(比較の上限に達したときの未選択行など)。 */
  isDisabled?: (item: T) => boolean;
  /** 行の先頭(色見本の丸など)。 */
  renderLead?: (item: T) => ReactNode;
  /** 行の右端(HEX値など。等幅・右揃えで表示される)。 */
  renderValue?: (item: T) => ReactNode;
  /** 一覧の上に出す補足(「最大4件まで」など)。 */
  hint?: ReactNode;
  listLabel: string;
};

/**
 * 「検索 + チップ + 一覧」の左カラム(IMPROVEMENT_DESIGN_2026-10 §4.2)。
 * 行は「見本の丸 + 名前 + 灰色の英字副題 + 値(右揃え・等幅)」の型で、カタログと比較ビューで共通。
 */
export function EntryList<T extends Entry>({
  filter,
  categoryOrder,
  subcategoriesByCategory,
  searchPlaceholder,
  visualizedLabel,
  isSelected,
  onSelect,
  isDisabled,
  renderLead,
  renderValue,
  hint,
  listLabel,
}: EntryListProps<T>) {
  const {
    query,
    setQuery,
    activeCategory,
    activeSubcategory,
    visualizedOnly,
    categoryCounts,
    subcategoryCounts,
    visualizedCount,
    filtered,
    groups,
  } = filter;

  return (
    <div className={styles.list}>
      <form
        className={styles.searchBar}
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <input
          className={styles.searchInput}
          type="search"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label="検索"
        />
      </form>

      <div
        className={styles.chipRow}
        role="group"
        aria-label="カテゴリで絞り込む"
      >
        <button
          type="button"
          className={`${styles.chip} ${activeCategory === null ? styles.chipActive : ""}`}
          aria-pressed={activeCategory === null}
          onClick={() => filter.selectCategory(null)}
        >
          すべて
        </button>
        {categoryOrder
          .filter((category) => categoryCounts.has(category))
          .map((category) => (
            <button
              key={category}
              type="button"
              className={`${styles.chip} ${activeCategory === category ? styles.chipActive : ""}`}
              aria-pressed={activeCategory === category}
              onClick={() => filter.selectCategory(category)}
            >
              {category}
              <span className={`num ${styles.chipCount}`}>
                {categoryCounts.get(category)}
              </span>
            </button>
          ))}
      </div>

      {activeCategory ? (
        <div
          className={styles.chipRow}
          role="group"
          aria-label="サブカテゴリで絞り込む"
        >
          {(subcategoriesByCategory[activeCategory] ?? [])
            .filter((subcategory) => subcategoryCounts.has(subcategory))
            .map((subcategory) => (
              <button
                key={subcategory}
                type="button"
                className={`${styles.chip} ${styles.chipSub} ${activeSubcategory === subcategory ? styles.chipActive : ""}`}
                aria-pressed={activeSubcategory === subcategory}
                onClick={() => filter.toggleSubcategory(subcategory)}
              >
                {subcategory}
                <span className={`num ${styles.chipCount}`}>
                  {subcategoryCounts.get(subcategory)}
                </span>
              </button>
            ))}
        </div>
      ) : null}

      <div
        className={styles.chipRow}
        role="group"
        aria-label={`${visualizedLabel}で絞り込む`}
      >
        <button
          type="button"
          className={`${styles.chip} ${visualizedOnly ? styles.chipActive : ""}`}
          aria-pressed={visualizedOnly}
          onClick={filter.toggleVisualizedOnly}
        >
          {visualizedLabel}のみ
          <span className={`num ${styles.chipCount}`}>{visualizedCount}</span>
        </button>
      </div>

      <p className={styles.status} role="status">
        <span className="num">{filtered.length}</span>件を表示
        {hint ? <span className={styles.hint}>{hint}</span> : null}
      </p>

      {groups.length === 0 ? (
        <div className={styles.emptyState}>
          該当する項目が見つかりませんでした。別のキーワードやカテゴリでお試しください。
        </div>
      ) : (
        <div className={styles.groups} aria-label={listLabel}>
          {groups.map(({ category, items }) => (
            <section key={category} className={styles.group}>
              <h3 className={styles.groupHeading}>
                {category}
                <span className={`num ${styles.groupCount}`}>
                  {items.length}
                </span>
              </h3>
              <ul className={styles.rows}>
                {items.map((item, index) => {
                  const selected = isSelected(item.id);
                  const disabled = isDisabled?.(item) ?? false;
                  return (
                    <li
                      key={item.id}
                      className="stagger"
                      style={{ "--i": index } as CSSProperties}
                    >
                      <button
                        type="button"
                        className={`${styles.row} ${selected ? styles.rowSelected : ""}`}
                        aria-pressed={selected}
                        disabled={disabled}
                        onClick={() => onSelect(item.id)}
                      >
                        <span className={styles.rowLead}>
                          {renderLead ? renderLead(item) : null}
                        </span>
                        <span className={styles.rowText}>
                          <span className={styles.rowName}>{item.name}</span>
                          <span className={styles.rowSubtitle}>
                            {item.nameEn}
                          </span>
                        </span>
                        <span className={`num ${styles.rowValue}`}>
                          {renderValue ? renderValue(item) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
