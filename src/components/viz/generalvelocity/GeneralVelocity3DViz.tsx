"use client";

import { useState } from "react";
import { Viz3D } from "@/components/viz/Viz3D";
import { VizFrame } from "@/components/viz/VizFrame";
import GeneralVelocity3DScene, { C } from "./GeneralVelocity3DScene";

const fmt = (n: number) => (Math.abs(n) < 5e-3 ? 0 : n).toFixed(1);
const R_Q = 1.2;

function Slider({
  label,
  value,
  min,
  max,
  unit,
  color,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  color?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span className="w-44" style={color ? { color } : undefined}>
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-accent"
        aria-valuetext={`${value.toFixed(1)} ${unit}`}
      />
      <span className="w-16 tabular-nums text-foreground">
        {value.toFixed(1)} {unit}
      </span>
    </label>
  );
}

const OMEGA_INIT = 1.0;
const VBORG_INIT = 1.2;
const VQB_INIT = 1.0;

export default function GeneralVelocity3DViz() {
  const [omega, setOmega] = useState(OMEGA_INIT);
  const [vBorg, setVBorg] = useState(VBORG_INIT);
  const [vQb, setVQb] = useState(VQB_INIT);
  const [paused, setPaused] = useState(false);
  const [reduce] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );

  const btn =
    "rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-2";

  const description =
    `A 3D dark canvas with a fixed world frame {A} and a moving frame {B} that both ` +
    `translates (bouncing back and forth, origin speed ${fmt(vBorg)} m/s) and spins about ` +
    `its vertical axis (Ω = ${fmt(omega)} rad/s, purple). A point Q is fixed in {B} at ` +
    `distance ${fmt(R_Q)} along its x-axis, so it orbits as {B} turns. The velocity of Q ` +
    `seen from {A} is drawn tip-to-tail as three contributions at Q — origin translation ` +
    `(blue), motion of Q within {B} (green, ${fmt(vQb)} m/s), and the rotation term Ω×r ` +
    `(orange) — summing to the resultant ᴬV_Q (pink). Orbit the camera to view it from any ` +
    `angle; pause to study the vectors statically.`;

  return (
    <VizFrame
      title="Moving frame in 3D: translation + rotation and the velocity of Q"
      caption="Frame {B} both translates (bouncing) and spins about its vertical axis (Ω, purple); point Q is fixed in {B}. The velocity of Q seen from {A} is the tip-to-tail sum of three contributions at Q — translation (blue), motion within {B} (green), and Ω×r (orange) — giving ᴬV_Q (pink). Drag to orbit the camera; pause to inspect the vectors."
      textAlternative={description}
      controls={
        <>
          <Slider label="angular velocity Ω" value={omega} min={-3} max={3} unit="rad/s" color={C.omega} onChange={setOmega} />
          <Slider label="origin speed |V_Borg|" value={vBorg} min={0} max={3} unit="m/s" color={C.vBorg} onChange={setVBorg} />
          <Slider label="speed of Q in {B} |ᴮV_Q|" value={vQb} min={0} max={3} unit="m/s" color={C.motion} onChange={setVQb} />
          <span className="mx-1 h-6 w-px bg-border" />
          <button type="button" onClick={() => setPaused((p) => !p)} aria-pressed={paused} className={btn}>
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={() => {
              setOmega(OMEGA_INIT);
              setVBorg(VBORG_INIT);
              setVQb(VQB_INIT);
              setPaused(false);
            }}
            className={btn}
          >
            Reset
          </button>
        </>
      }
    >
      <Viz3D aspectRatio={16 / 10}>
        <GeneralVelocity3DScene omega={omega} vBorg={vBorg} vQb={vQb} paused={paused} reduce={reduce} />
      </Viz3D>

      <div className="mt-3 space-y-2 text-sm">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono tabular-nums">
          <span style={{ color: C.omega }}>Ω = {fmt(omega)} rad/s</span>
          <span style={{ color: C.vBorg }}>|ᴬV_Borg| = {fmt(vBorg)}</span>
          <span style={{ color: C.motion }}>|ᴮV_Q| = {fmt(vQb)}</span>
          <span style={{ color: C.omegaR }}>|Ω×r| = {fmt(Math.abs(omega) * R_Q)}</span>
          <span className="font-semibold" style={{ color: C.res }}>→ ᴬV_Q = their vector sum</span>
        </div>
        <p className="text-muted">
          ᴬV_Q = <span style={{ color: C.vBorg }}>ᴬV_Borg</span> +{" "}
          <span style={{ color: C.motion }}>ᴬ_B R ᴮV_Q</span> +{" "}
          <span style={{ color: C.omegaR }}>ᴬΩ_B × r</span>. Same decomposition as the 2D view, now
          in 3D — the frame really moves and spins, and you can orbit the camera to see the
          vectors from any side.
        </p>
      </div>
    </VizFrame>
  );
}
