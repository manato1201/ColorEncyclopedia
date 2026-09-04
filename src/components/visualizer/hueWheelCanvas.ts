import { hsvToRgb } from "@/lib/color-math";

/**
 * HueWheelVisualizer/HarmonyVisualizer共通の色相環描画ロジック。
 * 角度(0-360°)は canvas 座標系で atan2(dy, dx) と揃えており、
 * ピクセル描画(drawHueWheel)とマーカー座標計算(polarToXY)が必ず一致するようにしている。
 */

/**
 * 色相環の画像はhex(選択色)に依存せずsizeだけで決まるため、同じ詳細ページ内で
 * HueWheelVisualizerとHarmonyVisualizerの両方が同じsizeで描画する際に計算を使い回す。
 * (比較ビューで複数色を並べた場合も同じキャッシュを共有する。)
 */
const wheelImageCache = new Map<number, ImageData>();

function computeHueWheelImage(size: number): ImageData {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 2;
  const imageData = new ImageData(size, size);
  const data = imageData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      const idx = (y * size + x) * 4;
      if (r > radius) {
        data[idx + 3] = 0;
        continue;
      }
      const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
      const sat = Math.min((r / radius) * 100, 100);
      const { r: rr, g: gg, b: bb } = hsvToRgb({ h: hue, s: sat, v: 100 });
      data[idx] = Math.round(rr);
      data[idx + 1] = Math.round(gg);
      data[idx + 2] = Math.round(bb);
      data[idx + 3] = 255;
    }
  }

  return imageData;
}

export function drawHueWheel(ctx: CanvasRenderingContext2D, size: number): void {
  let image = wheelImageCache.get(size);
  if (!image) {
    image = computeHueWheelImage(size);
    wheelImageCache.set(size, image);
  }
  ctx.putImageData(image, 0, 0);
}

/**
 * devicePixelRatioをそのまま使うと高DPI端末(3〜4倍)でピクセル数が2乗で増え、
 * この円盤サイズ(260px程度)では体感できない解像度向上のためにCPU負荷だけが跳ね上がる。
 * 実用上十分な2倍を上限にクランプする。
 */
export function getEffectiveDpr(): number {
  return Math.min(window.devicePixelRatio || 1, 2);
}

/** 色相(度)・彩度(%)から、色相環canvas上の座標を計算する。drawHueWheelの角度定義と一致させること。 */
export function polarToXY(
  size: number,
  hueDeg: number,
  satPercent: number,
): { x: number; y: number } {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 2;
  const rad = (hueDeg * Math.PI) / 180;
  const r = (Math.min(satPercent, 100) / 100) * radius;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
