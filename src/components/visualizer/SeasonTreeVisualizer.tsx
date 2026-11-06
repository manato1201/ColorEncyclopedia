"use client";

import styles from "./SeasonTreeVisualizer.module.css";
import { PlaybackControls } from "./PlaybackControls";
import { useStepPlayer } from "./useStepPlayer";
import { deriveColorValues } from "@/lib/color-values";

export type SeasonPalette = {
  id: string;
  name: string;
  palette: { name: string; hex: string }[];
};

/** 木の絵の構成(円の位置・大きさ・使うパレットの番号)。季節が変わっても構図は同じ。 */
const CANOPY: { cx: number; cy: number; r: number; slot: 0 | 1 }[] = [
  { cx: 50, cy: 25, r: 15, slot: 0 },
  { cx: 38, cy: 31, r: 11, slot: 1 },
  { cx: 62, cy: 31, r: 11, slot: 1 },
  { cx: 44, cy: 17, r: 9, slot: 0 },
  { cx: 58, cy: 16, r: 9, slot: 1 },
];
const ACCENTS: [number, number][] = [
  [42, 22],
  [55, 14],
  [60, 28],
  [35, 34],
  [66, 34],
  [48, 32],
  [51, 21],
  [57, 36],
  [41, 13],
];

const average = (
  palette: { hex: string }[],
  pick: (v: ReturnType<typeof deriveColorValues>) => number,
) =>
  Math.round(
    palette.reduce((a, p) => a + pick(deriveColorValues(p.hex)), 0) /
      palette.length,
  );

/**
 * 季節の配色(IMPROVEMENT_DESIGN Z21「季節のパレット」)。同じ構図の木に、季節ごとのパレットを当てはめて並べる。
 * パレットは 葉(主)・葉(副)・差し色・幹と地面・空 の順。色が変わる間は、色が移り変わる(動きを減らす設定では切り替わるだけ)。
 * 下に、各季節の彩度・明度の平均を数値で並べる(HEXからの単一の変換で計算)。
 */
export function SeasonTreeVisualizer({
  seasons,
  currentId,
}: {
  seasons: SeasonPalette[];
  currentId: string;
}) {
  const start = Math.max(
    0,
    seasons.findIndex((s) => s.id === currentId),
  );
  const {
    stepIndex,
    isFinished,
    showPause,
    handlePlayPause,
    handleStep,
    reset,
  } = useStepPlayer(seasons.length, start);
  const season = seasons[stepIndex];
  const [leafA, leafB, accent, ground, sky] = season.palette.map((p) => p.hex);

  return (
    <div className={styles.visualizer}>
      <svg
        viewBox="0 0 100 70"
        className={styles.canvas}
        role="img"
        aria-label={`${season.name}の木`}
      >
        <rect
          x="0"
          y="0"
          width="100"
          height="70"
          className={styles.fill}
          style={{ fill: sky }}
        />
        <rect
          x="0"
          y="58"
          width="100"
          height="12"
          className={styles.fill}
          style={{ fill: ground, fillOpacity: 0.55 }}
        />
        <rect
          x="47"
          y="34"
          width="6"
          height="26"
          className={styles.fill}
          style={{ fill: ground }}
        />
        {CANOPY.map((c, i) => (
          <circle
            key={i}
            cx={c.cx}
            cy={c.cy}
            r={c.r}
            className={styles.fill}
            style={{ fill: c.slot === 0 ? leafA : leafB }}
          />
        ))}
        {ACCENTS.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={1.6}
            className={styles.fill}
            style={{ fill: accent }}
          />
        ))}
      </svg>

      <div className={styles.head}>
        <h3 className={styles.seasonName}>{season.name}</h3>
        <ul className={styles.palette}>
          {season.palette.map((p) => (
            <li key={p.name} className={styles.paletteItem}>
              <span
                className={styles.chip}
                style={{ backgroundColor: p.hex }}
                aria-hidden="true"
              />
              <span>{p.name}</span>
              <span className={`num ${styles.hex}`}>{p.hex}</span>
            </li>
          ))}
        </ul>
      </div>

      <PlaybackControls
        stepIndex={stepIndex}
        frameCount={seasons.length}
        showPause={showPause}
        isFinished={isFinished}
        onPlayPause={handlePlayPause}
        onStep={handleStep}
        onReset={reset}
        resetLabel="春から"
      />

      <table className={styles.table}>
        <caption className={styles.caption}>
          季節ごとの、パレット5色のHSV平均(彩度S・明度V)
        </caption>
        <thead>
          <tr>
            <th scope="col">季節</th>
            <th scope="col">彩度の平均</th>
            <th scope="col">明度の平均</th>
          </tr>
        </thead>
        <tbody>
          {seasons.map((s, i) => (
            <tr
              key={s.id}
              className={i === stepIndex ? styles.current : undefined}
            >
              <th scope="row">{s.name}</th>
              <td className="num">{average(s.palette, (v) => v.hsv.s)}%</td>
              <td className="num">{average(s.palette, (v) => v.hsv.v)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.note}>
        同じ構図の木で、色だけを入れ替えています。この数値は、この図のパレットから計算したもので、実際の季節の色の平均ではありません。
      </p>
    </div>
  );
}
