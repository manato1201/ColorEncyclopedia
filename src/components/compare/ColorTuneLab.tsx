"use client";

import { useState } from "react";
import styles from "./ColorTuneLab.module.css";
import { ColorSwatch } from "@/components/hud/ColorSwatch";
import { ActionButton } from "@/components/hud/ActionLink";
import { IconRefresh } from "@/components/icons/Icons";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  contrastRatio,
  deltaE76,
  hexToHsv,
  hexToLab,
  hexToRgb,
  hsvToHex,
  WCAG_AA_NORMAL,
} from "@/lib/color-math";
import { formatHsv, formatLab, formatRgb } from "@/lib/color-format";
import { COLOR_VALUE_TERMS } from "@/lib/color-terms";

type ColorTuneLabProps = {
  name: string;
  hex: string;
};

/**
 * 比較ラボ(T1)。基準の色(A)と、彩度・明度を動かした色(B)を並べ、数値の変化とΔE・コントラスト比を見る。
 * つまみはダブルクリック(またはボタン)で初期値に戻る。色相は動かさない(色相を保ったままトーンを変える見方)。
 * 値は表示色(HEX)から計算し直しているので、ここで見る数値はどれも画面上のsRGB値に対するもの。
 * 親側でkeyに基準色のidを渡し、基準が変わったら初期化する。
 */
export function ColorTuneLab({ name, hex }: ColorTuneLabProps) {
  const base = hexToHsv(hex);
  const [s, setS] = useState(base.s);
  const [v, setV] = useState(base.v);

  const tunedHex = hsvToHex({ h: base.h, s, v });
  const changed = s !== base.s || v !== base.v;
  const delta = deltaE76(hexToLab(hex), hexToLab(tunedHex));
  const ratio = contrastRatio(hex, tunedHex);

  const reset = () => {
    setS(base.s);
    setV(base.v);
  };

  const columns = [
    { key: "A", title: "A 基準", hex },
    { key: "B", title: "B 調整後", hex: tunedHex },
  ];

  return (
    <div className={styles.lab}>
      <p className={styles.lead}>
        「{name}」の彩度・明度を動かして、数値と見え方がどう変わるかを比べます。つまみはダブルクリックで初期値に戻ります。
      </p>

      <div className={styles.sliders}>
        <label className={styles.slider}>
          <span className={styles.sliderLabel}>
            彩度 S <span className={`num ${styles.sliderValue}`}>{String(s).padStart(3, " ")}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={s}
            onChange={(event) => setS(Number(event.target.value))}
            onDoubleClick={() => setS(base.s)}
          />
        </label>
        <label className={styles.slider}>
          <span className={styles.sliderLabel}>
            明度 V <span className={`num ${styles.sliderValue}`}>{String(v).padStart(3, " ")}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={v}
            onChange={(event) => setV(Number(event.target.value))}
            onDoubleClick={() => setV(base.v)}
          />
        </label>
      </div>

      <div className={styles.columns}>
        {columns.map((column) => (
          <div key={column.key} className={styles.column}>
            <div className={styles.columnHead}>
              <ColorSwatch hex={column.hex} size={40} />
              <span className={styles.columnTitle}>{column.title}</span>
            </div>
            <div className={`num ${styles.values}`}>
              <span>{column.hex}</span>
              <span>{formatRgb(hexToRgb(column.hex))}</span>
              <span>{formatHsv(hexToHsv(column.hex))}</span>
              <span>{formatLab(hexToLab(column.hex))}</span>
            </div>
          </div>
        ))}
      </div>

      <p className={styles.result}>
        <Tooltip label={COLOR_VALUE_TERMS["ΔE"]}>ΔE</Tooltip>{" "}
        <span className="num">{delta.toFixed(1)}</span>
        <span className={styles.sep}>/</span>A×Bのコントラスト比{" "}
        <span className="num">{ratio.toFixed(2)} : 1</span>
        <span className={ratio >= WCAG_AA_NORMAL ? styles.pass : styles.fail}>
          {ratio >= WCAG_AA_NORMAL ? "AA適合" : "AA未達"}
        </span>
      </p>

      <div className={styles.actions}>
        <ActionButton icon={<IconRefresh />} onClick={reset} disabled={!changed}>
          初期値に戻す
        </ActionButton>
      </div>
    </div>
  );
}
