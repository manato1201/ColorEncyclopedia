"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import styles from "./Visual3D.module.css";
import { ChoiceRow, RangeRow, Readout, Toggle } from "./Controls";
import { Viewport3D } from "./Viewport3D";
import {
  bezierScene,
  conicScene,
  cubeNetScene,
  fractalCubesScene,
  goldenScene,
  hilbertScene,
  hyperboloidScene,
  LISSAJOUS_PRESETS,
  lissajousScene,
  packingScene,
  phyllotaxisScene,
  shellScene,
  sierpinskiScene,
  solidsScene,
  treeScene,
} from "./shape-scenes";
import { CONIC_LABEL, conicKind, GOLDEN_ANGLE_DEG, PACKING_DENSITY, type PackingKind } from "@/lib/geometry3d/curves";
import { CUBE_NETS, netLabel, POLYHEDRA, PHI, eulerCharacteristic, type PolyhedronId } from "@/lib/geometry3d/polyhedra";
import { SHAPE_3D, type Shape3DEntry } from "@/lib/shape-3d";
import {
  ArchimedesView,
  BoxDiagonalView,
  CatenoidView,
  CavalieriView,
  HelixView,
  HullSolidsView,
  IsometricView,
  RevolveView,
  SpaceFillingView,
} from "./Shape3DSolidViews";

/** 図形の「立体で見る」(3D)。登録(SHAPE_3D)の種類ごとに、シーンと操作を組み合わせる。 */

type Props = { shapeId: string };

function Frame({ entry, children }: { entry: Shape3DEntry; children: ReactNode }) {
  return (
    <div className={styles.wrap}>
      <h3 className={styles.title}>{entry.title}</h3>
      <p className={styles.note}>{entry.note}</p>
      {children}
    </div>
  );
}

const fmt = (n: number, digits = 0) => n.toFixed(digits);

function SolidsView({ entry }: { entry: Extract<Shape3DEntry, { kind: "solids" }> }) {
  const [solid, setSolid] = useState<PolyhedronId>(entry.initial);
  const params = useMemo(() => ({ solid }), [solid]);
  const spec = POLYHEDRA.find((p) => p.id === solid)!;
  return (
    <Frame entry={entry}>
      <Viewport3D scene={solidsScene} params={params} label={`${spec.name}の3Dモデル`} distance={5.2}>
        <div className={styles.controls}>
          <ChoiceRow
            label="立体"
            value={solid}
            onChange={setSolid}
            options={entry.solids.map((id) => ({ value: id, label: POLYHEDRA.find((p) => p.id === id)!.name }))}
          />
          <Readout>
            {spec.name}: {spec.faces}。頂点 <span className="num">{spec.v}</span> − 辺 <span className="num">{spec.e}</span> + 面{" "}
            <span className="num">{spec.f}</span> = <span className="num">{eulerCharacteristic(spec)}</span>
          </Readout>
        </div>
      </Viewport3D>
    </Frame>
  );
}

function CubeNetView({ entry }: { entry: Shape3DEntry }) {
  const [net, setNet] = useState(1);
  const [fold, setFold] = useState(0);
  const [target, setTarget] = useState<number | null>(null);
  const foldRef = useRef(0);

  useEffect(() => {
    if (target === null) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const cur = foldRef.current;
      const dir = target > cur ? 1 : -1;
      let next = cur + (dir * dt) / 1.8;
      const done = (dir > 0 && next >= target) || (dir < 0 && next <= target);
      if (done) next = target;
      foldRef.current = next;
      setFold(next);
      if (done) {
        setTarget(null);
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const setFoldNow = (v: number) => {
    foldRef.current = v;
    setFold(v);
    setTarget(null);
  };
  const toggleFold = () => {
    const goal = foldRef.current > 0.5 ? 0 : 1;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setFoldNow(goal);
    else setTarget(goal);
  };

  const params = useMemo(() => ({ net, fold }), [net, fold]);
  return (
    <Frame entry={entry}>
      <Viewport3D scene={cubeNetScene} params={params} label="立方体の展開図を折りたたむ3Dモデル" distance={6.5} autoRotate={false}>
        <div className={styles.controls}>
          <ChoiceRow
            label="展開図"
            value={net}
            onChange={(n) => {
              setNet(n);
              setFoldNow(0);
            }}
            options={CUBE_NETS.map((cells, i) => ({ value: i, label: String(i + 1), title: `${netLabel(cells)}型` }))}
          />
          <RangeRow label="折る" min={0} max={1} step={0.01} value={fold} onChange={setFoldNow} format={(v) => `${fmt(v * 100)}%`} />
          <div className={styles.row}>
            <button type="button" className={styles.choice} onClick={toggleFold}>
              {fold > 0.5 ? "開く" : "折りたたむ"}
            </button>
          </div>
          <Readout>
            展開図 <span className="num">{net + 1}</span>({netLabel(CUBE_NETS[net])}型)。6マスがつながった図形35種類のうち、立方体に折れるのは{" "}
            <span className="num">{CUBE_NETS.length}</span> 種類です(サイコロを転がして確かめた数)。
          </Readout>
        </div>
      </Viewport3D>
    </Frame>
  );
}

function FractalCubesView({ entry }: { entry: Extract<Shape3DEntry, { kind: "fractal-cubes" }> }) {
  const max = entry.variant === "menger" ? 3 : 4;
  const [level, setLevel] = useState(entry.variant === "menger" ? 2 : 3);
  const params = useMemo(() => ({ variant: entry.variant, level }), [entry.variant, level]);
  const count = entry.variant === "menger" ? 20 ** level : 8 ** level;
  const volume = entry.variant === "menger" ? (20 / 27) ** level : (8 / 27) ** level;
  return (
    <Frame entry={entry}>
      <Viewport3D scene={fractalCubesScene} params={params} label={entry.variant === "menger" ? "メンガーのスポンジ" : "カントール塵"} distance={6}>
        <div className={styles.controls}>
          <RangeRow label="段数" min={0} max={max} step={1} value={level} onChange={setLevel} format={(v) => `${v}段`} />
          <Readout>
            {level}段: 立方体 <span className="num">{count.toLocaleString()}</span> 個、体積は元の{" "}
            <span className="num">{fmt(volume * 100, 1)}%</span>
          </Readout>
        </div>
      </Viewport3D>
    </Frame>
  );
}

function SierpinskiView({ entry }: { entry: Shape3DEntry }) {
  const [level, setLevel] = useState(3);
  const params = useMemo(() => ({ level }), [level]);
  return (
    <Frame entry={entry}>
      <Viewport3D scene={sierpinskiScene} params={params} label="シェルピンスキーの四面体" distance={6}>
        <div className={styles.controls}>
          <RangeRow label="段数" min={0} max={5} step={1} value={level} onChange={setLevel} format={(v) => `${v}段`} />
          <Readout>
            {level}段: 四面体 <span className="num">{(4 ** level).toLocaleString()}</span> 個、体積は元の{" "}
            <span className="num">{fmt((0.5 ** level) * 100, 1)}%</span>
          </Readout>
        </div>
      </Viewport3D>
    </Frame>
  );
}

function HilbertView({ entry }: { entry: Shape3DEntry }) {
  const [order, setOrder] = useState(2);
  const params = useMemo(() => ({ order }), [order]);
  return (
    <Frame entry={entry}>
      <Viewport3D scene={hilbertScene} params={params} label="3次元ヒルベルト曲線" distance={6}>
        <div className={styles.controls}>
          <RangeRow label="次数" min={1} max={3} step={1} value={order} onChange={setOrder} format={(v) => `${v}次`} />
          <Readout>
            {order}次: 格子点 <span className="num">{(8 ** order).toLocaleString()}</span> 個(1辺に {2 ** order} 個)を、1回ずつ、隣へ移りながらたどります。
          </Readout>
        </div>
      </Viewport3D>
    </Frame>
  );
}

function PhyllotaxisView({ entry }: { entry: Extract<Shape3DEntry, { kind: "phyllotaxis" }> }) {
  const [angle, setAngle] = useState(entry.angle);
  const [count, setCount] = useState(800);
  const params = useMemo(() => ({ angle, count }), [angle, count]);
  return (
    <Frame entry={entry}>
      <Viewport3D scene={phyllotaxisScene} params={params} label="黄金角で並べた球面の点" distance={5.5}>
        <div className={styles.controls}>
          <RangeRow label="回転角" min={125} max={150} step={0.1} value={angle} onChange={setAngle} format={(v) => `${fmt(v, 1)}°`} />
          <RangeRow label="点の数" min={200} max={1500} step={100} value={count} onChange={setCount} format={(v) => `${v}個`} />
          <div className={styles.row}>
            <button type="button" className={styles.choice} onClick={() => setAngle(Math.round(GOLDEN_ANGLE_DEG * 10) / 10)}>
              黄金角(約{fmt(GOLDEN_ANGLE_DEG, 1)}°)に戻す
            </button>
          </div>
          <Readout>
            回転角 <span className="num">{fmt(angle, 1)}°</span>
            {Math.abs(angle - GOLDEN_ANGLE_DEG) < 0.06 ? ": 黄金角。点がむらなく広がります" : ": 黄金角からずれると、腕やすき間が目立ちます"}
          </Readout>
        </div>
      </Viewport3D>
    </Frame>
  );
}

const SHELL_GROWTH = [
  { value: 1.618, label: "黄金比 1.618" },
  { value: 1.3, label: "1.3" },
  { value: 2.2, label: "2.2" },
];

function ShellView({ entry }: { entry: Shape3DEntry }) {
  const [growth, setGrowth] = useState(1.618);
  const params = useMemo(() => ({ growth }), [growth]);
  return (
    <Frame entry={entry}>
      <Viewport3D scene={shellScene} params={params} label="対数らせんの巻き貝" distance={6}>
        <div className={styles.controls}>
          <ChoiceRow label="1/4回転で" value={growth} onChange={setGrowth} options={SHELL_GROWTH.map((g) => ({ value: g.value, label: `${g.label}倍` }))} />
          <Readout>
            1/4回転ごとに半径が <span className="num">{growth === 1.618 ? PHI.toFixed(3) : growth}</span> 倍。巻きの間隔は、1回転で{" "}
            <span className="num">{fmt(growth ** 4, 1)}</span> 倍に開きます。
          </Readout>
        </div>
      </Viewport3D>
    </Frame>
  );
}

function LissajousView({ entry }: { entry: Shape3DEntry }) {
  const [preset, setPreset] = useState(0);
  const params = useMemo(() => ({ preset }), [preset]);
  return (
    <Frame entry={entry}>
      <Viewport3D scene={lissajousScene} params={params} label="3次元リサジュー曲線" distance={6}>
        <div className={styles.controls}>
          <ChoiceRow label="周波数の比" value={preset} onChange={setPreset} options={LISSAJOUS_PRESETS.map((p, i) => ({ value: i, label: p.label }))} />
          <Readout>x : y : z の周波数の比が {LISSAJOUS_PRESETS[preset].label}。整数比なので、曲線は閉じます。</Readout>
        </div>
      </Viewport3D>
    </Frame>
  );
}

function ConicView({ entry }: { entry: Extract<Shape3DEntry, { kind: "conic" }> }) {
  const [tilt, setTilt] = useState(entry.tilt);
  const params = useMemo(() => ({ tilt }), [tilt]);
  const kind = conicKind(tilt);
  return (
    <Frame entry={entry}>
      <Viewport3D scene={conicScene} params={params} label="円錐を平面で切った切り口" distance={7} autoRotate={false}>
        <div className={styles.controls}>
          <RangeRow label="平面の傾き" min={0} max={85} step={0.5} value={tilt} onChange={setTilt} format={(v) => `${fmt(v, 1)}°`} />
          <ChoiceRow
            label="目安"
            value={-1}
            onChange={(v) => setTilt(v)}
            options={[
              { value: 0, label: "円 0°" },
              { value: 25, label: "楕円 25°" },
              { value: 45, label: "放物線 45°" },
              { value: 65, label: "双曲線 65°" },
            ]}
          />
          <Readout>
            切り口: <span className="num">{CONIC_LABEL[kind]}</span>
            。この円錐は母線が水平から45°なので、平面が45°ちょうどで母線と平行になり放物線、それより寝ていれば楕円、立っていれば双曲線(円錐の上下2枚にまたがる)です。
          </Readout>
        </div>
      </Viewport3D>
    </Frame>
  );
}

function PackingView({ entry }: { entry: Shape3DEntry }) {
  const [kind, setKind] = useState<PackingKind>("fcc");
  const [layers, setLayers] = useState(3);
  const params = useMemo(() => ({ kind, layers }), [kind, layers]);
  return (
    <Frame entry={entry}>
      <Viewport3D scene={packingScene} params={params} label="球の最密充填" distance={7}>
        <div className={styles.controls}>
          <ChoiceRow
            label="積み方"
            value={kind}
            onChange={setKind}
            options={[
              { value: "fcc", label: "ABC ABC…(面心立方)" },
              { value: "hcp", label: "AB AB…(六方最密)" },
            ]}
          />
          <RangeRow label="層の数" min={1} max={4} step={1} value={layers} onChange={setLayers} format={(v) => `${v}層`} />
          <Readout>
            どちらの積み方でも、球が空間を占める割合は π/√18 ≈ <span className="num">{fmt(PACKING_DENSITY * 100, 2)}%</span>。色は層(A・B・C)の違いです。
          </Readout>
        </div>
      </Viewport3D>
    </Frame>
  );
}

function HyperboloidView({ entry }: { entry: Extract<Shape3DEntry, { kind: "hyperboloid" }> }) {
  const [twist, setTwist] = useState(entry.twist);
  const params = useMemo(() => ({ twist }), [twist]);
  return (
    <Frame entry={entry}>
      <Viewport3D scene={hyperboloidScene} params={params} label="直線で作る一葉双曲面" distance={6}>
        <div className={styles.controls}>
          <RangeRow label="ひねり" min={0} max={150} step={1} value={twist} onChange={setTwist} format={(v) => `${v}°`} />
          <Readout>
            上の円を <span className="num">{twist}°</span> ひねって、60本の直線で結んでいます。{twist === 0 ? "ひねりが0°なら円柱です。" : "くびれた曲面の輪郭が、直線だけで現れます。"}
          </Readout>
        </div>
      </Viewport3D>
    </Frame>
  );
}

function TreeView({ entry }: { entry: Shape3DEntry }) {
  const [depth, setDepth] = useState(4);
  const [spread, setSpread] = useState(35);
  const params = useMemo(() => ({ depth, spread }), [depth, spread]);
  return (
    <Frame entry={entry}>
      <Viewport3D scene={treeScene} params={params} label="3次元のフラクタルツリー" distance={6}>
        <div className={styles.controls}>
          <RangeRow label="段数" min={1} max={6} step={1} value={depth} onChange={setDepth} format={(v) => `${v}段`} />
          <RangeRow label="開き角" min={15} max={60} step={1} value={spread} onChange={setSpread} format={(v) => `${v}°`} />
          <Readout>
            {depth}段: 枝 <span className="num">{((3 ** (depth + 1) - 1) / 2).toLocaleString()}</span> 本(1本が3本に分かれ、長さは 0.7 倍)。
          </Readout>
        </div>
      </Viewport3D>
    </Frame>
  );
}

function BezierView({ entry }: { entry: Shape3DEntry }) {
  const [t, setT] = useState(0.4);
  const params = useMemo(() => ({ t }), [t]);
  return (
    <Frame entry={entry}>
      <Viewport3D scene={bezierScene} params={params} label="3次ベジェ曲線とド・カステリョの作図" distance={6} autoRotate={false}>
        <div className={styles.controls}>
          <RangeRow label="割合 t" min={0} max={1} step={0.01} value={t} onChange={setT} format={(v) => fmt(v, 2)} />
          <Readout>
            t = <span className="num">{fmt(t, 2)}</span>: 灰色の線が制御点を結ぶ線、青・緑の線が内分した線分、強調色の大きい点が曲線上の点です。
          </Readout>
        </div>
      </Viewport3D>
    </Frame>
  );
}

function GoldenView({ entry }: { entry: Shape3DEntry }) {
  const [icosa, setIcosa] = useState(false);
  const params = useMemo(() => ({ icosahedron: icosa }), [icosa]);
  return (
    <Frame entry={entry}>
      <Viewport3D scene={goldenScene} params={params} label="3枚の黄金長方形と正二十面体" distance={7}>
        <div className={styles.controls}>
          <Toggle label="正二十面体の辺を重ねる" pressed={icosa} onChange={setIcosa} />
          <Readout>
            長方形の縦横比は 1 : <span className="num">{PHI.toFixed(3)}</span>。12個の頂点を、距離が同じ(辺の長さ2)の頂点どうしで結ぶと、辺が30本の正二十面体になります。
          </Readout>
        </div>
      </Viewport3D>
    </Frame>
  );
}

/** 図形のid → 3D表示。登録(SHAPE_3D)がなければ何も出さない。 */
export function Shape3DVisualizer({ shapeId }: Props) {
  const entry = SHAPE_3D[shapeId];
  if (!entry) return null;
  switch (entry.kind) {
    case "solids":
      return <SolidsView key={shapeId} entry={entry} />;
    case "cube-net":
      return <CubeNetView key={shapeId} entry={entry} />;
    case "fractal-cubes":
      return <FractalCubesView key={shapeId} entry={entry} />;
    case "sierpinski":
      return <SierpinskiView key={shapeId} entry={entry} />;
    case "hilbert":
      return <HilbertView key={shapeId} entry={entry} />;
    case "phyllotaxis":
      return <PhyllotaxisView key={shapeId} entry={entry} />;
    case "shell":
      return <ShellView key={shapeId} entry={entry} />;
    case "lissajous":
      return <LissajousView key={shapeId} entry={entry} />;
    case "conic":
      return <ConicView key={shapeId} entry={entry} />;
    case "packing":
      return <PackingView key={shapeId} entry={entry} />;
    case "hyperboloid":
      return <HyperboloidView key={shapeId} entry={entry} />;
    case "tree":
      return <TreeView key={shapeId} entry={entry} />;
    case "bezier":
      return <BezierView key={shapeId} entry={entry} />;
    case "golden":
      return <GoldenView key={shapeId} entry={entry} />;
    case "hull-solids":
      return <HullSolidsView key={shapeId} entry={entry} />;
    case "space-filling":
      return <SpaceFillingView key={shapeId} entry={entry} />;
    case "revolve":
      return <RevolveView key={shapeId} entry={entry} />;
    case "archimedes":
      return <ArchimedesView key={shapeId} entry={entry} />;
    case "cavalieri":
      return <CavalieriView key={shapeId} entry={entry} />;
    case "box-diagonal":
      return <BoxDiagonalView key={shapeId} entry={entry} />;
    case "catenoid":
      return <CatenoidView key={shapeId} entry={entry} />;
    case "helix":
      return <HelixView key={shapeId} entry={entry} />;
    case "isometric":
      return <IsometricView key={shapeId} entry={entry} />;
  }
}
