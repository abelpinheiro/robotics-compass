"use client";

import { useState } from "react";
import { Viz3D } from "@/components/viz/Viz3D";
import { VizFrame } from "@/components/viz/VizFrame";
import { MatrixDisplay } from "@/components/viz/MatrixDisplay";
import SE3Scene, { type Vec3 } from "./SE3Scene";

const fmt = (n: number) => (Math.abs(n) < 1e-9 ? 0 : n).toFixed(2);
const toRad = (d: number) => (d * Math.PI) / 180;

const INITIAL_P: Vec3 = { x: 1, y: 0, z: 1 };

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  fmt: f,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  fmt: (v: number) => string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      {label}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-accent"
        aria-valuetext={f(value)}
      />
      <span className="w-12 tabular-nums text-foreground">{f(value)}</span>
    </label>
  );
}

export default function SE3Viz() {
  const [P, setP] = useState<Vec3>(INITIAL_P);
  const [yawDeg, setYawDeg] = useState(30);
  const [tx, setTx] = useState(2);
  const [tz, setTz] = useState(-1.5);

  const yaw = toRad(yawDeg);
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);

  // ^B p = R_y(-yaw) · (^A p − t)
  const rx = P.x - tx;
  const rz = P.z - tz;
  const bp: Vec3 = { x: rx * c - rz * s, y: 0, z: rx * s + rz * c };

  // ^A_B T (4x4): R_y(yaw) with translation t.
  const T = [
    [c, 0, s, tx],
    [0, 1, 0, 0],
    [-s, 0, c, tz],
    [0, 0, 0, 1],
  ];

  const description =
    `An SE(3) transform between frame {A} (world) and frame {B}, displaced to ` +
    `(${fmt(tx)}, 0, ${fmt(tz)}) and rotated ${yawDeg}° about the vertical axis. ` +
    `The draggable point P is the same physical location in both frames: ` +
    `^A P = (${fmt(P.x)}, ${fmt(P.y)}, ${fmt(P.z)}), ^B P = (${fmt(bp.x)}, ${fmt(bp.y)}, ${fmt(bp.z)}). ` +
    `The 4×4 homogeneous transform T maps ^B P to ^A P by combining rotation and translation.`;

  return (
    <VizFrame
      title="Homogeneous transform (SE(3))"
      caption="Drag P; move and rotate frame {B} with the sliders."
      textAlternative={description}
      controls={
        <>
          <Slider label="Yaw" value={yawDeg} min={-180} max={180} step={1} onChange={setYawDeg} fmt={(v) => `${v}°`} />
          <Slider label="tx" value={tx} min={-3} max={3} step={0.1} onChange={setTx} fmt={fmt} />
          <Slider label="tz" value={tz} min={-3} max={3} step={0.1} onChange={setTz} fmt={fmt} />
          <button
            type="button"
            onClick={() => setP(INITIAL_P)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-2"
          >
            Reset point
          </button>
        </>
      }
    >
      <Viz3D aspectRatio={16 / 10}>
        <SE3Scene P={P} onChange={setP} base={{ yaw, tx, tz }} />
      </Viz3D>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="flex items-center gap-2 text-muted">
          <sup>A</sup>
          <sub>B</sub>T =
          <MatrixDisplay rows={T} ariaLabel="4 by 4 homogeneous transform" />
        </span>
        <span className="text-muted">
          ^A P:{" "}
          <span className="font-mono tabular-nums text-foreground">
            [{fmt(P.x)}, {fmt(P.y)}, {fmt(P.z)}]ᵀ
          </span>
        </span>
        <span className="text-muted">
          ^B P:{" "}
          <span className="font-mono tabular-nums text-foreground">
            [{fmt(bp.x)}, {fmt(bp.y)}, {fmt(bp.z)}]ᵀ
          </span>
        </span>
      </div>
    </VizFrame>
  );
}
