"use client";

import { useMemo } from "react";
import styles from "./Review.module.css";
import { ReviewBackup } from "./ReviewBackup";
import { ActionLink } from "@/components/hud/ActionLink";
import { IconArrowRight } from "@/components/icons/Icons";
import { EXAM_QUESTIONS } from "@/data/exam-questions";
import { selectReviewSummary, useReviewState } from "@/lib/review-store";

const KNOWN_IDS = EXAM_QUESTIONS.map((q) => q.id);

/** /exam の上部。いまの学習状況(復習待ちの数など)と、復習・書き出しへの入口。 */
export function ReviewPanel() {
  const state = useReviewState();
  // 期限の判定は履歴が変わったときだけ行う
  const summary = useMemo(() => selectReviewSummary(state), [state]);
  const accuracy =
    summary.attemptsTotal > 0 ? Math.round((summary.correctTotal / summary.attemptsTotal) * 100) : null;

  return (
    <section className={styles.panel} aria-labelledby="review-heading">
      <h2 id="review-heading" className={styles.panelLabel}>
        REVIEW 復習
      </h2>
      <dl className={styles.stats}>
        <div>
          <dt>復習待ち</dt>
          <dd className="num">{summary.due}問</dd>
        </div>
        <div>
          <dt>解いた問題</dt>
          <dd className="num">
            {summary.answered}/{KNOWN_IDS.length}問
          </dd>
        </div>
        <div>
          <dt>通算の正答率</dt>
          <dd className="num">{accuracy === null ? "—" : `${accuracy}%`}</dd>
        </div>
      </dl>
      <p className={styles.explain}>
        解いた問題は、正解を重ねるほど出題の間隔が空き、間違えた問題はすぐ復習に戻ります(1日→3日→7日→14日→30日が目安)。
      </p>
      <div className={styles.panelActions}>
        <ActionLink href="/exam/review" icon={<IconArrowRight />}>
          復習を始める
        </ActionLink>
      </div>
      <ReviewBackup hasHistory={summary.answered > 0} />
    </section>
  );
}
