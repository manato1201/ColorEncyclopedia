import { ColorAtlas } from "@/components/atlas/ColorAtlas";
import { deriveColorValues } from "@/lib/color-values";
import { colorLoader } from "@/lib/content/colors";

export const metadata = { title: "色彩Atlas | 色彩図鑑" };

export default function AtlasPage() {
  // 数値(HSV・Lab)を持つ色だけを点にする。概念エントリ(配色理論など)は座標がないので載せない
  // 位置も表示値も、HEXからの単一の変換(deriveColorValues)で出す
  const points = colorLoader.getAllMeta().flatMap((color) => {
    if (!color.colorValue) return [];
    const { hex, hsv, lab } = deriveColorValues(color.colorValue.hex);
    return [{ id: color.id, name: color.name, nameEn: color.nameEn, hex, hsv, lab }];
  });
  return <ColorAtlas points={points} />;
}
