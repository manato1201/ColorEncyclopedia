import { ColorCatalog } from "@/components/catalog/ColorCatalog";
import { colorLoader } from "@/lib/content/colors";

export default function HomePage() {
  const colors = colorLoader.getAllMeta();
  return <ColorCatalog colors={colors} featuredId="shuiro" />;
}
