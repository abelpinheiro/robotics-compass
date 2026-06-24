"use client";

import { useState } from "react";
import { Viz3D } from "@/components/viz/Viz3D";
import { VizFrame } from "@/components/viz/VizFrame";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import FramesScene, { BASE, type Vec3 } from "./FramesScene";

const INITIAL: Vec3 = { x: 1, y: 0, z: 1 };
const fmt = (n: number) => n.toFixed(2);

/** Coordinates of the same physical point P expressed in {RobotBase}:
 *  ^B p = R_y(-θ) · (^W p − ^W p_BORG). */
function baseCoords(P: Vec3): Vec3 {
  const th = (BASE.rotYdeg * Math.PI) / 180;
  const c = Math.cos(th);
  const s = Math.sin(th);
  const rx = P.x - BASE.x;
  const rz = P.z - BASE.z;
  return { x: rx * c - rz * s, y: 0, z: rx * s + rz * c };
}

function ReadoutRow({
  swatch,
  label,
  v,
}: {
  swatch: string;
  label: string;
  v: Vec3;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2">
      <dt className="flex items-center gap-2 text-sm font-medium text-foreground">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${swatch}`} />
        {label}
      </dt>
      <dd className="mt-1 font-mono text-sm tabular-nums text-muted">
        [{fmt(v.x)}, {fmt(v.y)}, {fmt(v.z)}]ᵀ
      </dd>
    </div>
  );
}

export default function VectorsFramesViz() {
  const { t } = useLocale();
  const [P, setP] = useState<Vec3>(INITIAL);
  const baseP = baseCoords(P);

  const description =
    `A 3D scene with two coordinate frames: {World} at the global origin and {RobotBase} ` +
    `displaced to (${BASE.x}, ${BASE.y}, ${BASE.z}) and rotated ${BASE.rotYdeg}° ` +
    `about the vertical axis. A draggable target point P sits at the same physical location but ` +
    `has different coordinates in each frame: in {World} it is ` +
    `(${fmt(P.x)}, ${fmt(P.y)}, ${fmt(P.z)}); in {RobotBase} it is ` +
    `(${fmt(baseP.x)}, ${fmt(baseP.y)}, ${fmt(baseP.z)}). An arrow runs from each frame's ` +
    `origin to P; dragging P (on the ground plane) updates both position vectors live.`;

  return (
    <VizFrame
      title="One point, two frames"
      caption="Drag the point P on the ground plane; orbit with the mouse."
      textAlternative={description}
      controls={
        <button
          type="button"
          onClick={() => setP(INITIAL)}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-2"
        >
          {t.viz.resetPoint}
        </button>
      }
    >
      <Viz3D aspectRatio={16 / 10}>
        <FramesScene P={P} onChange={setP} />
      </Viz3D>

      <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <ReadoutRow swatch="bg-accent" label={"{World} → P"} v={P} />
        <ReadoutRow swatch="bg-danger" label={"{RobotBase} → P"} v={baseP} />
      </dl>
    </VizFrame>
  );
}
