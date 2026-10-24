import styles from "./PracticeBadge.module.css";

/**
 * 「実務の用語」バッジ。色彩検定の出題範囲として確認していない用語(映像・撮影など)を、
 * 級バッジのある検定対策の項目と区別するための印。点線の枠で級バッジと見分ける。
 */
export function PracticeBadge() {
  return (
    <span
      className={styles.badge}
      title="映像・撮影などの実務の用語です。色彩検定の出題範囲としては確認していません。"
    >
      実務の用語
    </span>
  );
}
