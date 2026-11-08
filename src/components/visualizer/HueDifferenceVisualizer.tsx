"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./HarmonyVisualizer.module.css";
import { drawHueWheel, getEffectiveDpr, polarToXY } from "./hueWheelCanvas";
import { hexToHsv, hsvToHex } from "@/lib/color-math";

const SIZE = 260;

/** 24色相環での色相差(つ)の分類(目安)。 */
export function hueDifferenceClass(step: number): string {
  if (step === 0) return "同一色相";
  if (step === 1) return "隣接色相";
  if (step <= 3) return "類似色相";
  if (step <= 7) return "中差色相";
  if (step <= 10) return "対照色相";
  return "補色色相";
}

/**
 * 色相差による配色。基準色から、24色相環(HSVの色相角を24等分した目安)で何つ離れた色と組むかを動かして、
 * 分類(同一・隣接・類似・中差・対照・補色)を確かめる。PCCSの正式な色相番号ではない。
 */
export function HueDifferenceVisualizer({
  hex,
  initialStep,
}: {
  hex: string;
  initialStep: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(initialStep);
  const { h, s, v } = hexToHsv(hex);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = getEffectiveDpr();
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawHueWheel(ctx, Math.round(SIZE * dpr));
  }, []);

  const otherHue = (h + step * 15) % 360;
  const otherHex = hsvToHex({ h: otherHue, s, v });
  const a = polarToXY(SIZE, h, s);
  const b = polarToXY(SIZE, otherHue, s);
  const c = SIZE / 2;
  const ticks = Array.from({ length: 24 }, (_, i) =>
    polarToXY(SIZE, (h + i * 15) % 360, 100),
  );

  return (
    <div className={styles.visualizer}>
      <div className={styles.stage}>
        <div className={styles.stageWrap}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            role="img"
            aria-label="色相環"
          />
          <svg
            className={styles.overlay}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            aria-hidden="true"
          >
            {ticks.map((t, i) => (
              <circle
                key={i}
                cx={t.x}
                cy={t.y}
                r={i === step ? 4 : 1.6}
                fill="#333"
              />
            ))}
            <line
              x1={c}
              y1={c}
              x2={a.x}
              y2={a.y}
              className={styles.harmonyLine}
            />
            <line
              x1={c}
              y1={c}
              x2={b.x}
              y2={b.y}
              className={styles.harmonyLine}
            />
            <circle cx={a.x} cy={a.y} r={7} className={styles.baseMarker} />
            <circle cx={b.x} cy={b.y} r={6} className={styles.harmonyMarker} />
          </svg>
        </div>
      </div>
      <label
        style={{
          display: "flex",
          gap: "var(--space-3)",
          alignItems: "center",
          width: "100%",
          maxWidth: 320,
          fontSize: "var(--text-caption)",
        }}
      >
        <span>色相差</span>
        <input
          type="range"
          min={0}
          max={12}
          step={1}
          value={step}
          onChange={(e) => setStep(Number(e.target.value))}
          style={{ flex: 1, accentColor: "var(--accent-current)" }}
        />
        <span className="num">{step}</span>
      </label>
      <p role="status" style={{ fontSize: "var(--text-body-sm)" }}>
        色相差 <span className="num">{step}</span>({step * 15}°)={" "}
        <strong>{hueDifferenceClass(step)}</strong>
      </p>
      <ul className={styles.harmonyList}>
        <li className={styles.harmonyItem}>
          <span
            className={styles.swatch}
            style={{ backgroundColor: hex }}
            aria-hidden="true"
          />
          基準色 {hex.toUpperCase()}(色相{h}°)
        </li>
        <li className={styles.harmonyItem}>
          <span
            className={styles.swatch}
            style={{ backgroundColor: otherHex }}
            aria-hidden="true"
          />
          組み合わせる色 {otherHex}(色相{Math.round(otherHue)}°)
        </li>
      </ul>
      <p
        style={{
          fontSize: "var(--text-caption)",
          color: "var(--color-ink-muted)",
          maxWidth: 320,
        }}
      >
        分類は
        同一(0)・隣接(1)・類似(2〜3)・中差(4〜7)・対照(8〜10)・補色(11〜12)の目安。色相角はHSVを24等分した値で、PCCSの正式な色相番号ではありません。
      </p>
    </div>
  );
}
