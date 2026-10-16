"use client";

import { useEffect, useRef } from "react";

type CountUpProps = {
  value: number;
  /** 数え上げにかける時間(ms)。 */
  duration?: number;
  className?: string;
};

const easeOut = (u: number) => 1 - (1 - u) ** 3;

/**
 * 数値が0から目標値まで数え上がる(画面に入ったとき1回だけ)。
 * サーバー出力と動きを減らす設定では最初から最終値を出す(数値の意味は変わらない)。
 * 描画は要素のテキストを直接書き換えるので、数え上げ中に再描画は起きない。
 */
export function CountUp({ value, duration = 1100, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const u = Math.min(1, (now - start) / duration);
          el.textContent = String(Math.round(value * easeOut(u)));
          if (u < 1) frame = requestAnimationFrame(tick);
        };
        el.textContent = "0";
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      el.textContent = String(value);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
