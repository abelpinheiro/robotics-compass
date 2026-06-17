"use client";

import { useState } from "react";
import { Viz3D } from "@/components/viz/Viz3D";
import { VizFrame } from "@/components/viz/VizFrame";
import QuaternionScene from "./QuaternionScene";

const fmt = (n: number) => (Math.abs(n) < 1e-9 ? 0 : n).toFixed(2);
const toRad = (d: number) => (d * Math.PI) / 180;

function QuatPart({ name, value }: { name: string; value: number }) {
  return (
    <span className="rounded-md bg-surface-2 px-2 py-1">
      <span className="text-muted">{name}</span>{" "}
      <span className="font-mono tabular-nums text-foreground">{fmt(value)}</span>
    </span>
  );
}

function Slider({
  label,
  value,
  onChange,
  unit = "°",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      {label}
      <input
        type="range"
        min={-180}
        max={180}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-accent"
        aria-valuetext={`${value} ${unit}`}
      />
      <span className="w-12 tabular-nums text-foreground">
        {value}
        {unit}
      </span>
    </label>
  );
}

export default function QuaternionViz() {
  const [azimuth, setAzimuth] = useState(40); // about vertical
  const [elevation, setElevation] = useState(35); // from the ground plane
  const [angle, setAngle] = useState(90); // rotation angle θ

  const a = toRad(azimuth);
  const e = toRad(elevation);
  const theta = toRad(angle);

  // Unit rotation axis n̂.
  const axis = {
    x: Math.cos(e) * Math.cos(a),
    y: Math.sin(e),
    z: Math.cos(e) * Math.sin(a),
  };

  // Quaternion q = (cos θ/2, sin θ/2 · n̂), stored as {x, y, z, w}.
  const half = theta / 2;
  const sh = Math.sin(half);
  const q = {
    x: axis.x * sh,
    y: axis.y * sh,
    z: axis.z * sh,
    w: Math.cos(half),
  };

  const description =
    `A unit quaternion rotation. The axis n̂ = (${fmt(axis.x)}, ${fmt(axis.y)}, ${fmt(axis.z)}) ` +
    `(dashed line) and angle θ = ${angle}° define q = (w, x, y, z) = ` +
    `(${fmt(q.w)}, ${fmt(q.x)}, ${fmt(q.y)}, ${fmt(q.z)}), with w = cos(θ/2) and ` +
    `(x, y, z) = sin(θ/2)·n̂. The body frame {B} is rotated about n̂ by θ. Drag to orbit.`;

  return (
    <VizFrame
      title="Quaternion rotation"
      caption="Set the axis and angle; the quaternion and the body frame update live."
      textAlternative={description}
      controls={
        <>
          <Slider label="Axis azimuth" value={azimuth} onChange={setAzimuth} />
          <Slider label="Axis elevation" value={elevation} onChange={setElevation} />
          <Slider label="Angle θ" value={angle} onChange={setAngle} />
        </>
      }
    >
      <Viz3D aspectRatio={16 / 10}>
        <QuaternionScene q={q} axis={axis} />
      </Viz3D>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">q =</span>
        <QuatPart name="w" value={q.w} />
        <QuatPart name="x" value={q.x} />
        <QuatPart name="y" value={q.y} />
        <QuatPart name="z" value={q.z} />
      </div>
    </VizFrame>
  );
}
