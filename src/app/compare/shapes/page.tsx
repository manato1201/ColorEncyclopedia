import Link from "next/link";
import { ShapeCompareView } from "@/components/compare/ShapeCompareView";
import { shapeLoader } from "@/lib/content/shapes";
import styles from "../page.module.css";

export default function CompareShapesPage() {
  const shapes = shapeLoader.getAllMeta();
  return (
    <div>
      <div className={styles.switchBar}>
        <Link href="/compare" className={styles.switchLink}>
          ← 色を比較
        </Link>
        <span className={styles.switchActive}>図形を比較</span>
      </div>
      <ShapeCompareView shapes={shapes} />
    </div>
  );
}
