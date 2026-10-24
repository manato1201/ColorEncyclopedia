import styles from "./HarmonySets.module.css";
import { ColorSwatch } from "@/components/hud/ColorSwatch";
import { hexToHsv, hsvToHex } from "@/lib/color-math";

type Harmony = { key: string; name: string; rule: string; offsets: number[] };

/** 基準の色相(HSV)からの回転角で、各調和の色相を決める。 */
const HARMONIES: Harmony[] = [
  { key: "analogous", name: "類似色", rule: "基準の両隣 ±30°", offsets: [-30, 0, 30] },
  { key: "complementary", name: "補色", rule: "正反対 +180°", offsets: [0, 180] },
  { key: "split", name: "分裂補色", rule: "補色の両隣 +150° / +210°", offsets: [0, 150, 210] },
  { key: "triadic", name: "三色(トライアド)", rule: "120°ずつ", offsets: [0, 120, 240] },
  { key: "equal5", name: "等間隔(5分割)", rule: "72°ずつ", offsets: [0, 72, 144, 216, 288] },
  { key: "golden", name: "黄金角", rule: "137.5°ずつ回す(5色)", offsets: [0, 137.5, 275, 412.5, 550] },
];

const wrap = (h: number) => ((h % 360) + 360) % 360;

/**
 * 基準の色から、調和の選び方(色相の取り方)ごとの色を並べる(IMPROVEMENT_DESIGN Y5の追加候補)。
 * 色相はHSVの色相を回して決め、彩度S・明度Vは基準と同じに保つ。
 * HSVの色相を回すだけなので、見た目の明るさ(L*)は色相ごとに少しずつ違う(上のC*の表も参照)。
 * 各色には、基準からの角度とHEXを併記する。
 */
export function HarmonySets({ name, hex }: { name: string; hex: string }) {
  const base = hexToHsv(hex);

  return (
    <div className={styles.sets}>
      <p className={styles.lead}>
        「{name}」(色相 <span className="num">{base.h}°</span>、S <span className="num">{base.s}%</span>、V{" "}
        <span className="num">{base.v}%</span>)を基準に、色相の取り方だけを変えて並べます。
      </p>
      <ul className={styles.list}>
        {HARMONIES.map((harmony) => (
          <li key={harmony.key} className={styles.row}>
            <div className={styles.head}>
              <span className={styles.name}>{harmony.name}</span>
              <span className={styles.rule}>{harmony.rule}</span>
            </div>
            <ul className={styles.swatches}>
              {harmony.offsets.map((offset) => {
                const color = hsvToHex({ h: wrap(base.h + offset), s: base.s, v: base.v });
                return (
                  <li key={offset} className={styles.swatch}>
                    <ColorSwatch hex={color} size={24} />
                    <span className={`num ${styles.hex}`}>{color}</span>
                    <span className={`num ${styles.offset}`}>
                      {offset === 0 ? "基準" : `${offset > 0 ? "+" : ""}${offset}°`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
