"use client";

import Link from "next/link";
import styles from "./Compare.module.css";
import { useCompareSelection, useIdsFromQuery, MAX_COMPARE_SELECTED } from "./useCompareSelection";
import { ExamLevelBadge } from "@/components/hud/ExamLevelBadge";
import { ColorSwatch } from "@/components/hud/ColorSwatch";
import { ActionButton, ActionLink } from "@/components/hud/ActionLink";
import { IconArrowRight, IconRefresh } from "@/components/icons/Icons";
import { EntryList } from "@/components/explorer/EntryList";
import { useEntryFilter } from "@/components/explorer/useEntryFilter";
import { ColorVisualizer, hasColorVisualizer } from "@/components/visualizer/ColorVisualizer";
import { ChromaLab } from "./ChromaLab";
import { ColorTuneLab } from "./ColorTuneLab";
import { HarmonySets } from "./HarmonySets";
import { ColorSystemsVisualizer } from "@/components/visualizer/ColorSystemsVisualizer";
import { contrastRatio, WCAG_AA_NORMAL, WCAG_AAA_NORMAL } from "@/lib/color-math";
import { deriveColorValues } from "@/lib/color-values";
import { formatHsv, formatLab, formatRgb } from "@/lib/color-format";
import { COLOR_CATEGORY_ORDER, COLOR_SUBCATEGORIES_BY_CATEGORY } from "@/lib/color-categories";
import type { ColorMeta } from "@/lib/content/colors";

type ColorCompareViewProps = {
  colors: ColorMeta[];
};

/** HEX値でも検索できるようにする。参照が安定するようモジュール定数にする。 */
const colorSearchFields = (color: ColorMeta): string[] =>
  color.colorValue ? [color.colorValue.hex, color.colorValue.hex.replace("#", "")] : [];

/**
 * 色の比較。左=チップと一覧(行クリックで追加/解除、最大4件)、中央=並べた比較、下=操作。
 * colorValueを持つ2件以上を選ぶと、各ペアのWCAGコントラスト比を表示する
 * (計算式はderiveThemeFromColor/ContrastVisualizerとcolor-math.tsを共有)。
 * カタログの「比較に追加」から ?ids= で渡された色を最初から選択済みにする。
 */
export function ColorCompareView({ colors }: ColorCompareViewProps) {
  const initialIds = useIdsFromQuery();
  const filter = useEntryFilter(colors, COLOR_CATEGORY_ORDER, { extraSearchFields: colorSearchFields });
  const { selected, isSelected, isFull, toggle, remove, clear } = useCompareSelection(colors, initialIds);

  const withColorValue = selected.filter((c) => c.colorValue);
  const pairs: [ColorMeta, ColorMeta][] = [];
  for (let i = 0; i < withColorValue.length; i++) {
    for (let j = i + 1; j < withColorValue.length; j++) {
      pairs.push([withColorValue[i], withColorValue[j]]);
    }
  }
  const visualized = selected.filter((c) => c.colorValue && hasColorVisualizer(c.id));

  return (
    <div className={styles.view}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>COMPARE</span>
        <h1 className={styles.title}>色を比較</h1>
        <p className="subtitle">Compare Colors</p>
        <p className={styles.lead}>
          左の一覧から最大{MAX_COMPARE_SELECTED}件の色を選ぶと、見本・数値・コントラスト比を並べて確認できます。
        </p>
      </header>

      <div className={styles.explorer}>
        <div className={styles.listPane}>
          <EntryList
            filter={filter}
            categoryOrder={COLOR_CATEGORY_ORDER}
            subcategoriesByCategory={COLOR_SUBCATEGORIES_BY_CATEGORY}
            searchPlaceholder="色名・英字名・HEX・カテゴリで検索"
            visualizedLabel="可視化対応"
            listLabel="比較に追加する色の一覧"
            isSelected={isSelected}
            onSelect={toggle}
            isDisabled={(color) => isFull && !isSelected(color.id)}
            hint={isFull ? `(最大${MAX_COMPARE_SELECTED}件まで選択済み)` : `(${selected.length}/${MAX_COMPARE_SELECTED}件を選択中)`}
            renderLead={(color) => (color.colorValue ? <ColorSwatch hex={color.colorValue.hex} size={14} /> : null)}
            renderValue={(color) => color.colorValue?.hex ?? ""}
          />
        </div>

        <div className={styles.stagePane}>
          <p className={styles.notice}>
            画面上の色は環境により異なります(ディスプレイの設定・周囲の明るさ・見本の周りの色で見え方が変わります)。
          </p>

          {selected.length === 0 ? (
            <div className={styles.emptyState}>左の一覧から色を選ぶと、ここに比較が表示されます。</div>
          ) : (
            <ul className={styles.cards}>
              {selected.map((c) => (
                <li
                  key={c.id}
                  className={`${styles.card} stagger`}
                  style={{ "--i": selected.indexOf(c) } as React.CSSProperties}
                >
                  <div className={styles.cardHead}>
                    {c.colorValue ? <ColorSwatch hex={c.colorValue.hex} size={40} /> : <span />}
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => remove(c.id)}
                      aria-label={`${c.name}を比較から外す`}
                    >
                      ✕ 外す
                    </button>
                  </div>
                  <Link href={`/colors/${c.id}`} className={styles.cardName}>
                    {c.name}
                  </Link>
                  <span className="subtitle">{c.nameEn}</span>
                  <span className={styles.cardCategory}>
                    {c.category} ・ {c.subcategory}
                  </span>
                  {c.examLevel ? <ExamLevelBadge level={c.examLevel} /> : null}
                  {c.colorValue ? (
                    <div className={`num ${styles.cardValues}`}>
                      {/* どの数値も、HEXからの同じ変換(deriveColorValues)で出す */}
                      <span>{c.colorValue.hex}</span>
                      <span>{formatRgb(deriveColorValues(c.colorValue.hex).rgb)}</span>
                      <span>{formatHsv(deriveColorValues(c.colorValue.hex).hsv)}</span>
                      <span>{formatLab(deriveColorValues(c.colorValue.hex).lab)}</span>
                    </div>
                  ) : null}
                  <p className={styles.cardSummary}>{c.summary}</p>
                </li>
              ))}
            </ul>
          )}

          {pairs.length > 0 ? (
            <section className={styles.section} aria-labelledby="cmp-contrast">
              <h2 id="cmp-contrast" className={styles.sectionLabel}>
                CONTRAST 各ペアのWCAGコントラスト比
              </h2>
              <ul className={styles.pairList}>
                {pairs.map(([a, b]) => {
                  const ratio = contrastRatio(a.colorValue!.hex, b.colorValue!.hex);
                  const aa = ratio >= WCAG_AA_NORMAL;
                  const aaa = ratio >= WCAG_AAA_NORMAL;
                  return (
                    <li key={`${a.id}-${b.id}`} className={styles.pairRow}>
                      <ColorSwatch hex={a.colorValue!.hex} size={14} />
                      <span>{a.name}</span>
                      <span className={styles.pairX}>×</span>
                      <ColorSwatch hex={b.colorValue!.hex} size={14} />
                      <span>{b.name}</span>
                      <span className={`num ${styles.pairRatio}`}>{ratio.toFixed(2)} : 1</span>
                      <span className={aa ? styles.pass : styles.fail}>{aa ? "AA適合" : "AA未達"}</span>
                      <span className={aaa ? styles.pass : styles.fail}>{aaa ? "AAA適合" : "AAA未達"}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {withColorValue.length > 0 ? (
            <section className={styles.section} aria-labelledby="cmp-lab">
              <h2 id="cmp-lab" className={styles.sectionLabel}>
                LAB 彩度・明度を動かして比べる
              </h2>
              <ColorTuneLab key={withColorValue[0].id} name={withColorValue[0].name} hex={withColorValue[0].colorValue!.hex} />
            </section>
          ) : null}

          {withColorValue.length > 0 ? (
            <section className={styles.section} aria-labelledby="cmp-systems">
              <h2 id="cmp-systems" className={styles.sectionLabel}>
                SYSTEMS 同じ色を別の方式で並べる
              </h2>
              <div className={styles.visualGrid}>
                {withColorValue.map((c) => (
                  <div key={c.id} className={styles.visualPanel}>
                    <Link href={`/colors/${c.id}`} className={styles.visualPanelTitle}>
                      {c.name}
                    </Link>
                    <ColorSystemsVisualizer hex={c.colorValue!.hex} />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {visualized.length > 0 ? (
            <section className={styles.section} aria-labelledby="cmp-visual">
              <h2 id="cmp-visual" className={styles.sectionLabel}>
                VISUALIZE 色相環・配色理論を見比べる
              </h2>
              <div className={styles.visualGrid}>
                {visualized.map((c) => (
                  <div key={c.id} className={styles.visualPanel}>
                    <Link href={`/colors/${c.id}`} className={styles.visualPanelTitle}>
                      {c.name}
                    </Link>
                    <ColorVisualizer hex={c.colorValue!.hex} />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {withColorValue.length > 0 ? (
            <section className={styles.section} aria-labelledby="cmp-harmony">
              <h2 id="cmp-harmony" className={styles.sectionLabel}>
                HARMONY 調和の選び方を並べる
              </h2>
              <HarmonySets
                key={withColorValue[0].id}
                name={withColorValue[0].name}
                hex={withColorValue[0].colorValue!.hex}
              />
            </section>
          ) : null}

          <section className={styles.section} aria-labelledby="cmp-chroma">
            <h2 id="cmp-chroma" className={styles.sectionLabel}>
              CHROMA 同じ明度でも、色相で出せる鮮やかさは違う
            </h2>
            <ChromaLab />
          </section>

          <p className={styles.claim}>
            この画面の数値は、すべて表示している色のHEXから、同じ変換(RGB→HSV・Lab)で計算しています。記載値は npm run verify が同じ関数で再計算して一致を確認しています。
          </p>

          <div className={styles.actions}>
            <ActionButton icon={<IconRefresh />} onClick={clear} disabled={selected.length === 0}>
              選択をクリア
            </ActionButton>
            <ActionLink href="/compare/shapes" icon={<IconArrowRight />}>
              図形を比較する
            </ActionLink>
          </div>
        </div>
      </div>
    </div>
  );
}
