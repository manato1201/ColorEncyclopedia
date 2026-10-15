import { ShapeCatalog } from "@/components/catalog/ShapeCatalog";
import { SectionTabs } from "@/components/ui/SectionTabs";
import { shapeLoader } from "@/lib/content/shapes";

export default function ShapesPage() {
  const shapes = shapeLoader.getAllMeta();
  return (
    <>
      <SectionTabs current="shapes" />
      <ShapeCatalog shapes={shapes} featuredId="golden-ratio" />
    </>
  );
}
