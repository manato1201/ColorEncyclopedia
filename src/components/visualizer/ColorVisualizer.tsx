import styles from "./ColorVisualizer.module.css";
import { HueWheelVisualizer } from "./HueWheelVisualizer";
import { HarmonyVisualizer } from "./HarmonyVisualizer";

export { hasColorVisualizer } from "@/lib/has-color-visualizer";

type ColorVisualizerProps = {
  colorId: string;
  hex: string;
};

/**
 * 色の可視化(色相環+配色理論)の共通ディスパッチャ。詳細ページ・比較画面の両方から使う。
 * hasColorVisualizer(colorId)がtrueのエントリでのみ意味を持つ(呼び出し側で判定する)。
 */
export function ColorVisualizer({ hex }: ColorVisualizerProps) {
  return (
    <div className={styles.stack}>
      <section>
        <h3 className={styles.sectionLabel}>色相環</h3>
        <HueWheelVisualizer hex={hex} />
      </section>
      <section>
        <h3 className={styles.sectionLabel}>配色理論</h3>
        <HarmonyVisualizer hex={hex} />
      </section>
    </div>
  );
}
