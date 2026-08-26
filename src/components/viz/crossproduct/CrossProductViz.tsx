"use client";

import { useState } from "react";
import { Viz3D } from "@/components/viz/Viz3D";
import { VizFrame } from "@/components/viz/VizFrame";
import CrossProductScene, { OMEGA_COLOR, R_COLOR, V_COLOR } from "./CrossProductScene";

const OMEGA_INIT = 1;
const RADIUS_INIT = 5;

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span className="w-40">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
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

export default function CrossProductViz() {
  const [omega, setOmega] = useState(OMEGA_INIT);
  const [radius, setRadius] = useState(RADIUS_INIT);
  // Read once at mount (client-only via ssr:false) so we never auto-spin when
  // the viewer prefers reduced motion.
  const [reduce] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );

  const v = Math.abs(omega * radius);
  const btn =
    "rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-2";

  const description =
    `A single robot link on a dark canvas, pinned at a central joint and spinning about a ` +
    `vertical axis. Three arrows show the cross product v = ω × r: a blue ω arrow along the ` +
    `rotation axis (ω = ${omega.toFixed(1)} rad/s), an amber r arrow along the link ` +
    `(r = ${radius.toFixed(1)} m), and a green v arrow at the tip, perpendicular to both and ` +
    `tangent to the tip's circular path. The tip speed is |v| = |ω|·|r| = ${v.toFixed(1)} m/s; ` +
    `it grows when either the angular velocity or the link length increases, and reverses ` +
    `direction when ω changes sign.` +
    (reduce ? " Continuous spin is disabled because you prefer reduced motion; the sliders still update every vector." : "");

  return (
    <VizFrame
      title="Velocity of a rotating link: v = ω × r"
      caption="The link spins about the ω axis. r points along the link; v is the velocity of the tip — always perpendicular to both ω and r, with magnitude |v| = |ω|·|r|. Change either slider and watch the green v arrow scale and flip."
      textAlternative={description}
      controls={
        <>
          <Slider
            label="Angular velocity ω"
            value={omega}
            min={-5}
            max={5}
            step={0.1}
            unit="rad/s"
            onChange={setOmega}
          />
          <Slider
            label="Link length r"
            value={radius}
            min={2}
            max={10}
            step={0.1}
            unit="m"
            onChange={setRadius}
          />
          <button
            type="button"
            onClick={() => {
              setOmega(OMEGA_INIT);
              setRadius(RADIUS_INIT);
            }}
            className={btn}
          >
            Reset
          </button>
        </>
      }
    >
      <Viz3D aspectRatio={16 / 10}>
        <CrossProductScene omega={omega} radius={radius} reduce={reduce} />
      </Viz3D>

      <div className="mt-3 space-y-2 text-sm">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono tabular-nums">
          <span style={{ color: OMEGA_COLOR }}>ω = {omega.toFixed(1)} rad/s</span>
          <span style={{ color: R_COLOR }}>r = {radius.toFixed(1)} m</span>
          <span className="font-semibold" style={{ color: V_COLOR }}>
            |v| = |ω|·|r| = {v.toFixed(1)} m/s
          </span>
        </div>
        <p className="text-muted">
          v = ω × r is perpendicular to both the rotation axis ω and the link r, tangent to the
          tip&apos;s circular path. Its length is the product |ω|·|r|, so it grows with either the
          spin rate or the link length — and points the other way when ω flips sign.
        </p>
      </div>
    </VizFrame>
  );
}
