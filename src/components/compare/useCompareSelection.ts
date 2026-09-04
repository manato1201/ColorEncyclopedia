"use client";

import { useMemo, useState } from "react";

const MAX_SELECTED = 4;

type Searchable = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  summary: string;
};

/**
 * ColorCompareView/ShapeCompareViewで共通の「検索して最大4件まで選択する」状態管理。
 * 両ビューでほぼ同一のロジックが重複していたため一本化した(比較UIの見た目・追加のカラムは
 * 各コンポーネント側に残し、選択状態の管理だけをここに集約する)。
 */
export function useCompareSelection<T extends Searchable>(items: T[]) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const byId = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );
  const selected = selectedIds
    .map((id) => byId.get(id))
    .filter((item): item is T => !!item);

  const trimmedQuery = query.trim().toLowerCase();
  const candidates = useMemo(() => {
    if (trimmedQuery.length === 0) return [];
    return items
      .filter((item) => !selectedIds.includes(item.id))
      .filter((item) =>
        [item.name, item.category, item.subcategory, item.summary].some(
          (field) => field.toLowerCase().includes(trimmedQuery),
        ),
      )
      .slice(0, 8);
  }, [items, trimmedQuery, selectedIds]);

  const isFull = selectedIds.length >= MAX_SELECTED;

  const addItem = (id: string) => {
    if (isFull || selectedIds.includes(id)) return;
    setSelectedIds((current) => [...current, id]);
    setQuery("");
  };

  const removeItem = (id: string) => {
    setSelectedIds((current) => current.filter((x) => x !== id));
  };

  return {
    query,
    setQuery,
    selected,
    candidates,
    addItem,
    removeItem,
    isFull,
    MAX_SELECTED,
  };
}
