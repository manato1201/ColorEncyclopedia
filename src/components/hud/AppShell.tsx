import Link from "next/link";
import { IconArrowRight } from "@/components/icons/Icons";
import { ThemeColorPicker } from "@/components/theme/ThemeColorPicker";
import { ThemeModeToggle } from "@/components/theme/ThemeModeToggle";
import styles from "./AppShell.module.css";

type AppShellProps = {
  children: React.ReactNode;
};

const NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/colors", label: "色図鑑" },
  { href: "/shapes", label: "図形図鑑" },
  { href: "/atlas", label: "Atlas" },
  { href: "/compare", label: "比較" },
  { href: "/exam", label: "検定対策" },
  { href: "/basics", label: "はじめに" },
];

/**
 * 全画面共通のシェル。OFF+BRANDスタイルリファレンスに合わせ、ブランドワードマーク+
 * ゴーストリンクのナビゲーション+テーマ操作(選択色・ライト/ダーク)だけの最小限のトップバーにしている。
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.frame}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          COLOR ENCYCLOPEDIA
        </Link>
        <nav className={styles.nav} aria-label="メインナビゲーション">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navLink}>
              {item.label} <IconArrowRight className={styles.navArrow} />
            </Link>
          ))}
        </nav>
        <div className={styles.controls}>
          <ThemeColorPicker />
          <ThemeModeToggle />
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
