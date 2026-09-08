"use client";

import { useEffect, useRef, useState } from "react";
import { Viz2D } from "@/components/viz/Viz2D";
import { VizFrame } from "@/components/viz/VizFrame";

// Planar 2R arm. Link lengths chosen so the ellipse and arm share a nice scale.
const L1 = 1.4;
const L2 = 1.1;
const W_MAX = L1 * L2; // Yoshikawa index at θ2 = ±90°
const SINGULAR = 0.05; // w/W_MAX below this ⇒ singular

const deg = (r: number) => Math.round((r * 180) / Math.PI);
const fmt = (n: number) => (Math.abs(n) < 5e-4 ? 0 : n).toFixed(3);

interface Ellipse {
  sigma1: number; // major semi-axis (m/s per unit joint speed)
  sigma2: number; // minor semi-axis
  angle: number; // orientation of the major axis (math frame, y up)
  w: number; // Yoshikawa manipulability = σ1·σ2 = |det J|
  ee: [number, number];
}

/** Velocity manipulability ellipse of the 2R positional Jacobian at (θ1, θ2). */
function ellipseAt(t1: number, t2: number): Ellipse {
  const s1 = Math.sin(t1), c1 = Math.cos(t1);
  const s12 = Math.sin(t1 + t2), c12 = Math.cos(t1 + t2);
  // positional Jacobian d[x,y]/d[θ1,θ2]
  const j11 = -L1 * s1 - L2 * s12, j12 = -L2 * s12;
  const j21 = L1 * c1 + L2 * c12, j22 = L2 * c12;
  // A = J·Jᵀ (symmetric 2×2)
  const a = j11 * j11 + j12 * j12;
  const b = j11 * j21 + j12 * j22;
  const c = j21 * j21 + j22 * j22;
  const tr = a + c;
  const disc = Math.sqrt(Math.max(0, tr * tr - 4 * (a * c - b * b)));
  const lambda1 = (tr + disc) / 2;
  const lambda2 = (tr - disc) / 2;
  return {
    sigma1: Math.sqrt(Math.max(0, lambda1)),
    sigma2: Math.sqrt(Math.max(0, lambda2)),
    angle: 0.5 * Math.atan2(2 * b, a - c),
    w: Math.abs(j11 * j22 - j12 * j21),
    ee: [L1 * c1 + L2 * c12, L1 * s1 + L2 * s12],
  };
}

function Canvas2D({ width, height, t1, t2 }: { width: number; height: number; t1: number; t2: number }) {
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
      success: tok("--success", "#16a34a"),
      danger: tok("--danger", "#e2675f"),
    };

    const el = ellipseAt(t1, t2);
    const reach = L1 + L2;
    const scale = (Math.min(width, height) * 0.4) / (reach * 1.05);
    const disp = scale * 0.62; // (m/s) → px for the velocity ellipse
    const ox = width * 0.4;
    const oy = height * 0.56;
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

    // arm
    const c1 = Math.cos(t1), s1 = Math.sin(t1);
    const elbow: [number, number] = [L1 * c1, L1 * s1];
    const tool = el.ee;
    ctx.lineCap = "round";
    ctx.strokeStyle = col.fg;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(X(0), Y(0));
    ctx.lineTo(X(elbow[0]), Y(elbow[1]));
    ctx.lineTo(X(tool[0]), Y(tool[1]));
    ctx.stroke();
    ctx.lineCap = "butt";

    const dot = (p: [number, number], r: number, c: string) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(X(p[0]), Y(p[1]), r, 0, Math.PI * 2);
      ctx.fill();
    };
    dot([0, 0], 6, col.accent);
    dot(elbow, 5, col.accent);

    // ---- manipulability ellipse at the end-effector ----
    const cx = X(tool[0]), cy = Y(tool[1]);
    const rx = el.sigma1 * disp;
    const ry = el.sigma2 * disp;
    const singular = el.w / W_MAX < SINGULAR;
    const rot = -el.angle; // math y-up → screen y-down

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    // translucent green fill + stroke; when singular it is a near-flat line
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(rx, 0.5), Math.max(ry, 0.5), 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(22,163,74,0.22)";
    ctx.fill();
    ctx.strokeStyle = col.success; // the ellipse itself stays green
    ctx.lineWidth = 2.4;
    ctx.stroke();
    // principal axes (major = σ1 along x, minor = σ2 along y after rotation)
    ctx.strokeStyle = col.success;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 1.3;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(-rx, 0);
    ctx.lineTo(rx, 0);
    ctx.moveTo(0, -ry);
    ctx.lineTo(0, ry);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.restore();

    // EE dot on top
    dot(tool, 5.5, singular ? col.danger : col.success);

    // labels
    ctx.font = "600 12px ui-sans-serif, system-ui, sans-serif";
    ctx.fillStyle = singular ? col.danger : col.success;
    ctx.fillText(singular ? "ellipse → line (singular)" : "manipulability ellipse", cx + 10, cy - 10);
  }, [width, height, t1, t2]);

  return <canvas ref={ref} style={{ width, height }} className="touch-none" aria-hidden="true" />;
}

function Slider({
  label,
  value,
  min,
  max,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span className="w-20 tabular-nums">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-accent"
        aria-valuetext={display}
      />
      <span className="w-14 tabular-nums text-foreground">{display}</span>
    </label>
  );
}

const presetBtn =
  "rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface-2";

export default function ManipulabilityViz() {
  const [t1, setT1] = useState(0.6);
  const [t2, setT2] = useState(Math.PI / 2);

  const el = ellipseAt(t1, t2);
  const barFrac = Math.max(0, Math.min(1, Math.sqrt(el.w / W_MAX)));
  const singular = el.w / W_MAX < SINGULAR;
  const cond = el.sigma2 > 1e-4 ? el.sigma1 / el.sigma2 : Infinity;

  const description =
    `A planar 2R arm (link lengths ${L1} and ${L2}). At the end-effector, the translucent green ` +
    `manipulability ellipse shows every tool velocity reachable with unit-bounded joint speeds — its ` +
    `semi-axes are the singular values σ₁ = ${fmt(el.sigma1)} and σ₂ = ${fmt(el.sigma2)} of the ` +
    `Jacobian. Its area is π·σ₁·σ₂, proportional to the Yoshikawa manipulability index ` +
    `w = √det(J·Jᵀ) = ${fmt(el.w)}. Current joints: θ₁ = ${deg(t1)}°, θ₂ = ${deg(t2)}°. ` +
    (singular
      ? `θ₂ is near 0° or 180°, so σ₂ → 0 and the ellipse has collapsed into a 1-D line: the arm is at a singularity and can no longer move the tool in one direction.`
      : `As θ₂ approaches 0° or 180° the ellipse flattens toward a line.`);

  return (
    <VizFrame
      title="The manipulability ellipse flattens at a singularity"
      caption="The green ellipse at the tool is the set of tool velocities reachable with bounded joint speeds. It is fat and round in a strong posture and squashes into a 1-D line as θ₂ → 0° or 180°, where the Yoshikawa index w drops to 0. Drag θ₂ toward the singular values to watch it collapse."
      textAlternative={description}
      controls={
        <div className="flex w-full flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={presetBtn} onClick={() => setT2(Math.PI / 2)}>
              θ₂ = 90° (best)
            </button>
            <button type="button" className={presetBtn} onClick={() => setT2(0.035)}>
              θ₂ → 0° (singular)
            </button>
            <button type="button" className={presetBtn} onClick={() => setT2(Math.PI - 0.035)}>
              θ₂ → 180° (singular)
            </button>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1.5">
            <Slider label="θ₁" value={t1} min={-Math.PI} max={Math.PI} display={`${deg(t1)}°`} onChange={setT1} />
            <Slider label="θ₂" value={t2} min={-Math.PI} max={Math.PI} display={`${deg(t2)}°`} onChange={setT2} />
          </div>
        </div>
      }
    >
      <Viz2D aspectRatio={1.5}>
        {({ width, height }) => <Canvas2D width={width} height={height} t1={t1} t2={t2} />}
      </Viz2D>

      <div className="mt-3 space-y-2 text-sm">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 font-mono tabular-nums">
          <span className="text-base font-semibold text-foreground">w = {fmt(el.w)}</span>
          <span className="text-muted">σ₁ = {fmt(el.sigma1)}</span>
          <span className="text-muted">σ₂ = {fmt(el.sigma2)}</span>
          <span className="text-muted">κ = σ₁/σ₂ = {cond === Infinity ? "∞" : fmt(cond)}</span>
          {singular && (
            <span className="rounded-md px-2 py-0.5 text-xs font-bold text-white" style={{ background: "var(--danger)" }}>
              ⚠ SINGULAR
            </span>
          )}
        </div>
        <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full transition-[width] duration-150"
            style={{ width: `${barFrac * 100}%`, background: singular ? "var(--danger)" : "var(--success)" }}
          />
        </div>
        <p className="text-muted">
          The ellipse&apos;s area is π·σ₁·σ₂, so it shrinks exactly as{" "}
          <strong>w = √det(J·Jᵀ) = L₁·L₂·|sin θ₂|</strong>. When θ₂ hits 0° or 180°, σ₂ collapses to 0:
          the ellipse becomes a line, the condition number κ blows up, and the tool can no longer move
          perpendicular to that line — a kinematic singularity.
        </p>
      </div>
    </VizFrame>
  );
}
