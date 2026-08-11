"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./HarmonyVisualizer.module.css";
import { drawHueWheel, polarToXY } from "./hueWheelCanvas";
import { hexToHsv, hsvToHex } from "@/lib/color-math";

const CANVAS_SIZE = 260;

type HarmonyType = "complementary" | "analogous" | "triadic" | "split-complementary";

const HARMONY_LABELS: Record<HarmonyType, string> = {
  complementary: "補色",
  analogous: "類似色",
  triadic: "トライアド",
  "split-complementary": "スプリットコンプリメンタリ",
};

/** 基準色相からの相対角度(度)。配色理論での実在する用語をそのまま用いる。 */
function harmonyOffsets(type: HarmonyType): number[] {
  switch (type) {
    case "complementary":
      return [180];
    case "analogous":
      return [-30, 30];
    case "triadic":
      return [120, 240];
    case "split-complementary":
      return [150, 210];
  }
}

type HarmonyVisualizerProps = {
  hex: string;
};

/**
 * 補色・類似色・トライアド・スプリットコンプリメンタリを色相環上に線で結んで描画する。
 * HueWheelVisualizerと同じ色相環描画ロジック(hueWheelCanvas)を共有する。
 */
export function HarmonyVisualizer({ hex }: HarmonyVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [harmonyType, setHarmonyType] = useState<HarmonyType>("complementary");
  const { h, s, v } = hexToHsv(hex);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    canvas.style.width = `${CANVAS_SIZE}px`;
    canvas.style.height = `${CANVAS_SIZE}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawHueWheel(ctx, Math.round(CANVAS_SIZE * dpr));
  }, []);

  const offsets = harmonyOffsets(harmonyType);
  const baseMarker = polarToXY(CANVAS_SIZE, h, s);
  const harmonyHues = offsets.map((offset) => ((h + offset) % 360 + 360) % 360);
  const harmonyMarkers = harmonyHues.map((hueDeg) => polarToXY(CANVAS_SIZE, hueDeg, s));
  const harmonyHexes = harmonyHues.map((hueDeg) => hsvToHex({ h: hueDeg, s, v }));
  const center = CANVAS_SIZE / 2;

  return (
    <div className={styles.visualizer}>
      <div className={styles.chipRow} role="group" aria-label="配色理論を選ぶ">
        {(Object.keys(HARMONY_LABELS) as HarmonyType[]).map((type) => (
          <button
            key={type}
            type="button"
            className={`${styles.chip} ${harmonyType === type ? styles.chipActive : ""}`}
            aria-pressed={harmonyType === type}
            onClick={() => setHarmonyType(type)}
          >
            {HARMONY_LABELS[type]}
          </button>
        ))}
      </div>

      <div className={styles.stageWrap}>
        <canvas ref={canvasRef} className={styles.canvas} role="img" aria-label="色相環" />
        <svg className={styles.overlay} viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`} aria-hidden="true">
          {harmonyMarkers.map((m, i) => (
            <line key={i} x1={center} y1={center} x2={m.x} y2={m.y} className={styles.harmonyLine} />
          ))}
          <line x1={center} y1={center} x2={baseMarker.x} y2={baseMarker.y} className={styles.harmonyLine} />
          <circle cx={baseMarker.x} cy={baseMarker.y} r={7} className={styles.baseMarker} />
          {harmonyMarkers.map((m, i) => (
            <circle key={i} cx={m.x} cy={m.y} r={6} className={styles.harmonyMarker} />
          ))}
        </svg>
      </div>

      <ul className={styles.harmonyList}>
        <li className={styles.harmonyItem}>
          <span className={styles.swatch} style={{ backgroundColor: hex }} aria-hidden="true" />
          基準色 {hex.toUpperCase()}(色相{h}°)
        </li>
        {harmonyHexes.map((hh, i) => (
          <li key={hh + i} className={styles.harmonyItem}>
            <span className={styles.swatch} style={{ backgroundColor: hh }} aria-hidden="true" />
            {HARMONY_LABELS[harmonyType]} {hh}(色相{Math.round(harmonyHues[i])}°)
          </li>
        ))}
      </ul>
    </div>
  );
}
