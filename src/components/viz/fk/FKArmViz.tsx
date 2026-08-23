"use client";

import { useEffect, useRef, useState } from "react";
import { Viz3D } from "@/components/viz/Viz3D";
import { VizFrame } from "@/components/viz/VizFrame";
import { MatrixDisplay } from "@/components/viz/MatrixDisplay";
import FKArmScene, { TCP_COLOR } from "./FKArmScene";
import { linkMatrices, toRad } from "./fkMath";
import type { Mat4, P3, Pose } from "./fkMath";

const fmt = (n: number) => (Math.abs(n) < 5e-3 ? 0 : n).toFixed(2);

const HOME: Pose = { t1: 0, t2: 0, t3: 0 };
const POSE_A: Pose = { t1: 40, t2: -50, t3: 80 };
const POSE_B: Pose = { t1: -65, t2: -20, t3: 110 };
const TRAIL_CAP = 400;

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
      <span className="w-28">{label}</span>
      <input
        type="range"
        min={-180}
        max={180}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-accent"
        aria-valuetext={`${value} degrees`}
      />
      <span className="w-12 tabular-nums text-foreground">{value}°</span>
    </label>
  );
}

function LabeledMatrix({ label, rows }: { label: string; rows: Mat4 }) {
  return (
    <span className="flex items-center gap-1.5 text-muted">
      <span className="whitespace-nowrap">{label} =</span>
      <MatrixDisplay rows={rows} ariaLabel={`${label} matrix`} />
    </span>
  );
}

export default function FKArmViz() {
  const [pose, setPose] = useState<Pose>(HOME);
  const [trail, setTrail] = useState<P3[]>([]);
  const animRef = useRef<number | null>(null);

  const { A1, A2, A3, T03 } = linkMatrices(pose);
  const tcp: P3 = [T03[0][3], T03[1][3], T03[2][3]];

  const stopAnim = () => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  };
  useEffect(() => stopAnim, []);

  // Apply a pose and append the resulting TCP to the trail. Done here (not in an
  // effect) so the trail records both manual and animated moves.
  const applyPose = (next: Pose) => {
    setPose(next);
    const T = linkMatrices(next).T03;
    const p: P3 = [T[0][3], T[1][3], T[2][3]];
    setTrail((prev) => {
      const last = prev[prev.length - 1];
      if (last && Math.hypot(p[0] - last[0], p[1] - last[1], p[2] - last[2]) < 0.03)
        return prev;
      const t = [...prev, p];
      return t.length > TRAIL_CAP ? t.slice(t.length - TRAIL_CAP) : t;
    });
  };

  const setManual = (patch: Partial<Pose>) => {
    stopAnim();
    applyPose({ ...pose, ...patch });
  };

  const animateTo = (target: Pose) => {
    stopAnim();
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      applyPose(target);
      return;
    }
    const start = pose;
    const dur = 1400;
    const t0 = performance.now();
    const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = ease(k);
      applyPose({
        t1: Math.round(start.t1 + (target.t1 - start.t1) * e),
        t2: Math.round(start.t2 + (target.t2 - start.t2) * e),
        t3: Math.round(start.t3 + (target.t3 - start.t3) * e),
      });
      animRef.current = k < 1 ? requestAnimationFrame(step) : null;
    };
    animRef.current = requestAnimationFrame(step);
  };

  const reset = () => {
    stopAnim();
    setPose(HOME);
    setTrail([]);
  };

  const description =
    `A 3-DOF robot arm (base yaw θ₁, shoulder pitch θ₂, elbow pitch θ₃) in 3D on a ` +
    `dark canvas. Coordinate frames (x red, y green, z blue) are drawn at the base ` +
    `and each joint, and a trail marks where the tool center point (TCP) has ` +
    `travelled. The joint angles are θ₁=${pose.t1}°, θ₂=${pose.t2}°, θ₃=${pose.t3}°. ` +
    `The live 4×4 matrices A₁, A₂, A₃ and their product ⁰₃T = A₁·A₂·A₃ update as the ` +
    `sliders move; the TCP position is the highlighted last column of ⁰₃T, currently ` +
    `(x, y, z) = (${fmt(tcp[0])}, ${fmt(tcp[1])}, ${fmt(tcp[2])}). Buttons animate the ` +
    `arm to preset poses; reset returns it home and clears the trail.`;

  return (
    <VizFrame
      title="Forward kinematics: Obtaining the TCP pose from joint angles"
      caption="Move the joint sliders (or animate to a preset) and watch the 4x4 transforms chain into ⁰₃T. The pink last column of ⁰₃T is the tool center point which is the same pink dot and trail you see in 3D."
      textAlternative={description}
      controls={
        <>
          <Slider label="θ₁ (base)" value={pose.t1} onChange={(v) => setManual({ t1: v })} />
          <Slider label="θ₂ (shoulder)" value={pose.t2} onChange={(v) => setManual({ t2: v })} />
          <Slider label="θ₃ (elbow)" value={pose.t3} onChange={(v) => setManual({ t3: v })} />
          <span className="mx-1 h-6 w-px bg-border" />
          <button
            type="button"
            onClick={() => animateTo(POSE_A)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-2"
          >
            Pose A
          </button>
          <button
            type="button"
            onClick={() => animateTo(POSE_B)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-2"
          >
            Pose B
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-2"
          >
            Reset
          </button>
        </>
      }
    >
      <Viz3D aspectRatio={16 / 10}>
        <FKArmScene t1={toRad(pose.t1)} t2={toRad(pose.t2)} t3={toRad(pose.t3)} trail={trail} />
      </Viz3D>

      <div className="mt-3 space-y-3 overflow-x-auto text-sm">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <LabeledMatrix label="A₁" rows={A1} />
          <LabeledMatrix label="A₂" rows={A2} />
          <LabeledMatrix label="A₃" rows={A3} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="whitespace-nowrap text-muted">
            <sup>0</sup>
            <sub>3</sub>T = A₁·A₂·A₃ =
          </span>
          <MatrixDisplay
            rows={T03}
            highlightCol={3}
            highlightColor={TCP_COLOR}
            ariaLabel="chained base-to-TCP transform"
          />
        </div>
        <div>
          <span className="text-muted">TCP position </span>
          <span className="font-mono font-semibold tabular-nums" style={{ color: TCP_COLOR }}>
            (x, y, z) = ({fmt(tcp[0])}, {fmt(tcp[1])}, {fmt(tcp[2])})
          </span>
        </div>
      </div>
    </VizFrame>
  );
}
