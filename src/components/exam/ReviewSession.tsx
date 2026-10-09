"use client";

import { useMemo, useState } from "react";
import styles from "./Review.module.css";
import { ExamQuiz } from "./ExamQuiz";
import { ActionButton, ActionLink } from "@/components/hud/ActionLink";
import { IconArrowRight, IconRefresh } from "@/components/icons/Icons";
import { EXAM_QUESTIONS } from "@/data/exam-questions";
import { selectDueIds, useReviewState } from "@/lib/review-store";

const QUESTIONS_BY_ID = new Map(EXAM_QUESTIONS.map((q) => [q.id, q]));

/**
 * 復習セッション。「始める」を押した時点の復習待ちを固定して出題する
 * (解答のたびに期限が変わって一覧から消えないようにするため)。
 */
export function ReviewSession() {
  const state = useReviewState();
  const [sessionIds, setSessionIds] = useState<string[] | null>(null);

  const dueIds = useMemo(() => selectDueIds(state), [state]);

  if (sessionIds) {
    const questions = sessionIds.flatMap((id) => QUESTIONS_BY_ID.get(id) ?? []);
    return (
      <>
        <ExamQuiz questions={questions} />
        <div className={styles.panelActions}>
          <ActionButton
            icon={<IconRefresh />}
            onClick={() => setSessionIds(null)}
          >
            復習を終える
          </ActionButton>
        </div>
      </>
    );
  }

  if (dueIds.length === 0) {
    return (
      <div className={styles.empty}>
        <p>
          いま復習する問題はありません。級ごとの問題を解くと、ここに復習が貯まります。
        </p>
        <div className={styles.panelActions}>
          <ActionLink href="/exam" icon={<IconArrowRight />}>
            級を選んで問題を解く
          </ActionLink>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.empty}>
      <p>
        復習待ちが <span className="num">{dueIds.length}</span> 問あります。
      </p>
      <div className={styles.panelActions}>
        <ActionButton
          icon={<IconArrowRight />}
          onClick={() => setSessionIds(dueIds)}
        >
          復習を始める
        </ActionButton>
      </div>
    </div>
  );
}
