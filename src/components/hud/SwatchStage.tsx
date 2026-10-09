import type { ReactNode } from "react";
import styles from "./SwatchStage.module.css";
import { IconPalette } from "@/components/icons/Icons";

type SwatchStageProps = {
  /** 表示する色。無い(配色理論などの概念エントリ)ときはパレットの線画アイコンを出す。 */
  hex?: string;
  /** ステージ一辺の長さ(px)。 */
  size?: number;
  /** 色が無いときに出す線画アイコン(既定はパレット)。 */
  icon?: ReactNode;
};

/**
 * 大きな色見本の表示領域。背景は常に同じ中立灰(--swatch-stage)で、ライト/ダークで変えない。
 * 見本の周囲の色が変わると同じ色でも違って見える(同時対比)ため、見本の「地」を固定している。
 */
export function SwatchStage({ hex, size = 200, icon }: SwatchStageProps) {
  return (
    <div className={styles.stage} style={{ width: size, height: size }}>
      {hex ? (
        <span
          className={styles.color}
          style={{ backgroundColor: hex }}
          aria-hidden="true"
        />
      ) : (
        (icon ?? <IconPalette />)
      )}
    </div>
  );
}
