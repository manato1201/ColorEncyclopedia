import { deltaE76 } from "@/lib/color-math";
import type { ColorMeta } from "@/lib/content/colors";

export const RELATED_COUNT = 6;

/**
 * 基準の色に近い色(Labの距離ΔE76が小さい順)を返す。
 * 数値(colorValue)を持たない概念エントリは対象外。基準自身も含めない。
 */
export function findRelatedColors(
  baseId: string,
  all: ColorMeta[],
  count = RELATED_COUNT,
) {
  const base = all.find((color) => color.id === baseId);
  if (!base?.colorValue) return [];
  const baseLab = base.colorValue.lab;
  return all
    .flatMap((color) =>
      color.id !== baseId && color.colorValue
        ? [
            {
              id: color.id,
              name: color.name,
              nameEn: color.nameEn,
              hex: color.colorValue.hex,
              deltaE: deltaE76(baseLab, color.colorValue.lab),
            },
          ]
        : [],
    )
    .sort((a, b) => a.deltaE - b.deltaE)
    .slice(0, count);
}
