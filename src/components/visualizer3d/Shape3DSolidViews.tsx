"use client";

import { useMemo, useState, type ReactNode } from "react";
import styles from "./Visual3D.module.css";
import { ChoiceRow, RangeRow, Readout, Toggle } from "./Controls";
import { Viewport3D } from "./Viewport3D";
import {
  archimedesScene,
  boxDiagonalScene,
  catenoidScene,
  cavalieriScene,
  FOLD_COLOR,
  helixScene,
  hullSolidScene,
  isometricScene,
  revolveScene,
  SIDES_COLOR,
  spaceFillingScene,
  type RevolveProfile,
} from "./solid-scenes";
import { faceBreakdown, HULL_SOLIDS, rotationAxes, rotationGroupOrder, solidHull, type HullSolidId, type SpaceFiller } from "@/lib/geometry3d/hull";
import type { Shape3DEntry } from "@/lib/shape-3d";

/** 凸包の立体・空間充填・回転体・体積・断面・直方体・カテノイド・ヘリックス・アイソメの3D表示。 */

const PLATONIC_IDS: HullSolidId[] = ["tetrahedron", "cube", "octahedron", "dodecahedron", "icosahedron"];
const fmt = (n: number, d = 2) => n.toFixed(d);

function Frame({ entry, children }: { entry: Shape3DEntry; children: ReactNode }) {
  return (
    <div className={styles.wrap}>
      <h3 className={styles.title}>{entry.title}</h3>
      <p className={styles.note}>{entry.note}</p>
      {children}
    </div>
  );
}

function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <ul className={styles.legend} aria-label="色の凡例">
      {items.map((i) => (
        <li key={i.label} className={styles.legendItem}>
          <span style={{ width: 12, height: 12, background: i.color, display: "inline-block", borderRadius: 2 }} aria-hidden="true" />
          <span>{i.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function HullSolidsView({ entry }: { entry: Extract<Shape3DEntry, { kind: "hull-solids" }> }) {
  const [solid, setSolid] = useState<HullSolidId>(entry.initial);
  const [dual, setDual] = useState(entry.dual);
  const [axes, setAxes] = useState(entry.axes);
  const params = useMemo(() => ({ solid, dual, axes }), [solid, dual, axes]);
  const hull = solidHull(solid);
  const spec = HULL_SOLIDS.find((s) => s.id === solid)!;
  const breakdown = faceBreakdown(hull);
  const ax = axes ? rotationAxes(hull) : [];
  const folds = [...new Set(ax.map((a) => a.fold))].sort((a, b) => b - a);
  // 中心対称(すべての頂点 v に対して −v も頂点): 点対称
  const centrosymmetric = hull.vertices.every((v) => hull.vertices.some((w) => Math.hypot(v[0] + w[0], v[1] + w[1], v[2] + w[2]) < 1e-6));
  const regular = PLATONIC_IDS.includes(solid);
  return (
    <Frame entry={entry}>
      <Viewport3D scene={hullSolidScene} params={params} label={`${spec.name}の3Dモデル`} distance={5.4}>
        <div className={styles.controls}>
          <ChoiceRow label="立体" value={solid} onChange={setSolid} options={entry.solids.map((id) => ({ value: id, label: HULL_SOLIDS.find((s) => s.id === id)!.name }))} />
          <div className={styles.row}>
            <Toggle label="双対(面の中心を結ぶ)を重ねる" pressed={dual} onChange={setDual} />
            <Toggle label="回転の軸を出す" pressed={axes} onChange={setAxes} />
          </div>
          <Readout>
            {spec.name}: 頂点 <span className="num">{hull.vertices.length}</span> − 辺 <span className="num">{hull.edges.length}</span> + 面{" "}
            <span className="num">{hull.faces.length}</span> = <span className="num">{hull.vertices.length - hull.edges.length + hull.faces.length}</span>
            (面: {breakdown.map((b) => `${b.sides}角形×${b.count}`).join(" + ")})
          </Readout>
          {axes ? (
            <Readout>
              回転の軸:{" "}
              {folds.map((f) => `${f}回軸 ${ax.filter((a) => a.fold === f).length}本`).join("、")}
              {regular ? (
                <>
                  。恒等も入れた回転の数(回転群の位数)は <span className="num">{rotationGroupOrder(ax)}</span>
                </>
              ) : null}
              。点対称(中心対称): <span className="num">{centrosymmetric ? "あり" : "なし"}</span>
            </Readout>
          ) : null}
          <Legend
            items={[
              ...breakdown.map((b) => ({ color: SIDES_COLOR[b.sides] ?? "#999", label: `${b.sides}角形の面` })),
              ...(axes ? folds.map((f) => ({ color: FOLD_COLOR[f] ?? "#999", label: `${f}回軸` })) : []),
            ]}
          />
        </div>
      </Viewport3D>
    </Frame>
  );
}

const FILLERS: { value: SpaceFiller; label: string }[] = [
  { value: "cube", label: "立方体" },
  { value: "truncated-octahedron", label: "切頂八面体" },
  { value: "rhombic-dodecahedron", label: "菱形十二面体" },
];

export function SpaceFillingView({ entry }: { entry: Shape3DEntry }) {
  const [kind, setKind] = useState<SpaceFiller>("truncated-octahedron");
  const [cluster, setCluster] = useState(true);
  const [gap, setGap] = useState(1);
  const params = useMemo(() => ({ kind, cluster, gap }), [kind, cluster, gap]);
  const hull = solidHull(kind);
  return (
    <Frame entry={entry}>
      <Viewport3D scene={spaceFillingScene} params={params} label="同じ立体で空間を埋める" distance={7}>
        <div className={styles.controls}>
          <ChoiceRow label="立体" value={kind} onChange={setKind} options={FILLERS} />
          <Toggle label="並べて塊にする(切ると1個)" pressed={cluster} onChange={setCluster} />
          {cluster ? <RangeRow label="すき間" min={1} max={1.6} step={0.01} value={gap} onChange={setGap} format={(v) => `×${fmt(v)}`} /> : null}
          <Readout>
            {FILLERS.find((f) => f.value === kind)!.label}(面{hull.faces.length}枚): 同じ立体だけで、すき間なく空間を埋められます。「すき間」を広げると、1個ずつ離れて見えます。
          </Readout>
          <Legend items={[...new Set(hull.faces.map((f) => f.length))].map((n) => ({ color: SIDES_COLOR[n] ?? "#999", label: `${n}角形の面` }))} />
        </div>
      </Viewport3D>
    </Frame>
  );
}

const PROFILES: { value: RevolveProfile; label: string; solid: string; volume: string }[] = [
  { value: "cylinder", label: "長方形", solid: "円柱", volume: "2π" },
  { value: "cone", label: "直角三角形", solid: "円錐", volume: "2π/3" },
  { value: "sphere", label: "半円", solid: "球", volume: "4π/3" },
  { value: "frustum", label: "台形", solid: "円錐台", volume: "7π/6" },
  { value: "paraboloid", label: "放物線で囲んだ図形", solid: "回転放物体(お椀)", volume: "π" },
];

export function RevolveView({ entry }: { entry: Shape3DEntry }) {
  const [profile, setProfile] = useState<RevolveProfile>("sphere");
  const [sweep, setSweep] = useState(0.75);
  const params = useMemo(() => ({ profile, sweep }), [profile, sweep]);
  const p = PROFILES.find((x) => x.value === profile)!;
  return (
    <Frame entry={entry}>
      <Viewport3D scene={revolveScene} params={params} label="平面図形を回して作る立体" distance={6} autoRotate={false}>
        <div className={styles.controls}>
          <ChoiceRow label="回す図形" value={profile} onChange={setProfile} options={PROFILES.map((x) => ({ value: x.value, label: x.label }))} />
          <RangeRow label="回転" min={0} max={1} step={0.01} value={sweep} onChange={setSweep} format={(v) => `${Math.round(v * 360)}°`} />
          <Readout>
            {p.label}を、軸のまわりに {Math.round(sweep * 360)}° 回すと、{p.solid}の一部になります(360°で完成)。底の半径1・高さ2のとき、体積は <span className="num">{p.volume}</span>。
          </Readout>
        </div>
      </Viewport3D>
    </Frame>
  );
}

export function ArchimedesView({ entry }: { entry: Shape3DEntry }) {
  const [nested, setNested] = useState(false);
  const params = useMemo(() => ({ nested }), [nested]);
  return (
    <Frame entry={entry}>
      <Viewport3D scene={archimedesScene} params={params} label="円錐・球・円柱の体積の比" distance={6.5}>
        <div className={styles.controls}>
          <Toggle label="円柱に球を入れる" pressed={nested} onChange={setNested} />
          <Readout>
            底の半径 r・高さ 2r のとき、円錐 <span className="num">2πr³/3</span>、球 <span className="num">4πr³/3</span>、円柱 <span className="num">2πr³</span>。体積の比は{" "}
            <span className="num">1 : 2 : 3</span>(円柱 = 球 + 円錐)。
          </Readout>
        </div>
      </Viewport3D>
    </Frame>
  );
}

export function CavalieriView({ entry }: { entry: Shape3DEntry }) {
  const [h, setH] = useState(0.5);
  const params = useMemo(() => ({ h }), [h]);
  const area = Math.PI * (1 - h * h);
  return (
    <Frame entry={entry}>
      <Viewport3D scene={cavalieriScene} params={params} label="半球と、円柱から円錐をくり抜いた立体の断面" distance={7} autoRotate={false}>
        <div className={styles.controls}>
          <RangeRow label="切る高さ" min={0} max={1} step={0.01} value={h} onChange={setH} format={(v) => `h=${fmt(v)}`} />
          <Readout>
            高さ h=<span className="num">{fmt(h)}</span> の断面積: 半球の円 π(1−h²) = <span className="num">{fmt(area, 3)}</span>、円柱−円錐の円環 π(1−h²) = <span className="num">{fmt(area, 3)}</span>。どの高さでも等しいので、体積も等しくなります。
          </Readout>
        </div>
      </Viewport3D>
    </Frame>
  );
}

export function BoxDiagonalView({ entry }: { entry: Shape3DEntry }) {
  const [a, setA] = useState(2);
  const [b, setB] = useState(1.5);
  const [c, setC] = useState(1);
  const params = useMemo(() => ({ a, b, c }), [a, b, c]);
  const base = Math.hypot(a, b);
  return (
    <Frame entry={entry}>
      <Viewport3D scene={boxDiagonalScene} params={params} label="直方体の空間の対角線" distance={7}>
        <div className={styles.controls}>
          <RangeRow label="縦 a" min={0.5} max={3} step={0.1} value={a} onChange={setA} format={(v) => fmt(v, 1)} />
          <RangeRow label="横 b" min={0.5} max={3} step={0.1} value={b} onChange={setB} format={(v) => fmt(v, 1)} />
          <RangeRow label="高さ c" min={0.5} max={3} step={0.1} value={c} onChange={setC} format={(v) => fmt(v, 1)} />
          <Readout>
            底面の対角線(青) √(a²+b²) = <span className="num">{fmt(base, 3)}</span>。これと高さ c(緑)で直角三角形をつくると、空間の対角線(赤) d = √(a²+b²+c²) = <span className="num">{fmt(Math.hypot(base, c), 3)}</span>。三平方の定理を2回使います。
          </Readout>
        </div>
      </Viewport3D>
    </Frame>
  );
}

export function CatenoidView({ entry }: { entry: Shape3DEntry }) {
  const [a, setA] = useState(0.6);
  const params = useMemo(() => ({ a }), [a]);
  return (
    <Frame entry={entry}>
      <Viewport3D scene={catenoidScene} params={params} label="懸垂線を回してつくるカテノイド" distance={6}>
        <div className={styles.controls}>
          <RangeRow label="くびれの半径 a" min={0.3} max={1.2} step={0.01} value={a} onChange={setA} format={(v) => fmt(v)} />
          <Readout>
            断面の曲線は懸垂線 r = a·cosh(z/a)(黒)。これを軸のまわりに回した曲面がカテノイドで、二重の輪をつなぐ石けん膜がつくる形(最小曲面)です。
          </Readout>
        </div>
      </Viewport3D>
    </Frame>
  );
}

export function HelixView({ entry }: { entry: Shape3DEntry }) {
  const [pitch, setPitch] = useState(0.8);
  const [turns, setTurns] = useState(3);
  const params = useMemo(() => ({ pitch, turns }), [pitch, turns]);
  const oneTurn = Math.hypot(2 * Math.PI, pitch);
  return (
    <Frame entry={entry}>
      <Viewport3D scene={helixScene} params={params} label="円柱に巻きつくつる巻き線" distance={6}>
        <div className={styles.controls}>
          <RangeRow label="ピッチ(1周の上り)" min={0.2} max={2} step={0.05} value={pitch} onChange={setPitch} format={(v) => fmt(v)} />
          <RangeRow label="巻き数" min={1} max={5} step={1} value={turns} onChange={setTurns} format={(v) => `${v}周`} />
          <Readout>
            半径 1 のとき、1周ぶんの長さは √((2π)²+ピッチ²) = <span className="num">{fmt(oneTurn, 3)}</span>。円柱を切り開くと、つる巻き線は斜めの直線になります。
          </Readout>
        </div>
      </Viewport3D>
    </Frame>
  );
}

export function IsometricView({ entry }: { entry: Shape3DEntry }) {
  const [size, setSize] = useState(3);
  const params = useMemo(() => ({ size }), [size]);
  let count = 0;
  for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) count += size - Math.max(i, j);
  return (
    <Frame entry={entry}>
      <Viewport3D scene={isometricScene} params={params} label="階段状に積んだ立方体の等角投影" distance={6.5} initialView="iso" autoRotate={false}>
        <div className={styles.controls}>
          <RangeRow label="段数" min={1} max={5} step={1} value={size} onChange={setSize} format={(v) => `${v}段`} />
          <Readout>
            立方体 <span className="num">{count}</span> 個。「等角」の視点では、3方向の面がすべて同じ形の菱形に見え、平面ではひし形の敷き詰め(菱形タイリング)になります。ほかの視点に回すと、立体であることが分かります。
          </Readout>
        </div>
      </Viewport3D>
    </Frame>
  );
}
