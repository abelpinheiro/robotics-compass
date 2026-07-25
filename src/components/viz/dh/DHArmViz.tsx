"use client";

import { useState } from "react";
import { Viz3D } from "@/components/viz/Viz3D";
import { VizFrame } from "@/components/viz/VizFrame";
import DHArmScene from "./DHArmScene";

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

function FrameToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-accent"
      />
      {label}
    </label>
  );
}

export default function DHArmViz() {
  const [theta1, setTheta1] = useState(35);
  const [theta2, setTheta2] = useState(-55);
  const [showBase, setShowBase] = useState(true);
  const [showJoint1, setShowJoint1] = useState(true);
  const [showEE, setShowEE] = useState(true);

  const shown = [
    showBase && "{0} base",
    showJoint1 && "{1} joint 1",
    showEE && "{2} end-effector",
  ].filter(Boolean);

  const description =
    `A two-link planar robot arm shown in 3D on a dark canvas. Both joints are ` +
    `revolute and rotate about the vertical axis, drawn as cylindrical motors. ` +
    `Joint 1 is at ${theta1}°, joint 2 at ${theta2}° relative to link 1. Coordinate ` +
    `frames can be toggled at the base, joint 1, and the end-effector; currently ` +
    `shown: ${shown.length ? shown.join(", ") : "none"}. Each frame's z-axis (blue) ` +
    `points straight up, aligned with its motor's rotation axis — the DH convention ` +
    `where z is the joint axis. Drag to orbit the camera.`;

  return (
    <VizFrame
      title="Coordinate frames on a 2-link arm"
      caption="Toggle the frames at the base, joint 1, and the end-effector. Each frame's blue z-axis points up, along its motor's rotation axis. Move the joints — the z-axes stay aligned with the motors."
      textAlternative={description}
      controls={
        <>
          <AngleSlider label="Joint 1" value={theta1} onChange={setTheta1} />
          <AngleSlider label="Joint 2" value={theta2} onChange={setTheta2} />
          <FrameToggle label="{0} base" checked={showBase} onChange={setShowBase} />
          <FrameToggle
            label="{1} joint 1"
            checked={showJoint1}
            onChange={setShowJoint1}
          />
          <FrameToggle
            label="{2} end-effector"
            checked={showEE}
            onChange={setShowEE}
          />
        </>
      }
    >
      <Viz3D aspectRatio={16 / 10}>
        <DHArmScene
          theta1={toRad(theta1)}
          theta2={toRad(theta2)}
          showBase={showBase}
          showJoint1={showJoint1}
          showEE={showEE}
        />
      </Viz3D>
    </VizFrame>
  );
}
