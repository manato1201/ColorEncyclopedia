import styles from "./ExamLevelBadge.module.css";

type ExamLevelBadgeProps = {
  level: string;
};

/** 色彩検定の級バッジ。ComplexityBadge(The-Algorithm-Illustrated)の色側での対応物。 */
export function ExamLevelBadge({ level }: ExamLevelBadgeProps) {
  return <span className={styles.badge}>{level}</span>;
}
