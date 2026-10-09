import { ColorAtlas } from "@/components/atlas/ColorAtlas";
import { colorLoader } from "@/lib/content/colors";

export const metadata = { title: "色彩Atlas | 色彩図鑑" };

export default function AtlasPage() {
  // 数値(HSV・Lab)を持つ色だけを点にする。概念エントリ(配色理論など)は座標がないので載せない
  const points = colorLoader.getAllMeta().flatMap((color) =>
    color.colorValue
      ? [
          {
            id: color.id,
            name: color.name,
            nameEn: color.nameEn,
            hex: color.colorValue.hex,
            hsv: color.colorValue.hsv,
            lab: color.colorValue.lab,
          },
        ]
      : [],
  );
  return <ColorAtlas points={points} />;
}
