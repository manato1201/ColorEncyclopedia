"""docs/diagrams/ の構成図(SVG)を作る。`python tools/make_diagrams.py` で作り直す。部品は tools/svgkit.py。"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from svgkit import Diagram  # noqa: E402

OUT = Path(__file__).resolve().parent.parent / "docs" / "diagrams"


def architecture() -> Diagram:
    d = Diagram(1560, 780, "ColorEncyclopedia の構成",
                "色と図形の図鑑。content/ の Markdown(frontmatter つき)をローダーが読み、Next.js のページが、"
                "色空間・間隔反復などの純粋関数(src/lib)と、2D / 3D の可視化コンポーネントで見せる。"
                "検定問題の解答履歴はブラウザの localStorage にだけ保存する。scripts/verify-content.mjs が、コンテンツと純粋関数を検査する。")
    d.text(40, 44, "ColorEncyclopedia — 構成", cls="hd")
    d.text(40, 66, "青=主な流れ / 灰の破線=補助。コンテンツは Markdown、計算は純粋関数、保存はブラウザの中だけ", cls="note")

    d.group(40, 100, 300, 600, "CONTENT — データ", color="orange")
    col = d.card(190, 230, "doc", "content/colors", "色 129 件(Markdown +\nfrontmatter の hex・hsv・lab)")
    shp = d.card(190, 410, "doc", "content/shapes", "図形 92 件(Markdown)")
    exq = d.card(190, 590, "list", "src/data/", "検定問題 34 問・\n用語の定型項目")

    d.group(400, 100, 380, 600, "LIB — 純粋関数(src/lib)", color="teal")
    cm = d.card(590, 230, "gear", "color-math.ts", "HSV・Lab・LCh・\nWCAG コントラスト比")
    sr = d.card(590, 410, "clock", "spaced-repetition.ts", "ライトナー式の箱\n(1・3・7・14・30 日)")
    vz = d.card(590, 590, "branch", "shape-visualizers・geometry3d", "作図フレーム・3D の幾何\n(three.js に依存しない)")

    d.group(840, 100, 360, 600, "APP — Next.js(App Router)", color="blue")
    ld = d.card(1020, 230, "server", "createContentLoader", "Markdown → メタ・本文 HTML\n(gray-matter・marked)")
    pg = d.card(1020, 410, "browser", "ページ", "/colors・/shapes・/atlas\n/compare・/exam・/basics")
    v3 = d.card(1020, 590, "film", "可視化", "2D(canvas)・3D(three.js)\n「立体」を選んだ時に読み込む")

    d.group(1260, 100, 260, 600, "BROWSER / CHECK", color="gray")
    ls = d.card(1390, 280, "db", "localStorage", "学習履歴\nce:review:v1")
    vf = d.card(1390, 500, "check", "verify-content.mjs", "frontmatter・問題・可視化を検査\n(npm run verify)")

    d.arrow([col.top, (190, 150), (930, 150), (930, 230), ld.left], "読む", at=1, dy=-10)
    d.arrow([shp.right, (370, 410), (370, 150), (930, 150)], "", kind="secondary")
    d.arrow([ld.right, (1140, 230), (1140, 340), (1020, 340), pg.top], "")
    d.arrow([cm.right, (810, 230), (810, 400), pg.left], "計算", at=1, dx=0, dy=0)
    d.arrow([vz.right, (810, 590), v3.left], "", at=0)
    d.arrow([pg.right, (1230, 410), (1230, 280), ls.left], "解答を保存", kind="secondary", at=1, dx=0, dy=0)
    d.arrow([vf.left, (1230, 500), (1230, 688), (810, 688), (810, 440), (782, 440)], "検査", kind="secondary", at=3, dy=-10)
    return d


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "architecture.svg").write_text(architecture().svg(), encoding="utf-8")
    print("wrote", OUT / "architecture.svg")


if __name__ == "__main__":
    main()
