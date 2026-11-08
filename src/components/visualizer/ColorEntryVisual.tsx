import styles from "./ColorEntryVisual.module.css";
import { ColorEffectVisualizer } from "./ColorEffectVisualizer";
import { ColorVisualizer } from "./ColorVisualizer";
import { ContrastVisualizer } from "./ContrastVisualizer";
import { MixingVisualizer } from "./MixingVisualizer";
import { PaletteWheelVisualizer } from "./PaletteWheelVisualizer";
import { SeasonTreeVisualizer } from "./SeasonTreeVisualizer";
import { COLOR_EFFECT_SCENES } from "@/lib/color-effect-scenes";
import {
  COLOR_CONTRAST_DEMOS,
  COLOR_DEMO_HEX,
  COLOR_HARMONY_TYPE,
  COLOR_HUE_DIFFERENCE,
  COLOR_MIXING_MODES,
  COLOR_VISION_IDS,
  COLOR_PALETTE_VISUALIZERS,
  HUE_WHEEL_VISUALIZERS,
  SEASON_PALETTE_IDS,
} from "@/lib/color-visualizers";
import { colorLoader } from "@/lib/content/colors";
import { Color3DVisualizer } from "@/components/visualizer3d/Color3DVisualizer";
import { getColor3D, harmonyOffsets } from "@/lib/color-3d";
import { hexToHsv, hsvToHex } from "@/lib/color-math";
import { HueDifferenceVisualizer } from "./HueDifferenceVisualizer";
import { ColorVisionVisualizer } from "./ColorVisionVisualizer";

type ColorEntryVisualProps = {
  id: string;
  /** 色の名前(色立体の点の名前に使う)。 */
  name?: string;
  /** colorValue を持つ色のHEX。 */
  hex?: string;
  /** 複数色で見せる用語のパレット。 */
  palette?: { name: string; hex: string }[];
};

/**
 * 色の詳細ページの「可視化」。エントリの種類に応じて、対応する可視化を1つ以上出す。
 * - 見え方の場面(対比・残像など)/ 混色 / 季節の木+パレット / パレットの分布 / デモ用の色の色相環・配色 / colorValue の色相環・配色
 * どれにも当てはまらないときは、対応していない旨を出す。
 */
export function ColorEntryVisual({ id, name, hex, palette }: ColorEntryVisualProps) {
  const blocks: { key: string; title: string; node: React.ReactNode }[] = [];

  if (id in COLOR_EFFECT_SCENES) {
    blocks.push({ key: "effect", title: "見え方を確かめる", node: <ColorEffectVisualizer id={id} /> });
  }
  if (id in COLOR_CONTRAST_DEMOS) {
    const demo = COLOR_CONTRAST_DEMOS[id];
    blocks.push({
      key: "contrast",
      title: "コントラスト比を確かめる",
      node: <ContrastVisualizer initialForeground={demo.fg} initialBackground={demo.bg} />,
    });
  }
  if (id in COLOR_MIXING_MODES) {
    blocks.push({ key: "mixing", title: "混色の重なり", node: <MixingVisualizer mode={COLOR_MIXING_MODES[id]} /> });
  }
  if ((SEASON_PALETTE_IDS as readonly string[]).includes(id)) {
    const seasons = SEASON_PALETTE_IDS.flatMap((seasonId) => {
      const meta = colorLoader.getAllMeta().find((m) => m.id === seasonId);
      return meta?.palette ? [{ id: seasonId, name: meta.name, palette: meta.palette }] : [];
    });
    blocks.push({ key: "season", title: "同じ構図の木で、季節を並べる", node: <SeasonTreeVisualizer seasons={seasons} currentId={id} /> });
  }
  if (palette && id in COLOR_PALETTE_VISUALIZERS) {
    blocks.push({ key: "palette", title: "パレットを色相・彩度・明度で並べる", node: <PaletteWheelVisualizer items={palette} /> });
  }
  if (id in COLOR_VISION_IDS) {
    blocks.push({ key: "vision", title: "色覚の特性ごとの見え方(近似)", node: <ColorVisionVisualizer /> });
  }
  if (id in COLOR_HUE_DIFFERENCE) {
    blocks.push({
      key: "huediff",
      title: "色相差を動かして、分類を確かめる(デモ用の色)",
      node: <HueDifferenceVisualizer hex={COLOR_DEMO_HEX[id]} initialStep={COLOR_HUE_DIFFERENCE[id]} />,
    });
  } else if (hex && id in HUE_WHEEL_VISUALIZERS) {
    blocks.push({ key: "wheel", title: "色相環・配色理論", node: <ColorVisualizer hex={hex} /> });
  } else if (id in COLOR_DEMO_HEX) {
    blocks.push({
      key: "demo",
      title: "色相環・配色理論(デモ用の色)",
      node: (
        <div className={styles.demo}>
          <p className={styles.demoNote}>
            デモ用の色 <span className="num">{COLOR_DEMO_HEX[id]}</span> で見せています(この項目自体の色ではありません)。
          </p>
          <ColorVisualizer hex={COLOR_DEMO_HEX[id]} harmony={COLOR_HARMONY_TYPE[id]} />
        </div>
      ),
    });
  }

  // 色立体(3D): 色の位置・パレットの散らばり・概念に合う空間
  const solid = getColor3D(id);
  if (solid) {
    const markers =
      solid.markers === "hex" && hex
        ? [{ name: name ?? id, hex }]
        : solid.markers === "palette" && palette
          ? palette
            : solid.markers === "harmony" && id in COLOR_DEMO_HEX
              ? (harmonyOffsets(id) ?? [0]).map((off, i) => ({
                  name: i === 0 || off === 0 ? "基準色" : `色相 +${((off % 360) + 360) % 360}°`,
                  hex: hsvToHex({ ...hexToHsv(COLOR_DEMO_HEX[id]), h: (hexToHsv(COLOR_DEMO_HEX[id]).h + off + 360) % 360 }),
                }))
            : solid.markers === "demo" && id in COLOR_DEMO_HEX
            ? [{ name: "デモ用の色", hex: COLOR_DEMO_HEX[id] }]
            : [];
    blocks.push({
      key: "space3d",
      title: "立体(3D)で見る",
      node: (
        <Color3DVisualizer
          markers={markers}
          defaultSpace={solid.space}
          title={solid.title}
          note={solid.note}
          caption={(solid.markers === "demo" || solid.markers === "harmony") && markers.length > 0 ? "デモ用の色で示しています(この項目自体の色ではありません)。" : undefined}
        />
      ),
    });
  }

  if (blocks.length === 0) {
    return <div className={styles.placeholder}>このエントリは、まだ可視化に対応していません。</div>;
  }

  return (
    <div className={styles.stack}>
      {blocks.map((block) => (
        <section key={block.key}>
          {blocks.length > 1 ? <h3 className={styles.label}>{block.title}</h3> : null}
          {block.node}
        </section>
      ))}
    </div>
  );
}
