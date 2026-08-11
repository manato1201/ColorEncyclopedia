import Link from "next/link";
import { CornerBrackets } from "./CornerBrackets";
import { StatusChip } from "./StatusChip";
import { LiveClock } from "./LiveClock";
import { ThemeColorPicker } from "@/components/theme/ThemeColorPicker";
import styles from "./AppShell.module.css";

type AppShellProps = {
  children: React.ReactNode;
};

const NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/basics", label: "色彩図鑑とは?" },
  { href: "/", label: "色図鑑" },
  { href: "/shapes", label: "図形図鑑" },
  { href: "/compare", label: "比較" },
  { href: "/exam", label: "検定対策" },
];

/**
 * 全画面共通のHUDフレーム(The-Algorithm-IllustratedのAppShellを踏襲)。
 * ヘッダー(ブランド+ナビゲーション+テーマ色ピッカー+ステータスチップ+ライブ時計)を提供する。
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.frame}>
      <CornerBrackets />
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandDot} aria-hidden="true" />
          <span className={styles.brandName}>COLOR ENCYCLOPEDIA</span>
          <span className={styles.brandSub}>色彩・図形図鑑 — 色彩検定対策と配色理論の可視化学習</span>
        </div>
        <nav className={styles.nav} aria-label="メインナビゲーション">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.headerRight}>
          <ThemeColorPicker />
          <StatusChip status="online" />
          <LiveClock />
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
