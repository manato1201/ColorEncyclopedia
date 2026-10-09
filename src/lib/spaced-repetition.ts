/**
 * 間隔反復(ライトナー式の箱)で「忘れる頃に再出題」するための純粋関数群(IMPROVEMENT_PLAN C5)。
 * 保存先(localStorage)や画面とは独立させ、検査しやすくしている。
 *
 * 箱0=要復習(間違えた直後・すぐ再出題)、箱1〜5=正解を重ねるほど次の出題までの間隔が伸びる。
 * 間隔の日数は学習の目安であり、記憶の科学的な最適値を主張するものではない。
 */

export const REVIEW_VERSION = 1;
export const MAX_BOX = 5;

/** 箱ごとの次回出題までの日数(インデックス=箱)。 */
export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export type ReviewRecord = {
  box: number;
  /** 次に出題してよい時刻(epoch ms)。 */
  due: number;
  /** 最後に答えた時刻(epoch ms)。 */
  last: number;
  correct: number;
  wrong: number;
};

export type ReviewState = Record<string, ReviewRecord>;

export const EMPTY_REVIEW_STATE: ReviewState = Object.freeze({}) as ReviewState;

/** 1問の解答を記録した新しい状態を返す(元の状態は変更しない)。 */
export function recordAnswer(
  state: ReviewState,
  questionId: string,
  isCorrect: boolean,
  now: number,
): ReviewState {
  const prev = state[questionId];
  const box = isCorrect ? Math.min((prev?.box ?? 0) + 1, MAX_BOX) : 0;
  const next: ReviewRecord = {
    box,
    due: now + BOX_INTERVAL_DAYS[box] * DAY_MS,
    last: now,
    correct: (prev?.correct ?? 0) + (isCorrect ? 1 : 0),
    wrong: (prev?.wrong ?? 0) + (isCorrect ? 0 : 1),
  };
  return { ...state, [questionId]: next };
}

/** 出題期限を迎えた(記録のある)問題のid。期限の古い順、同じなら箱の低い順。 */
export function dueQuestionIds(
  state: ReviewState,
  knownIds: Iterable<string>,
  now: number,
): string[] {
  const known = new Set(knownIds);
  return Object.entries(state)
    .filter(([id, record]) => known.has(id) && record.due <= now)
    .sort(([, a], [, b]) => a.due - b.due || a.box - b.box)
    .map(([id]) => id);
}

export type ReviewSummary = {
  answered: number;
  due: number;
  correctTotal: number;
  attemptsTotal: number;
};

export function summarizeReview(
  state: ReviewState,
  knownIds: Iterable<string>,
  now: number,
): ReviewSummary {
  const known = new Set(knownIds);
  let answered = 0;
  let correctTotal = 0;
  let attemptsTotal = 0;
  for (const [id, record] of Object.entries(state)) {
    if (!known.has(id)) continue;
    answered += 1;
    correctTotal += record.correct;
    attemptsTotal += record.correct + record.wrong;
  }
  return {
    answered,
    due: dueQuestionIds(state, known, now).length,
    correctTotal,
    attemptsTotal,
  };
}

// ---- 保存形式(書き出し / 読み込み) ----

export type ReviewExport = {
  version: typeof REVIEW_VERSION;
  exportedAt: string;
  records: ReviewState;
};

export function serializeReview(state: ReviewState, now: number): string {
  const payload: ReviewExport = {
    version: REVIEW_VERSION,
    exportedAt: new Date(now).toISOString(),
    records: state,
  };
  return JSON.stringify(payload, null, 2);
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

function sanitizeRecord(value: unknown): ReviewRecord | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (
    !isFiniteNumber(v.box) ||
    !isFiniteNumber(v.due) ||
    !isFiniteNumber(v.last) ||
    !isFiniteNumber(v.correct) ||
    !isFiniteNumber(v.wrong)
  ) {
    return null;
  }
  return {
    box: Math.min(MAX_BOX, Math.max(0, Math.round(v.box))),
    due: v.due,
    last: v.last,
    correct: Math.max(0, Math.round(v.correct)),
    wrong: Math.max(0, Math.round(v.wrong)),
  };
}

/**
 * 保存済みの状態(localStorage)または書き出しファイルの`records`を検証して状態にする。
 * 形式が合わないレコードは捨て、knownIdsに無い問題id(問題の削除・改名後)も読み込まない。
 */
export function sanitizeRecords(
  value: unknown,
  knownIds: Iterable<string>,
): ReviewState {
  if (typeof value !== "object" || value === null) return {};
  const known = new Set(knownIds);
  const result: ReviewState = {};
  for (const [id, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!known.has(id)) continue;
    const record = sanitizeRecord(raw);
    if (record) result[id] = record;
  }
  return result;
}

export type ParseResult =
  | { ok: true; records: ReviewState; skipped: number }
  | { ok: false; error: string };

/** 書き出しファイルの中身を読み込み用に検証する。 */
export function parseReviewExport(
  text: string,
  knownIds: Iterable<string>,
): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "JSONとして読み込めませんでした。" };
  }
  if (typeof data !== "object" || data === null) {
    return { ok: false, error: "学習履歴の形式ではありません。" };
  }
  const payload = data as Record<string, unknown>;
  if (payload.version !== REVIEW_VERSION) {
    return { ok: false, error: "対応していないバージョンのファイルです。" };
  }
  if (typeof payload.records !== "object" || payload.records === null) {
    return { ok: false, error: "学習履歴が含まれていません。" };
  }
  const total = Object.keys(payload.records).length;
  const records = sanitizeRecords(payload.records, knownIds);
  return { ok: true, records, skipped: total - Object.keys(records).length };
}

/** 2つの履歴を結合する。同じ問題は、最後に答えた時刻が新しい方を採用する。 */
export function mergeReviewStates(
  current: ReviewState,
  incoming: ReviewState,
): ReviewState {
  const merged: ReviewState = { ...current };
  for (const [id, record] of Object.entries(incoming)) {
    const existing = merged[id];
    if (!existing || record.last > existing.last) merged[id] = record;
  }
  return merged;
}
