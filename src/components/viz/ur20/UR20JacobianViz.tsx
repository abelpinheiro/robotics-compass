"use client";

import { useState } from "react";
import { Viz3D } from "@/components/viz/Viz3D";
import { VizFrame } from "@/components/viz/VizFrame";
import UrdfArmScene from "@/components/playground/UrdfArmScene";
import { ur20FK, UR20_HOME, UR20_WMAX } from "@/components/playground/ur20Math";
import { ellipsoidFromCols, linearSingularValues } from "@/components/playground/manipEllipsoid";
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
  "rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-2";

export default function UR20JacobianViz() {
  const [theta, setTheta] = useState<number[]>(UR20_HOME);
  const setJoint = (i: number, v: number) => setTheta((t) => t.map((x, k) => (k === i ? v : x)));

  const pose = ur20FK(theta);
  const ellipsoid = ellipsoidFromCols(pose.cols, pose.ee);
  const [s1, s2, s3] = linearSingularValues(pose.cols);
  const cond = s3 > 1e-6 ? s1 / s3 : Infinity;
  const wFrac = Math.max(0, Math.min(1, Math.sqrt(pose.w / UR20_WMAX)));

  const description =
    `The UR20 posed at θ₁…θ₆ = ${theta.map(deg).join("°, ")}°, with its velocity ` +
    `manipulability ellipsoid drawn at the tool. The ellipsoid is the image of the linear ` +
    `Jacobian Jᵥ over unit-norm joint rates — the set of tool velocities reachable for a given ` +
    `joint-speed budget. Its semi-axes are the singular values of Jᵥ: σ₁ = ${fmt3(s1)}, ` +
    `σ₂ = ${fmt3(s2)}, σ₃ = ${fmt3(s3)} m per unit joint rate (long axis = easiest direction to ` +
    `move, short axis = hardest). The condition number σ₁/σ₃ = ${Number.isFinite(cond) ? cond.toFixed(1) : "∞"} ` +
    `and the Yoshikawa index w = |det J| = ${fmt3(pose.w)}. As the arm nears a position singularity σ₃ → 0 ` +
    `and the ellipsoid flattens toward a disc or line; w (the full 6-DOF measure) also vanishes at ` +
    `orientation singularities, where this linear ellipsoid can still look full.`;

  return (
    <VizFrame
      title="Velocity kinematics: the Jacobian and its ellipsoid"
      caption="The Jacobian J(q) maps joint rates to tool twist, [v; ω] = J q̇. The green surface is the velocity manipulability ellipsoid — tool velocities reachable for unit-norm joint rates. Its semi-axes are the singular values of the linear block Jᵥ; it stretches toward directions the arm moves easily and flattens near singularities."
      textAlternative={description}
      controls={
        <div className="flex w-full flex-col gap-3">
          <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {theta.map((v, i) => (
              <Slider key={i} label={`θ${["₁", "₂", "₃", "₄", "₅", "₆"][i]}`} value={v} onChange={(nv) => setJoint(i, nv)} />
            ))}
          </div>
          <button type="button" className={`${btn} w-fit`} onClick={() => setTheta(UR20_HOME)}>
            Reset
          </button>
        </div>
      }
    >
      <Viz3D aspectRatio={16 / 10}>
        <UrdfArmScene config={UR20_CONFIG} theta={theta} ellipsoid={ellipsoid} />
      </Viz3D>

      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-3">
          <span className="w-40 text-xs font-medium uppercase tracking-wide text-faint">Manipulability w</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-success transition-[width] duration-150" style={{ width: `${wFrac * 100}%` }} />
          </div>
          <span className="w-16 text-right font-mono text-sm tabular-nums">{fmt3(pose.w)}</span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-sm tabular-nums text-muted">
          <span>σ₁ = {fmt3(s1)}</span>
          <span>σ₂ = {fmt3(s2)}</span>
          <span>σ₃ = {fmt3(s3)}</span>
          <span>cond = σ₁/σ₃ = {Number.isFinite(cond) ? cond.toFixed(1) : "∞"}</span>
        </div>
      </div>
    </VizFrame>
  );
}
