import type { CSSProperties } from "react";
import styles from "./GlitchText.module.css";

type GlitchTextProps = {
  text: string;
};

/**
 * OFF+BRANDリファレンスに見られる、見出しの一部の文字が周期的にテーマ色へ一瞬だけ
 * 色づく・わずかに上下するグリッチ演出。1文字ずつspanに分割し、indexでずらしたanimation-delayを
 * 与えることで、文字ごとにばらばらのタイミングで明滅させている(全文字が同時に光ると煩わしいため)。
 */
export function GlitchText({ text }: GlitchTextProps) {
  return (
    <>
      {[...text].map((char, i) => (
        <span
          key={i}
          className={styles.char}
          style={{ "--i": i } as CSSProperties}
        >
          {char}
        </span>
      ))}
    </>
  );
}
