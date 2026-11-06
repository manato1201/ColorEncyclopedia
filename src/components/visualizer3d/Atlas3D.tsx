"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./Visual3D.module.css";
import { ChoiceRow } from "./Controls";
import { Viewport3D } from "./Viewport3D";
import { atlasScene } from "./color-scenes";
import { COLOR_3D_DISCLAIMER } from "@/lib/color-3d";
import { COLOR_SPACES, COLOR_SPACE_LABEL, type ColorSpace } from "@/lib/geometry3d/color-solids";

type Atlas3DProps = {
  points: { id: string; name: string; hex: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/** 色彩Atlasの「立体」表示。全収録色を、色立体(HSV円柱・Lab・RGB立方体)の中に点で並べる。 */
export function Atlas3D({ points, selectedId, onSelect }: Atlas3DProps) {
  const [space, setSpace] = useState<ColorSpace>("hsv");
  const markers = useMemo(() => points.map((p) => ({ name: p.name, hex: p.hex })), [points]);
  const selected = points.findIndex((p) => p.id === selectedId);

  // 親の onSelect の identity が変わっても、3Dを作り直さない
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });
  const onPick = useCallback((i: number) => onSelectRef.current(points[i].id), [points]);

  const params = useMemo(() => ({ space, markers, selected, onPick }), [space, markers, selected, onPick]);

  return (
    <div className={styles.wrap}>
      <Viewport3D scene={atlasScene} params={params} label="収録した色を色立体に並べた3D表示" distance={5.4} autoRotate={false}>
        <div className={styles.controls}>
          <ChoiceRow label="空間" value={space} onChange={setSpace} options={COLOR_SPACES.map((s) => ({ value: s, label: COLOR_SPACE_LABEL[s] }))} />
        </div>
      </Viewport3D>
      <p className={styles.note}>点をクリックすると選べます(ドラッグは回転)。{COLOR_3D_DISCLAIMER}</p>
    </div>
  );
}
