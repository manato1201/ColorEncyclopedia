"use client";

import styles from "./ThemeModeToggle.module.css";
import { useThemeFromColor } from "./ThemeFromColorProvider";
import { IconMoon, IconSun } from "@/components/icons/Icons";

/** ライト/ダークの切替ボタン(ヘッダー常設)。現在のモードを表示し、押すと反対側へ切り替える。 */
export function ThemeModeToggle() {
  const { mode, setMode } = useThemeFromColor();
  const next = mode === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={() => setMode(next)}
      aria-label={
        next === "dark"
          ? "ダークテーマに切り替える"
          : "ライトテーマに切り替える"
      }
      title={
        next === "dark"
          ? "ダークテーマに切り替える"
          : "ライトテーマに切り替える"
      }
    >
      {mode === "dark" ? <IconMoon /> : <IconSun />}
      <span className={styles.label}>{mode === "dark" ? "DARK" : "LIGHT"}</span>
    </button>
  );
}
