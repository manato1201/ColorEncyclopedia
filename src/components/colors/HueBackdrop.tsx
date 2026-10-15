"use client";

import { usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import styles from "./HueBackdrop.module.css";

type HueBackdropProps = {
  /** 色のid → 色相(0〜360°)。数値(colorValue)を持つ色だけ。 */
  hues: Record<string, number>;
  children: ReactNode;
};

/**
 * 色の詳細ページの背景を、その色の色相に応じて薄く染める(IMPROVEMENT_DESIGN「背景色トランジション(15)」)。
 * /colors 配下のレイアウトに置くので、色→色へ遷移してもこの要素は残り、背景色がなめらかに変わる。
 * 彩度は低く、明度はライトでキャンバスより明るく・ダークで暗く固定する(文字・アクセントのコントラストは同じか良くなる)。
 * 色見本の周囲は中立灰のステージのままなので、見本の見え方は変わらない。
 */
export function HueBackdrop({ hues, children }: HueBackdropProps) {
  const pathname = usePathname();
  const match = /^\/colors\/([^/]+)\/?$/.exec(pathname);
  const hue = match ? hues[decodeURIComponent(match[1])] : undefined;

  return (
    <div
      className={`${styles.backdrop} ${hue === undefined ? "" : styles.tinted}`}
      style={
        hue === undefined
          ? undefined
          : ({ "--backdrop-hue": hue } as CSSProperties)
      }
    >
      {children}
    </div>
  );
}
