"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./ExamQuiz.module.css";
import type { ExamQuestion } from "@/data/exam-questions";

type ExamQuizProps = {
  questions: ExamQuestion[];
};

/** 級別の問題一覧。選択肢を選ぶと正誤判定し、explanationRef先の色エントリへのリンクを表示する。 */
export function ExamQuiz({ questions }: ExamQuizProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});

  return (
    <ol className={styles.list}>
      {questions.map((q, index) => {
        const selected = answers[q.id];
        const answered = selected !== undefined;
        return (
          <li key={q.id} className={styles.question}>
            <p className={styles.questionText}>
              <span className={styles.questionNumber}>Q{index + 1}</span>
              {q.questionText}
              <span className={styles.year}>({q.year}年度想定・自作問題)</span>
            </p>
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
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [q.id]: choiceIndex }))
                      }
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
                <Link
                  href={`/colors/${q.explanationRef}`}
                  className={styles.link}
                >
                  対応する色エントリ
                </Link>{" "}
                を確認
              </p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
