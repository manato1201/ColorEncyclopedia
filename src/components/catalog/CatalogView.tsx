"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import styles from "./CatalogView.module.css";

export type CatalogItem = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  summary: string;
  hasVisualizer: boolean;
};

type CatalogViewProps<T extends CatalogItem> = {
  items: T[];
  featuredId: string;
  basePath: string;
  categoryOrder: readonly string[];
  subcategoriesByCategory: Record<string, readonly string[]>;
  eyebrow: string;
  titleLines: [string, string];
  lead: string;
  countLabel: string;
  searchPlaceholder: string;
  visualizedLabel: string;
  renderBadge?: (item: T) => ReactNode;
  renderRowMeta?: (item: T) => ReactNode;
};

/**
 * The-Algorithm-IllustratedのAlgorithmCatalog.tsxを汎化した共通カタログ実装。
 * ColorCatalog/ShapeCatalogの両方がこの内部実装をpropsだけ変えて利用する
 * (createContentLoader<T>の汎化と同じ発想を、UIコンポーネント側にも一箇所だけ適用したもの)。
 */
export function CatalogView<T extends CatalogItem>({
  items,
  featuredId,
  basePath,
  categoryOrder,
  subcategoriesByCategory,
  eyebrow,
  titleLines,
  lead,
  countLabel,
  searchPlaceholder,
  visualizedLabel,
  renderBadge,
  renderRowMeta,
}: CatalogViewProps<T>) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(
    null,
  );
  const [visualizedOnly, setVisualizedOnly] = useState(false);
  const trimmedQuery = query.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;
  const isFiltering = isSearching || activeCategory !== null || visualizedOnly;

  const visualizedCount = useMemo(
    () =>
      items.reduce((count, item) => count + (item.hasVisualizer ? 1 : 0), 0),
    [items],
  );

  const featured = items.find((item) => item.id === featuredId) ?? items[0];

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }
    return counts;
  }, [items]);

  const subcategoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    if (!activeCategory) return counts;
    for (const item of items) {
      if (item.category !== activeCategory) continue;
      counts.set(item.subcategory, (counts.get(item.subcategory) ?? 0) + 1);
    }
    return counts;
  }, [items, activeCategory]);

  const handleCategoryClick = (category: string) => {
    setActiveCategory((current) => (current === category ? null : category));
    setActiveSubcategory(null);
  };

  const handleSubcategoryClick = (subcategory: string) => {
    setActiveSubcategory((current) =>
      current === subcategory ? null : subcategory,
    );
  };

  const filteredResults = useMemo(() => {
    if (!isFiltering) return [];
    return items.filter((item) => {
      if (activeCategory && item.category !== activeCategory) return false;
      if (activeSubcategory && item.subcategory !== activeSubcategory)
        return false;
      if (visualizedOnly && !item.hasVisualizer) return false;
      if (
        trimmedQuery &&
        ![item.name, item.category, item.subcategory, item.summary].some(
          (field) => field.toLowerCase().includes(trimmedQuery),
        )
      ) {
        return false;
      }
      return true;
    });
  }, [
    items,
    activeCategory,
    activeSubcategory,
    visualizedOnly,
    trimmedQuery,
    isFiltering,
  ]);

  const filterLabelParts: string[] = [];
  if (activeCategory) {
    filterLabelParts.push(
      activeSubcategory
        ? `${activeCategory} ・ ${activeSubcategory}`
        : activeCategory,
    );
  }
  if (visualizedOnly) filterLabelParts.push(`${visualizedLabel}のみ`);
  if (isSearching) filterLabelParts.push(`「${query}」`);
  const filterLabel = filterLabelParts.join(" ／ ");

  const groupedByCategory = useMemo(() => {
    const rest = items.filter((item) => item.id !== featured?.id);
    const groups = new Map<string, T[]>();
    for (const item of rest) {
      const list = groups.get(item.category) ?? [];
      list.push(item);
      groups.set(item.category, list);
    }
    return categoryOrder
      .filter((category) => groups.has(category))
      .map((category) => ({ category, items: groups.get(category)! }));
  }, [items, featured?.id, categoryOrder]);

  if (!featured) return null;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.heroTitle}>
          {titleLines[0]}
          <br />
          {titleLines[1]}
        </h1>
        <p className={styles.heroLead}>{lead}</p>
        <p className={styles.countLine}>
          <span className={styles.countNumber}>{items.length}</span>
          <span className={styles.countLabel}>{countLabel}</span>
        </p>
        <form
          className={styles.searchBar}
          role="search"
          onSubmit={(event) => event.preventDefault()}
        >
          <span className={styles.searchLabel}>SEARCH</span>
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
            onClick={() => {
              setActiveCategory(null);
              setActiveSubcategory(null);
            }}
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
                onClick={() => handleCategoryClick(category)}
              >
                {category}
                <span className={styles.chipCount}>
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
                  onClick={() => handleSubcategoryClick(subcategory)}
                >
                  {subcategory}
                  <span className={styles.chipCount}>
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
            className={`${styles.chip} ${styles.chipVisualized} ${visualizedOnly ? styles.chipActive : ""}`}
            aria-pressed={visualizedOnly}
            onClick={() => setVisualizedOnly((current) => !current)}
          >
            <span className={styles.chipVisualizedDot} aria-hidden="true" />
            {visualizedLabel}のみ
            <span className={styles.chipCount}>{visualizedCount}</span>
          </button>
        </div>
      </section>

      {isFiltering ? (
        <section className={styles.results} aria-labelledby="results-heading">
          <h2 id="results-heading" className={styles.sectionLabel}>
            ■ RESULTS {filterLabel}の絞り込み結果 — {filteredResults.length}件
          </h2>
          {filteredResults.length === 0 ? (
            <div className={styles.emptyState}>
              該当する項目が見つかりませんでした。別のキーワードやカテゴリでお試しください。
            </div>
          ) : (
            <ul className={styles.listItems}>
              {filteredResults.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  basePath={basePath}
                  showCategory
                  visualizedLabel={visualizedLabel}
                  renderBadge={renderBadge}
                  renderRowMeta={renderRowMeta}
                />
              ))}
            </ul>
          )}
        </section>
      ) : (
        <>
          <section
            className={styles.showcase}
            aria-labelledby="featured-heading"
          >
            <h2 id="featured-heading" className={styles.sectionLabel}>
              ■ FEATURED 代表エントリ
            </h2>
            <Link
              href={`${basePath}/${featured.id}`}
              className={styles.featuredCard}
            >
              <div className={styles.featuredMeta}>
                <span className={styles.category}>
                  {featured.category} ・ {featured.subcategory}
                </span>
                {renderBadge ? renderBadge(featured) : null}
                {featured.hasVisualizer ? (
                  <VisualizedBadge label={visualizedLabel} />
                ) : null}
              </div>
              <h3 className={styles.featuredName}>{featured.name}</h3>
              <p className={styles.featuredDesc}>{featured.summary}</p>
            </Link>
          </section>

          <section className={styles.list} aria-labelledby="list-heading">
            <h2 id="list-heading" className={styles.sectionLabel}>
              ■ INDEX 一覧
            </h2>
            {groupedByCategory.map(({ category, items: groupItems }) => (
              <div key={category} className={styles.categoryGroup}>
                <h3 className={styles.categoryHeading}>
                  {category}
                  <span className={styles.categoryCount}>
                    {groupItems.length}
                  </span>
                </h3>
                <ul className={styles.listItems}>
                  {groupItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      basePath={basePath}
                      visualizedLabel={visualizedLabel}
                      renderBadge={renderBadge}
                      renderRowMeta={renderRowMeta}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}

function ItemRow<T extends CatalogItem>({
  item,
  basePath,
  showCategory = false,
  visualizedLabel,
  renderBadge,
  renderRowMeta,
}: {
  item: T;
  basePath: string;
  showCategory?: boolean;
  visualizedLabel: string;
  renderBadge?: (item: T) => ReactNode;
  renderRowMeta?: (item: T) => ReactNode;
}) {
  return (
    <li className={styles.listRow}>
      <Link href={`${basePath}/${item.id}`} className={styles.listRowHead}>
        {renderRowMeta ? renderRowMeta(item) : null}
        <span className={styles.listName}>{item.name}</span>
        {showCategory ? (
          <span className={styles.listCategory}>
            {item.category} ・ {item.subcategory}
          </span>
        ) : null}
        {renderBadge ? renderBadge(item) : null}
        {item.hasVisualizer ? (
          <VisualizedBadge label={visualizedLabel} />
        ) : null}
      </Link>
      <p className={styles.listSummary}>{item.summary}</p>
    </li>
  );
}

function VisualizedBadge({ label }: { label: string }) {
  return (
    <span
      className={styles.visualizedBadge}
      title={`この項目は${label}に対応済みです`}
    >
      <span className={styles.visualizedDot} aria-hidden="true" />
      {label}
    </span>
  );
}
