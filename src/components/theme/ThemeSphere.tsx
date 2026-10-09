"use client";

import styles from "./ThemeSphere.module.css";
import { useThemeFromColor } from "./ThemeFromColorProvider";

type ThemeSphereProps = {
  size?: number;
};

/**
 * ヒーローの色球(OFF+BRANDの「虹色球体」に相当する、本サイト唯一の有彩色イベント)。
 * 固定のブランドグラデーションではなく、選んだ色から導出したテーマ(primary→accent→白)で塗る。
 * 「選択した色に応じてサイト全体のテーマが変わる」という本サイトの核となる体験を、
 * そのままヒーローの一枚絵として可視化している。
 */
export function ThemeSphere({ size = 560 }: ThemeSphereProps) {
  const { theme } = useThemeFromColor();
  // 終端は紙面の色に溶ける(ライトでは白、ダークでは暗い紙面色)。固定の白だとダークで浮いてしまう
  const gradient = `linear-gradient(255deg, ${theme.primary}, ${theme.accent} 55%, var(--color-paper) 100%)`;

  return (
    <div
      className={styles.sphere}
      style={{ width: size, maxWidth: "100%", background: gradient }}
      aria-hidden="true"
    />
  );
}
