"use client";

import { useState } from "react";
import { Viz3D } from "@/components/viz/Viz3D";
import { VizFrame } from "@/components/viz/VizFrame";
import ArmScene, { L1, L2 } from "./ArmScene";

const toRad = (deg: number) => (deg * Math.PI) / 180;

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

export default function ArmViz() {
  const [theta1, setTheta1] = useState(35);
  const [theta2, setTheta2] = useState(-55);

  // Forward kinematics of the planar 2-link arm (xz ground plane).
  const t1 = toRad(theta1);
  const t12 = toRad(theta1 + theta2);
  const ex = L1 * Math.cos(t1) + L2 * Math.cos(t12);
  const ez = -(L1 * Math.sin(t1) + L2 * Math.sin(t12));

  const description =
    `A two-link planar robot arm shown in 3D on a dark canvas. Link 1 is ${L1} units long, ` +
    `link 2 is ${L2} units. Joint 1 is at ${theta1}°, joint 2 at ${theta2}° relative to link 1. ` +
    `Coordinate-frame triads (x red, y green, z blue) are drawn at each joint and the ` +
    `end-effector, which is at planar position (${ex.toFixed(2)}, ${ez.toFixed(2)}). ` +
    `Drag to orbit the camera; use the sliders to set each joint angle.`;

  const controls = (
    <>
      <AngleSlider label="Joint 1" value={theta1} onChange={setTheta1} />
      <AngleSlider label="Joint 2" value={theta2} onChange={setTheta2} />
    </>
  );

  return (
    <VizFrame
      title="Forward kinematics: 2-link arm"
      caption="Drag to orbit; set the joint angles with the sliders."
      textAlternative={description}
      controls={controls}
    >
      <Viz3D aspectRatio={16 / 10}>
        <ArmScene theta1={t1} theta2={toRad(theta2)} />
      </Viz3D>
    </VizFrame>
  );
}
