import styles from "./CornerBrackets.module.css";

type CornerBracketsProps = {
  size?: number;
};

/** 画面四隅のL字罫線装飾。 */
export function CornerBrackets({ size = 16 }: CornerBracketsProps) {
  const style = { "--corner-size": `${size}px` } as React.CSSProperties;

  return (
    <div className={styles.brackets} style={style} aria-hidden="true">
      <span className={`${styles.corner} ${styles.tl}`} />
      <span className={`${styles.corner} ${styles.tr}`} />
      <span className={`${styles.corner} ${styles.bl}`} />
      <span className={`${styles.corner} ${styles.br}`} />
    </div>
  );
}
