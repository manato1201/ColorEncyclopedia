"use client";

import { useState, type ReactNode } from "react";
import styles from "./Visual3D.module.css";

type Visual3DSwitchProps = {
  /** 平面の可視化(既定)。 */
  flat: ReactNode;
  /** 立体の可視化。「立体」を選んだときに初めて描画する(three.js もそのとき読み込む)。 */
  solid: ReactNode;
};

/** 「平面 / 立体」の切り替え。立体は選ぶまで読み込まない。 */
export function Visual3DSwitch({ flat, solid }: Visual3DSwitchProps) {
  const [mode, setMode] = useState<"flat" | "solid">("flat");
  return (
    <div className={styles.switch}>
      <div className={styles.switchTabs} role="group" aria-label="表示の切り替え">
        <button type="button" className={styles.switchTab} aria-pressed={mode === "flat"} onClick={() => setMode("flat")}>
          平面
        </button>
        <button type="button" className={styles.switchTab} aria-pressed={mode === "solid"} onClick={() => setMode("solid")}>
          立体(3D)
        </button>
      </div>
      {mode === "flat" ? flat : solid}
    </div>
  );
}
