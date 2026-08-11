import styles from "./ColorSwatch.module.css";

type ColorSwatchProps = {
  hex: string;
  size?: number;
};

/** 色の実物を表示する丸スウォッチ。カタログ・詳細・比較ビューで共通利用する。 */
export function ColorSwatch({ hex, size = 20 }: ColorSwatchProps) {
  return (
    <span
      className={styles.swatch}
      style={{ backgroundColor: hex, width: size, height: size }}
      aria-hidden="true"
    />
  );
}
