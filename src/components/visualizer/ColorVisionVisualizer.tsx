"use client";

import { useState } from "react";
import { ColorSwatch } from "@/components/hud/ColorSwatch";
import { contrastRatio, hexToRgb, rgbToHex } from "@/lib/color-math";

type Kind = "normal" | "protan" | "deutan" | "tritan";

/** Machadoらの近似行列(重度 1.0。線形RGBに適用)。おおまかな目安で、実際の見え方は個人差が大きい。 */
const MATRIX: Record<Exclude<Kind, "normal">, number[][]> = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
const LABEL: Record<Kind, string> = { normal: "一般型(3色型)", protan: "1型(P型)", deutan: "2型(D型)", tritan: "3型(T型)" };

const toLinear = (c: number) => (c / 255 <= 0.04045 ? c / 255 / 12.92 : Math.pow((c / 255 + 0.055) / 1.055, 2.4));
const toSrgb = (l: number) => 255 * (l <= 0.0031308 ? 12.92 * l : 1.055 * Math.pow(l, 1 / 2.4) - 0.055);

export function simulate(hex: string, kind: Kind): string {
  if (kind === "normal") return hex.toUpperCase();
  const { r, g, b } = hexToRgb(hex);
  const lin = [toLinear(r), toLinear(g), toLinear(b)];
  const m = MATRIX[kind];
  const out = m.map((row) => Math.min(1, Math.max(0, row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2])));
  return rgbToHex({ r: toSrgb(out[0]), g: toSrgb(out[1]), b: toSrgb(out[2]) });
}

const SAMPLES = [
  { name: "赤", hex: "#D62A1F" },
  { name: "橙", hex: "#EB6238" },
  { name: "黄", hex: "#F2C230" },
  { name: "緑", hex: "#2E8B57" },
  { name: "青緑", hex: "#2BA6A0" },
  { name: "青", hex: "#2B5FAE" },
  { name: "紫", hex: "#7A4FA0" },
  { name: "ピンク", hex: "#E88BA8" },
];
const PAIRS = [
  { a: "赤", b: "緑", ha: "#D62A1F", hb: "#2E8B57" },
  { a: "緑", b: "茶", ha: "#2E8B57", hb: "#8B5A2B" },
  { a: "青", b: "紫", ha: "#2B5FAE", hb: "#7A4FA0" },
];

/** 色覚の特性ごとの見え方の近似シミュレーション。色の区別がつきにくい組と、明暗の差(コントラスト比)を並べる。 */
export function ColorVisionVisualizer() {
  const [kind, setKind] = useState<Kind>("deutan");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div role="group" aria-label="見え方の種類" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
        {(Object.keys(LABEL) as Kind[]).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
            style={{
              border: "1px solid var(--color-line)",
              borderRadius: "var(--radius-interactive)",
              padding: "var(--space-1) var(--space-3)",
              background: kind === k ? "var(--accent-current)" : "transparent",
              color: kind === k ? "var(--on-accent)" : "var(--color-ink-muted)",
              cursor: "pointer",
              fontSize: "var(--text-caption)",
            }}
          >
            {LABEL[k]}
          </button>
        ))}
      </div>
      <div style={{ background: "var(--swatch-stage)", padding: "var(--space-4)", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(5.5rem, 1fr))", gap: "var(--space-3)" }}>
        {SAMPLES.map((s) => {
          const sim = simulate(s.hex, kind);
          return (
            <div key={s.name} style={{ display: "flex", flexDirection: "column", gap: 4, color: "var(--swatch-ink)", fontSize: "var(--text-caption)" }}>
              <div style={{ display: "flex", gap: 4 }}>
                <ColorSwatch hex={s.hex} size={28} />
                <ColorSwatch hex={sim} size={28} />
              </div>
              <span>{s.name}</span>
              <span className="num">{sim}</span>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: "var(--text-caption)", color: "var(--color-ink-muted)" }}>左が元の色、右が「{LABEL[kind]}」の見え方の近似。</p>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {PAIRS.map((p) => (
          <li key={p.a + p.b} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--space-3)", fontSize: "var(--text-body-sm)" }}>
            <ColorSwatch hex={simulate(p.ha, kind)} size={16} />
            <span>{p.a}</span>
            <span>×</span>
            <ColorSwatch hex={simulate(p.hb, kind)} size={16} />
            <span>{p.b}</span>
            <span className="num" style={{ marginLeft: "auto" }}>
              コントラスト比 {contrastRatio(simulate(p.ha, kind), simulate(p.hb, kind)).toFixed(2)} : 1
            </span>
          </li>
        ))}
      </ul>
      <p style={{ fontSize: "var(--text-caption)", color: "var(--color-ink-muted)", lineHeight: 1.7 }}>
        一般に使われる近似の変換(Machadoらの行列)による目安です。実際の見え方は、特性の程度・個人・環境で大きく違います。色の差が小さくなる組は、形・模様・文字でも区別できるようにします。
      </p>
    </div>
  );
}
