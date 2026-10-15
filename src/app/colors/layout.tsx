import { HueBackdrop } from "@/components/colors/HueBackdrop";
import { colorLoader } from "@/lib/content/colors";

/** 色図鑑の配下共通。詳細ページの背景を色相に応じて薄く染める(遷移してもなめらかに変わる)。 */
export default function ColorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hues: Record<string, number> = {};
  for (const color of colorLoader.getAllMeta()) {
    if (color.colorValue) hues[color.id] = color.colorValue.hsv.h;
  }
  return <HueBackdrop hues={hues}>{children}</HueBackdrop>;
}
