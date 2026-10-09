import Link from "next/link";
import styles from "../[level]/page.module.css";
import { ReviewSession } from "@/components/exam/ReviewSession";

export const metadata = { title: "復習 | 色彩・図形図鑑" };

/** 間隔反復の復習。履歴はブラウザのlocalStorageにあるため、中身はクライアント側で描画する。 */
export default function ExamReviewPage() {
  return (
    <div className={styles.page}>
      <Link href="/exam" className={styles.backLink}>
        ← 検定対策トップに戻る
      </Link>
      <header className={styles.header}>
        <p className={styles.eyebrow}>EXAM REVIEW</p>
        <h1 className={styles.title}>復習</h1>
        <p className="subtitle">Spaced Review</p>
      </header>
      <ReviewSession />
    </div>
  );
}
