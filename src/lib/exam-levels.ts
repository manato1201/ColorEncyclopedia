import type { ExamLevel } from "@/data/exam-questions";

/** URLセーフなslugと実際の級表記(ExamLevel)の対応表。ルーティング(/exam/[level])専用。 */
export const EXAM_LEVEL_SLUGS: { slug: string; level: ExamLevel }[] = [
  { slug: "3kyu", level: "3級" },
  { slug: "2kyu", level: "2級" },
  { slug: "1kyu", level: "1級" },
  { slug: "uc", level: "UC級" },
];

export function levelFromSlug(slug: string): ExamLevel | null {
  return EXAM_LEVEL_SLUGS.find((entry) => entry.slug === slug)?.level ?? null;
}

export function slugFromLevel(level: ExamLevel): string {
  const entry = EXAM_LEVEL_SLUGS.find((e) => e.level === level);
  if (!entry) throw new Error(`未定義の級: ${level}`);
  return entry.slug;
}

/**
 * 問題が実在する級を「3級〜1級・UC級」のように要約する(トップの表示用)。
 * 級の並び(EXAM_LEVEL_SLUGS)に従い、数字の級は両端だけ、UC級は別枠で書く。手書きせず問題データから生成するための関数。
 */
export function summarizeExamLevels(levels: Iterable<ExamLevel>): string {
  const present = new Set(levels);
  const numbered = EXAM_LEVEL_SLUGS.map((e) => e.level).filter((l) => l !== "UC級" && present.has(l));
  const parts: string[] = [];
  if (numbered.length === 1) parts.push(numbered[0]);
  else if (numbered.length > 1) parts.push(`${numbered[0]}〜${numbered[numbered.length - 1]}`);
  if (present.has("UC級")) parts.push("UC級");
  return parts.join("・");
}
