"use client";

import { useState } from "react";
import { Viz3D } from "@/components/viz/Viz3D";
import { VizFrame } from "@/components/viz/VizFrame";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import QuaternionScene from "./QuaternionScene";

const fmt = (n: number) => (Math.abs(n) < 5e-3 ? 0 : n).toFixed(2);
const toRad = (d: number) => (d * Math.PI) / 180;

function QuatPart({ name, value }: { name: string; value: number }) {
  return (
    <span className="rounded-md bg-surface-2 px-2 py-1">
      <span className="text-muted">{name}</span>{" "}
      <span className="font-mono tabular-nums text-foreground">{fmt(value)}</span>
    </span>
  );
}

function AxisSlider({
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
      {label}
      <input
        type="range"
        min={-1}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-accent"
        aria-valuetext={value.toFixed(2)}
      />
      <span className="w-11 tabular-nums text-foreground">{value.toFixed(2)}</span>
    </label>
  );
}

// Body convention: robot faces +x, up is +y, so a nose-up "pitch" is a rotation
// about +z. At exactly 90 deg this is where Euler angles gimbal-lock.
const PITCH_PRESET = { ax: 0, ay: 0, az: 1, angle: 90 };

export default function QuaternionViz() {
  const { t } = useLocale();
  const [ax, setAx] = useState(0);
  const [ay, setAy] = useState(1);
  const [az, setAz] = useState(0);
  const [angle, setAngle] = useState(60);

  const theta = toRad(angle);

  // Normalize the raw axis to a unit vector n̂; fall back to +y for a zero axis
  // so the quaternion stays well defined.
  const rawNorm = Math.hypot(ax, ay, az);
  const n =
    rawNorm < 1e-6
      ? { x: 0, y: 1, z: 0 }
      : { x: ax / rawNorm, y: ay / rawNorm, z: az / rawNorm };

  // q = (cos θ/2, sin θ/2 · n̂), stored as {x, y, z, w} (three's order).
  const half = theta / 2;
  const sh = Math.sin(half);
  const q = { x: n.x * sh, y: n.y * sh, z: n.z * sh, w: Math.cos(half) };

  // Always ~1 for a unit quaternion — shown to make "it never breaks" concrete.
  const qNorm = Math.hypot(q.x, q.y, q.z, q.w);

  const isPitch90 =
    Math.abs(ax) < 1e-6 &&
    Math.abs(ay) < 1e-6 &&
    Math.abs(az - 1) < 1e-6 &&
    angle === 90;

  const applyPitch90 = () => {
    setAx(PITCH_PRESET.ax);
    setAy(PITCH_PRESET.ay);
    setAz(PITCH_PRESET.az);
    setAngle(PITCH_PRESET.angle);
  };

  const description =
    `A robot rotated by a unit quaternion built from an axis and an angle. The ` +
    `axis slider vector (${fmt(ax)}, ${fmt(ay)}, ${fmt(az)}) is normalized to the ` +
    `unit rotation axis n̂ = (${fmt(n.x)}, ${fmt(n.y)}, ${fmt(n.z)}) (dashed line), and ` +
    `the angle θ = ${angle}° gives q = (w, x, y, z) = ` +
    `(${fmt(q.w)}, ${fmt(q.x)}, ${fmt(q.y)}, ${fmt(q.z)}), with w = cos(θ/2) and ` +
    `(x, y, z) = sin(θ/2)·n̂. Its magnitude |q| = ${fmt(qNorm)} stays exactly 1 for ` +
    `every axis and angle — including a 90° nose-up pitch (axis z, θ = 90°), where ` +
    `Euler angles gimbal-lock but the quaternion is a perfectly ordinary unit ` +
    `quaternion. Drag to orbit the camera.`;

  return (
    <VizFrame
      title="Axis–angle to quaternion"
      caption="Set the rotation axis (x, y, z) and angle θ; the 4-number quaternion updates live and always stays a unit quaternion. Try the 90° pitch preset — Euler angles gimbal-lock there, the quaternion does not."
      textAlternative={description}
      controls={
        <>
          <AxisSlider label="Axis x" value={ax} onChange={setAx} />
          <AxisSlider label="Axis y" value={ay} onChange={setAy} />
          <AxisSlider label="Axis z" value={az} onChange={setAz} />
          <label className="flex items-center gap-2 text-sm text-muted">
            {t.viz.angle}
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              className="accent-accent"
              aria-valuetext={`${angle} degrees`}
            />
            <span className="w-12 tabular-nums text-foreground">{angle}°</span>
          </label>
          <button
            type="button"
            onClick={applyPitch90}
            aria-pressed={isPitch90}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
              isPitch90
                ? "border-accent bg-accent-weak text-accent"
                : "border-border bg-surface text-foreground hover:bg-surface-2"
            }`}
          >
            90° pitch
          </button>
        </>
      }
    >
      <Viz3D aspectRatio={16 / 10}>
        <QuaternionScene q={q} axis={n} />
      </Viz3D>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">q =</span>
        <QuatPart name="w" value={q.w} />
        <QuatPart name="x" value={q.x} />
        <QuatPart name="y" value={q.y} />
        <QuatPart name="z" value={q.z} />
        <span className="ml-2 rounded-md bg-surface-2 px-2 py-1">
          <span className="text-muted">|q|</span>{" "}
          <span className="font-mono tabular-nums text-foreground">{fmt(qNorm)}</span>
        </span>
      </div>
    </VizFrame>
  );
}
