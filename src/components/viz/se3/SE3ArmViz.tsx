"use client";

import { useState } from "react";
import { Viz3D } from "@/components/viz/Viz3D";
import { VizFrame } from "@/components/viz/VizFrame";
import { MatrixDisplay } from "@/components/viz/MatrixDisplay";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import SE3ArmScene, { L1, L2, L3 } from "./SE3ArmScene";

const fmt = (n: number) => (Math.abs(n) < 5e-3 ? 0 : n).toFixed(2);
const toRad = (deg: number) => (deg * Math.PI) / 180;

type Mat4 = number[][];

// 4x4 homogeneous primitives. These MUST match three's conventions so the
// displayed matrix equals the {End-effector} group's world matrix in the scene:
// three composes a group as Trans(position) · Rot(rotation), and R_y / R_z use
// the same signs as three's makeRotationY / makeRotationZ.
function mul(a: Mat4, b: Mat4): Mat4 {
  const out: Mat4 = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++)
      for (let k = 0; k < 4; k++) out[i][j] += a[i][k] * b[k][j];
  return out;
}

function rotY(t: number): Mat4 {
  const c = Math.cos(t);
  const s = Math.sin(t);
  return [
    [c, 0, s, 0],
    [0, 1, 0, 0],
    [-s, 0, c, 0],
    [0, 0, 0, 1],
  ];
}

function rotZ(t: number): Mat4 {
  const c = Math.cos(t);
  const s = Math.sin(t);
  return [
    [c, -s, 0, 0],
    [s, c, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
}

function transX(d: number): Mat4 {
  return [
    [1, 0, 0, d],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
}

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

const INITIAL = { t1: 40, t2: -35, t3: -50 };

export default function SE3ArmViz() {
  const { t } = useLocale();
  const [theta1, setTheta1] = useState(INITIAL.t1);
  const [theta2, setTheta2] = useState(INITIAL.t2);
  const [theta3, setTheta3] = useState(INITIAL.t3);

  const r1 = toRad(theta1);
  const r2 = toRad(theta2);
  const r3 = toRad(theta3);

  // ^Base_EE T = R_y(θ1)·Trans(L1)·R_z(θ2)·Trans(L2)·R_z(θ3)·Trans(L3).
  // Identical to the nested-group composition the scene renders.
  const T = mul(
    mul(mul(mul(mul(rotY(r1), transX(L1)), rotZ(r2)), transX(L2)), rotZ(r3)),
    transX(L3),
  );
  const px = T[0][3];
  const py = T[1][3];
  const pz = T[2][3];

  const baseLabel = "{Base}";
  const eeLabel = "{End-effector}";

  const description =
    `A three-link articulated robot arm shown in 3D on a dark canvas. Joint 1 ` +
    `(θ₁ = ${theta1}°) yaws the whole arm about the vertical Base y-axis; joints 2 ` +
    `(θ₂ = ${theta2}°) and 3 (θ₃ = ${theta3}°) pitch the arm up about their local z-axis. ` +
    `Link lengths are ${L1}, ${L2}, ${L3}. Coordinate triads (x red, y green, z blue) mark ` +
    `the fixed ${baseLabel} frame at the origin and the moving ${eeLabel} frame at the tip. ` +
    `The live 4×4 homogeneous transform ^Base_EE T gives the end-effector pose relative to ` +
    `the base; its translation column is currently (${fmt(px)}, ${fmt(py)}, ${fmt(pz)}). ` +
    `Drag to orbit the camera; use the sliders to set each joint angle.`;

  return (
    <VizFrame
      title="End-effector pose: 4×4 transform (SE(3))"
      caption="Drag to orbit; set the joint angles with the sliders. The 4×4 matrix is the end-effector pose relative to the base, updated live."
      textAlternative={description}
      controls={
        <>
          <AngleSlider label="Joint 1" value={theta1} onChange={setTheta1} />
          <AngleSlider label="Joint 2" value={theta2} onChange={setTheta2} />
          <AngleSlider label="Joint 3" value={theta3} onChange={setTheta3} />
          <button
            type="button"
            onClick={() => {
              setTheta1(INITIAL.t1);
              setTheta2(INITIAL.t2);
              setTheta3(INITIAL.t3);
            }}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-2"
          >
            {t.viz.reset}
          </button>
        </>
      }
    >
      <Viz3D aspectRatio={16 / 10}>
        <SE3ArmScene
          theta1={r1}
          theta2={r2}
          theta3={r3}
          baseLabel={baseLabel}
          eeLabel={eeLabel}
        />
      </Viz3D>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="flex items-center gap-2 text-muted">
          <span className="whitespace-nowrap">
            <sup>Base</sup>
            <sub>EE</sub>T =
          </span>
          <MatrixDisplay rows={T} ariaLabel="4 by 4 base-to-end-effector transform" />
        </span>
        <span className="text-muted">
          ᴮᵃˢᵉP<sub>EE</sub>:{" "}
          <span className="font-mono tabular-nums text-foreground">
            [{fmt(px)}, {fmt(py)}, {fmt(pz)}]ᵀ
          </span>
        </span>
      </div>
    </VizFrame>
  );
}
