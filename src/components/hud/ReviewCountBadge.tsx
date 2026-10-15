"use client";

import { useMemo } from "react";
import styles from "./ReviewCountBadge.module.css";
import { selectDueIds, useReviewState } from "@/lib/review-store";

/**
 * ヘッダーの「検定対策」に添える、復習待ちの問題数(T7)。0件のときは何も出さない。
 * 履歴はこの端末のlocalStorageにあるため、サーバー描画では出ず、読み込み後に表示される。
 */
export function ReviewCountBadge() {
  const state = useReviewState();
  const due = useMemo(() => selectDueIds(state).length, [state]);
  if (due === 0) return null;
  return (
    <span
      className={`num ${styles.badge}`}
      role="img"
      aria-label={`復習待ち ${due}問`}
    >
      {due}
    </span>
  );
}
