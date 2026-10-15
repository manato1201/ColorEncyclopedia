import Link from "next/link";
import styles from "./SectionTabs.module.css";

const TABS = [
  { key: "colors", href: "/colors", label: "色", labelEn: "Colors" },
  { key: "shapes", href: "/shapes", label: "図形", labelEn: "Shapes" },
  { key: "exam", href: "/exam", label: "試験対策", labelEn: "Exam" },
] as const;

export type SectionTabKey = (typeof TABS)[number]["key"];

/**
 * 図鑑の大きな区分(色 / 図形 / 試験対策)を見出しで切り替えるタブ(UIパーツ「タブ(09)」)。
 * 画面が変わる切り替えなのでリンクで実装し、現在地は aria-current で示す。
 */
export function SectionTabs({ current }: { current: SectionTabKey }) {
  return (
    <nav className={styles.tabs} aria-label="図鑑の区分">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`${styles.tab} ${tab.key === current ? styles.active : ""}`}
          aria-current={tab.key === current ? "page" : undefined}
        >
          {tab.label}
          <span className={styles.en}>{tab.labelEn}</span>
        </Link>
      ))}
    </nav>
  );
}
