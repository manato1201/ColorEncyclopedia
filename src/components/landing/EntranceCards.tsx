import Link from "next/link";
import styles from "./EntranceCards.module.css";
import { IconArrowRight } from "@/components/icons/Icons";

const ENTRANCES = [
  {
    no: "01",
    href: "/basics",
    title: "基礎",
    titleEn: "Basics",
    body: "色彩図鑑の読み方から。HSV・Labの意味と、WCAGコントラスト比という「数値で見る色」の入口です。",
  },
  {
    no: "02",
    href: "/compare",
    title: "比較",
    titleEn: "Compare",
    body: "2〜4色を並べて、HEX・HSV・コントラスト比を見比べます。同じ色をRGB・HSV・Labで並べる段階表示つき。",
  },
  {
    no: "03",
    href: "/exam",
    title: "試験",
    titleEn: "Exam",
    body: "級別の問題演習。間違えた問題は、忘れる頃に復習として戻ってきます。",
  },
] as const;

type EntranceCardsProps = {
  /** 「さらに探す」のリンク。件数は呼び出し側が実データから渡す。 */
  explore: { href: string; label: string; labelEn: string; count?: number; unit?: string }[];
};

/** 入口カード3つ(基礎 / 比較 / 試験)と、図鑑・Atlasへの副次リンク。トップの「学習を始める」の飛び先。 */
export function EntranceCards({ explore }: EntranceCardsProps) {
  return (
    <section id="start" className={styles.section} aria-labelledby="start-heading">
      <h2 id="start-heading" className={styles.heading}>
        どこから始めますか
      </h2>
      <p className="subtitle">Start here</p>

      <ul className={styles.cards}>
        {ENTRANCES.map((entrance) => (
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

      <h3 className={styles.exploreHeading}>さらに探す</h3>
      <ul className={styles.explore}>
        {explore.map((item) => (
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
