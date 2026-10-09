"use client";

import { useState, type MouseEvent, type ReactElement, type ReactNode } from "react";
import Link from "next/link";
import styles from "./ExamQuiz.module.css";
import { FlipNumber } from "./FlipNumber";
import type { ExamQuestion } from "@/data/exam-questions";
import { recordReviewAnswer } from "@/lib/review-store";

type ExamQuizProps = {
  questions: ExamQuestion[];
};

/** 押した位置から広がる波紋。動きを減らす設定のときは出さない(CSS側でも止まる)。 */
function spawnRipple(event: MouseEvent<HTMLButtonElement>, className: string) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const button = event.currentTarget;
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  // キーボード操作(座標が0)のときは中央から広げる
  const fromKeyboard = event.clientX === 0 && event.clientY === 0;
  const x = fromKeyboard ? rect.width / 2 : event.clientX - rect.left;
  const y = fromKeyboard ? rect.height / 2 : event.clientY - rect.top;
  const ripple = document.createElement("span");
  ripple.className = className;
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x - size / 2}px`;
  ripple.style.top = `${y - size / 2}px`;
  ripple.addEventListener("animationend", () => ripple.remove());
  button.appendChild(ripple);
}

/** 問題文の中の用語に「R」バッジを付ける(押すと補足が開く)。用語は最初の1か所だけ。 */
function QuestionText({
  question,
  openTerm,
  onToggle,
}: {
  question: ExamQuestion;
  openTerm: string | null;
  onToggle: (term: string) => void;
}): ReactNode {
  let nodes: (string | ReactElement)[] = [question.questionText];
  for (const { term } of question.glossary ?? []) {
    nodes = nodes.flatMap<string | ReactElement>((node, index) => {
      if (typeof node !== "string") return [node];
      const at = node.indexOf(term);
      if (at < 0) return [node];
      const expanded = openTerm === term;
      return [
        node.slice(0, at),
        <span key={`${term}-${index}`} className={styles.term}>
          {term}
          <button
            type="button"
            className={styles.rBadge}
            aria-expanded={expanded}
            aria-label={`用語の補足: ${term}`}
            onClick={() => onToggle(term)}
          >
            R
          </button>
        </span>,
        node.slice(at + term.length),
      ];
    });
  }
  return <>{nodes}</>;
}

/**
 * 級別の問題一覧。選択肢を選ぶと正誤判定し、explanationRef先の色エントリへのリンクを表示する。
 * 解答は学習履歴(間隔反復)に記録され、/exam/review で「忘れる頃に」再出題される。
 * 上部に正答数をフリップ数字で表示し、各問題はid(#q-…)でリンクできる(カタログの「クイズに出す」の飛び先)。
 */
export function ExamQuiz({ questions }: ExamQuizProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [openTerms, setOpenTerms] = useState<Record<string, string | null>>({});

  const answeredCount = Object.keys(answers).length;
  const correctCount = questions.filter((q) => answers[q.id] === q.answerIndex).length;

  const choose = (q: ExamQuestion, choiceIndex: number, event: MouseEvent<HTMLButtonElement>) => {
    spawnRipple(event, styles.ripple);
    setAnswers((prev) => ({ ...prev, [q.id]: choiceIndex }));
    recordReviewAnswer(q.id, choiceIndex === q.answerIndex);
  };

  return (
    <>
      <p className={styles.score} role="status">
        <span className={styles.scoreItem}>
          正答 <FlipNumber value={correctCount} label="正答数" />
        </span>
        <span className={styles.scoreItem}>
          回答 <span className="num">{answeredCount}</span> / <span className="num">{questions.length}</span>問
        </span>
      </p>
      <ol className={styles.list}>
        {questions.map((q, index) => {
          const selected = answers[q.id];
          const answered = selected !== undefined;
          const openTerm = openTerms[q.id] ?? null;
          const note = q.glossary?.find((g) => g.term === openTerm)?.note;
          return (
            <li key={q.id} id={q.id} className={styles.question}>
              <p className={styles.questionText}>
                <span className={`num ${styles.questionNumber}`}>Q{index + 1}</span>
                <QuestionText
                  question={q}
                  openTerm={openTerm}
                  onToggle={(term) =>
                    setOpenTerms((prev) => ({ ...prev, [q.id]: prev[q.id] === term ? null : term }))
                  }
                />
                <span className={`num ${styles.year}`}>({q.year}年度想定・自作問題)</span>
              </p>
              {note ? (
                <p className={styles.glossaryNote} role="note">
                  <span className={styles.rBadgeStatic}>R</span>
                  {openTerm}: {note}
                </p>
              ) : null}
              <ul className={styles.choices}>
                {q.choices.map((choice, choiceIndex) => {
                  const isCorrect = choiceIndex === q.answerIndex;
                  const isSelected = selected === choiceIndex;
                  let stateClass = "";
                  if (answered && isCorrect) stateClass = styles.correct;
                  else if (answered && isSelected) stateClass = styles.incorrect;
                  return (
                    <li key={choiceIndex}>
                      <button
                        type="button"
                        className={`${styles.choiceButton} ${stateClass}`}
                        disabled={answered}
                        onClick={(event) => choose(q, choiceIndex, event)}
                      >
                        {choice}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {answered ? (
                <p className={styles.result}>
                  {selected === q.answerIndex ? "正解" : "不正解"} — 詳しい解説は{" "}
                  <Link href={`/colors/${q.explanationRef}`} className={styles.link}>
                    対応する色エントリ
                  </Link>{" "}
                  を確認
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </>
  );
}
