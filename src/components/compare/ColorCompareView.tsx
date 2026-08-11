"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./ColorCompareView.module.css";
import { ExamLevelBadge } from "@/components/hud/ExamLevelBadge";
import { ColorSwatch } from "@/components/hud/ColorSwatch";
import { ColorVisualizer, hasColorVisualizer } from "@/components/visualizer/ColorVisualizer";
import { contrastRatio, WCAG_AA_NORMAL, WCAG_AAA_NORMAL } from "@/lib/color-math";
import type { ColorMeta } from "@/lib/content/colors";

const MAX_SELECTED = 4;

type ColorCompareViewProps = {
  colors: ColorMeta[];
};

/**
 * The-Algorithm-IllustratedのCompareView.tsxの直接移植。
 * 検索で候補を絞り込みつつ、最大4件まで選択して並べて比較する。
 * colorValueを持つ2件以上を選ぶと、各ペアのWCAGコントラスト比をカード間に表示する
 * (計算式はderiveThemeFromColor/ContrastVisualizerとcolor-math.tsを共有)。
 */
export function ColorCompareView({ colors }: ColorCompareViewProps) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const byId = useMemo(() => new Map(colors.map((c) => [c.id, c])), [colors]);
  const selected = selectedIds.map((id) => byId.get(id)).filter((c): c is ColorMeta => !!c);

  const trimmedQuery = query.trim().toLowerCase();
  const candidates = useMemo(() => {
    if (trimmedQuery.length === 0) return [];
    return colors
      .filter((c) => !selectedIds.includes(c.id))
      .filter((c) =>
        [c.name, c.category, c.subcategory, c.summary].some((field) =>
          field.toLowerCase().includes(trimmedQuery),
        ),
      )
      .slice(0, 8);
  }, [colors, trimmedQuery, selectedIds]);

  const addColor = (id: string) => {
    if (selectedIds.length >= MAX_SELECTED || selectedIds.includes(id)) return;
    setSelectedIds((current) => [...current, id]);
    setQuery("");
  };

  const removeColor = (id: string) => {
    setSelectedIds((current) => current.filter((x) => x !== id));
  };

  const withColorValue = selected.filter((c) => c.colorValue);
  const pairs: [ColorMeta, ColorMeta][] = [];
  for (let i = 0; i < withColorValue.length; i++) {
    for (let j = i + 1; j < withColorValue.length; j++) {
      pairs.push([withColorValue[i], withColorValue[j]]);
    }
  }

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
              : "比較に追加する色を検索(例: 暖色、朱色)"
          }
          aria-label="比較に追加する色を検索"
          disabled={selectedIds.length >= MAX_SELECTED}
        />
        {candidates.length > 0 ? (
          <ul className={styles.candidateList}>
            {candidates.map((c) => (
              <li key={c.id}>
                <button type="button" className={styles.candidateButton} onClick={() => addColor(c.id)}>
                  {c.colorValue ? <ColorSwatch hex={c.colorValue.hex} size={14} /> : null}
                  <span className={styles.candidateName}>{c.name}</span>
                  <span className={styles.candidateCategory}>{c.category}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {selected.length === 0 ? (
        <div className={styles.emptyState}>上の検索欄から色を追加すると、ここに比較表が表示されます。</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.rowLabel}></th>
                {selected.map((c) => (
                  <th key={c.id} className={styles.colHeader}>
                    {c.colorValue ? <ColorSwatch hex={c.colorValue.hex} size={28} /> : null}
                    <Link href={`/colors/${c.id}`} className={styles.colorLink}>
                      {c.name}
                    </Link>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => removeColor(c.id)}
                      aria-label={`${c.name}を比較から外す`}
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
                {selected.map((c) => (
                  <td key={c.id}>
                    {c.category} ・ {c.subcategory}
                  </td>
                ))}
              </tr>
              <tr>
                <th className={styles.rowLabel}>検定級</th>
                {selected.map((c) => (
                  <td key={c.id}>{c.examLevel ? <ExamLevelBadge level={c.examLevel} /> : "—"}</td>
                ))}
              </tr>
              <tr>
                <th className={styles.rowLabel}>HEX / HSV</th>
                {selected.map((c) => (
                  <td key={c.id} className={styles.mono}>
                    {c.colorValue
                      ? `${c.colorValue.hex} / H${c.colorValue.hsv.h}° S${c.colorValue.hsv.s}% V${c.colorValue.hsv.v}%`
                      : "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <th className={styles.rowLabel}>概要</th>
                {selected.map((c) => (
                  <td key={c.id} className={styles.summaryCell}>
                    {c.summary}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {pairs.length > 0 ? (
        <div className={styles.contrastSection}>
          <h2 className={styles.sectionLabel}>■ CONTRAST 各ペアのWCAGコントラスト比</h2>
          <ul className={styles.contrastList}>
            {pairs.map(([a, b]) => {
              const ratio = contrastRatio(a.colorValue!.hex, b.colorValue!.hex);
              const aa = ratio >= WCAG_AA_NORMAL;
              const aaa = ratio >= WCAG_AAA_NORMAL;
              return (
                <li key={`${a.id}-${b.id}`} className={styles.contrastRow}>
                  <ColorSwatch hex={a.colorValue!.hex} size={16} />
                  <span>{a.name}</span>
                  <span className={styles.contrastX}>×</span>
                  <ColorSwatch hex={b.colorValue!.hex} size={16} />
                  <span>{b.name}</span>
                  <span className={styles.contrastRatio}>{ratio.toFixed(2)} : 1</span>
                  <span className={aa ? styles.pass : styles.fail}>{aa ? "AA適合" : "AA未達"}</span>
                  <span className={aaa ? styles.pass : styles.fail}>{aaa ? "AAA適合" : "AAA未達"}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {selected.length > 0 ? (
        <div className={styles.visualSection}>
          <h2 className={styles.visualSectionLabel}>■ VISUALIZE 色相環・配色理論を見比べる</h2>
          {selected.some((c) => c.colorValue && hasColorVisualizer(c.id)) ? (
            <div className={styles.visualGrid}>
              {selected
                .filter((c) => c.colorValue && hasColorVisualizer(c.id))
                .map((c) => (
                  <div key={c.id} className={styles.visualPanel}>
                    <Link href={`/colors/${c.id}`} className={styles.visualPanelTitle}>
                      {c.name}
                    </Link>
                    <ColorVisualizer colorId={c.id} hex={c.colorValue!.hex} />
                  </div>
                ))}
            </div>
          ) : (
            <div className={styles.emptyState}>選択した色はまだ可視化に対応していません。</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
