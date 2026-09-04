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
  const gradient = `linear-gradient(255deg, ${theme.primary}, ${theme.accent} 55%, #ffffff 100%)`;

  return (
    <div
      className={styles.sphere}
      style={{ width: size, height: size, background: gradient }}
      aria-hidden="true"
    />
  );
}
