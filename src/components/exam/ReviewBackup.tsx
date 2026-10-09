"use client";

import { useRef, useState } from "react";
import styles from "./Review.module.css";
import { ActionButton } from "@/components/hud/ActionLink";
import { IconDownload, IconUpload } from "@/components/icons/Icons";
import { EXAM_QUESTIONS } from "@/data/exam-questions";
import { importReviewRecords, readReviewState } from "@/lib/review-store";
import { parseReviewExport, serializeReview } from "@/lib/spaced-repetition";

const KNOWN_IDS = EXAM_QUESTIONS.map((q) => q.id);

/**
 * 学習履歴の書き出し/読み込み。履歴はこの端末のブラウザにだけ保存されるため、
 * 端末を変える・ブラウザのデータを消す前にJSONで退避できるようにしている。
 */
export function ReviewBackup({ hasHistory }: { hasHistory: boolean }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const exportHistory = () => {
    const now = Date.now();
    const blob = new Blob([serializeReview(readReviewState(), now)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `color-encyclopedia-review-${new Date(now).toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage({ text: "学習履歴を書き出しました。", ok: true });
  };

  const importHistory = async (file: File) => {
    const result = parseReviewExport(await file.text(), KNOWN_IDS);
    if (!result.ok) {
      setMessage({ text: result.error, ok: false });
      return;
    }
    importReviewRecords(result.records);
    const count = Object.keys(result.records).length;
    setMessage({
      text:
        `${count}問分の履歴を読み込みました。` +
        (result.skipped > 0 ? `(現在の問題に無い${result.skipped}件は読み飛ばしました)` : ""),
      ok: true,
    });
  };

  return (
    <div className={styles.backup}>
      <div className={styles.backupActions}>
        <ActionButton icon={<IconDownload />} onClick={exportHistory} disabled={!hasHistory}>
          学習履歴を書き出す
        </ActionButton>
        <ActionButton icon={<IconUpload />} onClick={() => fileInput.current?.click()}>
          学習履歴を読み込む
        </ActionButton>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className={styles.fileInput}
          aria-label="学習履歴のJSONファイルを選ぶ"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importHistory(file);
            event.target.value = "";
          }}
        />
      </div>
      <p className={styles.backupNote}>
        履歴はこの端末のブラウザにだけ保存されます。端末を変えるときやブラウザのデータを消す前に書き出してください。
      </p>
      {message ? (
        <p className={message.ok ? styles.messageOk : styles.messageError} role="status">
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
