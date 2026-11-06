"use client";

import { useMemo, useState } from "react";
import styles from "./Visual3D.module.css";
import { ChoiceRow, Toggle } from "./Controls";
import { Viewport3D } from "./Viewport3D";
import { colorSpaceScene, type ColorMarker } from "./color-scenes";
import { ColorSwatch } from "@/components/hud/ColorSwatch";
import { COLOR_3D_DISCLAIMER } from "@/lib/color-3d";
import { COLOR_SPACES, COLOR_SPACE_LABEL, type ColorSpace } from "@/lib/geometry3d/color-solids";

type Color3DVisualizerProps = {
  /** 色立体の中に点で示す色(名前+HEX)。 */
  markers: ColorMarker[];
  /** 最初に出す空間。 */
  defaultSpace: ColorSpace;
  title?: string;
  note?: string;
  /** 注記(「デモ用の色です」など)。 */
  caption?: string;
};

/**
 * 色立体(RGB立方体・HSV円柱・Lab)の3D表示。色を点で示し、名前とHEXの凡例を併記する。
 * three.js は、「3Dで見る」を押したときに初めて読み込む(ページを重くしない)。
 */
export function Color3DVisualizer({ markers, defaultSpace, title, note, caption }: Color3DVisualizerProps) {
  const [started, setStarted] = useState(false);
  const [space, setSpace] = useState<ColorSpace>(defaultSpace);
  const [cut, setCut] = useState(false);
  // 呼び出し側が毎回新しい配列を渡しても、中身が同じなら3Dを作り直さないよう、値で安定させる
  const markerKey = JSON.stringify(markers);
  const stableMarkers = useMemo(() => JSON.parse(markerKey) as ColorMarker[], [markerKey]);
  const params = useMemo(
    () => ({ space, markers: stableMarkers, cut, labels: stableMarkers.length > 0 && stableMarkers.length <= 4 }),
    [space, stableMarkers, cut],
  );

  return (
    <div className={styles.wrap}>
      {title ? <h3 className={styles.title}>{title}</h3> : null}
      {note ? <p className={styles.note}>{note}</p> : null}
      {!started ? (
        <div className={styles.start}>
          <p className={styles.startText}>
            色立体は3Dで描きます。ボタンを押すと読み込みます(ドラッグで回せます)。
          </p>
          <button type="button" className={styles.choice} onClick={() => setStarted(true)}>
            3Dで見る
          </button>
        </div>
      ) : (
        <Viewport3D scene={colorSpaceScene} params={params} label={`色立体(${COLOR_SPACE_LABEL[space]})の3D表示`} distance={5.4}>
          <div className={styles.controls}>
            <ChoiceRow
              label="空間"
              value={space}
              onChange={setSpace}
              options={COLOR_SPACES.map((s) => ({ value: s, label: COLOR_SPACE_LABEL[s] }))}
            />
            {space === "hsv" ? <Toggle label="扇形を切り取って、同じ色相の面を見る" pressed={cut} onChange={setCut} /> : null}
          </div>
        </Viewport3D>
      )}
      {markers.length > 0 ? (
        <ul className={styles.legend} aria-label="色立体に示している色">
          {markers.map((m) => (
            <li key={`${m.name}-${m.hex}`} className={styles.legendItem}>
              <ColorSwatch hex={m.hex} size={14} />
              <span>{m.name}</span>
              <span className={`num ${styles.legendValue}`}>{m.hex}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {caption ? <p className={styles.note}>{caption}</p> : null}
      <p className={styles.note}>{COLOR_3D_DISCLAIMER}</p>
    </div>
  );
}
