"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Viz2D } from "@/components/viz/Viz2D";
import { Viz3D } from "@/components/viz/Viz3D";
import { VizFrame } from "@/components/viz/VizFrame";
import SingularitiesScene, { SINGULAR_FRACTION } from "./SingularitiesScene";
import {
  SCARA,
  scaraFK,
  scaraWorkspace,
  sixDofFK,
  SIXDOF_HOME,
  SIXDOF_SINGULARITIES,
  type RobotKind,
  type ScaraState,
} from "./singularitiesMath";

const deg = (r: number) => Math.round((r * 180) / Math.PI);
const fmt = (n: number) => (Math.abs(n) < 5e-4 ? 0 : n).toFixed(3);

const SCARA_INIT: ScaraState = { theta1: 0.5, theta2: 1.1, d3: 0.2, theta4: 0 };

// ---- live singularity classification (for the readout badge) ----
function scaraSingularity(st: ScaraState): string | null {
  const s = Math.abs(Math.sin(st.theta2));
  if (s >= SINGULAR_FRACTION) return null;
  const nearZero = Math.abs(Math.atan2(Math.sin(st.theta2), Math.cos(st.theta2))) < Math.PI / 2;
  return nearZero ? "outer boundary (θ₂ = 0)" : "inner boundary (θ₂ = π)";
}
function sixDofSingularity(theta: number[]): string | null {
  const p = sixDofFK(theta);
  if (p.w / p.wMax >= SINGULAR_FRACTION) return null;
  if (Math.abs(Math.sin(theta[4])) < 0.08) return "wrist singularity (interior)";
  const axisDist = Math.hypot(p.wristCenter[0], p.wristCenter[1]);
  if (axisDist < 0.14) return "shoulder singularity (interior)";
  return "elbow singularity (boundary)";
}

// -------------------- 2D top-down canvas (SCARA only) --------------------
function ScaraCanvas2D({ width, height, st }: { width: number; height: number; st: ScaraState }) {
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
      accentWeak: tok("--accent-weak", "#eaf1fe"),
      success: tok("--success", "#16a34a"),
      warning: tok("--warning", "#d97706"),
      danger: tok("--danger", "#e2675f"),
    };

    const { L1, L2 } = SCARA;
    const ws = scaraWorkspace();
    const ox = width / 2;
    const oy = height / 2;
    const scale = (Math.min(width, height) * 0.42) / ws.outer;
    const X = (x: number) => ox + x * scale;
    const Y = (y: number) => oy - y * scale;

    // reachable annulus (faint fill: outer disc minus inner disc)
    ctx.fillStyle = col.accentWeak;
    ctx.beginPath();
    ctx.arc(ox, oy, ws.outer * scale, 0, Math.PI * 2);
    ctx.arc(ox, oy, ws.inner * scale, 0, Math.PI * 2, true);
    ctx.fill("evenodd");

    // grid
    ctx.strokeStyle = col.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = Math.ceil(-ox / scale); gx * scale < width - ox; gx++) {
      ctx.moveTo(X(gx), 0);
      ctx.lineTo(X(gx), height);
    }
    for (let gy = Math.ceil(-oy / scale); gy * scale < height - oy; gy++) {
      ctx.moveTo(0, Y(gy));
      ctx.lineTo(width, Y(gy));
    }
    ctx.stroke();

    // singular loci: outer boundary (θ2=0) solid, inner boundary (θ2=π) dashed
    ctx.strokeStyle = col.warning;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(ox, oy, ws.outer * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(ox, oy, ws.inner * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // locus labels
    ctx.fillStyle = col.warning;
    ctx.font = "600 11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText("outer boundary · θ₂=0", ox, Y(ws.outer) - 8);
    if (ws.inner * scale > 26) ctx.fillText("inner · θ₂=π", ox, Y(ws.inner) - 6);
    ctx.textAlign = "left";

    // arm
    const c1 = Math.cos(st.theta1), s1 = Math.sin(st.theta1);
    const a12 = st.theta1 + st.theta2;
    const elbow: [number, number] = [L1 * c1, L1 * s1];
    const tool: [number, number] = [L1 * c1 + L2 * Math.cos(a12), L1 * s1 + L2 * Math.sin(a12)];
    const singular = Math.abs(Math.sin(st.theta2)) < SINGULAR_FRACTION;
    const armColor = singular ? col.danger : col.fg;

    ctx.lineCap = "round";
    ctx.strokeStyle = armColor;
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
    dot(tool, 6, col.success);

    // tool label
    ctx.fillStyle = col.muted;
    ctx.font = "600 11px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText("tool", X(tool[0]) + 8, Y(tool[1]) + 4);

    if (singular) {
      ctx.fillStyle = col.danger;
      ctx.font = "700 12px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText("● SINGULAR", X(tool[0]) + 8, Y(tool[1]) - 10);
    }
  }, [width, height, st]);

  return <canvas ref={ref} style={{ width, height }} className="touch-none" aria-hidden="true" />;
}

// -------------------- small UI primitives (module-level) --------------------
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
      <span className="w-14 tabular-nums text-foreground">{display}</span>
    </label>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { key: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex w-fit items-center gap-1 rounded-md border border-border p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          aria-pressed={value === o.key}
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            value === o.key ? "bg-accent text-white" : "text-muted hover:bg-surface-2"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const presetBtn =
  "rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface-2";

// ------------------------------ main viz ------------------------------
export default function SingularitiesViz() {
  const [robot, setRobot] = useState<RobotKind>("scara");
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const [scara, setScara] = useState<ScaraState>(SCARA_INIT);
  const [sixdof, setSixdof] = useState<number[]>(SIXDOF_HOME);

  const view = robot === "sixdof" ? "3d" : mode; // 6-DOF is 3D only

  const setJoint6 = (i: number, v: number) =>
    setSixdof((t) => t.map((x, k) => (k === i ? v : x)));

  // readout
  const { w, wMax, detJ, singularLabel } = useMemo(() => {
    if (robot === "scara") {
      const p = scaraFK(scara);
      return { w: p.w, wMax: p.wMax, detJ: p.detJ, singularLabel: scaraSingularity(scara) };
    }
    const p = sixDofFK(sixdof);
    return { w: p.w, wMax: p.wMax, detJ: p.detJ, singularLabel: sixDofSingularity(sixdof) };
  }, [robot, scara, sixdof]);

  const barFrac = Math.max(0, Math.min(1, Math.sqrt(w / wMax)));
  const isSingular = singularLabel !== null;

  const description =
    robot === "scara"
      ? `A SCARA robot (2R planar arm, link lengths ${SCARA.L1} and ${SCARA.L2}, plus a vertical ` +
        `prismatic and tool rotation) shown top-down (2D) or in 3D. Its reachable region is an ` +
        `annulus; the two amber circles are its only kinematic singularities — the outer boundary ` +
        `(θ₂ = 0, arm fully extended) and the inner boundary (θ₂ = π, arm folded). The Yoshikawa ` +
        `manipulability index is w = L₁·L₂·|sin θ₂| = ${fmt(w)} (0 at a singularity). ` +
        (isSingular ? `The arm is at a singularity: ${singularLabel}.` : `Joint angles: θ₁ = ${deg(scara.theta1)}°, θ₂ = ${deg(scara.theta2)}°.`)
      : `A 6-DOF anthropomorphic arm with a spherical wrist, in 3D. Unlike the SCARA it has genuine ` +
        `interior singularities: the wrist (joints 4 and 6 align), the shoulder (wrist centre over ` +
        `the base axis), and a boundary one at the elbow (arm extended). The Yoshikawa manipulability ` +
        `index w = √det(J·Jᵀ) = ${fmt(w)} drops to 0 at each. ` +
        (isSingular ? `The arm is at a ${singularLabel}.` : `Use the preset buttons to drive the arm into each singularity.`);

  return (
    <VizFrame
      title="Robot singularities: SCARA vs a 6-DOF arm"
      caption="Pick a robot. The SCARA's only singularities are its outer (θ₂=0) and inner (θ₂=π) workspace boundaries. The 6-DOF arm adds genuine interior singularities (wrist, shoulder). The Yoshikawa manipulability index w falls to 0 at every singularity — drag the joints or use the presets to reach them."
      textAlternative={description}
      controls={
        <div className="flex w-full flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              value={robot}
              onChange={setRobot}
              options={[
                { key: "scara", label: "SCARA" },
                { key: "sixdof", label: "6-DOF arm" },
              ]}
            />
            {robot === "scara" ? (
              <>
                <button type="button" className={presetBtn} onClick={() => setScara((s) => ({ ...s, theta2: 0 }))}>
                  θ₂ = 0 (outer)
                </button>
                <button type="button" className={presetBtn} onClick={() => setScara((s) => ({ ...s, theta2: Math.PI }))}>
                  θ₂ = π (inner)
                </button>
                <button type="button" className={presetBtn} onClick={() => setScara(SCARA_INIT)}>
                  Reset
                </button>
              </>
            ) : (
              <>
                {SIXDOF_SINGULARITIES.map((s) => (
                  <button key={s.key} type="button" className={presetBtn} onClick={() => setSixdof(s.theta)}>
                    {s.label}
                  </button>
                ))}
                <button type="button" className={presetBtn} onClick={() => setSixdof(SIXDOF_HOME)}>
                  Home
                </button>
              </>
            )}
          </div>

          {robot === "scara" ? (
            <div className="flex flex-wrap gap-x-6 gap-y-1.5">
              <Slider label="θ₁" value={scara.theta1} min={-Math.PI} max={Math.PI} step={0.02} display={`${deg(scara.theta1)}°`} onChange={(v) => setScara((s) => ({ ...s, theta1: v }))} />
              <Slider label="θ₂" value={scara.theta2} min={-Math.PI} max={Math.PI} step={0.02} display={`${deg(scara.theta2)}°`} onChange={(v) => setScara((s) => ({ ...s, theta2: v }))} />
              <Slider label="d₃ (prism.)" value={scara.d3} min={0} max={SCARA.d3Max} step={0.02} display={fmt(scara.d3)} onChange={(v) => setScara((s) => ({ ...s, d3: v }))} />
              <Slider label="θ₄ (tool)" value={scara.theta4} min={-Math.PI} max={Math.PI} step={0.02} display={`${deg(scara.theta4)}°`} onChange={(v) => setScara((s) => ({ ...s, theta4: v }))} />
            </div>
          ) : (
            <div className="flex flex-wrap gap-x-6 gap-y-1.5">
              {sixdof.map((v, i) => (
                <Slider
                  key={i}
                  label={`θ${["₁", "₂", "₃", "₄", "₅", "₆"][i]}`}
                  value={v}
                  min={-Math.PI}
                  max={Math.PI}
                  step={0.02}
                  display={`${deg(v)}°`}
                  onChange={(nv) => setJoint6(i, nv)}
                />
              ))}
            </div>
          )}
        </div>
      }
    >
      {/* view toggle: only meaningful for the (planar) SCARA */}
      {robot === "scara" && (
        <div className="mb-3">
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { key: "2d", label: "2D top-down" },
              { key: "3d", label: "3D scene" },
            ]}
          />
        </div>
      )}

      {view === "2d" ? (
        <Viz2D aspectRatio={1.4}>
          {({ width, height }) => <ScaraCanvas2D width={width} height={height} st={scara} />}
        </Viz2D>
      ) : (
        <Viz3D aspectRatio={16 / 10}>
          <SingularitiesScene robot={robot} scara={scara} sixdof={sixdof} />
        </Viz3D>
      )}

      {/* Yoshikawa manipulability readout */}
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 font-mono tabular-nums">
          <span className="text-base font-semibold text-foreground">
            w = {fmt(w)}
          </span>
          <span className="text-muted">det J = {fmt(detJ)}</span>
          {isSingular && (
            <span className="rounded-md px-2 py-0.5 text-xs font-bold text-white" style={{ background: "var(--danger)" }}>
              ⚠ SINGULAR — {singularLabel}
            </span>
          )}
        </div>
        <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full transition-[width] duration-150"
            style={{ width: `${barFrac * 100}%`, background: isSingular ? "var(--danger)" : "var(--success)" }}
          />
        </div>
        <p className="text-muted">
          The <strong>Yoshikawa manipulability index</strong> w = √det(J·Jᵀ) measures how freely the
          tool can move. It shrinks to <strong>0</strong> at a singularity, where the arm loses a
          degree of freedom and J becomes non-invertible.
          {robot === "scara"
            ? " For the SCARA, w = L₁·L₂·|sin θ₂|, so it vanishes only at the two workspace boundaries."
            : " The 6-DOF arm reaches w = 0 in the interior of its workspace too (wrist and shoulder), not just at the boundary."}
        </p>
      </div>
    </VizFrame>
  );
}
