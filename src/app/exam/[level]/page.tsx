import { notFound } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import { ExamQuiz } from "@/components/exam/ExamQuiz";
import { EXAM_LEVEL_SLUGS, levelFromSlug } from "@/lib/exam-levels";
import { getQuestionsByLevel } from "@/data/exam-questions";

type ExamLevelPageProps = {
  params: Promise<{ level: string }>;
};

export function generateStaticParams() {
  return EXAM_LEVEL_SLUGS.map(({ slug }) => ({ level: slug }));
}

export default async function ExamLevelPage({ params }: ExamLevelPageProps) {
  const { level: slug } = await params;
  const level = levelFromSlug(slug);

  if (!level) {
    notFound();
  }

  const questions = getQuestionsByLevel(level);

  return (
    <div className={styles.page}>
      <Link href="/exam" className={styles.backLink}>
        ← 検定対策トップに戻る
      </Link>
      <header className={styles.header}>
        <p className={styles.eyebrow}>■ EXAM {level}</p>
        <h1 className={styles.title}>{level} 問題演習</h1>
      </header>
      {questions.length === 0 ? (
        <div className={styles.emptyState}>この級の問題は準備中です。</div>
      ) : (
        <ExamQuiz questions={questions} />
      )}
    </div>
  );
}
