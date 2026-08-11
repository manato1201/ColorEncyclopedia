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
