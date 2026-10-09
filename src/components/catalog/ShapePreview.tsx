import styles from "./Preview.module.css";
import { SwatchStage } from "@/components/hud/SwatchStage";
import { IconShapes } from "@/components/icons/Icons";
import {
  ShapeVisualizer,
  hasShapeVisualizer,
} from "@/components/visualizer/ShapeVisualizer";
import type { ShapeMeta } from "@/lib/content/shapes";

type ShapePreviewProps = {
  shape: ShapeMeta;
};

/**
 * 図形カタログの中央「主役」。作図手順の可視化があるものはそのまま段階再生できる形で埋め込み、
 * ないものは概要だけを出す。選択が変わったら再生位置を初期化するためkeyにidを渡す。
 */
export function ShapePreview({ shape }: ShapePreviewProps) {
  return (
    <article className={styles.preview}>
      <div className={styles.shapeStage}>
        {hasShapeVisualizer(shape.id) ? (
          <ShapeVisualizer key={shape.id} shapeId={shape.id} />
        ) : (
          <SwatchStage size={260} icon={<IconShapes />} />
        )}
      </div>
      <div className={styles.text}>
        <p className={styles.category}>
          {shape.category} ・ {shape.subcategory}
        </p>
        <h2 className={styles.name}>{shape.name}</h2>
        <p className="subtitle">{shape.nameEn}</p>
        <p className={styles.summary}>{shape.summary}</p>
      </div>
    </article>
  );
}
