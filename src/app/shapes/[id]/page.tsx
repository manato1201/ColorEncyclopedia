import { notFound } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import {
  ShapeVisualizer,
  hasShapeVisualizer,
} from "@/components/visualizer/ShapeVisualizer";
import { shapeLoader } from "@/lib/content/shapes";

type ShapeDetailPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return shapeLoader.getAllIds().map((id) => ({ id }));
}

export default async function ShapeDetailPage({
  params,
}: ShapeDetailPageProps) {
  const { id } = await params;
  const shape = shapeLoader.getDetail(id);

  if (!shape) {
    notFound();
  }

  return (
    <div className={styles.page}>
      <Link href="/shapes" className={styles.backLink}>
        ← 図形図鑑に戻る
      </Link>

      <header className={styles.header}>
        <span className={styles.category}>
          {shape.category} ・ {shape.subcategory}
        </span>
        <h1 className={styles.title}>{shape.name}</h1>
      </header>

      <div className={styles.layout}>
        <section className={styles.visualPane} aria-labelledby="visual-heading">
          <h2 id="visual-heading" className={styles.sectionLabel}>
            ■ VISUALIZE 作図手順の可視化
          </h2>
          {hasShapeVisualizer(id) ? (
            <ShapeVisualizer shapeId={id} />
          ) : (
            <div className={styles.placeholder}>
              作図手順の可視化は準備中です。
            </div>
          )}
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
            // content/shapes/*.md はリポジトリで管理する信頼済みコンテンツのみ(外部入力なし)
            dangerouslySetInnerHTML={{ __html: shape.bodyHtml }}
          />
        </section>
      </div>
    </div>
  );
}
