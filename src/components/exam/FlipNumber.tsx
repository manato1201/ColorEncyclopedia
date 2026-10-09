import styles from "./FlipNumber.module.css";

type FlipNumberProps = {
  value: number;
  /** 読み上げ用のラベル(例: 「正答数」)。 */
  label: string;
};

/**
 * 値が変わるたびに上からめくれるように切り替わる数字(正答数の表示用)。
 * keyに値を使い、変わった時だけ要素を作り直してCSSアニメーションを再生する。
 * 動きは prefers-reduced-motion で止まる(globals.cssの全体ルール)。
 */
export function FlipNumber({ value, label }: FlipNumberProps) {
  return (
    <span
      className={`num ${styles.flip}`}
      role="img"
      aria-label={`${label} ${value}`}
    >
      <span key={value} className={styles.digit} aria-hidden="true">
        {value}
      </span>
    </span>
  );
}
