"use client";

import { useState, type KeyboardEvent } from "react";
import Link from "next/link";
import styles from "./ColorAtlas.module.css";
import { ActionLink } from "@/components/hud/ActionLink";
import { SwatchStage } from "@/components/hud/SwatchStage";
import { IconArrowRight } from "@/components/icons/Icons";
import { formatHsv, formatLab } from "@/lib/color-format";
import type { Hsv, Lab } from "@/lib/color-math";

export type AtlasPoint = {
  id: string;
  name: string;
  nameEn: string;
  hex: string;
  hsv: Hsv;
  lab: Lab;
};

type View = "wheel" | "unrolled";

const SIZE = 560;
const CENTER = SIZE / 2;
const RADIUS = 240;

/** 色相(0〜360°)を、真上を起点に時計回りの座標へ。彩度が半径になる。 */
function wheelPosition({ h, s }: Hsv) {
  const angle = ((h - 90) * Math.PI) / 180;
  const r = (s / 100) * RADIUS;
  return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
}

const UNROLLED = { left: 56, right: 24, top: 24, bottom: 48 };
const UNROLLED_W = 720;
const UNROLLED_H = 440;

/** 横=色相、縦=明度(上が明るい)。 */
function unrolledPosition({ h, v }: Hsv) {
  const innerW = UNROLLED_W - UNROLLED.left - UNROLLED.right;
  const innerH = UNROLLED_H - UNROLLED.top - UNROLLED.bottom;
  return {
    x: UNROLLED.left + (h / 360) * innerW,
    y: UNROLLED.top + (1 - v / 100) * innerH,
  };
}

/**
 * 色彩Atlas(2D)。全収録色を、同じ数値(HSV・Lab)から2つの見方で並べる。
 * 「色相×彩度(円)」と「色相×明度(展開)」。点を選ぶと下に同じ数値が並ぶ。
 * 3D表示は用意していない(IMPROVEMENT_PLAN C2のフォールバックである2Dを本体にしている)。
 * 点の周りは中立灰のステージにして、テーマ色で見え方が変わらないようにしている。
 */
export function ColorAtlas({ points }: { points: AtlasPoint[] }) {
  const [view, setView] = useState<View>("wheel");
  const [selectedId, setSelectedId] = useState<string>(points[0]?.id ?? "");
  const selected = points.find((p) => p.id === selectedId) ?? null;

  const onKey = (event: KeyboardEvent, id: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedId(id);
    }
  };

  // 選択中の点は最後に描いて、重なりの上に出す
  const ordered = [...points].sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>ATLAS</span>
        <h1 className={styles.title}>色彩Atlas</h1>
        <p className="subtitle">Color Atlas</p>
        <p className={styles.lead}>
          収録した色(<span className="num">{points.length}</span>
          色)を、色相・彩度・明度の位置で一枚に並べます。点を選ぶと、同じ色の数値が下に出ます。
        </p>
      </header>

      <div className={styles.layout}>
        <div className={styles.plotPane}>
          <div className={styles.tabs} role="group" aria-label="表示の切り替え">
            <button
              type="button"
              className={`${styles.tab} ${view === "wheel" ? styles.tabActive : ""}`}
              aria-pressed={view === "wheel"}
              onClick={() => setView("wheel")}
            >
              色相 × 彩度(円)
            </button>
            <button
              type="button"
              className={`${styles.tab} ${view === "unrolled" ? styles.tabActive : ""}`}
              aria-pressed={view === "unrolled"}
              onClick={() => setView("unrolled")}
            >
              色相 × 明度(展開)
            </button>
          </div>

          {view === "wheel" ? (
            <svg
              className={styles.plot}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              role="group"
              aria-label="色相と彩度で並べた色の分布(円)"
            >
              <circle cx={CENTER} cy={CENTER} r={RADIUS + 16} className={styles.stage} />
              {[0.25, 0.5, 0.75, 1].map((ratio) => (
                <circle key={ratio} cx={CENTER} cy={CENTER} r={RADIUS * ratio} className={styles.grid} />
              ))}
              {[0, 90, 180, 270].map((hue) => {
                const p = wheelPosition({ h: hue, s: 100, v: 0 });
                return <line key={hue} x1={CENTER} y1={CENTER} x2={p.x} y2={p.y} className={styles.grid} />;
              })}
              <text x={CENTER} y={CENTER - RADIUS - 22} textAnchor="middle" className={`num ${styles.axisText}`}>
                H 0°
              </text>
              <text x={CENTER + RADIUS + 22} y={CENTER + 4} textAnchor="start" className={`num ${styles.axisText}`}>
                90°
              </text>
              <text x={CENTER} y={CENTER + RADIUS + 34} textAnchor="middle" className={`num ${styles.axisText}`}>
                180°
              </text>
              <text x={CENTER - RADIUS - 22} y={CENTER + 4} textAnchor="end" className={`num ${styles.axisText}`}>
                270°
              </text>
              {ordered.map((p) => {
                const { x, y } = wheelPosition(p.hsv);
                const isSelected = p.id === selectedId;
                return (
                  <circle
                    key={p.id}
                    cx={x}
                    cy={y}
                    r={isSelected ? 11 : 8}
                    fill={p.hex}
                    className={`${styles.dot} ${isSelected ? styles.dotSelected : ""}`}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={`${p.name} ${p.hex}`}
                    onClick={() => setSelectedId(p.id)}
                    onKeyDown={(event) => onKey(event, p.id)}
                  />
                );
              })}
            </svg>
          ) : (
            <svg
              className={styles.plot}
              viewBox={`0 0 ${UNROLLED_W} ${UNROLLED_H}`}
              role="group"
              aria-label="色相と明度で並べた色の分布(展開)"
            >
              <rect x={0} y={0} width={UNROLLED_W} height={UNROLLED_H} className={styles.stage} />
              {[0, 25, 50, 75, 100].map((v) => {
                const y = unrolledPosition({ h: 0, s: 0, v }).y;
                return (
                  <g key={v}>
                    <line x1={UNROLLED.left} x2={UNROLLED_W - UNROLLED.right} y1={y} y2={y} className={styles.grid} />
                    <text x={UNROLLED.left - 8} y={y + 4} textAnchor="end" className={`num ${styles.axisText}`}>
                      V {v}
                    </text>
                  </g>
                );
              })}
              {[0, 60, 120, 180, 240, 300, 360].map((h) => {
                const x = unrolledPosition({ h, s: 0, v: 0 }).x;
                return (
                  <g key={h}>
                    <line x1={x} x2={x} y1={UNROLLED.top} y2={UNROLLED_H - UNROLLED.bottom} className={styles.grid} />
                    <text x={x} y={UNROLLED_H - UNROLLED.bottom + 20} textAnchor="middle" className={`num ${styles.axisText}`}>
                      {h}°
                    </text>
                  </g>
                );
              })}
              {ordered.map((p) => {
                const { x, y } = unrolledPosition(p.hsv);
                const isSelected = p.id === selectedId;
                return (
                  <circle
                    key={p.id}
                    cx={x}
                    cy={y}
                    r={isSelected ? 11 : 8}
                    fill={p.hex}
                    className={`${styles.dot} ${isSelected ? styles.dotSelected : ""}`}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={`${p.name} ${p.hex}`}
                    onClick={() => setSelectedId(p.id)}
                    onKeyDown={(event) => onKey(event, p.id)}
                  />
                );
              })}
            </svg>
          )}

          <p className={styles.note}>
            画面上の色は環境により異なります。位置はHSVの値(色相=角度、彩度=中心からの距離、明度=縦位置)で決めており、
            見た目の色ではなく数値が基準です。
          </p>
        </div>

        <aside className={styles.detail} aria-live="polite">
          {selected ? (
            <>
              <SwatchStage hex={selected.hex} size={160} />
              <h2 className={styles.name}>{selected.name}</h2>
              <p className="subtitle">{selected.nameEn}</p>
              <dl className={styles.values}>
                <div>
                  <dt>HEX</dt>
                  <dd className="num">{selected.hex}</dd>
                </div>
                <div>
                  <dt>HSV</dt>
                  <dd className="num">{formatHsv(selected.hsv)}</dd>
                </div>
                <div>
                  <dt>Lab</dt>
                  <dd className="num">{formatLab(selected.lab)}</dd>
                </div>
              </dl>
              <div className={styles.actions}>
                <ActionLink href={`/colors/${selected.id}`} icon={<IconArrowRight />}>
                  詳細を見る
                </ActionLink>
                <ActionLink href={`/compare?ids=${selected.id}`} icon={<IconArrowRight />}>
                  比較に追加
                </ActionLink>
              </div>
            </>
          ) : (
            <p className={styles.note}>
              点を選ぶと、ここに数値が出ます。 <Link href="/colors">色図鑑</Link>から探すこともできます。
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
