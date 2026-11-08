"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type * as ThreeNS from "three";
import styles from "./Viewport3D.module.css";

export type Three = typeof ThreeNS;

/** 3Dの線・面に使う色。サイトのトークン(ライト/ダーク・選択色)から読み取る。 */
export type SceneTheme = {
  ink: string;
  inkMuted: string;
  accent: string;
  paper: string;
  line: string;
};

export type SceneContext = {
  THREE: Three;
  scene: ThreeNS.Scene;
  camera: ThreeNS.PerspectiveCamera;
  /** 描画先のcanvas(クリックで点を選ぶシーンが、イベントを受けるために使う)。 */
  dom: HTMLCanvasElement;
  theme: SceneTheme;
  /** 描画が必要になったことを知らせる(見えているときだけ描く)。 */
  requestRender: () => void;
};

export type SceneHandle<P> = {
  /** パラメータが変わったとき。必要な部分だけ作り直す。 */
  update?: (params: P) => void;
  dispose?: () => void;
};

/** シーンを作る関数。three.js は ctx.THREE で受け取る(このファイルの外からは three を直接 import しない)。 */
export type SceneBuilder<P> = (ctx: SceneContext, params: P) => SceneHandle<P>;

export type ViewPreset = "oblique" | "top" | "front" | "iso";

type Viewport3DProps<P> = {
  scene: SceneBuilder<P>;
  params: P;
  /** スクリーンリーダー向けの説明。 */
  label: string;
  /** 斜めから見たときの、注視点からのカメラの向きと距離。 */
  distance?: number;
  /** 最初の視点。 */
  initialView?: ViewPreset;
  /** 最初から自動で回すか(動きを減らす設定では回さない。操作を始めたら止まる)。 */
  autoRotate?: boolean;
  /** ビューポートの下に出す補足(凡例など)。 */
  children?: ReactNode;
};

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** CSSの色(var・color-mixなどの解決後)を #rrggbb にそろえる。 */
function resolveCssColor(value: string, fallback: string): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return fallback;
    ctx.fillStyle = "#000000";
    ctx.fillStyle = value || fallback;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
  } catch {
    return fallback;
  }
}

function readTheme(el: HTMLElement): SceneTheme {
  const cs = getComputedStyle(el);
  const get = (name: string, fallback: string) => resolveCssColor(cs.getPropertyValue(name).trim(), fallback);
  return {
    ink: get("--color-ink", "#1c1b19"),
    inkMuted: get("--color-ink-muted", "#6b6860"),
    accent: get("--accent-current", "#7c4dff"),
    paper: get("--color-paper", "#f4f1ea"),
    line: get("--color-line", "#cfcabd"),
  };
}

/** カメラの向き(注視点から見た方向)。 */
function viewDirection(view: ViewPreset): [number, number, number] {
  if (view === "top") return [0, 1, 0.0001];
  if (view === "front") return [0, 0.08, 1];
  if (view === "iso") return [1, 1, 1];
  return [0.75, 0.55, 0.9];
}

/**
 * three.js のビューポート(共通)。three は表示したときに初めて読み込む(別チャンク)。
 * - ドラッグで回す。ホイールではズームしない(ページのスクロールを奪わないため)。ズームはボタンで行う。
 * - 見えている間だけ描画する(画面外・タブが裏のときは止める)。変化がなければ描き直さない。
 * - 自動回転は、動きを減らす設定では行わず、ドラッグを始めたら止まる。「回転」ボタンで切り替えられる。
 * - WebGLが使えない環境では、その旨を出す。
 */
export function Viewport3D<P>({ scene: buildScene, params, label, distance = 5, autoRotate = true, initialView = "oblique", children }: Viewport3DProps<P>) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unsupported">("loading");
  const [rotating, setRotating] = useState(
    () => autoRotate && typeof window !== "undefined" && !window.matchMedia(REDUCED_MOTION).matches,
  );
  const [themeKey, setThemeKey] = useState(0);

  const paramsRef = useRef(params);
  const handleRef = useRef<SceneHandle<P> | null>(null);
  const apiRef = useRef<{
    setRotate: (on: boolean) => void;
    setView: (v: ViewPreset) => void;
    zoom: (factor: number) => void;
    render: () => void;
  } | null>(null);
  const rotatingRef = useRef(rotating);

  useEffect(() => {
    rotatingRef.current = rotating;
    apiRef.current?.setRotate(rotating);
  }, [rotating]);

  // テーマ(ライト/ダーク・選択色)が変わったら、色を読み直して作り直す
  useEffect(() => {
    const observer = new MutationObserver(() => setThemeKey((k) => k + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "style", "class"] });
    return () => observer.disconnect();
  }, []);

  // パラメータが変わったら、シーンに知らせて描き直す
  useEffect(() => {
    paramsRef.current = params;
    handleRef.current?.update?.(params);
    apiRef.current?.render();
  }, [params]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      const [THREE, controlsModule] = await Promise.all([import("three"), import("three/addons/controls/OrbitControls.js")]);
      if (disposed) return;
      // 色見本・色立体の色を、そのままの値で出す(色の管理による変換を入れない)
      THREE.ColorManagement.enabled = false;

      let renderer: ThreeNS.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      } catch {
        setStatus("unsupported");
        return;
      }
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      const canvas = renderer.domElement;
      canvas.className = styles.canvas;
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", label);
      host.appendChild(canvas);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
      const setCameraFrom = (view: ViewPreset) => {
        const d = viewDirection(view);
        const len = Math.hypot(d[0], d[1], d[2]);
        camera.position.set((d[0] / len) * distance, (d[1] / len) * distance, (d[2] / len) * distance);
        camera.lookAt(0, 0, 0);
      };
      setCameraFrom(initialView);

      const controls = new controlsModule.OrbitControls(camera, canvas);
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.minDistance = distance * 0.5;
      controls.maxDistance = distance * 2.2;
      controls.autoRotate = rotatingRef.current;
      controls.autoRotateSpeed = 1.4;
      // 縦のスワイプはページのスクロールに使う(横のドラッグで回す)
      canvas.style.touchAction = "pan-y";

      const theme = readTheme(host);
      let visible = true;
      let raf = 0;
      let needs = true;
      let last = performance.now();

      const frame = (now: number) => {
        raf = 0;
        if (disposed) return;
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;
        controls.update(dt);
        if (needs) {
          renderer.render(scene, camera);
          needs = false;
        }
        // 自動回転の間だけ、続けて描く
        if (visible && controls.autoRotate) raf = requestAnimationFrame(frame);
      };
      const schedule = () => {
        if (raf || disposed || !visible || document.hidden) return;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      };
      const requestRender = () => {
        needs = true;
        schedule();
      };

      const handle = buildScene({ THREE, scene, camera, dom: canvas, theme, requestRender }, paramsRef.current);
      handleRef.current = handle;

      const resize = () => {
        const w = host.clientWidth;
        const h = host.clientHeight;
        if (w === 0 || h === 0) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        requestRender();
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      resize();

      controls.addEventListener("change", requestRender);
      controls.addEventListener("start", () => setRotating(false));

      const intersection = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          if (visible) requestRender();
        },
        { threshold: 0.05 },
      );
      intersection.observe(host);
      const onVisibility = () => {
        if (!document.hidden) requestRender();
      };
      document.addEventListener("visibilitychange", onVisibility);

      apiRef.current = {
        setRotate: (on) => {
          controls.autoRotate = on;
          if (on) requestRender();
        },
        setView: (view) => {
          setCameraFrom(view);
          controls.update();
          requestRender();
        },
        zoom: (factor) => {
          const dist = camera.position.length() * factor;
          camera.position.setLength(Math.min(controls.maxDistance, Math.max(controls.minDistance, dist)));
          requestRender();
        },
        render: requestRender,
      };
      setStatus("ready");
      requestRender();

      cleanup = () => {
        if (raf) cancelAnimationFrame(raf);
        resizeObserver.disconnect();
        intersection.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        controls.dispose();
        handle.dispose?.();
        handleRef.current = null;
        apiRef.current = null;
        scene.traverse((obj) => {
          const mesh = obj as ThreeNS.Mesh;
          mesh.geometry?.dispose?.();
          const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
          for (const m of materials) {
            (m as ThreeNS.MeshBasicMaterial).map?.dispose();
            m.dispose();
          }
        });
        renderer.dispose();
        renderer.forceContextLoss();
        canvas.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
    // paramsは別のeffectで反映する。シーン・テーマ・ラベルが変わったときだけ作り直す
  }, [buildScene, themeKey, label, distance, initialView]);

  const setView = useCallback((view: ViewPreset) => {
    setRotating(false);
    apiRef.current?.setView(view);
  }, []);

  return (
    <div className={styles.viewport}>
      <div ref={hostRef} className={styles.stage}>
        {status === "loading" ? <p className={styles.notice}>3Dを読み込み中…</p> : null}
        {status === "unsupported" ? (
          <p className={styles.notice}>
            この環境では3D表示(WebGL)を使えません。平面の図で確認してください。
          </p>
        ) : null}
      </div>
      {status === "ready" ? (
        <div className={styles.toolbar} role="group" aria-label="3Dの視点操作">
          <button type="button" className={styles.tool} onClick={() => setView("oblique")}>
            斜め
          </button>
          <button type="button" className={styles.tool} onClick={() => setView("top")}>
            真上
          </button>
          <button type="button" className={styles.tool} onClick={() => setView("front")}>
            正面
          </button>
          <button type="button" className={styles.tool} onClick={() => setView("iso")}>
            等角
          </button>
          <span className={styles.toolGap} aria-hidden="true" />
          <button type="button" className={styles.tool} onClick={() => apiRef.current?.zoom(0.8)} aria-label="拡大">
            ＋
          </button>
          <button type="button" className={styles.tool} onClick={() => apiRef.current?.zoom(1.25)} aria-label="縮小">
            −
          </button>
          <button type="button" className={styles.tool} aria-pressed={rotating} onClick={() => setRotating((on) => !on)}>
            回転
          </button>
          <span className={styles.hint}>ドラッグで回す</span>
        </div>
      ) : null}
      {children}
    </div>
  );
}
