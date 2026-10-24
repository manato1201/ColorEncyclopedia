import styles from "./PaletteSwatches.module.css";
import { ColorSwatch } from "@/components/hud/ColorSwatch";

export type PaletteItem = { name: string; hex: string };

type PaletteSwatchesProps = {
  items: PaletteItem[];
  /** 小さく並べる(カタログの主役など)。 */
  compact?: boolean;
};

/**
 * 複数色で見せる用語(カラーグレーディング・光の用語)の自前の見本。
 * 見本は必ず名前とHEXを併記し(色だけで伝えない)、周囲は中立灰のリングで固定する(ColorSwatch)。
 */
export function PaletteSwatches({
  items,
  compact = false,
}: PaletteSwatchesProps) {
  return (
    <ul className={`${styles.list} ${compact ? styles.compact : ""}`}>
      {items.map((item) => (
        <li key={`${item.name}-${item.hex}`} className={styles.item}>
          <ColorSwatch hex={item.hex} size={compact ? 24 : 40} />
          <span className={styles.name}>{item.name}</span>
          <span className={`num ${styles.hex}`}>{item.hex}</span>
        </li>
      ))}
    </ul>
  );
}
