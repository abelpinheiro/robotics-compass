"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { MatrixDisplay } from "@/components/viz/MatrixDisplay";
import { Viz3D } from "@/components/viz/Viz3D";
import { VizFrame } from "@/components/viz/VizFrame";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import BoxInertiaScene from "./BoxInertiaScene";
import { InertiaSlider } from "./InertiaSlider";
import {
  add3,
  boxTensor,
  fixedXYZ,
  momentAboutAxis,
  parallelAxisTerm,
  principalAxes,
  rotateTensor,
  unitVector,
} from "./inertiaMath";
import type { Vec3 } from "./inertiaMath";
import { boxStrings } from "./strings";
import type { BoxGroup } from "./strings";

const GROUPS: BoxGroup[] = ["box", "position", "orientation", "axis"];
const AXES = ["X", "Y", "Z"] as const;
const SIDES = ["a", "b", "c"] as const;

const INIT = {
  m: 6,
  sides: [1.2, 0.6, 0.3] as Vec3,
  position: [0, 0, 0] as Vec3,
  /** degrees */
  angles: [0, 0, 0] as Vec3,
  azimuth: 45,
  elevation: 45,
};

const rad = (d: number) => (d * Math.PI) / 180;
const fmt = (v: number, digits = 3) => (Math.abs(v) < 0.5 * 10 ** -digits ? 0 : v).toFixed(digits);
const list = (vs: readonly number[], digits = 3) => `(${vs.map((v) => fmt(v, digits)).join(", ")})`;
const withAt = (v: Vec3, i: number, x: number): Vec3 => v.map((old, k) => (k === i ? x : old)) as Vec3;

function Term({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <span className="flex flex-col gap-1">
      <span className="whitespace-nowrap text-xs text-muted">{label}</span>
      {children}
    </span>
  );
}

const btn = "rounded-md border px-3 py-1.5 text-sm font-medium";

export default function BoxInertiaViz() {
  const { locale, t } = useLocale();
  const s = boxStrings[locale];
  const [p, setP] = useState(INIT);
  const [group, setGroup] = useState<BoxGroup>("box");
  const [showPrincipal, setShowPrincipal] = useState(true);
  const set = (patch: Partial<typeof INIT>) => setP((prev) => ({ ...prev, ...patch }));

  const angles = p.angles.map(rad) as Vec3;
  const atCentre = rotateTensor(fixedXYZ(...angles), boxTensor(p.m, ...p.sides));
  const shift = parallelAxisTerm(p.m, p.position);
  const I = add3(atCentre, shift);
  const { moments, axes, repeated } = principalAxes(I);
  const n = unitVector(rad(p.azimuth), rad(p.elevation));
  const In = momentAboutAxis(I, n);
  const products = [-I[0][1], -I[0][2], -I[1][2]];

  return (
    <VizFrame
      title={s.title}
      caption={s.caption}
      textAlternative={s.description({
        m: p.m.toFixed(1),
        sides: list(p.sides, 2),
        position: list(p.position, 2),
        angles: `(${p.angles.map((v) => `${v}°`).join(", ")})`,
        diagonal: list([I[0][0], I[1][1], I[2][2]]),
        products: list(products),
        moments: list(moments),
        n: list(n, 2),
        axisMoment: fmt(In),
        repeated,
      })}
      controls={
        <div className="flex w-full flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={s.groupLabel}>
            {GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={g === group}
                onClick={() => setGroup(g)}
                className={`${btn} ${
                  g === group
                    ? "border-accent bg-accent-weak text-accent"
                    : "border-border bg-surface text-foreground hover:bg-surface-2"
                }`}
              >
                {s.groups[g]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {group === "box" && (
              <>
                {SIDES.map((name, i) => (
                  <InertiaSlider key={name} label={`${name} (${AXES[i]})`} ariaLabel={`${name}, ${s.side(AXES[i])}`} value={p.sides[i]} min={0.1} max={1.6} step={0.05} display={`${p.sides[i].toFixed(2)} m`} onChange={(v) => set({ sides: withAt(p.sides, i, v) })} />
                ))}
                <InertiaSlider label={`m (${s.mass})`} ariaLabel={s.mass} value={p.m} min={0.5} max={12} step={0.5} display={`${p.m.toFixed(1)} kg`} onChange={(m) => set({ m })} />
              </>
            )}
            {group === "position" &&
              AXES.map((name, i) => (
                <InertiaSlider key={name} label={<>{name.toLowerCase()}<sub>c</sub></>} ariaLabel={s.positionOf(name)} value={p.position[i]} min={-1} max={1} step={0.05} display={`${fmt(p.position[i], 2)} m`} onChange={(v) => set({ position: withAt(p.position, i, v) })} />
              ))}
            {group === "orientation" &&
              AXES.map((name, i) => (
                <InertiaSlider key={name} label={s.rotationShort(name)} ariaLabel={s.rotationAbout(name)} value={p.angles[i]} min={-180} max={180} step={5} display={`${p.angles[i]}°`} onChange={(v) => set({ angles: withAt(p.angles, i, v) })} />
              ))}
            {group === "axis" && (
              <>
                <InertiaSlider label={s.azimuth} ariaLabel={s.azimuth} value={p.azimuth} min={-180} max={180} step={5} display={`${p.azimuth}°`} onChange={(azimuth) => set({ azimuth })} />
                <InertiaSlider label={s.elevation} ariaLabel={s.elevation} value={p.elevation} min={-90} max={90} step={5} display={`${p.elevation}°`} onChange={(elevation) => set({ elevation })} />
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" checked={showPrincipal} onChange={(e) => setShowPrincipal(e.target.checked)} className="accent-accent" />
              {s.showPrincipal}
            </label>
            <button
              type="button"
              onClick={() => setP(INIT)}
              className={`${btn} border-border bg-surface text-foreground hover:bg-surface-2`}
            >
              {t.viz.reset}
            </button>
          </div>
        </div>
      }
    >
      <Viz3D aspectRatio={16 / 10}>
        <BoxInertiaScene sides={p.sides} position={p.position} angles={angles} principal={showPrincipal ? axes : null} n={n} />
      </Viz3D>

      <div className="mt-3 space-y-3 overflow-x-auto text-sm">
        <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
          <Term label={<><sup>A</sup>I (kg·m²)</>}>
            <MatrixDisplay rows={I} digits={3} ariaLabel={s.tensorName} />
          </Term>
          <span className="self-center pt-4 text-muted">=</span>
          <Term label={<>R <sup>C</sup>I R<sup>T</sup></>}>
            <MatrixDisplay rows={atCentre} digits={3} ariaLabel={s.centroidal} />
          </Term>
          <span className="self-center pt-4 text-muted">+</span>
          <Term label={<>m(P<sub>C</sub><sup>T</sup>P<sub>C</sub> 1₃ − P<sub>C</sub>P<sub>C</sub><sup>T</sup>)</>}>
            <MatrixDisplay rows={shift} digits={3} ariaLabel={s.translation} />
          </Term>
        </div>
        <dl className="space-y-1 text-muted">
          <div>
            <dt className="inline">{s.products}: </dt>
            <dd className="inline font-mono tabular-nums text-foreground">
              I<sub>xy</sub>, I<sub>xz</sub>, I<sub>yz</sub> = {list(products)}
            </dd>
          </div>
          <div>
            <dt className="inline">{s.principalMoments}: </dt>
            <dd className="inline font-mono tabular-nums text-foreground">I₁, I₂, I₃ = {list(moments)}</dd>
          </div>
          <div>
            <dt className="inline">{s.axisMoment}: </dt>
            <dd className="inline font-mono tabular-nums text-foreground">
              n̂<sup>T</sup> <sup>A</sup>I n̂ = {fmt(In)}
            </dd>
          </div>
        </dl>
        {repeated && <p className="text-xs text-muted">{s.repeated}</p>}
      </div>
    </VizFrame>
  );
}
