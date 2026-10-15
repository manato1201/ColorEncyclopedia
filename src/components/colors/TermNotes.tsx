import styles from "./TermNotes.module.css";
import type { TermNote } from "@/data/term-notes";

/**
 * 用語詳細の定型項目(見るポイント / 混同しやすい点 / 使うときの注意)。
 * 全エントリで同じ順・同じ見出しにして、どの用語でも同じ場所に同じ種類の情報があるようにする。
 */
export function TermNotes({ note }: { note: TermNote }) {
  const items = [
    { key: "look", label: "見るポイント", body: note.look },
    { key: "confuse", label: "混同しやすい点", body: note.confuse },
    { key: "caution", label: "使うときの注意", body: note.caution },
  ];
  return (
    <dl className={styles.list}>
      {items.map((item) => (
        <div key={item.key} className={styles.item}>
          <dt className={styles.label}>{item.label}</dt>
          <dd className={styles.body}>{item.body}</dd>
        </div>
      ))}
    </dl>
  );
}
