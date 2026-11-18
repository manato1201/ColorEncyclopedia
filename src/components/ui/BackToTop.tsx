"use client";

import { useEffect, useState } from "react";
import { IconArrowUp } from "@/components/icons/Icons";
import styles from "./BackToTop.module.css";

/**
 * 長いページ(色の詳細・はじめに・図形の詳細など)で、画面 1.5 枚分より下まで読み進んだときだけ
 * 右下に出る「ページの先頭へ」ボタン。出入りは opacity と transform の短い 1 回の動き。
 * スクロールのなめらかさは html の scroll-behavior に従う(動きを減らす設定では即座に戻る)。
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setVisible(window.scrollY > window.innerHeight * 1.5);
    };
    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <button
      type="button"
      className={`${styles.button} ${visible ? styles.visible : ""}`}
      aria-label="ページの先頭へ戻る"
      tabIndex={visible ? 0 : -1}
      aria-hidden={visible ? undefined : true}
      onClick={() => window.scrollTo({ top: 0 })}
    >
      <IconArrowUp />
    </button>
  );
}
