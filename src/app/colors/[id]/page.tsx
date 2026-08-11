import { notFound } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import { ExamLevelBadge } from "@/components/hud/ExamLevelBadge";
import { ColorSwatch } from "@/components/hud/ColorSwatch";
import { ApplyThemeButton } from "@/components/theme/ApplyThemeButton";
import {
  ColorVisualizer,
  hasColorVisualizer,
} from "@/components/visualizer/ColorVisualizer";
import { ContrastVisualizer } from "@/components/visualizer/ContrastVisualizer";
import { colorLoader } from "@/lib/content/colors";

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

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.backLink}>
        ← 色図鑑に戻る
      </Link>

      <header className={styles.header}>
        {colorValue ? <ColorSwatch hex={colorValue.hex} size={40} /> : null}
        <div className={styles.headerText}>
          <span className={styles.category}>
            {color.category} ・ {color.subcategory}
          </span>
          <h1 className={styles.title}>{color.name}</h1>
        </div>
        {color.examLevel ? <ExamLevelBadge level={color.examLevel} /> : null}
      </header>

      {colorValue ? (
        <section className={styles.dataPanel} aria-labelledby="data-heading">
          <h2 id="data-heading" className={styles.sectionLabel}>
            ■ DATA 数値データ
          </h2>
          <dl className={styles.dataGrid}>
            <div className={styles.dataItem}>
              <dt>HEX</dt>
              <dd>{colorValue.hex}</dd>
            </div>
            <div className={styles.dataItem}>
              <dt>HSV</dt>
              <dd>
                H {colorValue.hsv.h}° / S {colorValue.hsv.s}% / V{" "}
                {colorValue.hsv.v}%
              </dd>
            </div>
            <div className={styles.dataItem}>
              <dt>Lab</dt>
              <dd>
                L* {colorValue.lab.l} / a* {colorValue.lab.a} / b*{" "}
                {colorValue.lab.b}
              </dd>
            </div>
          </dl>
          <ApplyThemeButton hex={colorValue.hex} />
        </section>
      ) : null}

      <div className={styles.layout}>
        <section className={styles.visualPane} aria-labelledby="visual-heading">
          <h2 id="visual-heading" className={styles.sectionLabel}>
            ■ VISUALIZE 色相環・配色理論の可視化
          </h2>
          {colorValue && hasColorVisualizer(id) ? (
            <ColorVisualizer colorId={id} hex={colorValue.hex} />
          ) : (
            <div className={styles.placeholder}>
              このエントリは色相環・配色理論の可視化には対応していません(colorValueを持つ色エントリのみ対応)。
            </div>
          )}

          {colorValue ? (
            <div className={styles.contrastBlock}>
              <h2 className={styles.sectionLabel}>■ CONTRAST WCAGコントラスト比を確認する</h2>
              <ContrastVisualizer initialForeground={colorValue.hex} initialBackground="#FFFFFF" />
            </div>
          ) : null}
        </section>

        <section
          className={styles.explainPane}
          aria-labelledby="explain-heading"
        >
          <h2 id="explain-heading" className={styles.sectionLabel}>
            ■ ABOUT 概要
          </h2>
          <div
            className={styles.markdownBody}
            // content/colors/*.md はリポジトリで管理する信頼済みコンテンツのみ(外部入力なし)
            dangerouslySetInnerHTML={{ __html: color.bodyHtml }}
          />
        </section>
      </div>
    </div>
  );
}
