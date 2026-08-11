"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./ShapeCompareView.module.css";
import { ShapeVisualizer, hasShapeVisualizer } from "@/components/visualizer/ShapeVisualizer";
import type { ShapeMeta } from "@/lib/content/shapes";

const MAX_SELECTED = 4;

type ShapeCompareViewProps = {
  shapes: ShapeMeta[];
};

/**
 * ColorCompareView.tsxと同じ選択UIパターンを図形側に転用したもの。
 * colorValueに相当する数値属性をshapesは持たないため(frontmatterはcategory/subcategory/summaryのみ)、
 * カテゴリ・概要の並列比較と、作図手順の可視化を見比べる構成にしている。
 */
export function ShapeCompareView({ shapes }: ShapeCompareViewProps) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const byId = useMemo(() => new Map(shapes.map((s) => [s.id, s])), [shapes]);
  const selected = selectedIds.map((id) => byId.get(id)).filter((s): s is ShapeMeta => !!s);

  const trimmedQuery = query.trim().toLowerCase();
  const candidates = useMemo(() => {
    if (trimmedQuery.length === 0) return [];
    return shapes
      .filter((s) => !selectedIds.includes(s.id))
      .filter((s) =>
        [s.name, s.category, s.subcategory, s.summary].some((field) =>
          field.toLowerCase().includes(trimmedQuery),
        ),
      )
      .slice(0, 8);
  }, [shapes, trimmedQuery, selectedIds]);

  const addShape = (id: string) => {
    if (selectedIds.length >= MAX_SELECTED || selectedIds.includes(id)) return;
    setSelectedIds((current) => [...current, id]);
    setQuery("");
  };

  const removeShape = (id: string) => {
    setSelectedIds((current) => current.filter((x) => x !== id));
  };

  return (
    <div className={styles.view}>
      <div className={styles.searchArea}>
        <input
          className={styles.searchInput}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            selectedIds.length >= MAX_SELECTED
              ? `最大${MAX_SELECTED}件まで選択済みです`
              : "比較に追加する図形を検索(例: 黄金比、対称性)"
          }
          aria-label="比較に追加する図形を検索"
          disabled={selectedIds.length >= MAX_SELECTED}
        />
        {candidates.length > 0 ? (
          <ul className={styles.candidateList}>
            {candidates.map((s) => (
              <li key={s.id}>
                <button type="button" className={styles.candidateButton} onClick={() => addShape(s.id)}>
                  <span className={styles.candidateName}>{s.name}</span>
                  <span className={styles.candidateCategory}>{s.subcategory}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {selected.length === 0 ? (
        <div className={styles.emptyState}>上の検索欄から図形を追加すると、ここに比較表が表示されます。</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.rowLabel}></th>
                {selected.map((s) => (
                  <th key={s.id} className={styles.colHeader}>
                    <Link href={`/shapes/${s.id}`} className={styles.shapeLink}>
                      {s.name}
                    </Link>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => removeShape(s.id)}
                      aria-label={`${s.name}を比較から外す`}
                    >
                      ✕
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th className={styles.rowLabel}>カテゴリ</th>
                {selected.map((s) => (
                  <td key={s.id}>
                    {s.category} ・ {s.subcategory}
                  </td>
                ))}
              </tr>
              <tr>
                <th className={styles.rowLabel}>概要</th>
                {selected.map((s) => (
                  <td key={s.id} className={styles.summaryCell}>
                    {s.summary}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {selected.length > 0 ? (
        <div className={styles.visualSection}>
          <h2 className={styles.visualSectionLabel}>■ VISUALIZE 作図手順を見比べる</h2>
          {selected.some((s) => hasShapeVisualizer(s.id)) ? (
            <div className={styles.visualGrid}>
              {selected
                .filter((s) => hasShapeVisualizer(s.id))
                .map((s) => (
                  <div key={s.id} className={styles.visualPanel}>
                    <Link href={`/shapes/${s.id}`} className={styles.visualPanelTitle}>
                      {s.name}
                    </Link>
                    <ShapeVisualizer shapeId={s.id} />
                  </div>
                ))}
            </div>
          ) : (
            <div className={styles.emptyState}>選択した図形はまだ可視化に対応していません。</div>
          )}
          {selected.some((s) => !hasShapeVisualizer(s.id)) ? (
            <p className={styles.visualNote}>
              可視化未対応: {selected.filter((s) => !hasShapeVisualizer(s.id)).map((s) => s.name).join("、")}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
