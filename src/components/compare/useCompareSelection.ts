"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export const MAX_COMPARE_SELECTED = 4;

/**
 * 比較対象の選択状態(一覧の行クリックで追加/解除、最大4件)。
 * ColorCompareView/ShapeCompareViewで共通。検索・チップ絞り込みは一覧側(EntryList + useEntryFilter)が受け持つ。
 * initialIds(URLの?ids=から渡す)は最初の1回だけ使う。存在しないidは捨て、上限を超えた分も切る。
 */
export function useCompareSelection<T extends { id: string }>(items: T[], initialIds: string[] = []) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const known = new Set(items.map((item) => item.id));
    return [...new Set(initialIds)].filter((id) => known.has(id)).slice(0, MAX_COMPARE_SELECTED);
  });

  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const selected = selectedIds.map((id) => byId.get(id)).filter((item): item is T => !!item);
  const isFull = selectedIds.length >= MAX_COMPARE_SELECTED;

  const isSelected = (id: string) => selectedIds.includes(id);

  const toggle = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      if (current.length >= MAX_COMPARE_SELECTED) return current;
      return [...current, id];
    });
  };

  const remove = (id: string) => setSelectedIds((current) => current.filter((x) => x !== id));
  const clear = () => setSelectedIds([]);

  return { selected, selectedIds, isSelected, isFull, toggle, remove, clear };
}

/**
 * URLの ?ids=a,b,c を配列にして返す(カタログの「比較に追加」からの遷移で使う)。
 * useSearchParamsを使うため、呼び出し側はSuspense境界の内側に置くこと
 * (静的に生成されるページで、この部分だけクライアント側で描画させるため)。
 */
export function useIdsFromQuery(): string[] {
  const params = useSearchParams();
  const raw = params.get("ids") ?? "";
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}
