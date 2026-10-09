import { NotFoundDigits } from "@/components/not-found/NotFoundDigits";
import { ActionLink } from "@/components/hud/ActionLink";
import { IconArrowRight } from "@/components/icons/Icons";
import styles from "./not-found.module.css";

export const metadata = { title: "ページが見つかりません | 色彩図鑑" };

/** 404。数字の「404」が色相環をめぐるように色を変える小さな遊び(動きは設定で止まる)。 */
export default function NotFound() {
  return (
    <div className={styles.page}>
      <NotFoundDigits />
      <h1 className={styles.title}>ページが見つかりません</h1>
      <p className="subtitle">Page Not Found</p>
      <p className={styles.lead}>
        URLが間違っているか、ページが移動した可能性があります。図鑑の入口から探してみてください。
      </p>
      <div className={styles.actions}>
        <ActionLink href="/colors" icon={<IconArrowRight />}>
          色図鑑へ
        </ActionLink>
        <ActionLink href="/shapes" icon={<IconArrowRight />}>
          図形図鑑へ
        </ActionLink>
        <ActionLink href="/" icon={<IconArrowRight />}>
          トップへ
        </ActionLink>
      </div>
    </div>
  );
}
