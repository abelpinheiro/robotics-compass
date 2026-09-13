"use client";

import { useState } from "react";
import Link from "next/link";
import SingularitiesScene, { SINGULAR_FRACTION } from "@/components/viz/singularities/SingularitiesScene";
import { SCARA, scaraFK, type ScaraState } from "@/components/viz/singularities/singularitiesMath";
import UrdfArmScene, { type UrdfArmConfig } from "./UrdfArmScene";
import { ur20FK, ur20Singularity, UR20_HOME, UR20_JOINT_NAMES, UR20_SINGULARITIES } from "./ur20Math";
import { kukaFK, kukaSingularity, KUKA_HOME, KUKA_JOINT_NAMES, KUKA_SINGULARITIES } from "./kukaMath";
import { iiwaFK, iiwaSingularity, IIWA_HOME, IIWA_JOINT_NAMES, IIWA_SINGULARITIES } from "./iiwaMath";
import { ellipsoidFromCols } from "./manipEllipsoid";

type Robot = "ur20" | "kuka" | "iiwa" | "scara";
type ArmKey = "ur20" | "kuka" | "iiwa";

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

// Stable per-robot config (module-level so the scene doesn't reload every render).
const UR20_CONFIG: UrdfArmConfig = {
  urdfUrl: "/models/ur20/ur20.urdf",
  packages: { ur20: "/models/ur20" },
  jointNames: UR20_JOINT_NAMES,
  cameraPosition: [2.4, 1.8, 2.6],
  target: [0, 0.55, 0],
  groundSize: 6,
};
const KUKA_CONFIG: UrdfArmConfig = {
  urdfUrl: "/models/kuka_kr6/kr6.urdf",
  packages: { kuka_kr6: "/models/kuka_kr6" },
  jointNames: KUKA_JOINT_NAMES,
  cameraPosition: [1.5, 1.2, 1.6],
  target: [0, 0.5, 0],
  groundSize: 3,
};
const IIWA_CONFIG: UrdfArmConfig = {
  urdfUrl: "/models/kuka_iiwa/iiwa.urdf",
  packages: { kuka_iiwa: "/models/kuka_iiwa" },
  jointNames: IIWA_JOINT_NAMES,
  cameraPosition: [1.5, 1.3, 1.7],
  target: [0, 0.6, 0],
  groundSize: 3,
  stlColor: 0xc9ccd2,
};

const ARM: Record<ArmKey, {
  label: string;
  footer: string;
  home: number[];
  config: UrdfArmConfig;
  fk: (t: number[]) => { origins: [number, number, number][]; ee: [number, number, number]; w: number; wMax: number; detJ: number; cols: number[][] };
  singFn: (t: number[]) => string | null;
  singularities: { key: string; label: string; theta: number[] }[];
}> = {
  ur20: { label: "UR20", footer: "Universal Robots UR20 · official mesh", home: UR20_HOME, config: UR20_CONFIG, fk: ur20FK, singFn: ur20Singularity, singularities: UR20_SINGULARITIES },
  kuka: { label: "KUKA KR6", footer: "KUKA KR6 R900 sixx · official mesh", home: KUKA_HOME, config: KUKA_CONFIG, fk: kukaFK, singFn: kukaSingularity, singularities: KUKA_SINGULARITIES },
  iiwa: { label: "LBR iiwa", footer: "KUKA LBR iiwa 14 R820 · official mesh (7-DOF)", home: IIWA_HOME, config: IIWA_CONFIG, fk: iiwaFK, singFn: iiwaSingularity, singularities: IIWA_SINGULARITIES },
};

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
  const [robot, setRobot] = useState<Robot>("ur20");
  const [scara, setScara] = useState<ScaraState>(SCARA_INIT);
  const [armTheta, setArmTheta] = useState<Record<ArmKey, number[]>>({ ur20: UR20_HOME, kuka: KUKA_HOME, iiwa: IIWA_HOME });
  const [showEllipsoid, setShowEllipsoid] = useState(true);

  const isScara = robot === "scara";
  const armKey = (isScara ? "ur20" : robot) as ArmKey;
  const arm = ARM[armKey];
  const theta = armTheta[armKey];
  const setTheta = (t: number[]) => setArmTheta((s) => ({ ...s, [armKey]: t }));
  const setJoint = (i: number, v: number) => setTheta(theta.map((x, k) => (k === i ? v : x)));

  const scaraPose = isScara ? scaraFK(scara) : null;
  const armPose = isScara ? null : arm.fk(theta);
  const pose: { w: number; wMax: number; detJ: number } = scaraPose ?? armPose!;
  const ee = scaraPose ? scaraPose.tool : armPose!.ee;
  const ellipsoid = armPose && showEllipsoid ? ellipsoidFromCols(armPose.cols, armPose.ee) : null;
  const singularLabel = isScara ? scaraSingularity(scara) : arm.singFn(theta);
  const isSingular = singularLabel !== null;
  const barFrac = Math.max(0, Math.min(1, Math.sqrt(pose.w / pose.wMax)));
  const eeUnit = isScara ? "" : " m";

  const randomize = () => {
    if (isScara) {
      setScara({ theta1: rand(-Math.PI, Math.PI), theta2: rand(-Math.PI, Math.PI), d3: rand(0, SCARA.d3Max), theta4: rand(-Math.PI, Math.PI) });
    } else {
      setTheta(theta.map(() => rand(-Math.PI, Math.PI)));
    }
  };
  const reset = () => (isScara ? setScara(SCARA_INIT) : setTheta(arm.home));

  return (
    <div
      data-theme="dark"
      className="theme-dark fixed inset-0 z-40 flex flex-col bg-background text-foreground"
    >
      <header className="flex h-14 shrink-0 items-center gap-4 px-4 border-b border-border">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <span aria-hidden>←</span> Robotics Compass
        </Link>
        <h1 className="font-serif text-base font-semibold">Robot playground</h1>
        <div className="ml-auto">
          <Segmented
            value={robot}
            onChange={setRobot}
            options={[
              { key: "ur20", label: "UR20" },
              { key: "kuka", label: "KUKA KR6" },
              { key: "iiwa", label: "LBR iiwa" },
              { key: "scara", label: "SCARA" },
            ]}
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* 3D scene */}
        <div className="relative min-h-0 flex-1">
          {isScara ? (
            <SingularitiesScene robot="scara" scara={scara} sixdof={UR20_HOME} />
          ) : (
            <UrdfArmScene key={armKey} config={arm.config} theta={theta} ellipsoid={ellipsoid} />
          )}
          {isSingular && (
            <div className="pointer-events-none absolute left-4 top-4 rounded-md px-2.5 py-1 text-xs font-bold text-white" style={{ background: "var(--danger)" }}>
              ⚠ SINGULAR — {singularLabel}
            </div>
          )}
          <div className="pointer-events-none absolute bottom-3 left-4 text-xs text-faint">
            {isScara ? "SCARA (2R + prismatic)" : arm.footer}
          </div>
        </div>

        {/* control panel */}
        <aside className="flex w-full shrink-0 flex-col gap-4 overflow-y-auto border-t border-border p-4 md:w-80 md:border-l md:border-t-0">
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
              <span>x = {fmt(ee[0])}{eeUnit}</span>
              <span>y = {fmt(ee[1])}{eeUnit}</span>
              <span>z = {fmt(ee[2])}{eeUnit}</span>
              <span>det J = {fmt3(pose.detJ)}</span>
            </div>
          </section>

          <section className="flex flex-wrap gap-2">
            {isScara ? (
              <>
                <button type="button" className={btn} onClick={() => setScara((s) => ({ ...s, theta2: 0 }))}>θ₂ = 0</button>
                <button type="button" className={btn} onClick={() => setScara((s) => ({ ...s, theta2: Math.PI }))}>θ₂ = π</button>
              </>
            ) : (
              arm.singularities.map((s) => (
                <button key={s.key} type="button" className={btn} onClick={() => setTheta(s.theta)}>{s.label}</button>
              ))
            )}
            <button type="button" className={btn} onClick={randomize}>Random pose</button>
            <button type="button" className={btn} onClick={reset}>Reset</button>
            {!isScara && (
              <button
                type="button"
                aria-pressed={showEllipsoid}
                onClick={() => setShowEllipsoid((v) => !v)}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                  showEllipsoid ? "border-success bg-success/15 text-success" : "border-border bg-surface text-foreground hover:bg-surface-2"
                }`}
              >
                Ellipsoid
              </button>
            )}
          </section>

          <section className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wide text-faint">Joints</span>
            {isScara ? (
              <>
                <Slider label="θ₁" value={scara.theta1} min={-Math.PI} max={Math.PI} step={0.02} display={`${deg(scara.theta1)}°`} onChange={(v) => setScara((s) => ({ ...s, theta1: v }))} />
                <Slider label="θ₂" value={scara.theta2} min={-Math.PI} max={Math.PI} step={0.02} display={`${deg(scara.theta2)}°`} onChange={(v) => setScara((s) => ({ ...s, theta2: v }))} />
                <Slider label="d₃" value={scara.d3} min={0} max={SCARA.d3Max} step={0.02} display={fmt(scara.d3)} onChange={(v) => setScara((s) => ({ ...s, d3: v }))} />
                <Slider label="θ₄" value={scara.theta4} min={-Math.PI} max={Math.PI} step={0.02} display={`${deg(scara.theta4)}°`} onChange={(v) => setScara((s) => ({ ...s, theta4: v }))} />
              </>
            ) : (
              theta.map((v, i) => (
                <Slider
                  key={i}
                  label={`θ${["₁", "₂", "₃", "₄", "₅", "₆", "₇"][i]}`}
                  value={v}
                  min={-Math.PI}
                  max={Math.PI}
                  step={0.02}
                  display={`${deg(v)}°`}
                  onChange={(nv) => setJoint(i, nv)}
                />
              ))
            )}
          </section>

          <p className="mt-auto text-xs text-muted">
            Drag the joints to pose the arm; orbit/zoom the scene with the mouse. The Yoshikawa
            manipulability index w falls to 0 at a singularity — use the presets to reach each one.
          </p>
        </aside>
      </div>
    </div>
  );
}
