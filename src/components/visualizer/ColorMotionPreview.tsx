"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import styles from "./ColorMotionPreview.module.css";
import { ActionButton } from "@/components/hud/ActionLink";
import { IconRefresh } from "@/components/icons/Icons";
import { hexToHsv, hsvToHex, type Hsv } from "@/lib/color-math";

type AxisKey = "s" | "v" | "h";

type Phase = {
  key: AxisKey;
  label: string;
  caption: string;
  unit: string;
};

const PHASES: Phase[] = [
  { key: "s", label: "彩度 S", caption: "鮮やかさだけを 0→100→元の値へ動かす", unit: "%" },
  { key: "v", label: "明度 V", caption: "明るさだけを 0→100→元の値へ動かす", unit: "%" },
  { key: "h", label: "色相 H", caption: "色相を ±60° 動かして元に戻す", unit: "°" },
];

/** 1つの軸を動かす時間(ms)。3軸で一巡する。 */
const PHASE_MS = 3000;
const HUE_SWING = 60;
const SPEEDS = [0.5, 1, 2] as const;

const easeInOut = (u: number) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

/** 軸の値の経路: 元の値 → 下限 → 上限 → 元の値(3区間、それぞれ緩急つき)。 */
function axisValue(key: AxisKey, base: Hsv, t: number): number {
  const origin = base[key];
  const [lo, hi] = key === "h" ? [origin - HUE_SWING, origin + HUE_SWING] : [0, 100];
  const seg = Math.min(2, Math.floor(t * 3));
  const u = easeInOut(t * 3 - seg);
  if (seg === 0) return lerp(origin, lo, u);
  if (seg === 1) return lerp(lo, hi, u);
  return lerp(hi, origin, u);
}

/** 「動きを減らす」設定。サーバー描画では減らす側(=自動再生しない)として扱い、読み込み後に実際の設定へ切り替わる。 */
const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeReduceMotion(listener: () => void) {
  const query = window.matchMedia(REDUCE_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}
const getReduceMotion = () => window.matchMedia(REDUCE_QUERY).matches;
const getServerReduceMotion = () => true;

const wrapHue = (h: number) => ((h % 360) + 360) % 360;

/** 軸のトラック(背景のグラデーション)。動かす軸の変化の範囲を色で見せる。 */
function trackGradient(key: AxisKey, base: Hsv): string {
  if (key === "s") {
    return `linear-gradient(90deg, ${hsvToHex({ ...base, s: 0 })}, ${hsvToHex({ ...base, s: 100 })})`;
  }
  if (key === "v") {
    return `linear-gradient(90deg, #000000, ${hsvToHex({ ...base, v: 100 })})`;
  }
  const stops = Array.from({ length: 7 }, (_, i) =>
    hsvToHex({ ...base, h: wrapHue(base.h - HUE_SWING + (i * 2 * HUE_SWING) / 6) }),
  );
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}

const pad = (value: number, width: number) => String(Math.round(value)).padStart(width, " ");

/**
 * ライブプレビュー。1つの色の彩度・明度・色相を順に動かし、見本と数値(HSV・HEX)が同時に変わる様子を見せる。
 * 「軸を1つだけ動かすと見た目がどう変わるか」を、数値の動きと対応づけて見るための演出。
 * 見本は中立灰のステージの上に置く(周囲の色で見え方が変わらないように)。
 * 動きを減らす設定のときは自動再生せず、再生ボタンを押したときだけ動く。画面外では止まる。
 */
export function ColorMotionPreview({ hex }: { hex: string }) {
  const base = useMemo(() => hexToHsv(hex), [hex]);
  const reduceMotion = useSyncExternalStore(subscribeReduceMotion, getReduceMotion, getServerReduceMotion);
  // 利用者が押すまでは設定どおり(動きを減らす設定なら停止、そうでなければ自動再生)
  const [userPlaying, setUserPlaying] = useState<boolean | null>(null);
  const playing = userPlaying ?? !reduceMotion;
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLSpanElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);
  const hexRef = useRef<HTMLSpanElement>(null);
  const hsvRef = useRef<HTMLSpanElement>(null);
  const elapsedRef = useRef(0);

  // 画面に入っているときだけ動かす(外では描画を止める)
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const paint = () => {
      const total = PHASES.length * PHASE_MS;
      const elapsed = elapsedRef.current % total;
      const index = Math.floor(elapsed / PHASE_MS);
      const t = (elapsed - index * PHASE_MS) / PHASE_MS;
      const phase = PHASES[index];

      const next: Hsv = { ...base };
      next[phase.key] = phase.key === "h" ? wrapHue(axisValue("h", base, t)) : axisValue(phase.key, base, t);
      const color = hsvToHex(next);

      if (colorRef.current) colorRef.current.style.backgroundColor = color;
      if (hexRef.current) hexRef.current.textContent = color;
      if (hsvRef.current) {
        hsvRef.current.textContent = `H ${pad(next.h, 3)}°  S ${pad(next.s, 3)}%  V ${pad(next.v, 3)}%`;
      }
      if (valueRef.current) {
        valueRef.current.textContent = `${pad(next[phase.key], 3)}${phase.unit}`;
      }
      if (markerRef.current) {
        const range = phase.key === "h" ? HUE_SWING * 2 : 100;
        const position =
          phase.key === "h"
            ? ((axisValue("h", base, t) - (base.h - HUE_SWING)) / range) * 100
            : axisValue(phase.key, base, t);
        markerRef.current.style.left = `${Math.min(100, Math.max(0, position))}%`;
      }
      setPhaseIndex((current) => (current === index ? current : index));
    };

    paint();
    if (!playing || !visible) return;

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      elapsedRef.current += (now - last) * speed;
      last = now;
      paint();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [base, playing, visible, speed]);

  const phase = PHASES[phaseIndex];

  const replay = () => {
    elapsedRef.current = 0;
    setPhaseIndex(0);
    setUserPlaying(true);
  };

  return (
    <div className={styles.preview} ref={rootRef}>
      <div className={styles.stage}>
        <span className={styles.corner} data-pos="tl" aria-hidden="true" />
        <span className={styles.corner} data-pos="tr" aria-hidden="true" />
        <span className={styles.corner} data-pos="bl" aria-hidden="true" />
        <span className={styles.corner} data-pos="br" aria-hidden="true" />
        <span className={styles.live}>
          <span className={`${styles.liveDot} ${playing && visible ? styles.liveOn : ""}`} aria-hidden="true" />
          LIVE
        </span>
        <span ref={colorRef} className={styles.color} style={{ backgroundColor: hex }} aria-hidden="true" />
        <span className={`num ${styles.readout}`} aria-hidden="true">
          <span ref={hexRef}>{hex}</span>
          <span ref={hsvRef}>{`H ${pad(base.h, 3)}°  S ${pad(base.s, 3)}%  V ${pad(base.v, 3)}%`}</span>
        </span>
      </div>

      <div className={styles.axis}>
        <div className={styles.axisHead}>
          <span className={styles.axisLabel}>{phase.label}</span>
          <span ref={valueRef} className={`num ${styles.axisValue}`}>
            {pad(base[phase.key], 3)}
            {phase.unit}
          </span>
        </div>
        <div className={styles.track} style={{ backgroundImage: trackGradient(phase.key, base) }}>
          <span ref={markerRef} className={styles.marker} aria-hidden="true" />
        </div>
        <p className={styles.caption}>{phase.caption}</p>
      </div>

      <ol className={styles.steps} aria-label="動かす軸の順序">
        {PHASES.map((item, index) => (
          <li key={item.key} className={index === phaseIndex ? styles.stepActive : undefined}>
            <span className="num">{index + 1}</span> {item.label}
          </li>
        ))}
      </ol>

      <div className={styles.controls}>
        <ActionButton onClick={() => setUserPlaying(!playing)} aria-pressed={playing}>
          {playing ? "一時停止" : "再生"}
        </ActionButton>
        <ActionButton icon={<IconRefresh />} onClick={replay}>
          最初から
        </ActionButton>
        <div className={styles.speeds} role="group" aria-label="再生速度">
          {SPEEDS.map((value) => (
            <button
              key={value}
              type="button"
              className={`${styles.speed} ${speed === value ? styles.speedActive : ""}`}
              aria-pressed={speed === value}
              onClick={() => setSpeed(value)}
            >
              <span className="num">{value}×</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
