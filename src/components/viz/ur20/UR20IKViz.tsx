"use client";

import { useEffect, useRef, useState } from "react";
import { Viz3D } from "@/components/viz/Viz3D";
import { VizFrame } from "@/components/viz/VizFrame";
import UrdfArmScene from "@/components/playground/UrdfArmScene";
import { ur20FK, UR20_HOME, type Vec3 } from "@/components/playground/ur20Math";
import { ur20IkSolve } from "./ur20Ik";
import { UR20_CONFIG } from "./config";

const fmt = (n: number) => (Math.abs(n) < 5e-4 ? 0 : n).toFixed(3);
const INIT_TARGET: Vec3 = [1.0, 0.2, 0.6];
const REACHED = 0.02; // m

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span className="w-24 tabular-nums">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-accent"
        aria-valuetext={`${value.toFixed(2)} m`}
      />
      <span className="w-16 tabular-nums text-foreground">{value.toFixed(2)} m</span>
    </label>
  );
}

const btn =
  "rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-2";

export default function UR20IKViz() {
  const [target, setTarget] = useState<Vec3>(INIT_TARGET);
  const [q, setQ] = useState<number[]>(() => ur20IkSolve(UR20_HOME, INIT_TARGET).q);
  const qRef = useRef<number[]>(q);

  // Re-solve (warm-started) whenever the target moves.
  useEffect(() => {
    const { q: nq } = ur20IkSolve(qRef.current, target);
    qRef.current = nq;
    setQ(nq);
  }, [target]);

  const ee = ur20FK(q).ee;
  const err = Math.hypot(ee[0] - target[0], ee[1] - target[1], ee[2] - target[2]);
  const reached = err < REACHED;
  const setT = (i: number, v: number) => setTarget((t) => t.map((x, k) => (k === i ? v : x)) as Vec3);

  const description =
    `The UR20 solving inverse kinematics for a target the pink marker at ` +
    `(${fmt(target[0])}, ${fmt(target[1])}, ${fmt(target[2])}) m. Starting from its current pose, ` +
    `the arm iterates the damped-least-squares update q ← q + Jᵥᵀ(Jᵥ·Jᵥᵀ + λ²I)⁻¹·Δx until the ` +
    `tool reaches the marker. Current residual ‖Δx‖ = ${fmt(err)} m — ` +
    (reached ? `target reached.` : `the target is outside the reachable workspace, so a residual remains.`);

  return (
    <VizFrame
      title="Inverse kinematics: reach a target"
      caption="Move the target (pink marker); the arm solves for the joint angles numerically by damped least squares — q ← q + Jᵥᵀ(Jᵥ·Jᵥᵀ + λ²I)⁻¹·Δx — iterating until the tool reaches it. If the marker is outside the workspace, a residual remains."
      textAlternative={description}
      controls={
        <div className="flex w-full flex-col gap-3">
          <div className="flex flex-wrap gap-x-6 gap-y-1.5">
            <Slider label="target x" value={target[0]} min={-1.7} max={1.7} onChange={(v) => setT(0, v)} />
            <Slider label="target y" value={target[1]} min={-1.7} max={1.7} onChange={(v) => setT(1, v)} />
            <Slider label="target z" value={target[2]} min={0} max={1.8} onChange={(v) => setT(2, v)} />
          </div>
          <button type="button" className={`${btn} w-fit`} onClick={() => setTarget(INIT_TARGET)}>
            Reset target
          </button>
        </div>
      }
    >
      <Viz3D aspectRatio={16 / 10}>
        <UrdfArmScene config={UR20_CONFIG} theta={q} marker={target} />
      </Viz3D>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <span className="font-mono tabular-nums">tool: ({fmt(ee[0])}, {fmt(ee[1])}, {fmt(ee[2])}) m</span>
        <span className="font-mono tabular-nums">residual ‖Δx‖ = {fmt(err)} m</span>
        <span
          className="rounded-md px-2 py-0.5 text-xs font-bold text-white"
          style={{ background: reached ? "var(--success)" : "var(--warning)" }}
        >
          {reached ? "target reached" : "out of reach"}
        </span>
      </div>
    </VizFrame>
  );
}
