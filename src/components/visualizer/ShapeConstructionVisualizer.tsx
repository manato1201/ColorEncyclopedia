"use client";

import { useMemo } from "react";
import styles from "./ShapeConstructionVisualizer.module.css";
import { PlaybackControls } from "./PlaybackControls";
import { useStepPlayer } from "./useStepPlayer";
import { SHAPE_VISUALIZERS, type ShapeElement, type ShapeElementState } from "@/lib/shape-visualizers";

const STATE_CLASS: Record<ShapeElementState, string> = {
  idle: "stateIdle",
  guide: "stateGuide",
  active: "stateActive",
  final: "stateFinal",
};

function polygonPoints(points: [number, number][]): string {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

function renderElement(el: ShapeElement, index: number) {
  if (el.kind === "rect") {
    return (
      <rect
        key={index}
        x={el.x}
        y={el.y}
        width={el.w}
        height={el.h}
        className={`${styles.shape} ${styles[STATE_CLASS[el.state]]}`}
      />
    );
  }
  if (el.kind === "line") {
    return (
      <line
        key={index}
        x1={el.x1}
        y1={el.y1}
        x2={el.x2}
        y2={el.y2}
        className={`${styles.shape} ${styles[STATE_CLASS[el.state]]}`}
        strokeDasharray={el.dashed ? "2 2" : undefined}
      />
    );
  }
  if (el.kind === "circle") {
    return (
      <circle
        key={index}
        cx={el.cx}
        cy={el.cy}
        r={el.r}
        className={`${styles.shape} ${styles[STATE_CLASS[el.state]]}`}
      />
    );
  }
  if (el.kind === "polygon") {
    return (
      <polygon
        key={index}
        points={polygonPoints(el.points)}
        className={`${styles.shape} ${styles[STATE_CLASS[el.state]]}`}
      />
    );
  }
  return (
    <text key={index} x={el.x} y={el.y} className={styles.label}>
      {el.text}
    </text>
  );
}

type ShapeConstructionVisualizerProps = {
  shapeId: string;
};

/**
 * 図形の作図手順(黄金比の矩形分割・テセレーション・対称群など)を、useStepPlayerのステップ再生パターンで
 * 段階的に描画する。座標系はshape-visualizers.tsが定義する0〜100の正方形空間をそのままSVG viewBoxにマップする。
 */
export function ShapeConstructionVisualizer({ shapeId }: ShapeConstructionVisualizerProps) {
  const generator = SHAPE_VISUALIZERS[shapeId];
  const frames = useMemo(() => (generator ? generator() : []), [generator]);
  const { stepIndex, isFinished, showPause, handlePlayPause, handleStep, reset } = useStepPlayer(
    frames.length,
  );

  if (!generator || frames.length === 0) return null;

  const currentFrame = frames[stepIndex];

  return (
    <div className={styles.visualizer}>
      <svg viewBox="0 0 100 100" className={styles.canvas} role="img" aria-label="図形の作図手順">
        {currentFrame.elements.map((el, i) => renderElement(el, i))}
      </svg>
      <p className={styles.description} role="status">
        {currentFrame.description}
      </p>
      <PlaybackControls
        stepIndex={stepIndex}
        frameCount={frames.length}
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
