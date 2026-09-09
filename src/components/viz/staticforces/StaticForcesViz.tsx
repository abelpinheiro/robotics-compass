"use client";

import { useEffect, useRef, useState } from "react";
import { Viz2D } from "@/components/viz/Viz2D";
import { VizFrame } from "@/components/viz/VizFrame";

// Planar 2R arm (same geometry as the manipulability viz).
const L1 = 1.4;
const L2 = 1.1;
const F_MAX = 100; // N (slider max)
const TAU_MAX = (L1 + L2) * F_MAX; // N·m, for normalising the torque arcs
const TAU_ZERO = TAU_MAX * 0.02; // |τ| below this counts as "≈ 0"
const SINGULAR = 0.05; // |sin θ2| below this ⇒ singular

const deg = (r: number) => Math.round((r * 180) / Math.PI);
const fmt = (n: number) => (Math.abs(n) < 5e-3 ? 0 : n).toFixed(1);

interface Statics {
  J: [number, number, number, number]; // [J00, J01, J10, J11]
  Fx: number;
  Fy: number;
  tau1: number;
  tau2: number;
  ee: [number, number];
  elbow: [number, number];
  singular: boolean;
}

/** τ = Jᵀ·F for the 2R arm at (θ1, θ2), force (Fmag, Fdir). */
function statics(t1: number, t2: number, fmag: number, fdir: number): Statics {
  const s1 = Math.sin(t1), c1 = Math.cos(t1);
  const s12 = Math.sin(t1 + t2), c12 = Math.cos(t1 + t2);
  const J00 = -L1 * s1 - L2 * s12;
  const J01 = -L2 * s12;
  const J10 = L1 * c1 + L2 * c12;
  const J11 = L2 * c12;
  const Fx = fmag * Math.cos(fdir);
  const Fy = fmag * Math.sin(fdir);
  return {
    J: [J00, J01, J10, J11],
    Fx,
    Fy,
    tau1: J00 * Fx + J10 * Fy, // τ = Jᵀ F  ⇒  τ1 = J00·Fx + J10·Fy
    tau2: J01 * Fx + J11 * Fy, //             τ2 = J01·Fx + J11·Fy
    ee: [L1 * c1 + L2 * c12, L1 * s1 + L2 * s12],
    elbow: [L1 * c1, L1 * s1],
    singular: Math.abs(Math.sin(t2)) < SINGULAR,
  };
}

function Canvas2D({
  width,
  height,
  t1,
  t2,
  fmag,
  fdir,
}: {
  width: number;
  height: number;
  t1: number;
  t2: number;
  fmag: number;
  fdir: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || width <= 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const cs = getComputedStyle(canvas);
    const tok = (n: string, fb: string) => cs.getPropertyValue(n).trim() || fb;
    const col = {
      grid: tok("--viz-grid", "#e3e6eb"),
      muted: tok("--muted", "#5b6472"),
      fg: tok("--foreground", "#1a1f2b"),
      accent: tok("--accent", "#2563eb"),
      warning: tok("--warning", "#d97706"),
      danger: tok("--danger", "#e2675f"),
      success: tok("--success", "#16a34a"),
    };

    const st = statics(t1, t2, fmag, fdir);
    const reach = L1 + L2;
    const scale = (Math.min(width, height) * 0.34) / reach;
    const ox = width * 0.44;
    const oy = height * 0.54;
    const X = (x: number) => ox + x * scale;
    const Y = (y: number) => oy - y * scale;

    // grid
    ctx.strokeStyle = col.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = Math.ceil(-ox / scale); gx * scale < width - ox; gx++) {
      ctx.moveTo(X(gx), 0);
      ctx.lineTo(X(gx), height);
    }
    for (let gy = Math.ceil((oy - height) / scale); gy * scale < oy; gy++) {
      ctx.moveTo(0, Y(gy));
      ctx.lineTo(width, Y(gy));
    }
    ctx.stroke();

    // structural axis (the null-space direction) at a singularity: pushing along
    // this line needs zero torque. Drawn as a faint guide through the base.
    if (st.singular) {
      ctx.strokeStyle = col.success;
      ctx.globalAlpha = 0.5;
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.4;
      const ux = Math.cos(t1), uy = Math.sin(t1);
      ctx.beginPath();
      ctx.moveTo(X(-ux * reach), Y(-uy * reach));
      ctx.lineTo(X(ux * reach), Y(uy * reach));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // arm
    ctx.lineCap = "round";
    ctx.strokeStyle = col.fg;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(X(0), Y(0));
    ctx.lineTo(X(st.elbow[0]), Y(st.elbow[1]));
    ctx.lineTo(X(st.ee[0]), Y(st.ee[1]));
    ctx.stroke();
    ctx.lineCap = "butt";

    // ---- torque arcs at joint 1 (base) and joint 2 (elbow) ----
    const drawTorque = (center: [number, number], tau: number, baseR: number) => {
      const mag = Math.min(1, Math.abs(tau) / TAU_MAX);
      if (Math.abs(tau) < TAU_ZERO) return; // negligible → no arc
      const cx = X(center[0]), cy = Y(center[1]);
      const r = baseR + mag * 14;
      const sweep = 0.5 + mag * (Math.PI * 1.25);
      const sign = tau > 0 ? 1 : -1; // +1 = CCW on screen (math y-up)
      const psi0 = -0.6;
      const pt = (psi: number): [number, number] => [cx + r * Math.cos(psi), cy - r * Math.sin(psi)];
      ctx.strokeStyle = col.accent;
      ctx.globalAlpha = 0.3 + 0.7 * mag; // intensity ∝ |τ|
      ctx.lineWidth = 2 + mag * 4;
      ctx.beginPath();
      const N = 40;
      for (let i = 0; i <= N; i++) {
        const [px, py] = pt(psi0 + sign * sweep * (i / N));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      // arrowhead at the swept end
      const pe = psi0 + sign * sweep;
      const [ex, ey] = pt(pe);
      const ta = Math.atan2(sign * -Math.cos(pe), sign * -Math.sin(pe));
      ctx.fillStyle = col.accent;
      const h = 7 + mag * 4;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - h * Math.cos(ta - 0.5), ey - h * Math.sin(ta - 0.5));
      ctx.lineTo(ex - h * Math.cos(ta + 0.5), ey - h * Math.sin(ta + 0.5));
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    };
    drawTorque([0, 0], st.tau1, 26);
    drawTorque(st.elbow, st.tau2, 20);

    // joints on top
    const dot = (p: [number, number], r: number, c: string) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(X(p[0]), Y(p[1]), r, 0, Math.PI * 2);
      ctx.fill();
    };
    dot([0, 0], 6, col.fg);
    dot(st.elbow, 5, col.fg);

    // ---- external force arrow, pointing INTO the end-effector ----
    if (fmag > 0.5) {
      const fLen = (fmag / F_MAX) * scale * 1.35; // px
      const tipX = X(st.ee[0]), tipY = Y(st.ee[1]);
      const tailX = tipX - fLen * Math.cos(fdir);
      const tailY = tipY + fLen * Math.sin(fdir); // screen y down
      ctx.strokeStyle = col.danger;
      ctx.fillStyle = col.danger;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      const ang = Math.atan2(tipY - tailY, tipX - tailX);
      const h = 12;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX - h * Math.cos(ang - 0.42), tipY - h * Math.sin(ang - 0.42));
      ctx.lineTo(tipX - h * Math.cos(ang + 0.42), tipY - h * Math.sin(ang + 0.42));
      ctx.closePath();
      ctx.fill();
      ctx.font = "700 12px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText("F", tailX - 14, tailY + 4);
    }

    // EE marker
    dot(st.ee, 5.5, col.danger);

    // "τ ≈ 0" callout when the structure absorbs the force
    const absorbed = fmag > 5 && Math.abs(st.tau1) < TAU_ZERO && Math.abs(st.tau2) < TAU_ZERO;
    if (absorbed) {
      ctx.fillStyle = col.success;
      ctx.font = "700 12px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText("τ ≈ 0 · force absorbed by structure", X(st.ee[0]) + 12, Y(st.ee[1]) - 12);
    }
  }, [width, height, t1, t2, fmag, fdir]);

  return <canvas ref={ref} style={{ width, height }} className="touch-none" aria-hidden="true" />;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span className="w-28 tabular-nums">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-accent"
        aria-valuetext={display}
      />
      <span className="w-16 tabular-nums text-foreground">{display}</span>
    </label>
  );
}

const presetBtn =
  "rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface-2";

export default function StaticForcesViz() {
  const [t1, setT1] = useState(0.7);
  const [t2, setT2] = useState(1.2);
  const [fmag, setFmag] = useState(60);
  const [fdir, setFdir] = useState(Math.PI / 2);

  const st = statics(t1, t2, fmag, fdir);
  const fmagShown = Math.hypot(st.Fx, st.Fy);
  const absorbed = fmag > 5 && Math.abs(st.tau1) < TAU_ZERO && Math.abs(st.tau2) < TAU_ZERO;

  // demo: fold the arm out to a singularity (θ2 = 0) and push straight along it
  const singularityDemo = () => {
    setT2(0);
    setFdir(((t1 % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));
    setFmag(60);
  };
  const alignWithArm = () =>
    setFdir(((t1 % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));

  const description =
    `A planar 2R arm (link lengths ${L1} and ${L2}) with an external force F pushed into its ` +
    `end-effector. The force has magnitude ${fmt(fmag)} N at ${deg(fdir)}°, giving ` +
    `F = (${fmt(st.Fx)}, ${fmt(st.Fy)}) N. The joint torques needed to hold against it follow the ` +
    `Jacobian transpose, τ = Jᵀ·F: τ₁ = ${fmt(st.tau1)} N·m at the base and τ₂ = ${fmt(st.tau2)} N·m ` +
    `at the elbow, drawn as curved arrows whose size and intensity scale with |τ|. ` +
    (absorbed
      ? `The arm is at a singularity and the force points along its structure, so both torques are ≈ 0 — the rigid links carry the load and the motors feel nothing.`
      : `Fold the arm to a singularity (θ₂ = 0) and push along the arm to drive both torques to zero.`);

  return (
    <VizFrame
      title="Static forces: τ = Jᵀ·F"
      caption="Push a force into the end-effector and watch the joint torques the motors must supply to resist it, τ = Jᵀ·F. The torque arcs grow with |τ|. At a singularity, a force pushed straight along the arm's structure produces zero torque — the links carry it, not the motors."
      textAlternative={description}
      controls={
        <div className="flex w-full flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={presetBtn} onClick={singularityDemo}>
              Singularity demo (τ → 0)
            </button>
            <button type="button" className={presetBtn} onClick={alignWithArm}>
              Align force with arm
            </button>
            <button
              type="button"
              className={presetBtn}
              onClick={() => {
                setT1(0.7);
                setT2(1.2);
                setFmag(60);
                setFdir(Math.PI / 2);
              }}
            >
              Reset
            </button>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1.5">
            <Slider label="force dir" value={fdir} min={0} max={2 * Math.PI} step={0.01} display={`${deg(fdir)}°`} onChange={setFdir} />
            <Slider label="force mag" value={fmag} min={0} max={F_MAX} step={1} display={`${Math.round(fmag)} N`} onChange={setFmag} />
            <Slider label="θ₁ (shoulder)" value={t1} min={-Math.PI} max={Math.PI} step={0.02} display={`${deg(t1)}°`} onChange={setT1} />
            <Slider label="θ₂ (elbow)" value={t2} min={-Math.PI} max={Math.PI} step={0.02} display={`${deg(t2)}°`} onChange={setT2} />
          </div>
        </div>
      }
    >
      <Viz2D aspectRatio={1.5}>
        {({ width, height }) => <Canvas2D width={width} height={height} t1={t1} t2={t2} fmag={fmag} fdir={fdir} />}
      </Viz2D>

      {/* real-time F / τ text panel */}
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 font-mono tabular-nums">
          <span style={{ color: "var(--danger)" }}>
            F = ({fmt(st.Fx)}, {fmt(st.Fy)}) N · |F| = {fmt(fmagShown)}
          </span>
          <span style={{ color: "var(--accent)" }}>τ₁ = {fmt(st.tau1)} N·m</span>
          <span style={{ color: "var(--accent)" }}>τ₂ = {fmt(st.tau2)} N·m</span>
          {absorbed && (
            <span className="rounded-md px-2 py-0.5 text-xs font-bold text-white" style={{ background: "var(--success)" }}>
              τ ≈ 0 — structure carries the load
            </span>
          )}
        </div>
        <p className="text-muted">
          The <strong>same Jacobian</strong> that maps joint speeds to tool velocity maps tool forces
          to joint torques — transposed: <strong>τ = Jᵀ·F</strong>. So{" "}
          <span className="font-mono">τ₁ = J₀₀·Fₓ + J₁₀·F_y</span> and{" "}
          <span className="font-mono">τ₂ = J₀₁·Fₓ + J₁₁·F_y</span>. At a singularity J drops rank, so a
          force along the arm&apos;s structure lands in the null space of Jᵀ and needs{" "}
          <strong>zero</strong> torque — the worst posture for producing velocity is the best for
          resisting force.
        </p>
      </div>
    </VizFrame>
  );
}
