"use client";

import { useMemo } from "react";
import styles from "./ColorSystemsVisualizer.module.css";
import { PlaybackControls } from "./PlaybackControls";
import { useStepPlayer } from "./useStepPlayer";
import { hexToHsv, hexToLab, hexToRgb } from "@/lib/color-math";

type Axis = {
  label: string;
  /** 表示用の値(半角・等幅で桁を揃える)。 */
  value: string;
  /** 取りうる範囲(表示用)。 */
  range: string;
  /** 範囲の中での位置(0〜1)。 */
  ratio: number;
  /** 棒の色。RGBだけは三原色の色で塗る(他は選択テーマ色)。 */
  barColor?: string;
};

type System = {
  id: string;
  name: string;
  nameEn: string;
  axes: Axis[];
  meaning: string;
};

const STEP_TITLES = ["入力", "値", "位置", "見方"] as const;

const CHANNEL_COLORS = { r: "#e5484d", g: "#30a46c", b: "#3e63dd" } as const;

const pad = (value: number | string, width: number) => String(value).padStart(width, " ");
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function buildSystems(hex: string): System[] {
  const rgb = hexToRgb(hex);
  const hsv = hexToHsv(hex);
  const lab = hexToLab(hex);

  return [
    {
      id: "rgb",
      name: "RGB",
      nameEn: "Additive mixing of light",
      axes: [
        { label: "R", value: pad(rgb.r, 3), range: "0–255", ratio: rgb.r / 255, barColor: CHANNEL_COLORS.r },
        { label: "G", value: pad(rgb.g, 3), range: "0–255", ratio: rgb.g / 255, barColor: CHANNEL_COLORS.g },
        { label: "B", value: pad(rgb.b, 3), range: "0–255", ratio: rgb.b / 255, barColor: CHANNEL_COLORS.b },
      ],
      meaning: "光の三原色の強さ。画面が実際に出している信号そのもので、混ぜるほど明るくなる(加法混色)。",
    },
    {
      id: "hsv",
      name: "HSV",
      nameEn: "Hue / Saturation / Value",
      axes: [
        { label: "H", value: `${pad(hsv.h, 3)}°`, range: "0–360°", ratio: hsv.h / 360 },
        { label: "S", value: `${pad(hsv.s, 3)}%`, range: "0–100%", ratio: hsv.s / 100 },
        { label: "V", value: `${pad(hsv.v, 3)}%`, range: "0–100%", ratio: hsv.v / 100 },
      ],
      meaning: "色相・彩度・明度という人の直感に近い3軸。色相環の上の位置(角度)として色を扱える。",
    },
    {
      id: "lab",
      name: "Lab",
      nameEn: "CIE L*a*b*",
      axes: [
        { label: "L*", value: pad(lab.l.toFixed(1), 6), range: "0–100", ratio: lab.l / 100 },
        { label: "a*", value: pad(lab.a.toFixed(1), 6), range: "−128–127", ratio: clamp01((lab.a + 128) / 255) },
        { label: "b*", value: pad(lab.b.toFixed(1), 6), range: "−128–127", ratio: clamp01((lab.b + 128) / 255) },
      ],
      meaning: "人の見え方に近い距離で測れる体系。2色の「違いの大きさ」(色差)を数値で比べるのに向く。",
    },
  ];
}

type ColorSystemsVisualizerProps = {
  hex: string;
};

/**
 * 同じ1色を、RGB・HSV・Labの3つの体系で並べて段階的に見せる(IMPROVEMENT_PLAN_2026-10 C3)。
 * 3列が同時に1ステップずつ進む: ① 入力(軸と範囲)→ ② 値 → ③ 範囲内の位置 → ④ 見方。
 * PCCS・マンセルは換算に対応表が必要で、近似で出すと試験学習の数値として不正確になるため、ここでは扱わない。
 */
export function ColorSystemsVisualizer({ hex }: ColorSystemsVisualizerProps) {
  const systems = useMemo(() => buildSystems(hex), [hex]);
  const frameCount = STEP_TITLES.length;
  const { stepIndex, isFinished, showPause, handlePlayPause, handleStep, reset } =
    useStepPlayer(frameCount);

  return (
    <div className={styles.visualizer}>
      <p className={styles.input}>
        入力
        <span className={`num ${styles.inputHex}`}>{hex.toUpperCase()}</span>
        <span className={styles.inputSwatch} style={{ backgroundColor: hex }} aria-hidden="true" />
      </p>

      <div className={styles.columns}>
        {systems.map((system) => (
          <section key={system.id} className={styles.column} aria-label={`${system.name}での表現`}>
            <h4 className={styles.systemName}>{system.name}</h4>
            <p className="subtitle">{system.nameEn}</p>

            <ul className={styles.axes}>
              {system.axes.map((axis) => (
                <li key={axis.label} className={styles.axis}>
                  <span className={`num ${styles.axisLabel}`}>{axis.label}</span>
                  <span className={`num ${styles.axisValue}`}>
                    {stepIndex >= 1 ? axis.value : "—"}
                  </span>
                  <span className={`num ${styles.axisRange}`}>{axis.range}</span>
                  <span className={styles.track} aria-hidden="true">
                    {stepIndex >= 2 ? (
                      <span
                        className={styles.fill}
                        style={{
                          width: `${(axis.ratio * 100).toFixed(1)}%`,
                          backgroundColor: axis.barColor ?? "var(--accent-current)",
                        }}
                      />
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>

            <p className={styles.meaning}>{stepIndex >= 3 ? system.meaning : ""}</p>
          </section>
        ))}
      </div>

      <p className={styles.description} role="status">
        STEP {stepIndex + 1}/{frameCount}「{STEP_TITLES[stepIndex]}」 — 完了 {stepIndex + 1}/{frameCount}
      </p>

      <PlaybackControls
        stepIndex={stepIndex}
        frameCount={frameCount}
        showPause={showPause}
        isFinished={isFinished}
        onPlayPause={handlePlayPause}
        onStep={handleStep}
        onReset={reset}
        resetLabel="最初から"
      />

      <p className={styles.note}>
        画面に表示される色は、ディスプレイの設定や周囲の環境で見え方が変わります。ここに並ぶ数値は、その色のデータとしての値です。
        PCCS・マンセルは換算に対応表が必要なため、ここでは扱っていません。
      </p>
    </div>
  );
}
