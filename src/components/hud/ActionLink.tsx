import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./ActionLink.module.css";

type CommonProps = {
  children: ReactNode;
  /** 先頭に置く線画アイコン(意味はラベルが持つので装飾扱い)。 */
  icon?: ReactNode;
};

type ActionLinkProps = CommonProps & {
  href: string;
  /** trueのとき、リンクではなく操作できない表示にする(理由はtitleで補足する)。 */
  disabled?: boolean;
  title?: string;
};

/**
 * 画面下部の「操作」に並べるゴースト型のリンク(枠線のみ・ホバーで塗り反転)。
 * 「紫(テーマ色)は操作」の決めごとに従い、操作要素にだけアクセント色を使う(docs/ui-rules.md)。
 */
export function ActionLink({
  href,
  children,
  icon,
  disabled,
  title,
}: ActionLinkProps) {
  if (disabled) {
    return (
      <span
        className={`${styles.action} ${styles.disabled}`}
        aria-disabled="true"
        title={title}
      >
        {icon}
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={styles.action} title={title}>
      {icon}
      {children}
    </Link>
  );
}

type ActionButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

/** ActionLinkと同じ見た目のボタン版(画面遷移ではなく、その場で状態を変える操作用)。 */
export function ActionButton({
  children,
  icon,
  type = "button",
  ...props
}: ActionButtonProps) {
  return (
    <button type={type} className={styles.action} {...props}>
      {icon}
      {children}
    </button>
  );
}
