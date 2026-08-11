import { SHAPE_VISUALIZERS } from "./shape-visualizers";

/** このidに対応する図形の作図手順可視化があるかどうか。 */
export function hasShapeVisualizer(shapeId: string): boolean {
  return shapeId in SHAPE_VISUALIZERS;
}
