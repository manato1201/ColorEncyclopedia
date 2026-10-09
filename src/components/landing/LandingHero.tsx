import Link from "next/link";
import styles from "./LandingHero.module.css";
import { ConcentricCircles } from "@/components/hud/ConcentricCircles";
import { ColorSwatch } from "@/components/hud/ColorSwatch";
import { GlitchText } from "@/components/hud/GlitchText";
import { IconArrowDown } from "@/components/icons/Icons";
import { ThemeSphere } from "@/components/theme/ThemeSphere";

/** ヒーロー球のまわりに散らす見本の位置(球体を囲む緩いリング状)。見本の左端を基準にする。 */
const ORBIT_SLOTS = [
  { top: "6%", left: "4%" },
  { top: "14%", left: "66%" },
  { top: "46%", left: "-4%" },
  { top: "56%", left: "70%" },
  { top: "84%", left: "10%" },
  { top: "90%", left: "56%" },
] as const;

export type LandingStat = {
  label: string;
  value: number;
  unit: string;
  note?: string;
};

type LandingHeroProps = {
  stats: LandingStat[];
  orbitSwatches: { id: string; name: string; hex: string }[];
};

/**
 * トップの入口(IMPROVEMENT_DESIGN_2026-10 §4.1)。見出しの1語だけをアクセント色にし、
 * 主要数値は「数字を大きく、単位を小さく」、最後にスクロール誘導を置く。
 * 数値は呼び出し側が実際のコンテンツ数から生成して渡す(ここに数字を手書きしない)。
 */
export function LandingHero({ stats, orbitSwatches }: LandingHeroProps) {
  return (
    <section className={styles.hero} aria-labelledby="landing-title">
      <ConcentricCircles className={styles.rings} />

      <div className={styles.text}>
        <p className={styles.eyebrow}>COLOR ENCYCLOPEDIA</p>
        <h1 id="landing-title" className={styles.title}>
          <GlitchText text="色を、" />
          <span className={styles.accentWord}>
            <GlitchText text="体系" />
          </span>
          <GlitchText text="で学ぶ。" />
        </h1>
        <p className="subtitle">Learn color as a system.</p>
        <p className={styles.lead}>
          色相・彩度・明度から配色理論、図形の比例と対称性まで。数値で読み、動かして確かめる、色彩検定対策のための図鑑です。
        </p>

        <ul className={styles.stats}>
          {stats.map((stat) => (
            <li key={stat.label} className={styles.stat}>
              <span className={styles.statLabel}>{stat.label}</span>
              <span className={styles.statValue}>
                <span className={`num ${styles.statNumber}`}>{stat.value}</span>
                <span className={styles.statUnit}>{stat.unit}</span>
              </span>
              {stat.note ? <span className={styles.statNote}>{stat.note}</span> : null}
            </li>
          ))}
        </ul>

        <a href="#start" className={styles.cta}>
          学習を始める
          <IconArrowDown />
        </a>
      </div>

      <div className={styles.visual}>
        <ThemeSphere size={440} />
        {orbitSwatches.map((swatch, i) => (
          <Link
            key={swatch.id}
            href={`/colors/${swatch.id}`}
            className={styles.orbit}
            style={{
              top: ORBIT_SLOTS[i % ORBIT_SLOTS.length].top,
              left: ORBIT_SLOTS[i % ORBIT_SLOTS.length].left,
            }}
          >
            <ColorSwatch hex={swatch.hex} size={18} />
            {/* 色だけで伝えない: 見本には必ず名前と値を併記する */}
            <span className={styles.orbitLabel}>
              <span>{swatch.name}</span>
              <span className={`num ${styles.orbitHex}`}>{swatch.hex}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
