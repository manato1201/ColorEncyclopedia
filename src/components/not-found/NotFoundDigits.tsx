"use client";

import { useEffect, useRef } from "react";
import styles from "./NotFoundDigits.module.css";

const DIGITS = ["4", "0", "4"] as const;
/** 数字ごとの色相のずれ(度)。3つで色相環を3等分して、同時に違う色に見えるようにする。 */
const HUE_OFFSETS = [0, 120, 240] as const;
/** 色相が一周する時間(ms)。 */
const CYCLE_MS = 12000;

const SATURATION = 70;
const LIGHTNESS = 42;

/**
 * 「404」の各桁が、色相環の色で塗られる。時間とともに色相が回り、いま何度かを数字で表示する。
 * 装飾なので桁はaria-hidden、見出しの文章が内容を伝える。
 * 動きを減らす設定のときは回さず、初期の3色のまま止める。
 */
export function NotFoundDigits() {
  const digitRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const hueRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const paint = (base: number) => {
      digitRefs.current.forEach((el, i) => {
        if (el)
          el.style.color = `hsl(${(base + HUE_OFFSETS[i]) % 360} ${SATURATION}% ${LIGHTNESS}%)`;
      });
      if (hueRef.current)
        hueRef.current.textContent = String(Math.round(base) % 360).padStart(
          3,
          " ",
        );
    };
    paint(0);
    if (reduce) return;

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      paint((((now - start) % CYCLE_MS) / CYCLE_MS) * 360);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className={styles.wrap}>
      <div className={`num ${styles.digits}`} aria-hidden="true">
        {DIGITS.map((digit, i) => (
          <span
            key={i}
            ref={(el) => {
              digitRefs.current[i] = el;
            }}
            // JS無効・初回描画前でも3色に分かれて見えるよう、初期色を直接持たせる
            style={{
              color: `hsl(${HUE_OFFSETS[i]} ${SATURATION}% ${LIGHTNESS}%)`,
            }}
          >
            {digit}
          </span>
        ))}
      </div>
      <p className={styles.readout} aria-hidden="true">
        色相 H{" "}
        <span ref={hueRef} className="num">
          {" "}
          0
        </span>
        °
      </p>
    </div>
  );
}
