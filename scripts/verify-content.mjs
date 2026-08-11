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

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { COLOR_CATEGORY_TAXONOMY } from "../src/lib/color-categories.ts";
import { SHAPE_CATEGORY_TAXONOMY } from "../src/lib/shape-categories.ts";

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

    if (!data.name || !data.category || !data.subcategory || !data.summary) {
      fail(file, "name/category/subcategory/summary のいずれかが欠落している");
      continue;
    }

    const pair = `${data.category}::${data.subcategory}`;
    if (!pairs.has(pair)) {
      fail(file, `"${data.category} / ${data.subcategory}" が COLOR_CATEGORY_TAXONOMY に存在しない`);
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

    if (!data.name || !data.category || !data.subcategory || !data.summary) {
      fail(file, "name/category/subcategory/summary のいずれかが欠落している");
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

verifyColors();
verifyShapes();

if (errors > 0) {
  console.error(`${errors}件のfrontmatter検証エラー`);
  process.exit(1);
}

console.log("OK: 全エントリのfrontmatter検証をパスしました");
