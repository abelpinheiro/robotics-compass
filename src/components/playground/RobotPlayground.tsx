"use client";

import { useState } from "react";
import Link from "next/link";
import SingularitiesScene, { SINGULAR_FRACTION } from "@/components/viz/singularities/SingularitiesScene";
import {
  SCARA,
  scaraFK,
  sixDofFK,
  SIXDOF_HOME,
  SIXDOF_SINGULARITIES,
  type RobotKind,
  type ScaraState,
} from "@/components/viz/singularities/singularitiesMath";

const deg = (r: number) => Math.round((r * 180) / Math.PI);
const fmt = (n: number) => (Math.abs(n) < 5e-4 ? 0 : n).toFixed(2);
const fmt3 = (n: number) => (Math.abs(n) < 5e-4 ? 0 : n).toFixed(3);

const SCARA_INIT: ScaraState = { theta1: 0.5, theta2: 1.1, d3: 0.2, theta4: 0 };
const rand = (a: number, b: number) => a + Math.random() * (b - a);

function scaraSingularity(st: ScaraState): string | null {
  if (Math.abs(Math.sin(st.theta2)) >= SINGULAR_FRACTION) return null;
  const near0 = Math.abs(Math.atan2(Math.sin(st.theta2), Math.cos(st.theta2))) < Math.PI / 2;
  return near0 ? "outer boundary (θ₂ = 0)" : "inner boundary (θ₂ = π)";
}
function sixDofSingularity(theta: number[]): string | null {
  const p = sixDofFK(theta);
  if (p.w / p.wMax >= SINGULAR_FRACTION) return null;
  if (Math.abs(Math.sin(theta[4])) < 0.08) return "wrist singularity";
  if (Math.hypot(p.wristCenter[0], p.wristCenter[1]) < 0.14) return "shoulder singularity";
  return "elbow singularity";
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span className="w-24 tabular-nums">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-w-0 flex-1 accent-accent"
        aria-valuetext={display}
      />
      <span className="w-14 text-right tabular-nums text-foreground">{display}</span>
    </label>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { key: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex w-fit items-center gap-1 rounded-md border border-border p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          aria-pressed={value === o.key}
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            value === o.key ? "bg-accent text-white" : "text-muted hover:bg-surface-2"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const btn =
  "rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface-2";

export default function RobotPlayground() {
  const [robot, setRobot] = useState<RobotKind>("sixdof");
  const [scara, setScara] = useState<ScaraState>(SCARA_INIT);
  const [sixdof, setSixdof] = useState<number[]>(SIXDOF_HOME);

  const setJoint6 = (i: number, v: number) => setSixdof((t) => t.map((x, k) => (k === i ? v : x)));

  const pose = robot === "scara" ? scaraFK(scara) : sixDofFK(sixdof);
  const ee = robot === "scara" ? scaraFK(scara).tool : sixDofFK(sixdof).ee;
  const singularLabel = robot === "scara" ? scaraSingularity(scara) : sixDofSingularity(sixdof);
  const isSingular = singularLabel !== null;
  const barFrac = Math.max(0, Math.min(1, Math.sqrt(pose.w / pose.wMax)));

  const randomize = () => {
    if (robot === "scara") {
      setScara({ theta1: rand(-Math.PI, Math.PI), theta2: rand(-Math.PI, Math.PI), d3: rand(0, SCARA.d3Max), theta4: rand(-Math.PI, Math.PI) });
    } else {
      setSixdof([rand(-Math.PI, Math.PI), rand(-2.2, 0.4), rand(-0.4, 2.6), rand(-Math.PI, Math.PI), rand(-2, 2), rand(-Math.PI, Math.PI)]);
    }
  };
  const reset = () => (robot === "scara" ? setScara(SCARA_INIT) : setSixdof(SIXDOF_HOME));

  return (
    <div
      data-theme="dark"
      className="theme-dark fixed inset-0 z-40 flex flex-col bg-background text-foreground"
    >
      {/* top bar */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border px-4">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <span aria-hidden>←</span> Robotics Compass
        </Link>
        <h1 className="font-serif text-base font-semibold">Robot playground</h1>
        <div className="ml-auto">
          <Segmented
            value={robot}
            onChange={setRobot}
            options={[
              { key: "sixdof", label: "6-DOF arm" },
              { key: "scara", label: "SCARA" },
            ]}
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* 3D scene */}
        <div className="relative min-h-0 flex-1">
          <SingularitiesScene robot={robot} scara={scara} sixdof={sixdof} />
          {isSingular && (
            <div className="pointer-events-none absolute left-4 top-4 rounded-md px-2.5 py-1 text-xs font-bold text-white" style={{ background: "var(--danger)" }}>
              ⚠ SINGULAR — {singularLabel}
            </div>
          )}
        </div>

        {/* control panel */}
        <aside className="flex w-full shrink-0 flex-col gap-4 overflow-y-auto border-t border-border p-4 md:w-80 md:border-l md:border-t-0">
          {/* readouts */}
          <section className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-faint">Manipulability</span>
              <span className="font-mono text-lg font-semibold tabular-nums">w = {fmt3(pose.w)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full transition-[width] duration-150"
                style={{ width: `${barFrac * 100}%`, background: isSingular ? "var(--danger)" : "var(--success)" }}
              />
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-xs tabular-nums text-muted">
              <span>x = {fmt(ee[0])}</span>
              <span>y = {fmt(ee[1])}</span>
              <span>z = {fmt(ee[2])}</span>
              <span>det J = {fmt3(pose.detJ)}</span>
            </div>
          </section>

          {/* presets */}
          <section className="flex flex-wrap gap-2">
            {robot === "scara" ? (
              <>
                <button type="button" className={btn} onClick={() => setScara((s) => ({ ...s, theta2: 0 }))}>θ₂ = 0</button>
                <button type="button" className={btn} onClick={() => setScara((s) => ({ ...s, theta2: Math.PI }))}>θ₂ = π</button>
              </>
            ) : (
              SIXDOF_SINGULARITIES.map((s) => (
                <button key={s.key} type="button" className={btn} onClick={() => setSixdof(s.theta)}>{s.label}</button>
              ))
            )}
            <button type="button" className={btn} onClick={randomize}>Random pose</button>
            <button type="button" className={btn} onClick={reset}>Reset</button>
          </section>

          {/* joint sliders */}
          <section className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wide text-faint">Joints</span>
            {robot === "scara" ? (
              <>
                <Slider label="θ₁" value={scara.theta1} min={-Math.PI} max={Math.PI} step={0.02} display={`${deg(scara.theta1)}°`} onChange={(v) => setScara((s) => ({ ...s, theta1: v }))} />
                <Slider label="θ₂" value={scara.theta2} min={-Math.PI} max={Math.PI} step={0.02} display={`${deg(scara.theta2)}°`} onChange={(v) => setScara((s) => ({ ...s, theta2: v }))} />
                <Slider label="d₃" value={scara.d3} min={0} max={SCARA.d3Max} step={0.02} display={fmt(scara.d3)} onChange={(v) => setScara((s) => ({ ...s, d3: v }))} />
                <Slider label="θ₄" value={scara.theta4} min={-Math.PI} max={Math.PI} step={0.02} display={`${deg(scara.theta4)}°`} onChange={(v) => setScara((s) => ({ ...s, theta4: v }))} />
              </>
            ) : (
              sixdof.map((v, i) => (
                <Slider
                  key={i}
                  label={`θ${["₁", "₂", "₃", "₄", "₅", "₆"][i]}`}
                  value={v}
                  min={-Math.PI}
                  max={Math.PI}
                  step={0.02}
                  display={`${deg(v)}°`}
                  onChange={(nv) => setJoint6(i, nv)}
                />
              ))
            )}
          </section>

          <p className="mt-auto text-xs text-muted">
            Drag the joints to pose the arm; orbit/zoom the scene with the mouse. The manipulability
            index w falls to 0 at a singularity, where the arm turns red.
          </p>
        </aside>
      </div>
    </div>
  );
}
