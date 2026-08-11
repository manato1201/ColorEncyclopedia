"use client";

import { useMemo, useState } from "react";
import styles from "./ContrastVisualizer.module.css";
import {
  contrastRatio,
  WCAG_AA_LARGE,
  WCAG_AA_NORMAL,
  WCAG_AAA_LARGE,
  WCAG_AAA_NORMAL,
} from "@/lib/color-math";

type ContrastVisualizerProps = {
  initialForeground?: string;
  initialBackground?: string;
};

function passFail(pass: boolean) {
  return (
    <span className={pass ? styles.pass : styles.fail}>{pass ? "AA/AAA適合" : "基準未達"}</span>
  );
}

/**
 * WCAGコントラスト比のライブ計算を可視化する。2色を選ぶとリアルタイムに比率を再計算し、
 * AA/AAA基準の達成・未達成を色分け表示する。計算式はderiveThemeFromColor(Phase 4)と共有(color-math.ts)。
 */
export function ContrastVisualizer({
  initialForeground = "#EB6238",
  initialBackground = "#FFFDF4",
}: ContrastVisualizerProps) {
  const [fg, setFg] = useState(initialForeground);
  const [bg, setBg] = useState(initialBackground);

  const ratio = useMemo(() => contrastRatio(fg, bg), [fg, bg]);

  const aaNormal = ratio >= WCAG_AA_NORMAL;
  const aaLarge = ratio >= WCAG_AA_LARGE;
  const aaaNormal = ratio >= WCAG_AAA_NORMAL;
  const aaaLarge = ratio >= WCAG_AAA_LARGE;

  return (
    <div className={styles.visualizer}>
      <div className={styles.controls}>
        <label className={styles.control}>
          <span className={styles.controlLabel}>文字色</span>
          <input
            type="color"
            value={fg}
            onChange={(event) => setFg(event.target.value)}
            aria-label="文字色を選択"
          />
          <span className={styles.hex}>{fg.toUpperCase()}</span>
        </label>
        <label className={styles.control}>
          <span className={styles.controlLabel}>背景色</span>
          <input
            type="color"
            value={bg}
            onChange={(event) => setBg(event.target.value)}
            aria-label="背景色を選択"
          />
          <span className={styles.hex}>{bg.toUpperCase()}</span>
        </label>
      </div>

      <div className={styles.preview} style={{ backgroundColor: bg, color: fg }}>
        <span className={styles.previewLarge}>大きな文字 Aa</span>
        <span className={styles.previewNormal}>通常サイズの文字見本 Aa 色彩検定</span>
      </div>

      <p className={styles.ratio} role="status">
        コントラスト比 <strong>{ratio.toFixed(2)}</strong> : 1
      </p>

      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col"></th>
            <th scope="col">AA(4.5:1 / 大文字3:1)</th>
            <th scope="col">AAA(7:1 / 大文字4.5:1)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">通常テキスト</th>
            <td>{passFail(aaNormal)}</td>
            <td>{passFail(aaaNormal)}</td>
          </tr>
          <tr>
            <th scope="row">大きな文字</th>
            <td>{passFail(aaLarge)}</td>
            <td>{passFail(aaaLarge)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
