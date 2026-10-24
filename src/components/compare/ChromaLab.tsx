"use client";

import { useMemo, useState } from "react";
import styles from "./ChromaLab.module.css";
import { Tooltip } from "@/components/ui/Tooltip";
import { lchToHex, maxChromaInGamut } from "@/lib/color-math";

/** LCh上の色相(度)。30°刻みで12色相を並べる。 */
const HUES = Array.from({ length: 12 }, (_, i) => i * 30);
const MAX_CHROMA_SCALE = 130;

const TERMS = {
  chroma:
    "C*(クロマ)。Lab上で、無彩色の軸からの距離√(a*²+b*²)。彩度に相当する値で、HSVのSとは別の尺度。",
  gamut: "sRGBで表示できる色の範囲。同じ明度・色相でも、表示できる最大のC*は色相ごとに違う。",
} as const;

/**
 * 「同じ彩度でも、色相によって出せる鮮やかさは違う」を数値で見る学習項目(IMPROVEMENT_DESIGN Y5)。
 * 明度L*を固定し、12色相それぞれについて sRGB に収まる最大の彩度 C*max を計算する(棒の高さ)。
 * A行: 全色相に同じ絶対C*を与える(収まらない色相は最大値に抑えられ、×で示す)。
 * B行: 各色相の C*max の同じ「割合」で揃える(どの色相でも収まる)。
 * 計算は color-math.ts の LCh→sRGB の逆変換と二分探索(lchToHex / maxChromaInGamut)だけを使う。
 */
export function ChromaLab() {
  const [lightness, setLightness] = useState(60);
  const [absolute, setAbsolute] = useState(50);
  const [ratio, setRatio] = useState(70);

  const columns = useMemo(
    () =>
      HUES.map((h) => {
        const max = maxChromaInGamut(lightness, h);
        const a = lchToHex({ l: lightness, c: absolute, h });
        const b = lchToHex({ l: lightness, c: (max * ratio) / 100, h });
        return { h, max, a, b };
      }),
    [lightness, absolute, ratio],
  );

  const maxima = columns.map((column) => column.max);
  const lowest = Math.min(...maxima);
  const highest = Math.max(...maxima);

  return (
    <div className={styles.lab}>
      <p className={styles.lead}>
        明度 L* を固定して、12の色相で比べます。同じ明度でも、<Tooltip label={TERMS.gamut}>sRGBで出せる</Tooltip>
        最大の <Tooltip label={TERMS.chroma}>C*</Tooltip> は色相ごとに違い、この明度では{" "}
        <span className="num">{lowest.toFixed(0)}</span> から <span className="num">{highest.toFixed(0)}</span> まで開きます。
      </p>

      <div className={styles.sliders}>
        <label className={styles.slider}>
          <span className={styles.sliderLabel}>
            明度 L* <span className={`num ${styles.sliderValue}`}>{lightness}</span>
          </span>
          <input
            type="range"
            min={15}
            max={90}
            value={lightness}
            onChange={(event) => setLightness(Number(event.target.value))}
            onDoubleClick={() => setLightness(60)}
          />
        </label>
        <label className={styles.slider}>
          <span className={styles.sliderLabel}>
            A: 同じ絶対C* <span className={`num ${styles.sliderValue}`}>{absolute}</span>
          </span>
          <input
            type="range"
            min={0}
            max={110}
            value={absolute}
            onChange={(event) => setAbsolute(Number(event.target.value))}
            onDoubleClick={() => setAbsolute(50)}
          />
        </label>
        <label className={styles.slider}>
          <span className={styles.sliderLabel}>
            B: 最大の割合 <span className={`num ${styles.sliderValue}`}>{ratio}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={ratio}
            onChange={(event) => setRatio(Number(event.target.value))}
            onDoubleClick={() => setRatio(70)}
          />
        </label>
      </div>
      <p className={styles.hint}>つまみはダブルクリックで初期値(L*=60 / C*=50 / 70%)に戻ります。</p>

      <div className={styles.scroller}>
        <table className={styles.table}>
          <caption className={styles.caption}>
            色相ごとの出せる最大C*(棒)と、A・Bそれぞれの色。×は、指定のC*がsRGBに収まらず、最大値に抑えた色。
          </caption>
          <thead>
            <tr>
              <th scope="row">色相 h</th>
              {columns.map((column) => (
                <th key={column.h} scope="col" className="num">
                  {column.h}°
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">最大C*</th>
              {columns.map((column) => (
                <td key={column.h} className={styles.barCell}>
                  <span className={styles.barTrack}>
                    <span
                      className={styles.bar}
                      style={{ height: `${Math.min(100, (column.max / MAX_CHROMA_SCALE) * 100)}%` }}
                    />
                  </span>
                  <span className="num">{column.max.toFixed(0)}</span>
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">A: 同じC*={absolute}</th>
              {columns.map((column) => (
                <td key={column.h} className={styles.swatchCell}>
                  <span
                    className={styles.swatch}
                    style={{ backgroundColor: column.a.hex }}
                    aria-hidden="true"
                  />
                  <span className={`num ${styles.hex}`}>{column.a.hex}</span>
                  {column.a.clipped ? (
                    <span className={styles.clipped} title="指定のC*がsRGBに収まらないため、最大値に抑えています">
                      ×
                    </span>
                  ) : null}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">B: 最大の{ratio}%</th>
              {columns.map((column) => (
                <td key={column.h} className={styles.swatchCell}>
                  <span
                    className={styles.swatch}
                    style={{ backgroundColor: column.b.hex }}
                    aria-hidden="true"
                  />
                  <span className={`num ${styles.hex}`}>{column.b.hex}</span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className={styles.claim}>
        この表の数値は、すべて Lab → sRGB の同じ変換から計算しています(収まらないときは、同じ明度・色相で収まる最大のC*に抑えます)。
      </p>
    </div>
  );
}
