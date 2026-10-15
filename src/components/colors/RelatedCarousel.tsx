"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./RelatedCarousel.module.css";
import { ColorSwatch } from "@/components/hud/ColorSwatch";
import { Tooltip } from "@/components/ui/Tooltip";
import { COLOR_VALUE_TERMS } from "@/lib/color-terms";

export type RelatedColor = {
  id: string;
  name: string;
  nameEn: string;
  hex: string;
  /** 基準の色とのLab距離(CIE76のΔE)。 */
  deltaE: number;
};

/**
 * 近い色を横に送って順に見るカルーセル(UIパーツ「カルーセル(10)」)。
 * 並びは基準の色とのΔEが小さい順。スクロールスナップで1枚ずつ止まり、前へ/次へのボタンでも送れる。
 * 各カードは色見本に名前とHEXを必ず併記する。カードの出現はスタッガー(.stagger)。
 */
export function RelatedCarousel({ items }: { items: RelatedColor[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(items.length > 1);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  const scrollByPage = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className={styles.carousel}>
      <div className={styles.controls}>
        <p className={styles.note}>
          基準の色との <Tooltip label={COLOR_VALUE_TERMS["ΔE"]}>ΔE</Tooltip>{" "}
          が小さい順(横に送れます)
        </p>
        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.button}
            onClick={() => scrollByPage(-1)}
            disabled={!canPrev}
            aria-label="前の色へ"
          >
            ←
          </button>
          <button
            type="button"
            className={styles.button}
            onClick={() => scrollByPage(1)}
            disabled={!canNext}
            aria-label="次の色へ"
          >
            →
          </button>
        </div>
      </div>
      <ul
        ref={trackRef}
        className={styles.track}
        onScroll={update}
        aria-label="近い色の一覧"
      >
        {items.map((item, index) => (
          <li
            key={item.id}
            className={`${styles.card} stagger`}
            style={{ "--i": index } as React.CSSProperties}
          >
            <ColorSwatch hex={item.hex} size={40} />
            <Link href={`/colors/${item.id}`} className={styles.name}>
              {item.name}
            </Link>
            <span className="subtitle">{item.nameEn}</span>
            <span className={`num ${styles.hex}`}>{item.hex}</span>
            <span className={`num ${styles.delta}`}>
              ΔE {item.deltaE.toFixed(1)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
