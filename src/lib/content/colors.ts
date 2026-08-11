import {
  createContentLoader,
  type ColorFrontmatter,
} from "./createContentLoader";
import { hasColorVisualizer } from "@/lib/has-color-visualizer";

export type { ColorFrontmatter } from "./createContentLoader";

export const colorLoader = createContentLoader<ColorFrontmatter>(
  "colors",
  hasColorVisualizer,
);

export type ColorMeta = ReturnType<typeof colorLoader.getAllMeta>[number];
export type ColorDetail = NonNullable<ReturnType<typeof colorLoader.getDetail>>;
