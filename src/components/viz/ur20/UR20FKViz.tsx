"use client";

import { useState } from "react";
import { Viz3D } from "@/components/viz/Viz3D";
import { VizFrame } from "@/components/viz/VizFrame";
import UrdfArmScene from "@/components/playground/UrdfArmScene";
import { ur20FK, UR20_HOME } from "@/components/playground/ur20Math";
import { UR20_CONFIG } from "./config";

const deg = (r: number) => Math.round((r * 180) / Math.PI);
const fmt = (n: number) => (Math.abs(n) < 5e-4 ? 0 : n).toFixed(3);

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
      <span className="w-10 tabular-nums">{label}</span>
      <input
        type="range"
        min={-Math.PI}
        max={Math.PI}
        step={0.02}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-accent"
        aria-valuetext={`${deg(value)}°`}
      />
      <span className="w-12 tabular-nums text-foreground">{deg(value)}°</span>
    </label>
  );
}

const btn =
  "rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-2";

export default function UR20FKViz() {
  const [theta, setTheta] = useState<number[]>(UR20_HOME);
  const setJoint = (i: number, v: number) => setTheta((t) => t.map((x, k) => (k === i ? v : x)));
  const ee = ur20FK(theta).ee;

  const description =
    `The UR20 (official mesh) posed by its six joint angles ` +
    `θ₁…θ₆ = ${theta.map(deg).join("°, ")}°. Forward kinematics multiplies the six DH joint ` +
    `transforms to give the base-to-tool transform ⁰₆T; its translation is the end-effector ` +
    `position, here (${fmt(ee[0])}, ${fmt(ee[1])}, ${fmt(ee[2])}) m. Drag any joint to see the ` +
    `tool move; orbit the scene to read the tool orientation.`;

  return (
    <VizFrame
      title="Forward kinematics: pose the UR20"
      caption="Set the six joint angles and watch the tool move. The end-effector pose is the product of the per-joint DH transforms, ⁰₆T = ∏ ⁱ⁻¹ᵢT — its translation is shown below; its orientation is the tool frame you see in the scene."
      textAlternative={description}
      controls={
        <div className="flex w-full flex-col gap-3">
          <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {theta.map((v, i) => (
              <Slider key={i} label={`θ${["₁", "₂", "₃", "₄", "₅", "₆"][i]}`} value={v} onChange={(nv) => setJoint(i, nv)} />
            ))}
          </div>
          <button type="button" className={`${btn} w-fit`} onClick={() => setTheta(UR20_HOME)}>
            Reset
          </button>
        </div>
      }
    >
      <Viz3D aspectRatio={16 / 10}>
        <UrdfArmScene config={UR20_CONFIG} theta={theta} />
      </Viz3D>

      <div className="mt-3 text-sm">
        <span className="font-mono tabular-nums">
          end-effector: x = {fmt(ee[0])} m · y = {fmt(ee[1])} m · z = {fmt(ee[2])} m
        </span>
      </div>
    </VizFrame>
  );
}
