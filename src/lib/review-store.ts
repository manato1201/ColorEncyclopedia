"use client";

import { useSyncExternalStore } from "react";
import { EXAM_QUESTIONS } from "@/data/exam-questions";
import {
  EMPTY_REVIEW_STATE,
  REVIEW_VERSION,
  mergeReviewStates,
  dueQuestionIds,
  recordAnswer,
  sanitizeRecords,
  summarizeReview,
  type ReviewState,
  type ReviewSummary,
} from "@/lib/spaced-repetition";

/** 学習履歴の保存先。端末(ブラウザ)ごとの保存なので、移すときは書き出し/読み込みを使う。 */
export const REVIEW_STORAGE_KEY = "ce:review:v1";

const KNOWN_IDS = EXAM_QUESTIONS.map((q) => q.id);

const listeners = new Set<() => void>();
let cache: { raw: string | null; state: ReviewState } = {
  raw: null,
  state: EMPTY_REVIEW_STATE,
};

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(REVIEW_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): ReviewState {
  const raw = readRaw();
  if (raw === cache.raw) return cache.state;
  let state = EMPTY_REVIEW_STATE;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { version?: number; records?: unknown };
      if (parsed.version === REVIEW_VERSION) {
        state = sanitizeRecords(parsed.records, KNOWN_IDS);
      }
    } catch {
      // 壊れた保存値は無視して空から始める
    }
  }
  cache = { raw, state };
  return state;
}

function getServerSnapshot(): ReviewState {
  return EMPTY_REVIEW_STATE;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === REVIEW_STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function write(state: ReviewState) {
  const raw = JSON.stringify({ version: REVIEW_VERSION, records: state });
  try {
    window.localStorage.setItem(REVIEW_STORAGE_KEY, raw);
  } catch {
    // 保存できない環境(プライベートモード等)では、この画面の間だけ有効な状態として扱う
  }
  cache = { raw, state };
  listeners.forEach((listener) => listener());
}

/** 1問の解答を履歴に記録する。 */
export function recordReviewAnswer(questionId: string, isCorrect: boolean) {
  write(recordAnswer(getSnapshot(), questionId, isCorrect, Date.now()));
}

/** 書き出しファイルの履歴を、いまの履歴に結合する(同じ問題は新しい方を採用)。 */
export function importReviewRecords(incoming: ReviewState) {
  write(mergeReviewStates(getSnapshot(), incoming));
}

export function clearReviewHistory() {
  write(EMPTY_REVIEW_STATE);
}

export function readReviewState(): ReviewState {
  return getSnapshot();
}

/** 学習履歴を購読するフック。サーバー描画時と最初の描画は空(=履歴なし)で、保存値は描画後に反映される。 */
export function useReviewState(): ReviewState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** いま期限を迎えている問題のid(現在時刻を読むので、描画ではなくuseMemo(state依存)から呼ぶ)。 */
export function selectDueIds(state: ReviewState): string[] {
  return dueQuestionIds(state, KNOWN_IDS, Date.now());
}

export function selectReviewSummary(state: ReviewState): ReviewSummary {
  return summarizeReview(state, KNOWN_IDS, Date.now());
}
