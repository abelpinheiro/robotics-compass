"use client";

import { useState } from "react";
import { Viz3D } from "@/components/viz/Viz3D";
import { VizFrame } from "@/components/viz/VizFrame";
import UrdfArmScene from "@/components/playground/UrdfArmScene";
import {
  ur20FK,
  ur20Singularity,
  UR20_HOME,
  UR20_WMAX,
  UR20_SINGULARITIES,
} from "@/components/playground/ur20Math";
import { ellipsoidFromCols } from "@/components/playground/manipEllipsoid";
import { ManipHeatmap } from "@/components/playground/ManipHeatmap";
import { UR20_CONFIG } from "./config";

const deg = (r: number) => Math.round((r * 180) / Math.PI);
const fmt3 = (n: number) => (Math.abs(n) < 5e-4 ? 0 : n).toFixed(3);

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span className="w-10 tabular-nums">{label}</span>
      <input
        type="range"
        min={-Math.PI}
        max={Math.PI}
        step={0.02}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-accent"
        aria-valuetext={`${deg(value)}°`}
      />
      <span className="w-12 tabular-nums text-foreground">{deg(value)}°</span>
    </label>
  );
}

const btn =
  "rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface-2";

export default function UR20SingularityViz() {
  const [theta, setTheta] = useState<number[]>(UR20_HOME);
  const setJoint = (i: number, v: number) => setTheta((t) => t.map((x, k) => (k === i ? v : x)));

  const pose = ur20FK(theta);
  const ellipsoid = ellipsoidFromCols(pose.cols, pose.ee);
  const singularLabel = ur20Singularity(theta);
  const isSingular = singularLabel !== null;
  const wFrac = Math.max(0, Math.min(1, Math.sqrt(pose.w / UR20_WMAX)));

  const description =
    `The UR20 posed at θ₁…θ₆ = ${theta.map(deg).join("°, ")}°, with the Yoshikawa manipulability ` +
    `index w = |det J| = ${fmt3(pose.w)} and det J = ${fmt3(pose.detJ)}. ` +
    (isSingular
      ? `This configuration is singular (${singularLabel}): the Jacobian has lost rank, so the tool ` +
        `cannot move or reorient in at least one direction. At the elbow and shoulder families the ` +
        `linear velocity ellipsoid also flattens to a disc or line; the wrist family is an orientation ` +
        `loss, so w → 0 while the linear ellipsoid can still look full.`
      : `This configuration is well away from any singularity.`) +
    ` The presets jump to the UR20's three singularity families — wrist (θ₅ = 0), elbow (arm ` +
    `straight, θ₃ = 0), and shoulder (wrist centre over the base axis). The heatmap plots w over a ` +
    `2-joint slice of configuration space; the dark curves are the singular manifolds where w → 0.`;

  return (
    <VizFrame
      title="Singularities & workspace: where the Jacobian loses rank"
      caption="A configuration is singular when det J = 0, i.e. w = 0: the arm can no longer produce tool velocity in some direction. Jump to each of the UR20's three singularity families with the presets, or read the singular curves (w → 0, dark) directly off the manipulability heatmap."
      textAlternative={description}
      controls={
        <div className="flex w-full flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {UR20_SINGULARITIES.map((s) => (
              <button key={s.key} type="button" className={btn} onClick={() => setTheta(s.theta)}>
                {s.label}
              </button>
            ))}
            <button type="button" className={btn} onClick={() => setTheta(UR20_HOME)}>
              Reset
            </button>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {theta.map((v, i) => (
              <Slider key={i} label={`θ${["₁", "₂", "₃", "₄", "₅", "₆"][i]}`} value={v} onChange={(nv) => setJoint(i, nv)} />
            ))}
          </div>
        </div>
      }
    >
      <Viz3D aspectRatio={16 / 10}>
        <UrdfArmScene config={UR20_CONFIG} theta={theta} ellipsoid={ellipsoid} />
      </Viz3D>

      <div className="mt-3 space-y-3">
        <div className="flex items-center gap-3">
          <span className="w-40 text-xs font-medium uppercase tracking-wide text-faint">Manipulability w</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-[width] duration-150"
              style={{ width: `${wFrac * 100}%`, background: isSingular ? "var(--danger)" : "var(--success)" }}
            />
          </div>
          <span className="w-16 text-right font-mono text-sm tabular-nums">{fmt3(pose.w)}</span>
          {isSingular && (
            <span className="rounded-md px-2 py-0.5 text-xs font-bold text-white" style={{ background: "var(--danger)" }}>
              ⚠ {singularLabel}
            </span>
          )}
        </div>
        <ManipHeatmap fk={ur20FK} theta={theta} jointCount={theta.length} />
      </div>
    </VizFrame>
  );
}
