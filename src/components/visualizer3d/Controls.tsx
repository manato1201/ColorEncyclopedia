"use client";

import type { ReactNode } from "react";
import styles from "./Visual3D.module.css";

/** 3D表示の操作部品(選択肢・スライダー・読み取り欄)。 */

type ChoiceRowProps<T extends string | number> = {
  label: string;
  options: { value: T; label: string; title?: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function ChoiceRow<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: ChoiceRowProps<T>) {
  return (
    <div className={styles.row} role="group" aria-label={label}>
      <span className={styles.rowLabel}>{label}</span>
      <div className={styles.choices}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            className={styles.choice}
            aria-pressed={o.value === value}
            title={o.title}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

type RangeRowProps = {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  /** 値の表示(単位つき)。 */
  format?: (value: number) => string;
};

export function RangeRow({
  label,
  min,
  max,
  step,
  value,
  onChange,
  format,
}: RangeRowProps) {
  return (
    <label className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <input
        className={styles.range}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className={`num ${styles.rangeValue}`}>
        {format ? format(value) : value}
      </span>
    </label>
  );
}

export function Readout({ children }: { children: ReactNode }) {
  return (
    <p className={styles.readout} role="status">
      {children}
    </p>
  );
}

export function Toggle({
  label,
  pressed,
  onChange,
}: {
  label: string;
  pressed: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <div className={styles.row}>
      <button
        type="button"
        className={styles.choice}
        aria-pressed={pressed}
        onClick={() => onChange(!pressed)}
      >
        {label}
      </button>
    </div>
  );
}
