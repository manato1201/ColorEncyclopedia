import styles from "./Herbarium.module.css";
import { AsciiPlant } from "@/components/ui/AsciiPlant";

/**
 * トップの下の、植物図譜モチーフ(IMPROVEMENT_DESIGN「追補: ASCII モチーフ」)。
 * 羊皮紙の地・墨・緑(既存トークン)だけで描く装飾で、情報は持たない(読み上げ対象外)。
 * 動きは付けない(動きは空・待機の状態だけ=P8)。動きを減らす設定でも同じ静止画。
 */
export function Herbarium() {
  return (
    <section className={styles.band} aria-hidden="true">
      <div className={styles.plants}>
        {["shuiro", "ruriiro", "wakakusairo"].map((seed) => (
          <AsciiPlant key={seed} seed={seed} cols={34} rows={16} />
        ))}
      </div>
      <p className={styles.caption}>HERBARIUM — 色の名前の由来になった植物を思わせる、文字の図譜(装飾)</p>
    </section>
  );
}
