import { ShapeConstructionVisualizer } from "./ShapeConstructionVisualizer";

export { hasShapeVisualizer } from "@/lib/has-shape-visualizer";

type ShapeVisualizerProps = {
  shapeId: string;
};

/** 図形の可視化の共通ディスパッチャ。hasShapeVisualizer(shapeId)がtrueのエントリでのみ意味を持つ。 */
export function ShapeVisualizer({ shapeId }: ShapeVisualizerProps) {
  return <ShapeConstructionVisualizer shapeId={shapeId} />;
}
