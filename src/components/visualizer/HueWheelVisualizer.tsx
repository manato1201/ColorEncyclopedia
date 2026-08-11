"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./HueWheelVisualizer.module.css";
import { drawHueWheel, polarToXY } from "./hueWheelCanvas";
import { hexToHsv } from "@/lib/color-math";

const CANVAS_SIZE = 260;

type HueWheelVisualizerProps = {
  hex: string;
};

/**
 * 色相環(0〜360°)をcanvasで描画し、選択色の位置をハイライトする基盤コンポーネント。
 * 半径方向は彩度、角度は色相を表す(明度は常に100%で固定した円盤として描画する)。
 * クリックすると、その地点の色相・彩度を読み取れるプローブマーカーが表示される(色相環インタラクション)。
 */
export function HueWheelVisualizer({ hex }: HueWheelVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [probe, setProbe] = useState<{ h: number; s: number } | null>(null);
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

  const handlePointer = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;
    const dx = x - cx;
    const dy = y - cy;
    const r = Math.sqrt(dx * dx + dy * dy);
    const radius = CANVAS_SIZE / 2 - 2;
    if (r > radius) return;
    const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    const sat = Math.min((r / radius) * 100, 100);
    setProbe({ h: Math.round(hue), s: Math.round(sat) });
  };

  const marker = polarToXY(CANVAS_SIZE, h, s);
  const probeMarker = probe ? polarToXY(CANVAS_SIZE, probe.h, probe.s) : null;

  return (
    <div className={styles.visualizer}>
      <div className={styles.stageWrap}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onClick={handlePointer}
          role="img"
          aria-label={`色相環。この色(色相${h}度・彩度${s}%)の位置をハイライトしている`}
        />
        <svg
          className={styles.overlay}
          viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
          aria-hidden="true"
        >
          <circle cx={marker.x} cy={marker.y} r={7} className={styles.marker} />
          <circle
            cx={marker.x}
            cy={marker.y}
            r={2.5}
            className={styles.markerCore}
          />
          {probeMarker ? (
            <circle
              cx={probeMarker.x}
              cy={probeMarker.y}
              r={5}
              className={styles.probeMarker}
            />
          ) : null}
        </svg>
      </div>
      <p className={styles.description} role="status">
        {probe
          ? `プローブ位置: 色相${probe.h}° ・彩度${probe.s}%(円盤をクリックして色相環を探索できる)`
          : `この色は色相${h}° ・彩度${s}% ・明度${v}%の位置にある(円盤をクリックすると任意の地点を読み取れる)`}
      </p>
    </div>
  );
}
