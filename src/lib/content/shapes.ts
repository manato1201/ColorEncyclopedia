import {
  createContentLoader,
  type ShapeFrontmatter,
} from "./createContentLoader";
import { hasShapeVisualizer } from "@/lib/has-shape-visualizer";

export type { ShapeFrontmatter } from "./createContentLoader";

export const shapeLoader = createContentLoader<ShapeFrontmatter>(
  "shapes",
  hasShapeVisualizer,
);

export type ShapeMeta = ReturnType<typeof shapeLoader.getAllMeta>[number];
export type ShapeDetail = NonNullable<ReturnType<typeof shapeLoader.getDetail>>;
