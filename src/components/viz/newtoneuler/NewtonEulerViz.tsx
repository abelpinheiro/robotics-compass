"use client";

import { useEffect, useRef, useState } from "react";
import { Viz2D } from "@/components/viz/Viz2D";
import { VizFrame } from "@/components/viz/VizFrame";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  neSolve,
  massMatrix,
  coriolisTorque,
  gravityTorque,
  DEFAULT_ARM,
  type Arm2R,
  type NEState,
  type Vec2,
} from "./newtonEulerMath";
import { newtonEulerStrings } from "./strings";

const ARM = DEFAULT_ARM;
const deg = (r: number) => Math.round((r * 180) / Math.PI);
const fmt = (n: number) => (Math.abs(n) < 5e-3 ? 0 : n).toFixed(2);

// Display scales (screen px per physical unit), with per-kind clamps.
const ACC_PX_PER = 0.055; // × scale, per m/s²
const FORCE_PX_PER = 0.018; // × scale, per N (shared by forces + weights so they compare)
const TAU_REF = 45; // N·m → full-size torque arc
const MAX_ARROW_FRAC = 1.05; // clamp arrow length to this × scale

// Reveal stages: how far through the two-pass recursion to draw (named in strings.ts).
const LAST = newtonEulerStrings.en.steps.length - 1;

function Canvas2D({
  width,
  height,
  arm,
  st,
  step,
}: {
  width: number;
  height: number;
  arm: Arm2R;
  st: NEState;
  step: number;
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
      faint: tok("--faint", "#9aa1ac"),
      fg: tok("--foreground", "#1a1f2b"),
      accent: tok("--accent", "#2563eb"),
      warning: tok("--warning", "#d97706"),
      danger: tok("--danger", "#e2675f"),
      success: tok("--success", "#16a34a"),
    };

    const tr = neSolve(arm, st);
    const reach = arm.L1 + arm.L2;
    const scale = (Math.min(width, height) * 0.36) / reach;
    const ox = width * 0.42;
    const oy = height * 0.6;
    const X = (x: number) => ox + x * scale;
    const Y = (y: number) => oy - y * scale;
    const maxLen = scale * MAX_ARROW_FRAC;

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

    const arrow = (from: Vec2, vec: Vec2, pxPer: number, color: string, label: string, lift = -6) => {
      let dx = vec[0] * pxPer, dy = vec[1] * pxPer;
      const len = Math.hypot(dx, dy);
      if (len < 2) return;
      if (len > maxLen) {
        dx *= maxLen / len;
        dy *= maxLen / len;
      }
      const tx = X(from[0]), ty = Y(from[1]);
      const hx = tx + dx, hy = ty - dy; // screen y-down
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(hx, hy);
      ctx.stroke();
      const ang = Math.atan2(hy - ty, hx - tx);
      const h = 9;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx - h * Math.cos(ang - 0.45), hy - h * Math.sin(ang - 0.45));
      ctx.lineTo(hx - h * Math.cos(ang + 0.45), hy - h * Math.sin(ang + 0.45));
      ctx.closePath();
      ctx.fill();
      ctx.font = "700 12px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText(label, hx + 4, hy + lift);
    };

    const torqueArc = (center: Vec2, tau: number, color: string, label: string) => {
      const mag = Math.min(1, Math.abs(tau) / TAU_REF);
      if (Math.abs(tau) < TAU_REF * 0.015) return;
      const cx = X(center[0]), cy = Y(center[1]);
      const r = 18 + mag * 16;
      const sweep = 0.5 + mag * (Math.PI * 1.15);
      const sign = tau > 0 ? 1 : -1; // +1 = CCW on screen (math y-up)
      const psi0 = -0.6;
      const pt = (psi: number): Vec2 => [cx + r * Math.cos(psi), cy - r * Math.sin(psi)];
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.35 + 0.65 * mag;
      ctx.lineWidth = 2 + mag * 3.5;
      ctx.beginPath();
      const N = 40;
      for (let i = 0; i <= N; i++) {
        const [px, py] = pt(psi0 + sign * sweep * (i / N));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      const pe = psi0 + sign * sweep;
      const [ex, ey] = pt(pe);
      const ta = Math.atan2(sign * -Math.cos(pe), sign * -Math.sin(pe));
      const h = 7 + mag * 3;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - h * Math.cos(ta - 0.5), ey - h * Math.sin(ta - 0.5));
      ctx.lineTo(ex - h * Math.cos(ta + 0.5), ey - h * Math.sin(ta + 0.5));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.font = "700 12px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText(label, cx + r + 4, cy - r - 2);
    };

    // arm
    const [l1, l2] = tr.links;
    ctx.lineCap = "round";
    ctx.strokeStyle = col.fg;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(X(l1.jointPos[0]), Y(l1.jointPos[1]));
    ctx.lineTo(X(l1.distalPos[0]), Y(l1.distalPos[1]));
    ctx.lineTo(X(l2.distalPos[0]), Y(l2.distalPos[1]));
    ctx.stroke();
    ctx.lineCap = "butt";

    // weights at COMs (gravity), shown from the Configuration step on
    if (arm.g > 0) {
      arrow(l1.comPos, l1.weight, FORCE_PX_PER * scale, col.faint, "m₁g", 10);
      arrow(l2.comPos, l2.weight, FORCE_PX_PER * scale, col.faint, "m₂g", 10);
    }

    // outward pass — COM accelerations + angular readouts
    const angLabel = (p: Vec2, w: number, a: number) => {
      ctx.fillStyle = col.warning;
      ctx.font = "600 11px ui-monospace, monospace";
      ctx.fillText(`ω=${fmt(w)} α=${fmt(a)}`, X(p[0]) + 8, Y(p[1]) - 10);
    };
    if (step >= 1) {
      arrow(l1.comPos, l1.aCom, ACC_PX_PER * scale, col.warning, "a_c₁");
      angLabel(l1.jointPos, l1.omega, l1.alpha);
    }
    if (step >= 2) {
      arrow(l2.comPos, l2.aCom, ACC_PX_PER * scale, col.warning, "a_c₂");
      angLabel(l2.jointPos, l2.omega, l2.alpha);
    }

    // inward pass — joint forces + torque arcs
    if (step >= 3) {
      arrow(l2.jointPos, l2.force, FORCE_PX_PER * scale, col.danger, "f₂");
      torqueArc(l2.jointPos, l2.tau, col.accent, "τ₂");
    }
    if (step >= 4) {
      arrow(l1.jointPos, l1.force, FORCE_PX_PER * scale, col.danger, "f₁");
      torqueArc(l1.jointPos, l1.tau, col.accent, "τ₁");
    }

    // COMs + joints on top
    const dot = (p: Vec2, r: number, c: string) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(X(p[0]), Y(p[1]), r, 0, Math.PI * 2);
      ctx.fill();
    };
    dot(l1.comPos, 4, col.muted);
    dot(l2.comPos, 4, col.muted);
    dot(l1.jointPos, 6, col.fg);
    dot(l2.jointPos, 5, col.fg);
    dot(l2.distalPos, 5, col.fg);
  }, [width, height, arm, st, step]);

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
      <span className="w-24 tabular-nums">{label}</span>
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
      <span className="w-20 tabular-nums text-foreground">{display}</span>
    </label>
  );
}

const btn =
  "rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface-2 disabled:opacity-40";

const INIT: NEState = { th1: 0.6, th2: 0.9, d1: 0.8, d2: -0.5, dd1: 1.2, dd2: 0.6 };

export default function NewtonEulerViz() {
  const { locale } = useLocale();
  const s = newtonEulerStrings[locale];
  const [st, setSt] = useState<NEState>(INIT);
  const [step, setStep] = useState<number>(LAST);
  const [gravity, setGravity] = useState(true);

  const arm = { ...ARM, g: gravity ? ARM.g : 0 };
  const tr = neSolve(arm, st);
  const set = (k: keyof NEState, v: number) => setSt((prev) => ({ ...prev, [k]: v }));

  // τ = M q̈ + C q̇ + g  (closed-form decomposition, cross-checks the recursion)
  const M = massMatrix(arm, st.th2);
  const qdd: Vec2 = [st.dd1, st.dd2];
  const Mqdd: Vec2 = [M[0][0] * qdd[0] + M[0][1] * qdd[1], M[1][0] * qdd[0] + M[1][1] * qdd[1]];
  const Cqd = coriolisTorque(arm, st);
  const gq = gravityTorque(arm, st);

  const pair = (a: number, b: number) => `${fmt(a)}, ${fmt(b)}`;
  const description = s.description({
    theta: `${deg(st.th1)}°, ${deg(st.th2)}°`,
    qd: pair(st.d1, st.d2),
    qdd: pair(st.dd1, st.dd2),
    gravity,
    tau1: fmt(tr.tau[0]),
    tau2: fmt(tr.tau[1]),
    Mqdd: pair(Mqdd[0], Mqdd[1]),
    Cqd: pair(Cqd[0], Cqd[1]),
    g: pair(gq[0], gq[1]),
    step: s.steps[step],
  });

  return (
    <VizFrame
      title={s.title}
      caption={s.caption}
      textAlternative={description}
      controls={
        <div className="flex w-full flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={btn} onClick={() => setStep((n) => Math.max(0, n - 1))} disabled={step === 0}>
              ◀ {s.previous}
            </button>
            <span className="min-w-[13rem] text-center text-xs font-medium tabular-nums text-foreground">
              {step + 1}/{s.steps.length} · {s.steps[step]}
            </span>
            <button type="button" className={btn} onClick={() => setStep((n) => Math.min(LAST, n + 1))} disabled={step === LAST}>
              {s.next} ▶
            </button>
            <button
              type="button"
              aria-pressed={gravity}
              onClick={() => setGravity((g) => !g)}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                gravity ? "border-success bg-success/15 text-success" : "border-border bg-surface text-foreground hover:bg-surface-2"
              }`}
            >
              {gravity ? s.gravityOn : s.gravityOff}
            </button>
            <button type="button" className={btn} onClick={() => { setSt(INIT); setStep(LAST); setGravity(true); }}>
              {s.reset}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
            <Slider label="θ₁" value={st.th1} min={-Math.PI} max={Math.PI} step={0.02} display={`${deg(st.th1)}°`} onChange={(v) => set("th1", v)} />
            <Slider label="θ₂" value={st.th2} min={-Math.PI} max={Math.PI} step={0.02} display={`${deg(st.th2)}°`} onChange={(v) => set("th2", v)} />
            <Slider label="q̇₁" value={st.d1} min={-4} max={4} step={0.05} display={`${fmt(st.d1)} rad/s`} onChange={(v) => set("d1", v)} />
            <Slider label="q̇₂" value={st.d2} min={-4} max={4} step={0.05} display={`${fmt(st.d2)} rad/s`} onChange={(v) => set("d2", v)} />
            <Slider label="q̈₁" value={st.dd1} min={-6} max={6} step={0.05} display={`${fmt(st.dd1)} rad/s²`} onChange={(v) => set("dd1", v)} />
            <Slider label="q̈₂" value={st.dd2} min={-6} max={6} step={0.05} display={`${fmt(st.dd2)} rad/s²`} onChange={(v) => set("dd2", v)} />
          </div>
        </div>
      }
    >
      <Viz2D aspectRatio={1.5}>
        {({ width, height }) => <Canvas2D width={width} height={height} arm={arm} st={{ ...st }} step={step} />}
      </Viz2D>

      <div className="mt-3 space-y-1.5 text-sm">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 font-mono tabular-nums">
          <span style={{ color: "var(--accent)" }}>τ (Newton–Euler) = ({fmt(tr.tau[0])}, {fmt(tr.tau[1])}) N·m</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-xs tabular-nums text-muted">
          <span>M q̈ = ({fmt(Mqdd[0])}, {fmt(Mqdd[1])})</span>
          <span>+ C q̇ = ({fmt(Cqd[0])}, {fmt(Cqd[1])})</span>
          <span>+ g = ({fmt(gq[0])}, {fmt(gq[1])})</span>
          <span className="text-faint">(N·m — {s.equalsTau})</span>
        </div>
      </div>
    </VizFrame>
  );
}
