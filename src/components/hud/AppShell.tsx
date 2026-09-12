import Link from "next/link";
import { ThemeColorPicker } from "@/components/theme/ThemeColorPicker";
import styles from "./AppShell.module.css";

type AppShellProps = {
  children: React.ReactNode;
};

const NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/", label: "色図鑑" },
  { href: "/shapes", label: "図形図鑑" },
  { href: "/compare", label: "比較" },
  { href: "/exam", label: "検定対策" },
  { href: "/basics", label: "色彩図鑑とは" },
];

/**
 * 全画面共通のシェル。OFF+BRANDスタイルリファレンスに合わせ、旧ターミナルHUD調(コーナーブラケット・
 * ステータスチップ・ライブ時計)を廃し、ブランドワードマーク+ゴーストリンクのナビゲーションだけの
 * 最小限のトップバーにしている。
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
              {item.label} <span aria-hidden="true">→</span>
            </Link>
          ))}
        </nav>
        <ThemeColorPicker />
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
