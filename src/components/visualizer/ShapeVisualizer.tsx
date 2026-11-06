import { ShapeConstructionVisualizer } from "./ShapeConstructionVisualizer";
import { Shape3DVisualizer } from "@/components/visualizer3d/Shape3DVisualizer";
import { Visual3DSwitch } from "@/components/visualizer3d/Visual3DSwitch";
import { hasShape3D } from "@/lib/shape-3d";

export { hasShapeVisualizer } from "@/lib/has-shape-visualizer";

type ShapeVisualizerProps = {
  shapeId: string;
};

/**
 * 図形の可視化の共通ディスパッチャ。hasShapeVisualizer(shapeId)がtrueのエントリでのみ意味を持つ。
 * 立体(3D)の表示がある図形には、「平面 / 立体」の切り替えを付ける(立体は選んだときに初めて読み込む)。
 */
export function ShapeVisualizer({ shapeId }: ShapeVisualizerProps) {
  const flat = <ShapeConstructionVisualizer shapeId={shapeId} />;
  if (!hasShape3D(shapeId)) return flat;
  return <Visual3DSwitch flat={flat} solid={<Shape3DVisualizer shapeId={shapeId} />} />;
}
