"use client";

import styles from "./ColorEffectVisualizer.module.css";
import { PlaybackControls } from "./PlaybackControls";
import { useStepPlayer } from "./useStepPlayer";
import { COLOR_EFFECT_SCENES, type EffectTile } from "@/lib/color-effect-scenes";

/** 見え方(対比・残像・進出と後退・膨張と収縮・面積効果・色温度)の場面を、ステップ再生で見せる。 */
export function ColorEffectVisualizer({ id }: { id: string }) {
  const scenes = COLOR_EFFECT_SCENES[id] ?? [];
  const { stepIndex, isFinished, showPause, handlePlayPause, handleStep, reset } = useStepPlayer(scenes.length);
  if (scenes.length === 0) return null;
  const scene = scenes[stepIndex];

  return (
    <div className={styles.visualizer}>
      <ul className={styles.tiles}>
        {scene.tiles.map((tile, index) => (
          <Tile key={`${stepIndex}-${index}`} tile={tile} />
        ))}
      </ul>
      <p className={styles.description} role="status">
        {scene.description}
      </p>
      <PlaybackControls
        stepIndex={stepIndex}
        frameCount={scenes.length}
        showPause={showPause}
        isFinished={isFinished}
        onPlayPause={handlePlayPause}
        onStep={handleStep}
        onReset={reset}
        resetLabel="最初から"
      />
      <p className={styles.note}>
        この可視化は、まわりの色の影響を見せるため、見本の周囲を中立灰にしていません。画面上の色は環境により異なります。
      </p>
    </div>
  );
}

function Tile({ tile }: { tile: EffectTile }) {
  const size = tile.fgSize ?? 42;
  return (
    <li className={styles.tile}>
      <span className={styles.surface} style={{ backgroundColor: tile.bg }}>
        {tile.fg ? (
          <span
            className={styles.inner}
            style={{ backgroundColor: tile.fg, width: `${size}%`, height: `${size}%`, opacity: tile.fgOpacity ?? 1 }}
          />
        ) : null}
      </span>
      {/* 色だけで伝えない: 背景と中央の色に、名前とHEXを併記する */}
      <span className={styles.caption}>
        {tile.caption ?? tile.bgName}
        <span className={`num ${styles.hex}`}>{tile.bg}</span>
      </span>
      {tile.fg ? (
        <span className={styles.caption}>
          {tile.fgName}
          <span className={`num ${styles.hex}`}>{tile.fg}</span>
        </span>
      ) : null}
    </li>
  );
}
