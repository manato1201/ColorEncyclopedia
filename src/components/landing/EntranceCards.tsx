import Link from "next/link";
import styles from "./EntranceCards.module.css";
import { IconArrowRight } from "@/components/icons/Icons";

type Entrance = {
  no: string;
  href: string;
  title: string;
  titleEn: string;
  body: string;
};

/** 段1: まずはここから(基礎)。初めて来た人の最初の一歩。 */
const START_HERE: Entrance[] = [
  {
    no: "01",
    href: "/basics",
    title: "基礎",
    titleEn: "Basics",
    body: "図鑑の読み方から。HSV・Labの意味と、WCAGコントラスト比という「数値で見る色」の入口です。",
  },
];

/** 段2: 試験対策から。色彩検定の学習が目的の人向け。 */
const EXAM_FIRST: Entrance[] = [
  {
    no: "02",
    href: "/exam",
    title: "問題演習",
    titleEn: "Practice",
    body: "級別の自作問題。解答すると、根拠になる色エントリへのリンクが出ます。",
  },
  {
    no: "03",
    href: "/exam/review",
    title: "復習",
    titleEn: "Review",
    body: "間違えた問題や、解いてから日がたった問題を、忘れる頃に出し直します。",
  },
];

type ExploreItem = {
  href: string;
  label: string;
  labelEn: string;
  count?: number;
  unit?: string;
};

type EntranceCardsProps = {
  /** 段3: すべて。件数は呼び出し側が実データから渡す。 */
  all: ExploreItem[];
};

function CardList({ items }: { items: Entrance[] }) {
  return (
    <ul className={styles.cards}>
      {items.map((entrance) => (
        <li key={entrance.href}>
          <Link href={entrance.href} className={styles.card}>
            <span className={`num ${styles.no}`}>{entrance.no}</span>
            <span className={styles.cardTitle}>{entrance.title}</span>
            <span className="subtitle">{entrance.titleEn}</span>
            <span className={styles.body}>{entrance.body}</span>
            <span className={styles.go}>
              開く
              <IconArrowRight />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * 入口を3段に分ける(T5): まずはここから(基礎)/ 試験対策から / すべて(件数つき)。
 * 目的の違う人が、迷わず最初の一歩を選べるようにする。
 */
export function EntranceCards({ all }: EntranceCardsProps) {
  return (
    <section id="start" className={styles.section} aria-labelledby="start-heading">
      <h2 id="start-heading" className={styles.heading}>
        どこから始めますか
      </h2>
      <p className="subtitle">Start here</p>

      <h3 className={styles.tierHeading}>まずはここから</h3>
      <CardList items={START_HERE} />

      <h3 className={styles.tierHeading}>試験対策から</h3>
      <CardList items={EXAM_FIRST} />

      <h3 className={styles.exploreHeading}>すべて</h3>
      <ul className={styles.explore}>
        {all.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={styles.exploreLink}>
              <span className={styles.exploreText}>
                <span>{item.label}</span>
                <span className="subtitle">{item.labelEn}</span>
              </span>
              {item.count !== undefined ? (
                <span className={styles.exploreCount}>
                  <span className="num">{item.count}</span>
                  <span className={styles.exploreUnit}>{item.unit}</span>
                </span>
              ) : null}
              <IconArrowRight />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
