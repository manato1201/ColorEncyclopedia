import Link from "next/link";
import { ColorCompareView } from "@/components/compare/ColorCompareView";
import { colorLoader } from "@/lib/content/colors";
import styles from "./page.module.css";

export default function ComparePage() {
  const colors = colorLoader.getAllMeta();
  return (
    <div>
      <div className={styles.switchBar}>
        <span className={styles.switchActive}>色を比較</span>
        <Link href="/compare/shapes" className={styles.switchLink}>
          図形を比較 →
        </Link>
      </div>
      <ColorCompareView colors={colors} />
    </div>
  );
}
