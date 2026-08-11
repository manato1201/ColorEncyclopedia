import { ShapeCatalog } from "@/components/catalog/ShapeCatalog";
import { shapeLoader } from "@/lib/content/shapes";

export default function ShapesPage() {
  const shapes = shapeLoader.getAllMeta();
  return <ShapeCatalog shapes={shapes} featuredId="golden-ratio" />;
}
