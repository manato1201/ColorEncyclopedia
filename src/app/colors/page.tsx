import { SectionTabs } from "@/components/ui/SectionTabs";
import { ColorCatalog } from "@/components/catalog/ColorCatalog";
import { colorLoader } from "@/lib/content/colors";

export default function ColorsPage() {
  const colors = colorLoader.getAllMeta();
  return (
    <>
      <SectionTabs current="colors" />
      <ColorCatalog colors={colors} featuredId="shuiro" />
    </>
  );
}
