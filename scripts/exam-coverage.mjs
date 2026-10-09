// 級ごとの収録問題と、その問題が参照する色エントリの対応表をMarkdownで出力する。
// README の「試験範囲との対応表」はこの出力を貼ったもの。手書きせず、問題データから生成する。
//   npm run exam-table
//
// 注意: これは「このリポジトリの自作問題が、どの収録エントリを参照しているか」の一覧であり、
// 色彩検定の公式の出題範囲との対応は確認していない(公式の最新情報で確認すること)。

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { EXAM_QUESTIONS } from "../src/data/exam-questions.ts";

const LEVELS = ["3級", "2級", "1級", "UC級"];
const colorsDir = path.join(process.cwd(), "content", "colors");

const names = new Map();
for (const file of fs.readdirSync(colorsDir).filter((f) => f.endsWith(".md"))) {
  const { data } = matter(fs.readFileSync(path.join(colorsDir, file), "utf8"));
  names.set(file.replace(/\.md$/, ""), data.name);
}

const rows = LEVELS.map((level) => {
  const questions = EXAM_QUESTIONS.filter((q) => q.level === level);
  const refs = [...new Set(questions.map((q) => q.explanationRef))];
  const refNames = refs.map((id) => names.get(id) ?? id).join("、");
  return `| ${level} | ${questions.length} | ${refs.length} | ${refNames || "—"} |`;
});

console.log("| 級 | 問題数 | 参照エントリ数 | 参照している色エントリ |");
console.log("| --- | ---: | ---: | --- |");
console.log(rows.join("\n"));
