import { Suspense } from "react";
import { ColorCompareView } from "@/components/compare/ColorCompareView";
import { colorLoader } from "@/lib/content/colors";

export default function ComparePage() {
  const colors = colorLoader.getAllMeta();
  // ?ids= を読むクライアント部分だけをSuspenseの内側に置き、それ以外は静的に生成する
  return (
    <Suspense fallback={null}>
      <ColorCompareView colors={colors} />
    </Suspense>
  );
}
