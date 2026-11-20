"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IconChevronDown, IconChevronUp } from "@/components/icons/Icons";
import { RELATED_SITES, type SiteId } from "./RelatedSites";
import styles from "./SitesMenu.module.css";

/**
 * ヘッダーの「関連サイト」メニュー(アルゴリズム図鑑・基礎学習図鑑の SitesMenu と同じ作りを写したもの。共有パッケージは作らない)。
 * フッターまで行かなくても、姉妹サイトへ飛べる。ボタンで開閉する開示(disclosure)パターン:
 * Esc・外側のクリック・フォーカスが外れる(Tab)で閉じる。いま見ているサイトはリンクにしない。
 * 一覧の定数は RelatedSites.tsx の RELATED_SITES を使う(1 か所のまま)。
 */
export function SitesMenu({ current }: { current: SiteId }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={styles.root}
      onBlur={(event) => {
        // フォーカスがメニューの外へ出たら閉じる
        if (open && !event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className={styles.button}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        関連サイト
        {open ? <IconChevronUp /> : <IconChevronDown />}
      </button>
      <div id={panelId} className={styles.panel} data-open={open} hidden={!open}>
        <ul className={styles.list}>
          {RELATED_SITES.map((site) => (
            <li key={site.id}>
              {site.id === current ? (
                <span className={`${styles.item} ${styles.current}`} aria-current="true">
                  <span className={styles.name}>{site.name}</span>
                  <span className={styles.desc}>いま見ているサイト</span>
                </span>
              ) : site.url ? (
                <a className={`${styles.item} ${styles.link}`} href={site.url} rel="noopener">
                  <span className={styles.name}>{site.name}</span>
                  <span className={styles.desc}>{site.desc}</span>
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
