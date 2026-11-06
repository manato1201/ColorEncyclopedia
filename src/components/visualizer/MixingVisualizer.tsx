"use client";

import styles from "./MixingVisualizer.module.css";
import { PlaybackControls } from "./PlaybackControls";
import { useStepPlayer } from "./useStepPlayer";

type Mode = "additive" | "subtractive";

type Circle = { cx: number; cy: number; hex: string; name: string };

const R = 22;
/** 3つの円の中心(三角形の頂点)。 */
const POS: [number, number][] = [
  [38, 36],
  [62, 36],
  [50, 56],
];

const MODES: Record<
  Mode,
  {
    background: string;
    blend: "screen" | "multiply";
    circles: Circle[];
    frames: { show: number; description: string; results: { name: string; hex: string }[] }[];
  }
> = {
  additive: {
    background: "#000000",
    blend: "screen",
    circles: [
      { cx: POS[0][0], cy: POS[0][1], hex: "#FF0000", name: "赤(R)の光" },
      { cx: POS[1][0], cy: POS[1][1], hex: "#00FF00", name: "緑(G)の光" },
      { cx: POS[2][0], cy: POS[2][1], hex: "#0000FF", name: "青(B)の光" },
    ],
    frames: [
      { show: 1, description: "暗闇(黒)の上に、赤の光を当てる", results: [{ name: "赤", hex: "#FF0000" }] },
      {
        show: 2,
        description: "緑の光を重ねる。重なった部分は、赤+緑=黄になり、元の2色より明るい",
        results: [{ name: "赤+緑=黄", hex: "#FFFF00" }],
      },
      {
        show: 3,
        description: "青の光も重ねる。緑+青=シアン、青+赤=マゼンタ、3つ全部が重なった中心は、白になる",
        results: [
          { name: "赤+緑=黄", hex: "#FFFF00" },
          { name: "緑+青=シアン", hex: "#00FFFF" },
          { name: "青+赤=マゼンタ", hex: "#FF00FF" },
          { name: "赤+緑+青=白", hex: "#FFFFFF" },
        ],
      },
    ],
  },
  subtractive: {
    background: "#FFFFFF",
    blend: "multiply",
    circles: [
      { cx: POS[0][0], cy: POS[0][1], hex: "#00FFFF", name: "シアン(C)のインク" },
      { cx: POS[1][0], cy: POS[1][1], hex: "#FF00FF", name: "マゼンタ(M)のインク" },
      { cx: POS[2][0], cy: POS[2][1], hex: "#FFFF00", name: "イエロー(Y)のインク" },
    ],
    frames: [
      { show: 1, description: "白い紙に、シアンのインクを塗る", results: [{ name: "シアン", hex: "#00FFFF" }] },
      {
        show: 2,
        description: "マゼンタのインクを重ねる。重なった部分は、シアン+マゼンタ=青になり、元の2色より暗い",
        results: [{ name: "シアン+マゼンタ=青", hex: "#0000FF" }],
      },
      {
        show: 3,
        description:
          "イエローも重ねる。マゼンタ+イエロー=赤、イエロー+シアン=緑、3つ全部が重なった中心は、理論上は黒(実際のインクでは濁った暗い色になり、印刷では黒のインクKを足す)",
        results: [
          { name: "シアン+マゼンタ=青", hex: "#0000FF" },
          { name: "マゼンタ+イエロー=赤", hex: "#FF0000" },
          { name: "イエロー+シアン=緑", hex: "#00FF00" },
          { name: "C+M+Y=黒(理論上)", hex: "#000000" },
        ],
      },
    ],
  },
};

/** 加法混色(光)と減法混色(色材)を、円の重なりで段階的に見せる。重なりの色は mix-blend-mode で描く。 */
export function MixingVisualizer({ mode }: { mode: Mode }) {
  const config = MODES[mode];
  const { stepIndex, isFinished, showPause, handlePlayPause, handleStep, reset } = useStepPlayer(config.frames.length);
  const frame = config.frames[stepIndex];

  return (
    <div className={styles.visualizer}>
      <svg
        viewBox="0 0 100 80"
        className={styles.canvas}
        style={{ backgroundColor: config.background }}
        role="img"
        aria-label={mode === "additive" ? "光の三原色の重なり" : "色材の三原色の重なり"}
      >
        {config.circles.slice(0, frame.show).map((circle) => (
          <circle
            key={circle.hex}
            cx={circle.cx}
            cy={circle.cy}
            r={R}
            fill={circle.hex}
            style={{ mixBlendMode: config.blend }}
          />
        ))}
      </svg>
      <ul className={styles.results}>
        {frame.results.map((result) => (
          <li key={result.name} className={styles.result}>
            <span className={styles.chip} style={{ backgroundColor: result.hex }} aria-hidden="true" />
            <span>{result.name}</span>
            <span className={`num ${styles.hex}`}>{result.hex}</span>
          </li>
        ))}
      </ul>
      <p className={styles.description} role="status">
        {frame.description}
      </p>
      <PlaybackControls
        stepIndex={stepIndex}
        frameCount={config.frames.length}
        showPause={showPause}
        isFinished={isFinished}
        onPlayPause={handlePlayPause}
        onStep={handleStep}
        onReset={reset}
        resetLabel="最初から"
      />
    </div>
  );
}
