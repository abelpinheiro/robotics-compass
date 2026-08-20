"use client";

import { useEffect, useRef, useState } from "react";
import { Viz3D } from "@/components/viz/Viz3D";
import { VizFrame } from "@/components/viz/VizFrame";
import { MatrixDisplay } from "@/components/viz/MatrixDisplay";
import FKArmScene, { TCP_COLOR } from "@/components/viz/fk/FKArmScene";
import { fkTCP, linkMatrices, toRad } from "@/components/viz/fk/fkMath";
import type { P3 } from "@/components/viz/fk/fkMath";
import { solveIK } from "./ikMath";
import type { Elbow } from "./ikMath";

const fmt = (n: number) => (Math.abs(n) < 5e-3 ? 0 : n).toFixed(2);
const deg = (n: number) => `${Math.round(n)}°`;

// Reachable preset targets and the workspace-sized slider ranges.
const HOME_TARGET: P3 = [2.0, 0, 1.2];
const TARGET_A: P3 = [1.5, 0.6, 1.8];
const TARGET_B: P3 = [-0.8, 1.2, 0.6];
const XY_MIN = -2.3, XY_MAX = 2.3;
const Z_MIN = -1.0, Z_MAX = 3.5;
const TRAIL_CAP = 400;

function AxisSlider({
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
      <span className="w-24">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-accent"
        aria-valuetext={`${value.toFixed(2)} meters`}
      />
      <span className="w-16 tabular-nums text-foreground">{value.toFixed(2)} m</span>
    </label>
  );
}

export default function IKArmViz() {
  const [target, setTarget] = useState<P3>(HOME_TARGET);
  const [elbow, setElbow] = useState<Elbow>("down");
  const [trail, setTrail] = useState<P3[]>([]);
  const animRef = useRef<number | null>(null);

  const sol = solveIK(target, elbow);
  const { T03 } = linkMatrices(sol.pose);
  const tcp: P3 = [T03[0][3], T03[1][3], T03[2][3]];

  const stopAnim = () => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  };
  useEffect(() => stopAnim, []);

  // Apply a target and append the arm's actual TCP to the trail. Done here (not
  // in an effect) so the trail records manual, animated, and clamped moves.
  const applyTarget = (next: P3) => {
    setTarget(next);
    const p = fkTCP(solveIK(next, elbow).pose);
    setTrail((prev) => {
      const last = prev[prev.length - 1];
      if (last && Math.hypot(p[0] - last[0], p[1] - last[1], p[2] - last[2]) < 0.03)
        return prev;
      const t = [...prev, p];
      return t.length > TRAIL_CAP ? t.slice(t.length - TRAIL_CAP) : t;
    });
  };

  const setAxis = (idx: 0 | 1 | 2, v: number) => {
    stopAnim();
    const next: P3 = [target[0], target[1], target[2]];
    next[idx] = v;
    applyTarget(next);
  };

  const chooseElbow = (e: Elbow) => {
    stopAnim();
    setElbow(e);
  };

  const animateTo = (dest: P3) => {
    stopAnim();
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      applyTarget(dest);
      return;
    }
    const start = target;
    const dur = 1400;
    const t0 = performance.now();
    const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = ease(k);
      applyTarget([
        start[0] + (dest[0] - start[0]) * e,
        start[1] + (dest[1] - start[1]) * e,
        start[2] + (dest[2] - start[2]) * e,
      ]);
      animRef.current = k < 1 ? requestAnimationFrame(step) : null;
    };
    animRef.current = requestAnimationFrame(step);
  };

  const reset = () => {
    stopAnim();
    setTarget(HOME_TARGET);
    setElbow("down");
    setTrail([]);
  };

  const description =
    `A 3-DOF robot arm on a dark canvas whose tool center point (TCP) is driven to a ` +
    `target position you set. The target is (x, y, z) = (${fmt(target[0])}, ` +
    `${fmt(target[1])}, ${fmt(target[2])}) and is ` +
    `${sol.reachable ? "reachable" : "outside the workspace, so the arm shows the closest pose"}. ` +
    `The inverse-kinematics solver returns the joint angles θ₁=${deg(sol.pose.t1)}, ` +
    `θ₂=${deg(sol.pose.t2)}, θ₃=${deg(sol.pose.t3)} (${elbow === "up" ? "elbow-up" : "elbow-down"} ` +
    `branch). Feeding those angles back through forward kinematics gives ⁰₃T, whose ` +
    `highlighted last column returns the TCP (${fmt(tcp[0])}, ${fmt(tcp[1])}, ${fmt(tcp[2])}). ` +
    `Coordinate frames (x red, y green, z blue) sit at the base and each joint, and a ` +
    `trail marks where the TCP has travelled.`;

  const btn =
    "rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-2";

  return (
    <VizFrame
      title="Inverse kinematics: TCP target → joint angles"
      caption="Move the target position (or animate to a preset) and the arm solves for the joint angles that reach it. Toggle elbow-up / elbow-down to see the two solutions. Feed the solved angles back through forward kinematics and the pink last column of ⁰₃T returns your target."
      textAlternative={description}
      controls={
        <>
          <AxisSlider label="target x" value={target[0]} min={XY_MIN} max={XY_MAX} onChange={(v) => setAxis(0, v)} />
          <AxisSlider label="target y" value={target[1]} min={XY_MIN} max={XY_MAX} onChange={(v) => setAxis(1, v)} />
          <AxisSlider label="target z" value={target[2]} min={Z_MIN} max={Z_MAX} onChange={(v) => setAxis(2, v)} />
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="w-24">elbow</span>
            <div className="inline-flex overflow-hidden rounded-md border border-border">
              {(["up", "down"] as Elbow[]).map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => chooseElbow(e)}
                  aria-pressed={elbow === e}
                  className="px-3 py-1 text-sm text-foreground hover:bg-surface-2"
                  style={elbow === e ? { backgroundColor: "var(--accent)", color: "#fff" } : undefined}
                >
                  {e === "up" ? "Up" : "Down"}
                </button>
              ))}
            </div>
          </div>
          <span className="mx-1 h-6 w-px bg-border" />
          <button type="button" onClick={() => animateTo(TARGET_A)} className={btn}>
            Target A
          </button>
          <button type="button" onClick={() => animateTo(TARGET_B)} className={btn}>
            Target B
          </button>
          <button type="button" onClick={reset} className={btn}>
            Reset
          </button>
        </>
      }
    >
      <Viz3D aspectRatio={16 / 10}>
        <FKArmScene
          t1={toRad(sol.pose.t1)}
          t2={toRad(sol.pose.t2)}
          t3={toRad(sol.pose.t3)}
          trail={trail}
          target={target}
          targetReachable={sol.reachable}
        />
      </Viz3D>

      <div className="mt-3 space-y-3 overflow-x-auto text-sm">
        <div>
          <span className="text-muted">Target (input) </span>
          <span className="font-mono font-semibold tabular-nums" style={{ color: TCP_COLOR }}>
            (x, y, z) = ({fmt(target[0])}, {fmt(target[1])}, {fmt(target[2])})
          </span>
          {sol.reachable ? (
            <span className="ml-2 text-muted">— in reach (two solutions: elbow-up / elbow-down)</span>
          ) : (
            <span className="ml-2 font-medium" style={{ color: "var(--danger)" }}>
              — out of reach; showing the closest pose
            </span>
          )}
        </div>
        <div>
          <span className="text-muted">Solved joint angles (output) </span>
          <span className="font-mono font-semibold tabular-nums text-foreground">
            θ = ({deg(sol.pose.t1)}, {deg(sol.pose.t2)}, {deg(sol.pose.t3)})
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="whitespace-nowrap text-muted">
            <sup>0</sup>
            <sub>3</sub>T = FK(θ) =
          </span>
          <MatrixDisplay
            rows={T03}
            highlightCol={3}
            highlightColor={TCP_COLOR}
            ariaLabel="forward-kinematics check of the solved joint angles"
          />
          <span className="text-muted">← last column returns the target</span>
        </div>
      </div>
    </VizFrame>
  );
}
