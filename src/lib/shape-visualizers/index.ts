import { BASE_SHAPE_VISUALIZERS, type ShapeFrame } from "./base.ts";
import { CONSTRUCTION_VISUALIZERS } from "./constructions.ts";
import { CURVE_VISUALIZERS } from "./curves.ts";
import { EXTRA_VISUALIZERS } from "./extra.ts";
import { FRACTAL_VISUALIZERS } from "./fractal.ts";
import { PROPORTION_VISUALIZERS } from "./proportion.ts";
import { SOLID_VISUALIZERS } from "./solids.ts";
import { SYMMETRY_VISUALIZERS } from "./symmetry.ts";
import { TILING_VISUALIZERS } from "./tiling.ts";

export type { ShapeElement, ShapeElementState, ShapeFrame } from "./base.ts";

/**
 * 図形の作図手順可視化のレジストリ(id → フレーム生成関数)。カテゴリごとのファイルを結合する。
 * has-shape-visualizer.ts と ShapeConstructionVisualizer が参照する。frontmatterには書かない。
 */
export const SHAPE_VISUALIZERS: Record<string, () => ShapeFrame[]> = {
  ...BASE_SHAPE_VISUALIZERS,
  ...PROPORTION_VISUALIZERS,
  ...SYMMETRY_VISUALIZERS,
  ...TILING_VISUALIZERS,
  ...FRACTAL_VISUALIZERS,
  ...CURVE_VISUALIZERS,
  ...CONSTRUCTION_VISUALIZERS,
  ...SOLID_VISUALIZERS,
  ...EXTRA_VISUALIZERS,
};
