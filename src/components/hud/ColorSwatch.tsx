import styles from "./ColorSwatch.module.css";

type ColorSwatchProps = {
  hex: string;
  /** 色が塗られる部分の直径(px)。周囲の中立灰のリングはこの外側に付く。 */
  size?: number;
};

/**
 * 色の実物を表示する丸スウォッチ。カタログ・詳細・比較ビューで共通利用する。
 * 周りの色で見え方が変わる(同時対比)ため、周囲にテーマで変わらない中立灰のリング(--swatch-stage)を付け、
 * ライト/ダークどちらの紙面に置かれても同じ見え方になるようにしている(docs/ui-rules.md「色見本」)。
 * 色だけで意味を伝えないため、呼び出し側は必ず名前または値を併記すること。
 */
export function ColorSwatch({ hex, size = 20 }: ColorSwatchProps) {
  const ring = size >= 24 ? 4 : 3;
  return (
    <span
      className={styles.swatch}
      style={{
        backgroundColor: hex,
        width: size + ring * 2,
        height: size + ring * 2,
        borderWidth: ring,
      }}
      aria-hidden="true"
    />
  );
}
