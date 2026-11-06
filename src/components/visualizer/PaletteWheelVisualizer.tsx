import styles from "./PaletteWheelVisualizer.module.css";
import { deriveColorValues } from "@/lib/color-values";
import { formatHsv } from "@/lib/color-format";

export type PaletteVisualItem = { name: string; hex: string };

const C = 50;
const R = 40;

/** 色相(真上=0°・時計回り)と彩度(中心からの距離)の円の上の位置。 */
function position(h: number, s: number): [number, number] {
  const rad = (h * Math.PI) / 180;
  const r = (s / 100) * R;
  return [C + r * Math.sin(rad), C - r * Math.cos(rad)];
}

/**
 * パレットの色を、色相(角度)・彩度(中心からの距離)の円の上に並べ、明度を棒で見せる。
 * 複数色で見せる用語(グレーディング・光の用語、季節の配色)の可視化。数値はHEXからの単一の変換で出す。
 * 円の地は中立灰で、テーマ色で変えない。
 */
export function PaletteWheelVisualizer({
  items,
}: {
  items: PaletteVisualItem[];
}) {
  const values = items.map((item) => ({
    ...item,
    ...deriveColorValues(item.hex),
  }));
  const meanS = Math.round(
    values.reduce((a, v) => a + v.hsv.s, 0) / values.length,
  );
  const meanV = Math.round(
    values.reduce((a, v) => a + v.hsv.v, 0) / values.length,
  );

  return (
    <div className={styles.visualizer}>
      <svg
        viewBox="0 0 100 100"
        className={styles.canvas}
        role="img"
        aria-label="パレットの色を色相と彩度で並べた円"
      >
        <circle cx={C} cy={C} r={R + 6} className={styles.stage} />
        {[0.5, 1].map((ratio) => (
          <circle
            key={ratio}
            cx={C}
            cy={C}
            r={R * ratio}
            className={styles.grid}
          />
        ))}
        {[0, 90, 180, 270].map((h) => {
          const [x, y] = position(h, 100);
          return (
            <line key={h} x1={C} y1={C} x2={x} y2={y} className={styles.grid} />
          );
        })}
        <text x={C} y={5} textAnchor="middle" className={`num ${styles.axis}`}>
          H 0°
        </text>
        <text
          x={97}
          y={C + 1.5}
          textAnchor="end"
          className={`num ${styles.axis}`}
        >
          90°
        </text>
        <text x={C} y={98} textAnchor="middle" className={`num ${styles.axis}`}>
          180°
        </text>
        <text
          x={3}
          y={C + 1.5}
          textAnchor="start"
          className={`num ${styles.axis}`}
        >
          270°
        </text>
        {values.map((v, index) => {
          const [x, y] = position(v.hsv.h, v.hsv.s);
          return (
            <g key={`${v.name}-${v.hex}`}>
              <circle
                cx={x}
                cy={y}
                r={4.4}
                fill={v.hex}
                className={styles.dot}
              />
              <text
                x={x}
                y={y + 1.2}
                textAnchor="middle"
                className={styles.dotLabel}
              >
                {index + 1}
              </text>
            </g>
          );
        })}
      </svg>

      <ol className={styles.list}>
        {values.map((v, index) => (
          <li key={`${v.name}-${v.hex}`} className={styles.item}>
            <span className={`num ${styles.index}`}>{index + 1}</span>
            <span className={styles.name}>{v.name}</span>
            <span className={`num ${styles.hex}`}>{v.hex}</span>
            <span className={`num ${styles.hsv}`}>{formatHsv(v.hsv)}</span>
            <span className={styles.bar} aria-hidden="true">
              <span
                className={styles.barFill}
                style={{ width: `${v.hsv.v}%` }}
              />
            </span>
          </li>
        ))}
      </ol>

      <p className={styles.summary}>
        彩度の平均 <span className="num">{meanS}%</span>、明度の平均{" "}
        <span className="num">{meanV}%</span>
        (HSV。棒は明度V)。円の中心に近いほど低彩度で、外側ほど鮮やかな色。
      </p>
    </div>
  );
}
