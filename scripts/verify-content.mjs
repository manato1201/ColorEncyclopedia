// content/colors/*.md と content/shapes/*.md のfrontmatterを機械的に検証する常設スクリプト
// (The-Algorithm-Illustrated の verify-visualizations.mjs / verify-categories.mjs を
// ColorEncyclopedia_DESIGN.md Phase 1の要件に合わせて統合・転用したもの)。
//
// 検証内容:
// 1. colorValue.hex が #RRGGBB 形式であること
// 2. colorValue.hsv / colorValue.lab の各値が数値かつ妥当な範囲であること
// 3. examLevel が色彩検定の実在する級(1級/2級/3級/UC級)のいずれかであること
// 4. shapes側エントリに colorValue/examLevel が混入していないこと
// 5. category/subcategory が対応する CATEGORY_TAXONOMY に存在する組み合わせであること
// 6. nameEn(見出しの下に添える英字の副題)が全エントリにあること
// 7. colorValue.hsv / colorValue.lab が hex から再計算した値と一致すること(転記ミスの検出)
// 8. 検定問題(src/data/exam-questions.ts)のid重複・選択肢・答えの範囲・explanationRefの解決
// 9. 全エントリに定型項目(src/data/term-notes.ts: 見るポイント/混同しやすい点/使うときの注意)があること
// 10. beyondExam(実務の用語)は examLevel を持たず、palette は #RRGGBB の見本であること

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { COLOR_CATEGORY_TAXONOMY } from "../src/lib/color-categories.ts";
import { SHAPE_CATEGORY_TAXONOMY } from "../src/lib/shape-categories.ts";
import { hexToHsv, hexToLab } from "../src/lib/color-math.ts";
import { EXAM_QUESTIONS } from "../src/data/exam-questions.ts";
import { COLOR_TERM_NOTES, SHAPE_TERM_NOTES } from "../src/data/term-notes.ts";

/** frontmatterのhsvは整数丸め(±1)、labは小数1桁丸めなので、再計算値との許容差を持たせる。 */
const HSV_TOLERANCE = 1;
const LAB_TOLERANCE = 0.2;

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const VALID_EXAM_LEVELS = new Set(["1級", "2級", "3級", "UC級"]);

let errors = 0;

function fail(file, message) {
  console.error(`[NG] ${file}: ${message}`);
  errors += 1;
}

function validPairs(taxonomy) {
  return new Set(
    taxonomy.flatMap((c) => c.subcategories.map((sub) => `${c.category}::${sub}`)),
  );
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function verifyColors() {
  const dir = path.join(process.cwd(), "content", "colors");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  const pairs = validPairs(COLOR_CATEGORY_TAXONOMY);

  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const { data } = matter(raw);

    if (!data.name || !data.nameEn || !data.category || !data.subcategory || !data.summary) {
      fail(file, "name/nameEn/category/subcategory/summary のいずれかが欠落している");
      continue;
    }

    const pair = `${data.category}::${data.subcategory}`;
    if (!pairs.has(pair)) {
      fail(file, `"${data.category} / ${data.subcategory}" が COLOR_CATEGORY_TAXONOMY に存在しない`);
    }

    if (data.beyondExam !== undefined && data.beyondExam !== true) {
      fail(file, "beyondExam は true のときだけ書く(検定範囲として確認していない実務の用語の印)");
    }
    if (data.beyondExam === true && data.examLevel !== undefined) {
      fail(file, "beyondExam と examLevel は同時に持てない(検定範囲として確認していない用語に級を付けない)");
    }
    if (data.palette !== undefined) {
      if (!Array.isArray(data.palette) || data.palette.length === 0) {
        fail(file, "palette は1件以上の配列である必要がある");
      } else {
        for (const item of data.palette) {
          if (!item || typeof item.name !== "string" || item.name.trim() === "") fail(file, "palette の項目に name がない");
          if (!item || typeof item.hex !== "string" || !HEX_PATTERN.test(item.hex)) {
            fail(file, `palette の hex "${item?.hex}" が #RRGGBB 形式ではない`);
          }
        }
      }
    }

    if (data.examLevel !== undefined && !VALID_EXAM_LEVELS.has(data.examLevel)) {
      fail(file, `examLevel "${data.examLevel}" は色彩検定の実在する級ではない`);
    }

    if (data.colorValue !== undefined) {
      const { hex, hsv, lab } = data.colorValue;
      if (typeof hex !== "string" || !HEX_PATTERN.test(hex)) {
        fail(file, `colorValue.hex "${hex}" が #RRGGBB 形式ではない`);
      }
      if (
        !hsv ||
        !isFiniteNumber(hsv.h) ||
        !isFiniteNumber(hsv.s) ||
        !isFiniteNumber(hsv.v) ||
        hsv.h < 0 ||
        hsv.h > 360 ||
        hsv.s < 0 ||
        hsv.s > 100 ||
        hsv.v < 0 ||
        hsv.v > 100
      ) {
        fail(file, "colorValue.hsv の値が不正(h:0-360 / s,v:0-100 の数値である必要がある)");
      }
      if (!lab || !isFiniteNumber(lab.l) || !isFiniteNumber(lab.a) || !isFiniteNumber(lab.b) || lab.l < 0 || lab.l > 100) {
        fail(file, "colorValue.lab の値が不正(l:0-100、a/bは数値である必要がある)");
      }

      // hexから再計算した値と突き合わせる(型・範囲が正しくても、値の転記ミスは検出できないため)
      if (typeof hex === "string" && HEX_PATTERN.test(hex)) {
        if (hsv && isFiniteNumber(hsv.h) && isFiniteNumber(hsv.s) && isFiniteNumber(hsv.v)) {
          const calc = hexToHsv(hex);
          // 色相は0°と360°が同一の色なので、円環上の差で比べる
          const hueDiff = Math.min(Math.abs(calc.h - hsv.h), 360 - Math.abs(calc.h - hsv.h));
          if (
            hueDiff > HSV_TOLERANCE ||
            Math.abs(calc.s - hsv.s) > HSV_TOLERANCE ||
            Math.abs(calc.v - hsv.v) > HSV_TOLERANCE
          ) {
            fail(file, `colorValue.hsv が hex(${hex})からの再計算値 H${calc.h} S${calc.s} V${calc.v} と一致しない`);
          }
        }
        if (lab && isFiniteNumber(lab.l) && isFiniteNumber(lab.a) && isFiniteNumber(lab.b)) {
          const calc = hexToLab(hex);
          if (
            Math.abs(calc.l - lab.l) > LAB_TOLERANCE ||
            Math.abs(calc.a - lab.a) > LAB_TOLERANCE ||
            Math.abs(calc.b - lab.b) > LAB_TOLERANCE
          ) {
            fail(
              file,
              `colorValue.lab が hex(${hex})からの再計算値 L${calc.l.toFixed(1)} a${calc.a.toFixed(1)} b${calc.b.toFixed(1)} と一致しない`,
            );
          }
        }
      }
    }
  }

  console.log(`colors: ${files.length}件を検証`);
}

function verifyShapes() {
  const dir = path.join(process.cwd(), "content", "shapes");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  const pairs = validPairs(SHAPE_CATEGORY_TAXONOMY);

  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const { data } = matter(raw);

    if (!data.name || !data.nameEn || !data.category || !data.subcategory || !data.summary) {
      fail(file, "name/nameEn/category/subcategory/summary のいずれかが欠落している");
      continue;
    }

    const pair = `${data.category}::${data.subcategory}`;
    if (!pairs.has(pair)) {
      fail(file, `"${data.category} / ${data.subcategory}" が SHAPE_CATEGORY_TAXONOMY に存在しない`);
    }

    if (data.colorValue !== undefined) {
      fail(file, "shapes側エントリに colorValue が混入している(colors専用フィールド)");
    }
    if (data.examLevel !== undefined) {
      fail(file, "shapes側エントリに examLevel が混入している(colors専用フィールド)");
    }
  }

  console.log(`shapes: ${files.length}件を検証`);
}

function verifyExamQuestions() {
  const colorIds = new Set(
    fs
      .readdirSync(path.join(process.cwd(), "content", "colors"))
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, "")),
  );
  const seen = new Set();

  for (const q of EXAM_QUESTIONS) {
    const label = `exam-questions:${q.id}`;
    if (seen.has(q.id)) fail(label, "idが重複している");
    seen.add(q.id);
    if (!VALID_EXAM_LEVELS.has(q.level)) fail(label, `level "${q.level}" は実在する級ではない`);
    if (!Array.isArray(q.choices) || q.choices.length < 2) fail(label, "選択肢が2つ未満");
    else if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex >= q.choices.length) {
      fail(label, `answerIndex ${q.answerIndex} が選択肢の範囲外`);
    }
    if (!colorIds.has(q.explanationRef)) fail(label, `explanationRef "${q.explanationRef}" が content/colors に存在しない`);
    for (const g of q.glossary ?? []) {
      if (!q.questionText.includes(g.term)) fail(label, `glossary の用語 "${g.term}" が問題文に含まれない`);
    }
  }

  console.log(`exam-questions: ${EXAM_QUESTIONS.length}問を検証`);
}

function verifyTermNotes() {
  for (const [dirName, notes] of [
    ["colors", COLOR_TERM_NOTES],
    ["shapes", SHAPE_TERM_NOTES],
  ]) {
    const dir = path.join(process.cwd(), "content", dirName);
    const ids = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/.md$/, ""));
    for (const id of ids) {
      const label = `term-notes:${dirName}/${id}`;
      const note = notes[id];
      if (!note) {
        fail(label, "定型項目(look/confuse/caution)が未登録");
        continue;
      }
      for (const key of ["look", "confuse", "caution"]) {
        if (typeof note[key] !== "string" || note[key].trim() === "") fail(label, `${key} が空`);
      }
    }
    for (const id of Object.keys(notes)) {
      if (!ids.includes(id)) fail(`term-notes:${dirName}/${id}`, "対応するcontentファイルが存在しない");
    }
  }
  console.log("term-notes: 全エントリの定型項目を検証");
}

verifyColors();
verifyShapes();
verifyExamQuestions();
verifyTermNotes();

if (errors > 0) {
  console.error(`${errors}件のfrontmatter検証エラー`);
  process.exit(1);
}

console.log("OK: 全エントリのfrontmatter検証をパスしました");
