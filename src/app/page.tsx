import { EntranceCards } from "@/components/landing/EntranceCards";
import { LandingHero, type LandingStat } from "@/components/landing/LandingHero";
import { EXAM_QUESTIONS } from "@/data/exam-questions";
import { colorLoader } from "@/lib/content/colors";
import { shapeLoader } from "@/lib/content/shapes";
import { summarizeExamLevels } from "@/lib/exam-levels";

/** ヒーロー球のまわりに浮かべる色(色相環上でばらけるよう意図的に選定)。 */
const ORBIT_IDS = ["shuiro", "yamabukiiro", "wakakusairo", "ruriiro", "murasaki", "sakurairo"];

/**
 * トップ(U1)。主要数値はすべて実際のコンテンツ(content/*.mdと検定問題データ)から生成する。
 * 手書きの数字を置かないので、コンテンツを増減してもトップの表示は自動で一致する。
 */
export default function HomePage() {
  const colors = colorLoader.getAllMeta();
  const shapes = shapeLoader.getAllMeta();

  const stats: LandingStat[] = [
    { label: "色図鑑", value: colors.length, unit: "項目" },
    { label: "図形図鑑", value: shapes.length, unit: "項目" },
    {
      label: "試験対策",
      value: EXAM_QUESTIONS.length,
      unit: "問",
      note: summarizeExamLevels(EXAM_QUESTIONS.map((q) => q.level)),
    },
  ];

  const orbitSwatches = ORBIT_IDS.map((id) => colors.find((c) => c.id === id))
    .filter((c) => !!c?.colorValue)
    .map((c) => ({ id: c!.id, name: c!.name, hex: c!.colorValue!.hex }));

  return (
    <>
      <LandingHero stats={stats} orbitSwatches={orbitSwatches} />
      <EntranceCards
        all={[
          { href: "/basics", label: "基礎", labelEn: "Basics" },
          { href: "/colors", label: "色図鑑", labelEn: "Color Encyclopedia", count: colors.length, unit: "項目" },
          { href: "/shapes", label: "図形図鑑", labelEn: "Shape Encyclopedia", count: shapes.length, unit: "項目" },
          { href: "/atlas", label: "色彩Atlas", labelEn: "Color Atlas", count: colors.filter((c) => c.colorValue).length, unit: "色" },
          { href: "/compare", label: "比較", labelEn: "Compare" },
          { href: "/exam", label: "検定対策", labelEn: "Exam", count: EXAM_QUESTIONS.length, unit: "問" },
        ]}
      />
    </>
  );
}
