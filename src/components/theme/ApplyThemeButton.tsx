"use client";

import styles from "./ApplyThemeButton.module.css";
import { useThemeFromColor } from "./ThemeFromColorProvider";

type ApplyThemeButtonProps = {
  hex: string;
};

/** この色をサイト全体のテーマ色として適用するボタン(色詳細ページで使用)。 */
export function ApplyThemeButton({ hex }: ApplyThemeButtonProps) {
  const { selectedHex, setSelectedHex } = useThemeFromColor();
  const isActive = selectedHex.toUpperCase() === hex.toUpperCase();

  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => setSelectedHex(hex)}
      disabled={isActive}
    >
      {isActive ? "この色がテーマ適用中" : "この色をサイトのテーマにする"}
    </button>
  );
}
