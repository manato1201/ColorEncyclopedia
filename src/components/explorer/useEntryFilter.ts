"use client";

import { useMemo, useState } from "react";

/** 一覧に載せられる項目の最小形(色・図形で共通)。 */
export type Entry = {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  subcategory: string;
  summary: string;
  hasVisualizer: boolean;
};

export type EntryGroup<T> = { category: string; items: T[] };

export type EntryFilter<T extends Entry> = {
  query: string;
  setQuery: (value: string) => void;
  activeCategory: string | null;
  activeSubcategory: string | null;
  visualizedOnly: boolean;
  toggleVisualizedOnly: () => void;
  selectCategory: (category: string | null) => void;
  toggleSubcategory: (subcategory: string) => void;
  categoryCounts: Map<string, number>;
  subcategoryCounts: Map<string, number>;
  visualizedCount: number;
  filtered: T[];
  groups: EntryGroup<T>[];
};

type Options<T> = {
  /** 検索対象に加える文字列(例: 色のHEX値)。名前・英字名・カテゴリ・概要は常に対象。 */
  extraSearchFields?: (item: T) => string[];
};

/**
 * 検索・カテゴリ・サブカテゴリ・可視化対応フィルタの状態と、その結果(絞り込み済みの一覧とカテゴリ別グループ)。
 * カタログ(単一選択)と比較ビュー(複数選択)で同じ一覧UI(EntryList)を使うため、状態をここに切り出している。
 */
export function useEntryFilter<T extends Entry>(
  items: T[],
  categoryOrder: readonly string[],
  options: Options<T> = {},
): EntryFilter<T> {
  const { extraSearchFields } = options;
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(
    null,
  );
  const [visualizedOnly, setVisualizedOnly] = useState(false);

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

  const visualizedCount = useMemo(
    () =>
      items.reduce((count, item) => count + (item.hasVisualizer ? 1 : 0), 0),
    [items],
  );

  const trimmedQuery = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (activeCategory && item.category !== activeCategory) return false;
        if (activeSubcategory && item.subcategory !== activeSubcategory)
          return false;
        if (visualizedOnly && !item.hasVisualizer) return false;
        if (trimmedQuery) {
          const fields = [
            item.name,
            item.nameEn,
            item.category,
            item.subcategory,
            item.summary,
            ...(extraSearchFields?.(item) ?? []),
          ];
          if (
            !fields.some((field) => field.toLowerCase().includes(trimmedQuery))
          )
            return false;
        }
        return true;
      }),
    [
      items,
      activeCategory,
      activeSubcategory,
      visualizedOnly,
      trimmedQuery,
      extraSearchFields,
    ],
  );

  const groups = useMemo(() => {
    const byCategory = new Map<string, T[]>();
    for (const item of filtered) {
      const list = byCategory.get(item.category) ?? [];
      list.push(item);
      byCategory.set(item.category, list);
    }
    return categoryOrder
      .filter((category) => byCategory.has(category))
      .map((category) => ({ category, items: byCategory.get(category)! }));
  }, [filtered, categoryOrder]);

  return {
    query,
    setQuery,
    activeCategory,
    activeSubcategory,
    visualizedOnly,
    toggleVisualizedOnly: () => setVisualizedOnly((current) => !current),
    selectCategory: (category) => {
      setActiveCategory((current) => (current === category ? null : category));
      setActiveSubcategory(null);
    },
    toggleSubcategory: (subcategory) =>
      setActiveSubcategory((current) =>
        current === subcategory ? null : subcategory,
      ),
    categoryCounts,
    subcategoryCounts,
    visualizedCount,
    filtered,
    groups,
  };
}
