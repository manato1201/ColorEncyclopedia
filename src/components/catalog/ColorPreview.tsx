import styles from "./Preview.module.css";
import { ExamLevelBadge } from "@/components/hud/ExamLevelBadge";
import { PaletteSwatches } from "@/components/colors/PaletteSwatches";
import { PracticeBadge } from "@/components/hud/PracticeBadge";
import { SwatchStage } from "@/components/hud/SwatchStage";
import { deriveColorValues } from "@/lib/color-values";
import { formatHsv, formatLab, formatRgb } from "@/lib/color-format";
import type { ColorMeta } from "@/lib/content/colors";

type ColorPreviewProps = {
  color: ColorMeta;
};

/**
 * 色カタログの中央「主役」。大きな見本(中立灰のステージ上)と、名前・英字の副題・HEX/RGB/HSV/Labを併記する。
 * 色見本は必ず名前と値を一緒に出す(色だけで伝えない)。数値は等幅・固定幅で桁を揃える。
 */
export function ColorPreview({ color }: ColorPreviewProps) {
  // 画面の数値は、HEXからの単一の変換で出す(deriveColorValues)
  const value = color.colorValue ? deriveColorValues(color.colorValue.hex) : null;

  return (
    <article className={styles.preview}>
      {color.palette && !value ? null : <SwatchStage hex={value?.hex} size={220} />}
      <div className={styles.text}>
        <p className={styles.category}>
          {color.category} ・ {color.subcategory}
          {color.examLevel ? <ExamLevelBadge level={color.examLevel} /> : null}
          {color.beyondExam ? <PracticeBadge /> : null}
        </p>
        <h2 className={styles.name}>{color.name}</h2>
        <p className="subtitle">{color.nameEn}</p>
        {value ? (
          <dl className={styles.values}>
            <div className={styles.valueRow}>
              <dt>HEX</dt>
              <dd className="num">{value.hex}</dd>
            </div>
            <div className={styles.valueRow}>
              <dt>RGB</dt>
              <dd className="num">{formatRgb(value.rgb)}</dd>
            </div>
            <div className={styles.valueRow}>
              <dt>HSV</dt>
              <dd className="num">{formatHsv(value.hsv)}</dd>
            </div>
            <div className={styles.valueRow}>
              <dt>Lab</dt>
              <dd className="num">{formatLab(value.lab)}</dd>
            </div>
          </dl>
        ) : null}
        <p className={styles.summary}>{color.summary}</p>
        {color.palette ? <PaletteSwatches items={color.palette} compact /> : null}
      </div>
    </article>
  );
}
