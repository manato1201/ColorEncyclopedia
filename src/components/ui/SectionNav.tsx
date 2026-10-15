"use client";

import { useEffect, useState } from "react";
import styles from "./SectionNav.module.css";

export type SectionNavItem = { id: string; label: string };

/**
 * ページ内の目次。いま読んでいる節をスクロール位置から判定して示す(UIパーツ「スクロールスパイ(24)」)。
 * 現在地は文字色と下線で示す(動きは足さない)。節のid要素にはscroll-margin-topを付けること。
 */
export function SectionNav({ items }: { items: SectionNavItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // 画面の上の帯に入っている節のうち、ページ順で最初のものを現在地にする
        const current = items.find((item) => visible.has(item.id));
        if (current) setActiveId(current.id);
      },
      { rootMargin: "-10% 0px -70% 0px" },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className={styles.nav} aria-label="このページの目次">
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`${styles.link} ${activeId === item.id ? styles.active : ""}`}
              aria-current={activeId === item.id ? "location" : undefined}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
