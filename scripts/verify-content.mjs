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
// 11. 可視化(図形の作図ジェネレータ・色の可視化レジストリ)が、実在するエントリだけを指し、全フレームの座標が有限・描画範囲内であること
// 10. beyondExam(実務の用語)は examLevel を持たず、palette は #RRGGBB の見本であること

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { COLOR_CATEGORY_TAXONOMY } from "../src/lib/color-categories.ts";
import { SHAPE_CATEGORY_TAXONOMY } from "../src/lib/shape-categories.ts";
import { hexToHsv, hexToLab } from "../src/lib/color-math.ts";
import { EXAM_QUESTIONS } from "../src/data/exam-questions.ts";
import { COLOR_TERM_NOTES, SHAPE_TERM_NOTES } from "../src/data/term-notes.ts";
import { SHAPE_VISUALIZERS } from "../src/lib/shape-visualizers/index.ts";
import { COLOR_EFFECT_SCENES } from "../src/lib/color-effect-scenes.ts";
import {
  COLOR_CONTRAST_DEMOS,
  COLOR_DEMO_HEX,
  COLOR_MIXING_MODES,
  COLOR_PALETTE_VISUALIZERS,
  COLOR_VISION_IDS,
  HUE_WHEEL_VISUALIZERS,
} from "../src/lib/color-visualizers.ts";

import { SHAPE_3D } from "../src/lib/shape-3d.ts";
import { getColor3D } from "../src/lib/color-3d.ts";
import { CUBE_NETS, enumerateCubeNets, enumerateHexominoes, eulerCharacteristic, foldsToCube, POLYHEDRA } from "../src/lib/geometry3d/polyhedra.ts";
import { fractalTree3d, hilbert3dPath, sierpinskiTetrahedra, subdividedCubes } from "../src/lib/geometry3d/fractals.ts";
import {
  bezierCurve,
  BEZIER_CONTROL_POINTS,
  conicKind,
  conicSection,
  hyperboloidLines,
  icosahedronEdges,
  lissajous3d,
  phyllotaxisSphere,
  shellSurface,
  spherePacking,
} from "../src/lib/geometry3d/curves.ts";
import { colorPosition, hsvSolidMesh, labGamutCloud, rgbCubeMesh } from "../src/lib/geometry3d/color-solids.ts";
import { dualHull, HULL_SOLIDS, rotationAxes, rotationGroupOrder, solidHull, spaceFillingCenters } from "../src/lib/geometry3d/hull.ts";
import { allFinite, maxAbs } from "../src/lib/geometry3d/mesh-data.ts";

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

function listIds(dirName) {
  return fs
    .readdirSync(path.join(process.cwd(), "content", dirName))
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/.md$/, ""));
}

function verifyVisualizers() {
  const shapeIds = new Set(listIds("shapes"));
  const colorIds = new Set(listIds("colors"));

  for (const [id, generate] of Object.entries(SHAPE_VISUALIZERS)) {
    const label = `shape-visualizer:${id}`;
    if (!shapeIds.has(id)) fail(label, "対応する content/shapes のエントリが存在しない");
    let frames;
    try {
      frames = generate();
    } catch (e) {
      fail(label, `フレーム生成で例外: ${e.message}`);
      continue;
    }
    if (!Array.isArray(frames) || frames.length < 2) {
      fail(label, "フレームが2つ未満");
      continue;
    }
    frames.forEach((fr, i) => {
      if (!fr.description) fail(label, `フレーム${i + 1}に説明文がない`);
      for (const el of fr.elements) {
        const pts = [];
        if (el.kind === "rect") pts.push([el.x, el.y], [el.x + el.w, el.y + el.h]);
        else if (el.kind === "line") pts.push([el.x1, el.y1], [el.x2, el.y2]);
        else if (el.kind === "circle") pts.push([el.cx - el.r, el.cy - el.r], [el.cx + el.r, el.cy + el.r]);
        else if (el.kind === "polygon" || el.kind === "polyline") pts.push(...el.points);
        else pts.push([el.x, el.y]);
        for (const [x, y] of pts) {
          if (!Number.isFinite(x) || !Number.isFinite(y)) fail(label, `フレーム${i + 1}に有限でない座標`);
          else if (x < -2 || x > 102 || y < -2 || y > 102) fail(label, `フレーム${i + 1}の座標(${x.toFixed(1)}, ${y.toFixed(1)})が描画範囲(0〜100)の外`);
        }
      }
    });
  }

  const colorRegistries = {
    HUE_WHEEL_VISUALIZERS,
    COLOR_CONTRAST_DEMOS,
    COLOR_DEMO_HEX,
    COLOR_MIXING_MODES,
    COLOR_EFFECT_SCENES,
    COLOR_PALETTE_VISUALIZERS,
    COLOR_VISION_IDS,
  };
  const withVisual = new Set();
  for (const [name, registry] of Object.entries(colorRegistries)) {
    for (const id of Object.keys(registry)) {
      if (!colorIds.has(id)) fail(`color-visualizer:${name}`, `"${id}" に対応する content/colors のエントリが存在しない`);
      withVisual.add(id);
    }
  }
  console.log(
    `visualizers: 図形 ${Object.keys(SHAPE_VISUALIZERS).filter((id) => shapeIds.has(id)).length}/${shapeIds.size}件、色 ${[...withVisual].filter((id) => colorIds.has(id)).length}/${colorIds.size}件が可視化に対応`,
  );
}

/**
 * 3D表示(three.js)の幾何データと対応表を、three.jsなしで検査する。
 * - 多面体はオイラーの多面体定理 V−E+F=2 を満たす
 * - 立方体の展開図は、6マスの連結図形35種のうち、サイコロを転がして折りたためる11種になる
 * - 3次元ヒルベルト曲線は、全格子点をちょうど1回、隣へ移りながらたどる
 * - メンガーのスポンジ 20^n、カントール塵 8^n、シェルピンスキーの四面体 4^n の個数
 * - 円錐の切り口は、傾きに応じて 円・楕円・放物線・双曲線(2本)になる
 * - 色立体のメッシュ・点群は有限で、範囲 [-1.7, 1.7] に収まる
 */
function verifyGeometry3d() {
  const shapeIds = new Set(listIds("shapes"));
  const colorIds = new Set(listIds("colors"));

  for (const p of POLYHEDRA) {
    if (eulerCharacteristic(p) !== 2) fail(`3d:polyhedron:${p.id}`, `V−E+F が 2 でない(${eulerCharacteristic(p)})`);
  }
  if (enumerateHexominoes().length !== 35) fail("3d:nets", "6マスの連結図形(ヘキソミノ)が35種類でない");
  if (enumerateCubeNets().length !== 11 || CUBE_NETS.length !== 11 || !CUBE_NETS.every(foldsToCube)) fail("3d:nets", "立方体の展開図が11種類でない");

  for (let order = 1; order <= 3; order++) {
    const path = hilbert3dPath(order);
    const step = 2 / 2 ** order;
    const seen = new Set(path.map((q) => q.join(",")));
    if (path.length !== 8 ** order || seen.size !== path.length) fail(`3d:hilbert:${order}`, "点の数・重複が合わない");
    for (let i = 1; i < path.length; i++) {
      const d = Math.abs(path[i][0] - path[i - 1][0]) + Math.abs(path[i][1] - path[i - 1][1]) + Math.abs(path[i][2] - path[i - 1][2]);
      if (Math.abs(d - step) > 1e-9) fail(`3d:hilbert:${order}`, `${i}番目で隣の点に移っていない`);
    }
  }
  for (let n = 0; n <= 3; n++) {
    if (subdividedCubes(n, "menger").length !== 20 ** n) fail("3d:menger", `${n}段の立方体の数が 20^n でない`);
    if (subdividedCubes(n, "cantor").length !== 8 ** n) fail("3d:cantor", `${n}段の立方体の数が 8^n でない`);
    if (sierpinskiTetrahedra(n).length !== 4 ** n) fail("3d:sierpinski", `${n}段の四面体の数が 4^n でない`);
  }
  if (fractalTree3d(5, 35).length !== (3 ** 6 - 1) / 2) fail("3d:tree", "枝の数が (3^(n+1)−1)/2 でない");

  const kinds = [0, 25, 45, 65].map((t) => conicKind(t));
  if (kinds.join() !== "circle,ellipse,parabola,hyperbola") fail("3d:conic", `切り口の種類が想定と違う(${kinds.join()})`);
  if (conicSection(65).length !== 2 || conicSection(25).length !== 1) fail("3d:conic", "双曲線は2本、楕円は1本の曲線になるはず");
  if (icosahedronEdges().length !== 30) fail("3d:golden", "正二十面体の辺が30本でない");

  const geometry = {
    "phyllotaxis": phyllotaxisSphere(500, 137.5).flat(),
    "shell": Array.from(shellSurface({ turns: 3.2, growth: 1.618 }).positions),
    "lissajous": lissajous3d([3, 2, 1], [Math.PI / 2, 0, 0]).flat(),
    "packing": spherePacking("fcc", 3).flat(),
    "hyperboloid": hyperboloidLines(60, 70).flat(2),
    "bezier": bezierCurve(BEZIER_CONTROL_POINTS).flat(),
    "conic": conicSection(60).flat(2),
    "hsv-solid": Array.from(hsvSolidMesh({ cutStart: 200, cutSpan: 90 }).positions),
    "rgb-cube": Array.from(rgbCubeMesh(10).positions),
    "lab-gamut": Array.from(labGamutCloud(26).positions),
  };
  for (const [name, values] of Object.entries(geometry)) {
    if (!allFinite(values)) fail(`3d:geometry:${name}`, "有限でない座標");
    else if (maxAbs(values) > (name === "packing" ? 20 : 3)) fail(`3d:geometry:${name}`, `座標の最大値が大きすぎる(${maxAbs(values).toFixed(2)})`);
  }
  for (const hex of ["#000000", "#FFFFFF", "#EB6238", "#2792C3"]) {
    for (const space of ["rgb", "hsv", "lab"]) {
      const pos = colorPosition(space, hex);
      if (!allFinite(pos) || maxAbs(pos) > 1.7) fail(`3d:position:${space}`, `${hex} の位置が範囲外: ${pos.join(",")}`);
    }
  }

  // 凸包の立体: V−E+F=2、双対の頂点数=元の面数、正多面体の回転群の位数(12・24・24・60・60)
  const platonicOrder = { tetrahedron: 12, cube: 24, octahedron: 24, dodecahedron: 60, icosahedron: 60 };
  for (const spec of HULL_SOLIDS) {
    const h = solidHull(spec.id);
    if (h.vertices.length - h.edges.length + h.faces.length !== 2) fail(`3d:hull:${spec.id}`, "V−E+F が 2 でない");
    if (dualHull(h).vertices.length !== h.faces.length) fail(`3d:hull:${spec.id}`, "双対の頂点数が元の面の数と違う");
    if (spec.id in platonicOrder && rotationGroupOrder(rotationAxes(h)) !== platonicOrder[spec.id]) fail(`3d:hull:${spec.id}`, "回転群の位数が想定と違う");
  }
  const vol = (h) => {
    let v = 0;
    for (const f of h.faces) for (let i = 1; i < f.length - 1; i++) {
      const a = h.vertices[f[0]], b = h.vertices[f[i]], c = h.vertices[f[i + 1]];
      v += (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
    }
    return Math.abs(v);
  };
  // 空間充填: 最近接の中心間距離から求めた格子の1点あたりの体積 = 立体の体積(すき間なく埋まる)
  for (const [kind, perPoint] of [["cube", (n) => n ** 3], ["truncated-octahedron", (n) => ((2 * n) / Math.sqrt(3)) ** 3 / 2], ["rhombic-dodecahedron", (n) => (Math.SQRT2 * n) ** 3 / 4]]) {
    const pts = spaceFillingCenters(kind, 100);
    const nearest = Math.min(...pts.filter((p) => Math.hypot(...p) > 1e-9).map((p) => Math.hypot(...p)));
    if (Math.abs(perPoint(nearest) - vol(solidHull(kind))) > 1e-6) fail(`3d:space-filling:${kind}`, "格子の1点あたりの体積が立体の体積と合わない(すき間・重なりがある)");
  }

  // 対応表: 実在するエントリを指し、図形は2Dの可視化も持つ(切り替えは2Dの可視化の中にあるため)
  for (const id of Object.keys(SHAPE_3D)) {
    if (!shapeIds.has(id)) fail(`3d:shape:${id}`, "対応する content/shapes のエントリが存在しない");
    if (!(id in SHAPE_VISUALIZERS)) fail(`3d:shape:${id}`, "2Dの可視化がない(立体への切り替えは2Dの可視化の中にある)");
  }
  const colors3d = [...colorIds].filter((id) => getColor3D(id) !== null).length;
  console.log(`3d: 図形 ${Object.keys(SHAPE_3D).length}/${shapeIds.size}件、色 ${colors3d}/${colorIds.size}件が立体(3D)表示に対応`);
}

verifyColors();
verifyShapes();
verifyExamQuestions();
verifyTermNotes();
verifyVisualizers();
verifyGeometry3d();

if (errors > 0) {
  console.error(`${errors}件のfrontmatter検証エラー`);
  process.exit(1);
}

console.log("OK: 全エントリのfrontmatter検証をパスしました");
