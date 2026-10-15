"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import styles from "./Tooltip.module.css";

type TooltipProps = {
  /** 説明文。 */
  label: ReactNode;
  /** 説明を付ける語(トリガー)。 */
  children: ReactNode;
};

/**
 * 用語に付ける小さな説明(UIパーツ「ツールチップ(06)」)。
 * ホバー・フォーカス・タップで開き、Escで閉じる。トリガーはボタンなのでキーボードで届く。
 * 説明はaria-describedbyで語に結びつけ、色だけに頼らない(下線の点線で「説明あり」を示す)。
 */
export function Tooltip({ label, children }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <span
      className={styles.wrap}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={styles.trigger}
        aria-describedby={id}
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((current) => !current)}
      >
        {children}
      </button>
      <span id={id} role="tooltip" className={styles.bubble} hidden={!open}>
        {label}
      </span>
    </span>
  );
}
