"use client";

import styles from "./ThemeColorPicker.module.css";
import { useThemeFromColor } from "./ThemeFromColorProvider";

/**
 * ヘッダーに常設するテーマ色ピッカー。選んだ色がそのまま
 * サイト全体のCSS custom properties(--theme-*)に反映される(Phase 4)。
 */
export function ThemeColorPicker() {
  const { selectedHex, setSelectedHex } = useThemeFromColor();

  return (
    <label className={styles.picker}>
      <span className={styles.label}>THEME</span>
      <input
        type="color"
        className={styles.swatchInput}
        value={selectedHex}
        onChange={(event) => setSelectedHex(event.target.value)}
        aria-label="サイトのテーマ色を選択"
      />
      <span className={styles.hexValue}>{selectedHex.toUpperCase()}</span>
    </label>
  );
}
