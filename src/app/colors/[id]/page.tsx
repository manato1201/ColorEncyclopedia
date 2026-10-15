import { notFound } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import { ExamLevelBadge } from "@/components/hud/ExamLevelBadge";
import { SwatchStage } from "@/components/hud/SwatchStage";
import { ApplyThemeButton } from "@/components/theme/ApplyThemeButton";
import {
  ColorVisualizer,
  hasColorVisualizer,
} from "@/components/visualizer/ColorVisualizer";
import { RelatedCarousel } from "@/components/colors/RelatedCarousel";
import { TermNotes } from "@/components/colors/TermNotes";
import { SectionNav, type SectionNavItem } from "@/components/ui/SectionNav";
import { Tooltip } from "@/components/ui/Tooltip";
import { ColorSystemsVisualizer } from "@/components/visualizer/ColorSystemsVisualizer";
import { ContrastVisualizer } from "@/components/visualizer/ContrastVisualizer";
import { hexToRgb } from "@/lib/color-math";
import { formatHsv, formatLab, formatRgb } from "@/lib/color-format";
import { COLOR_VALUE_TERMS } from "@/lib/color-terms";
import { colorLoader } from "@/lib/content/colors";
import { findRelatedColors } from "@/lib/related-colors";
import { COLOR_TERM_NOTES } from "@/data/term-notes";

type ColorDetailPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return colorLoader.getAllIds().map((id) => ({ id }));
}

export default async function ColorDetailPage({
  params,
}: ColorDetailPageProps) {
  const { id } = await params;
  const color = colorLoader.getDetail(id);

  if (!color) {
    notFound();
  }

  const { colorValue } = color;
  const note = COLOR_TERM_NOTES[id];
  const related = findRelatedColors(id, colorLoader.getAllMeta());

  // ページ内の目次(存在する節だけ)
  const sections: SectionNavItem[] = [
    ...(colorValue ? [{ id: "sec-data", label: "DATA 数値" }] : []),
    { id: "sec-visual", label: "VISUALIZE 可視化" },
    { id: "sec-about", label: "ABOUT 概要" },
    ...(colorValue ? [{ id: "sec-systems", label: "SYSTEMS 方式比較" }, { id: "sec-contrast", label: "CONTRAST" }] : []),
    ...(note ? [{ id: "sec-notes", label: "NOTES 見分け方" }] : []),
    ...(related.length > 0 ? [{ id: "sec-related", label: "RELATED 近い色" }] : []),
  ];

  return (
    <div className={styles.page}>
      <Link href="/colors" className={styles.backLink}>
        ← 色図鑑に戻る
      </Link>

      <header className={styles.header}>
        {/* 見本は常に中立灰のステージの上に置く(テーマで周囲の色を変えない) */}
        <SwatchStage hex={colorValue?.hex} size={160} />
        <div className={styles.headerText}>
          <span className={styles.category}>
            {color.category} ・ {color.subcategory}
          </span>
          <h1 className={styles.title}>{color.name}</h1>
          <p className="subtitle">{color.nameEn}</p>
          {color.examLevel ? (
            <div className={styles.badges}>
              <ExamLevelBadge level={color.examLevel} />
            </div>
          ) : null}
        </div>
      </header>

      {colorValue ? (
        <section id="sec-data" className={styles.dataPanel} aria-labelledby="data-heading">
          <h2 id="data-heading" className={styles.sectionLabel}>
            DATA 数値データ
          </h2>
          <dl className={styles.dataGrid}>
            <div className={styles.dataItem}>
              <dt>
                <Tooltip label={COLOR_VALUE_TERMS.HEX}>HEX</Tooltip>
              </dt>
              <dd className="num">{colorValue.hex}</dd>
            </div>
            <div className={styles.dataItem}>
              <dt>
                <Tooltip label={COLOR_VALUE_TERMS.RGB}>RGB</Tooltip>
              </dt>
              <dd className="num">{formatRgb(hexToRgb(colorValue.hex))}</dd>
            </div>
            <div className={styles.dataItem}>
              <dt>
                <Tooltip label={COLOR_VALUE_TERMS.HSV}>HSV</Tooltip>
              </dt>
              <dd className="num">{formatHsv(colorValue.hsv)}</dd>
            </div>
            <div className={styles.dataItem}>
              <dt>
                <Tooltip label={COLOR_VALUE_TERMS.Lab}>Lab</Tooltip>
              </dt>
              <dd className="num">{formatLab(colorValue.lab)}</dd>
            </div>
          </dl>
          <ApplyThemeButton hex={colorValue.hex} />
        </section>
      ) : null}

      <SectionNav items={sections} />

      <div className={styles.layout}>
        <section id="sec-visual" className={styles.visualPane} aria-labelledby="visual-heading">
          <h2 id="visual-heading" className={styles.sectionLabel}>
            VISUALIZE 色相環・配色理論の可視化
          </h2>
          {colorValue && hasColorVisualizer(id) ? (
            <ColorVisualizer hex={colorValue.hex} />
          ) : (
            <div className={styles.placeholder}>
              このエントリは色相環・配色理論の可視化には対応していません(colorValueを持つ色エントリのみ対応)。
            </div>
          )}
        </section>

        <section
          id="sec-about"
          className={styles.explainPane}
          aria-labelledby="explain-heading"
        >
          <h2 id="explain-heading" className={styles.sectionLabel}>
            ABOUT 概要
          </h2>
          <div
            className={styles.markdownBody}
            // content/colors/*.md はリポジトリで管理する信頼済みコンテンツのみ(外部入力なし)
            dangerouslySetInnerHTML={{ __html: color.bodyHtml }}
          />
        </section>
      </div>

      {colorValue ? (
        <div className={styles.tools}>
          <section id="sec-systems" className={styles.tool} aria-labelledby="systems-heading">
            <h2 id="systems-heading" className={styles.sectionLabel}>
              SYSTEMS 同じ色を別の方式で並べる
            </h2>
            <ColorSystemsVisualizer hex={colorValue.hex} />
          </section>

          <section id="sec-contrast" className={styles.tool} aria-labelledby="contrast-heading">
            <h2 id="contrast-heading" className={styles.sectionLabel}>
              CONTRAST WCAGコントラスト比を確認する
            </h2>
            <ContrastVisualizer
              initialForeground={colorValue.hex}
              initialBackground="#FFFFFF"
            />
          </section>
        </div>
      ) : null}

      {note ? (
        <section id="sec-notes" className={styles.extra} aria-labelledby="notes-heading">
          <h2 id="notes-heading" className={styles.sectionLabel}>
            NOTES 見るポイントと混同しやすい点
          </h2>
          <TermNotes note={note} />
        </section>
      ) : null}

      {related.length > 0 ? (
        <section id="sec-related" className={styles.extra} aria-labelledby="related-heading">
          <h2 id="related-heading" className={styles.sectionLabel}>
            RELATED 近い色
          </h2>
          <RelatedCarousel items={related} />
        </section>
      ) : null}
    </div>
  );
}
