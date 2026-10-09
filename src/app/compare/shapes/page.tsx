import { Suspense } from "react";
import { ShapeCompareView } from "@/components/compare/ShapeCompareView";
import { shapeLoader } from "@/lib/content/shapes";

export default function CompareShapesPage() {
  const shapes = shapeLoader.getAllMeta();
  return (
    <Suspense fallback={null}>
      <ShapeCompareView shapes={shapes} />
    </Suspense>
  );
}
