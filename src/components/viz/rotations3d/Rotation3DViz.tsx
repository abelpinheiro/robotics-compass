"use client";

import { useState } from "react";
import * as THREE from "three";
import { Viz3D } from "@/components/viz/Viz3D";
import { VizFrame } from "@/components/viz/VizFrame";
import { MatrixDisplay } from "@/components/viz/MatrixDisplay";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import Rotation3DScene from "./Rotation3DScene";

const toRad = (d: number) => (d * Math.PI) / 180;

interface Angles {
  x: number;
  y: number;
  z: number;
}

const INITIAL: Angles = { x: 0, y: 30, z: 45 };

function AngleSlider({
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

export default function Rotation3DViz() {
  const { t } = useLocale();
  const [deg, setDeg] = useState<Angles>(INITIAL);
  const euler = { x: toRad(deg.x), y: toRad(deg.y), z: toRad(deg.z) };

  // Rotation matrix matching the scene's group rotation (three Euler 'XYZ').
  const m = new THREE.Matrix4().makeRotationFromEuler(
    new THREE.Euler(euler.x, euler.y, euler.z, "XYZ"),
  );
  const e = m.elements;
  const R = [
    [e[0], e[4], e[8]],
    [e[1], e[5], e[9]],
    [e[2], e[6], e[10]],
  ];

  const set = (k: keyof Angles) => (v: number) =>
    setDeg((prev) => ({ ...prev, [k]: v }));

  const description =
    `A 3D rotation in SO(3). The world frame is fixed; the body frame {B} is rotated by ` +
    `intrinsic X–Y–Z Euler angles roll = ${deg.x}°, pitch = ${deg.y}°, yaw = ${deg.z}°. ` +
    `Its columns are the body axes expressed in the world frame; the matrix is orthonormal ` +
    `with determinant +1. Drag to orbit the scene.`;

  return (
    <VizFrame
      title="Rotations in 3D (SO(3))"
      caption="Set the Euler angles; the body frame {B} rotates and R updates live."
      textAlternative={description}
      controls={
        <>
          <AngleSlider label={t.viz.roll} value={deg.x} onChange={set("x")} />
          <AngleSlider label={t.viz.pitch} value={deg.y} onChange={set("y")} />
          <AngleSlider label={t.viz.yaw} value={deg.z} onChange={set("z")} />
          <button
            type="button"
            onClick={() => setDeg(INITIAL)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-2"
          >
            {t.viz.reset}
          </button>
        </>
      }
    >
      <Viz3D aspectRatio={16 / 10}>
        <Rotation3DScene euler={euler} />
      </Viz3D>

      <div className="mt-3 flex items-center gap-2 text-sm text-muted">
        R =
        <MatrixDisplay rows={R} ariaLabel="3 by 3 rotation matrix" />
      </div>
    </VizFrame>
  );
}
