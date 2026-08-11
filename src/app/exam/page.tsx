import Link from "next/link";
import styles from "./page.module.css";
import { EXAM_LEVEL_SLUGS } from "@/lib/exam-levels";
import { getQuestionsByLevel } from "@/data/exam-questions";

/** 級別に問題一覧へのリンクを並べる、検定対策コンテンツの入口ページ。 */
export default function ExamIndexPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>■ EXAM 検定対策</p>
        <h1 className={styles.title}>色彩検定 級別問題演習</h1>
        <p className={styles.lead}>
          級ごとに自作問題を出題する。解答すると、対応する色エントリの詳細ページへのリンクが表示され、根拠となる数値データ・配色理論を確認できる。
        </p>
      </header>
      <ul className={styles.levelGrid}>
        {EXAM_LEVEL_SLUGS.map(({ slug, level }) => {
          const count = getQuestionsByLevel(level).length;
          return (
            <li key={slug}>
              <Link href={`/exam/${slug}`} className={styles.levelCard}>
                <span className={styles.levelName}>{level}</span>
                <span className={styles.levelCount}>{count}問</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
