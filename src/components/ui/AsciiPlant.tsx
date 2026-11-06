"use client";

import { useEffect, useMemo, useRef } from "react";
import styles from "./AsciiPlant.module.css";
import { generatePlant, renderPlantHtml, seedFrom } from "@/lib/ascii-plant";

type AsciiPlantProps = {
  /** 植物の形を決める文字列(同じなら同じ形)。 */
  seed: string;
  cols?: number;
  rows?: number;
  /**
   * 空・待機の状態でだけ true にする。画面に入ると、芽から枝へと文字が伸びていく(IMPROVEMENT_DESIGN P8)。
   * false(既定)や動きを減らす設定のときは、完成した静止画1枚を出す。
   */
  grow?: boolean;
  className?: string;
};

/**
 * 植物図譜モチーフ(ASCII)。ヒーロー・色の詳細の余白・空状態の装飾で、本文や操作部品には出さない。
 * 色は既存トークンだけ(緑=--color-accent-green、花=--color-ink、地=紙面)。読み上げ対象外(aria-hidden)。
 * 描画は pre の中身を直接書き換えるので、成長中に再描画(React)は起きない。
 */
export function AsciiPlant({
  seed,
  cols = 48,
  rows = 20,
  grow = false,
  className,
}: AsciiPlantProps) {
  const cells = useMemo(
    () => generatePlant(seedFrom(seed), cols, rows),
    [seed, cols, rows],
  );
  const finalHtml = useMemo(
    () => renderPlantHtml(cells, cols, rows),
    [cells, cols, rows],
  );
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const pre = preRef.current;
    if (!grow || !pre) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let started = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started) return;
      started = true;
      observer.disconnect();
      const total = cells.length;
      const duration = 3200;
      const begin = performance.now();
      pre.innerHTML = renderPlantHtml(cells, cols, rows, 0);
      const tick = (now: number) => {
        const u = Math.min(1, (now - begin) / duration);
        pre.innerHTML = renderPlantHtml(
          cells,
          cols,
          rows,
          Math.round(total * u),
        );
        if (u < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    observer.observe(pre);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      pre.innerHTML = finalHtml;
    };
  }, [grow, cells, cols, rows, finalHtml]);

  return (
    <pre
      ref={preRef}
      className={`${styles.plant} ${className ?? ""}`}
      aria-hidden="true"
      // 文字は ascii-plant.ts が生成する固定の文字集合のみ(外部入力なし)
      dangerouslySetInnerHTML={{ __html: finalHtml }}
    />
  );
}
