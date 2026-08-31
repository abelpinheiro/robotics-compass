"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Viz2D } from "@/components/viz/Viz2D";
import { VizFrame } from "@/components/viz/VizFrame";

// Fixed geometry (world units). {B}'s origin sits here; the point Q is fixed in
// {B} at distance R_Q along B's x-axis, so it orbits B's origin as {B} spins.
const B_ORG: [number, number] = [2.6, 2.0];
const R_Q = 1.6;
const V_BORG_DIR = (60 * Math.PI) / 180; // fixed world direction of the origin's translation
const TIME_SCALE = 0.7; // rad/s -> on-screen spin

// Colour of the resultant — a fixed strong pink so ᴬV_Q pops against the three
// token-coloured contributions (matches the static figure).
const VQ_COLOR = "#db2777";

const fmt = (n: number) => (Math.abs(n) < 5e-3 ? 0 : n).toFixed(2);

interface State {
  omega: number;
  vBorg: number;
  vQb: number;
  showBorg: boolean;
  showMotion: boolean;
  showRot: boolean;
}

function Canvas2D({ width, height, st }: { width: number; height: number; st: State }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const angle = useRef(0.5); // current orientation of {B} (persists across redraws)

  const draw = useCallback(
    (a: number) => {
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
        faint: tok("--faint", "#9aa1ac"),
        muted: tok("--muted", "#5b6472"),
        borg: tok("--accent", "#2563eb"),
        motion: tok("--success", "#16a34a"),
        rot: tok("--warning", "#d97706"),
        fg: tok("--foreground", "#1a1f2b"),
      };

      const scale = Math.min(width, height) / 7;
      const ox = width * 0.12;
      const oy = height * 0.82;
      const X = (x: number) => ox + x * scale;
      const Y = (y: number) => oy - y * scale;

      // grid
      ctx.strokeStyle = col.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i * scale < width; i++) {
        ctx.moveTo(X(i), 0);
        ctx.lineTo(X(i), height);
      }
      for (let j = 0; oy - j * scale > 0; j++) {
        ctx.moveTo(0, Y(j));
        ctx.lineTo(width, Y(j));
      }
      ctx.stroke();

      const arrow = (
        p: [number, number],
        q: [number, number],
        color: string,
        w: number,
        label?: string,
        dash = false,
      ) => {
        const x1 = X(p[0]), y1 = Y(p[1]), x2 = X(q[0]), y2 = Y(q[1]);
        if (Math.hypot(x2 - x1, y2 - y1) < 1.5) return;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = w;
        ctx.setLineDash(dash ? [4, 4] : []);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
        const ang = Math.atan2(y2 - y1, x2 - x1);
        const h = 9;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - h * Math.cos(ang - 0.42), y2 - h * Math.sin(ang - 0.42));
        ctx.lineTo(x2 - h * Math.cos(ang + 0.42), y2 - h * Math.sin(ang + 0.42));
        ctx.closePath();
        ctx.fill();
        if (label) {
          ctx.font = "600 12px ui-monospace, SFMono-Regular, Menlo, monospace";
          ctx.fillText(label, x2 + 6, y2 - 5);
        }
      };

      const ca = Math.cos(a), sa = Math.sin(a);
      const add = (u: [number, number], v: [number, number]): [number, number] => [u[0] + v[0], u[1] + v[1]];

      // world axes {A}
      arrow([0, 0], [2.3, 0], col.faint, 1.5, "xA");
      arrow([0, 0], [0, 2.3], col.faint, 1.5, "yA");
      ctx.fillStyle = col.faint;
      ctx.font = "italic 12px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText("{A}", X(0) - 4, Y(0) + 16);

      // where {B} sits
      arrow([0, 0], B_ORG, col.grid, 1.3, undefined, true);

      // Q (fixed in {B}) and its orbit
      const q: [number, number] = [B_ORG[0] + R_Q * ca, B_ORG[1] + R_Q * sa];
      ctx.strokeStyle = col.grid;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(X(B_ORG[0]), Y(B_ORG[1]), R_Q * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // {B} axes (rotated by a)
      arrow(B_ORG, [B_ORG[0] + 1.3 * ca, B_ORG[1] + 1.3 * sa], col.muted, 1.6, "xB");
      arrow(B_ORG, [B_ORG[0] - 1.05 * sa, B_ORG[1] + 1.05 * ca], col.muted, 1.6, "yB");

      // angular velocity indicator at B's origin
      if (Math.abs(st.omega) > 1e-3) {
        const rr = 0.42 * scale;
        const bx = X(B_ORG[0]), by = Y(B_ORG[1]);
        const dir = st.omega > 0 ? 1 : -1; // ccw in world = ccw on screen (Y flipped handled below)
        ctx.strokeStyle = col.rot;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(bx, by, rr, -0.4, Math.PI * 1.3, dir < 0);
        ctx.stroke();
        const ea = dir > 0 ? Math.PI * 1.3 : -0.4;
        const ex = bx + rr * Math.cos(ea), ey = by + rr * Math.sin(ea);
        const ta = ea + dir * Math.PI / 2;
        ctx.fillStyle = col.rot;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 8 * Math.cos(ta - 0.42), ey - 8 * Math.sin(ta - 0.42));
        ctx.lineTo(ex - 8 * Math.cos(ta + 0.42), ey - 8 * Math.sin(ta + 0.42));
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = col.rot;
        ctx.font = "italic 12px ui-sans-serif, system-ui, sans-serif";
        ctx.fillText("Ω", bx - rr - 16, by - 2);
      }

      // r = position of Q inside {B} (label at midpoint, clear of Q)
      arrow(B_ORG, q, col.fg, 1.7);
      ctx.fillStyle = col.fg;
      ctx.font = "italic 12px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText("r", (X(B_ORG[0]) + X(q[0])) / 2 + 7, (Y(B_ORG[1]) + Y(q[1])) / 2 + 2);

      // ---- velocity contributions at Q ----
      const vB: [number, number] = [st.vBorg * Math.cos(V_BORG_DIR), st.vBorg * Math.sin(V_BORG_DIR)];
      const vM: [number, number] = [st.vQb * ca, st.vQb * sa]; // R(a)·(vQb,0) along x_B
      const vR: [number, number] = [-st.omega * R_Q * sa, st.omega * R_Q * ca]; // Ω × r
      const VEL_SCALE = 0.62; // world velocity -> arrow length

      // tip-to-tail sum of the enabled contributions, then the resultant
      let tip: [number, number] = q;
      const seg = (v: [number, number], on: boolean, color: string, label: string) => {
        if (!on) return;
        const next = add(tip, [v[0] * VEL_SCALE, v[1] * VEL_SCALE]);
        arrow(tip, next, color, 2.6, label);
        tip = next;
      };
      seg(vB, st.showBorg, col.borg, "V_Borg");
      seg(vM, st.showMotion, col.motion, "R·V_Q");
      seg(vR, st.showRot, col.rot, "Ω×r");

      // resultant ᴬV_Q (sum of enabled), labelled at its midpoint
      if (tip[0] !== q[0] || tip[1] !== q[1]) {
        arrow(q, tip, VQ_COLOR, 3.2);
        ctx.fillStyle = VQ_COLOR;
        ctx.font = "600 12px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.fillText("ᴬV_Q", (X(q[0]) + X(tip[0])) / 2 + 9, (Y(q[1]) + Y(tip[1])) / 2 + 5);
      }

      // point Q
      ctx.fillStyle = VQ_COLOR;
      ctx.beginPath();
      ctx.arc(X(q[0]), Y(q[1]), 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "600 13px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText("Q", X(q[0]) - 16, Y(q[1]) + 6);
    },
    [width, height, st],
  );

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const reduce =
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const spinning = st.omega !== 0 && !reduce;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      angle.current += st.omega * dt * TIME_SCALE;
      draw(angle.current);
      raf = requestAnimationFrame(tick);
    };
    draw(angle.current);
    if (spinning) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(raf);
  }, [draw, st.omega]);

  return <canvas ref={ref} style={{ width, height }} className="touch-none" aria-hidden="true" />;
}

const INIT: State = {
  omega: 1.2,
  vBorg: 1.5,
  vQb: 1.0,
  showBorg: true,
  showMotion: true,
  showRot: true,
};

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

function Toggle({
  on,
  color,
  label,
  onClick,
}: {
  on: boolean;
  color: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-surface-2"
      style={{ color: on ? color : "var(--text-faint, #9aa1ac)", opacity: on ? 1 : 0.55 }}
    >
      <span
        className="inline-block h-2.5 w-2.5 rounded-sm"
        style={{ background: on ? color : "transparent", border: `1.5px solid ${color}` }}
      />
      {label}
    </button>
  );
}

export default function GeneralVelocityViz() {
  const [st, setSt] = useState<State>(INIT);
  const set = (patch: Partial<State>) => setSt((s) => ({ ...s, ...patch }));

  const vB = st.showBorg ? st.vBorg : 0;
  const vM = st.showMotion ? st.vQb : 0;
  const vR = st.showRot ? Math.abs(st.omega) * R_Q : 0;
  // resultant magnitude (components summed in world axes at the current instant
  // are direction-dependent; this readout reports the three contribution sizes).
  const btn =
    "rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-2";

  const description =
    `A moving frame {B} on a light 2D canvas: its origin translates with velocity ` +
    `A-V-Borg and it spins with angular velocity Ω = ${fmt(st.omega)} rad/s. A point Q is ` +
    `fixed in {B} at distance ${fmt(R_Q)} from its origin, so Q orbits as {B} turns. The ` +
    `velocity of Q seen from the world frame {A} is drawn tip-to-tail as the sum of three ` +
    `contributions at Q: the origin translation A-V-Borg (blue, |V_Borg| = ${fmt(vB)}), the ` +
    `motion of Q within {B} re-expressed in {A} (green, |B-V-Q| = ${fmt(vM)}), and the ` +
    `rotation-induced term Ω × r (orange, |Ω||r| = ${fmt(vR)}). Their vector sum is the ` +
    `total A-V-Q (pink). Toggle any term to isolate its effect.`;

  return (
    <VizFrame
      title="Velocity of a point in a moving, rotating frame"
      caption="Frame {B} translates and spins; point Q is fixed in {B}. The velocity of Q seen from {A} is the tip-to-tail sum of three contributions — origin translation (blue), motion within {B} (green), and the rotation term Ω × r (orange) — giving the total ᴬV_Q (pink). Scale each term or toggle it off to see what it contributes."
      textAlternative={description}
      controls={
        <>
          <Slider label="angular velocity Ω" value={st.omega} min={-3} max={3} unit="rad/s" color="var(--warning)" onChange={(v) => set({ omega: v })} />
          <Slider label="origin speed |V_Borg|" value={st.vBorg} min={0} max={3} unit="m/s" color="var(--accent)" onChange={(v) => set({ vBorg: v })} />
          <Slider label="speed of Q in {B} |ᴮV_Q|" value={st.vQb} min={0} max={3} unit="m/s" color="var(--success)" onChange={(v) => set({ vQb: v })} />
          <div className="flex flex-wrap items-center gap-2">
            <Toggle on={st.showBorg} color="var(--accent)" label="translation" onClick={() => set({ showBorg: !st.showBorg })} />
            <Toggle on={st.showMotion} color="var(--success)" label="motion in {B}" onClick={() => set({ showMotion: !st.showMotion })} />
            <Toggle on={st.showRot} color="var(--warning)" label="rotation Ω×r" onClick={() => set({ showRot: !st.showRot })} />
            <button type="button" onClick={() => setSt(INIT)} className={btn}>
              Reset
            </button>
          </div>
        </>
      }
    >
      <Viz2D aspectRatio={1.55}>
        {({ width, height }) => <Canvas2D width={width} height={height} st={st} />}
      </Viz2D>

      <div className="mt-3 space-y-2 text-sm">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono tabular-nums">
          <span style={{ color: "var(--accent)" }}>|ᴬV_Borg| = {fmt(vB)}</span>
          <span style={{ color: "var(--success)" }}>|ᴬ_B R ᴮV_Q| = {fmt(vM)}</span>
          <span style={{ color: "var(--warning)" }}>|ᴬΩ_B × r| = {fmt(vR)}</span>
          <span className="font-semibold" style={{ color: VQ_COLOR }}>→ ᴬV_Q = their vector sum</span>
        </div>
        <p className="text-muted">
          ᴬV_Q = <span style={{ color: "var(--accent)" }}>ᴬV_Borg</span> +{" "}
          <span style={{ color: "var(--success)" }}>ᴬ_B R ᴮV_Q</span> +{" "}
          <span style={{ color: "var(--warning)" }}>ᴬΩ_B × r</span>. The rotation term is always
          perpendicular to r and grows with |Ω| or |r|; the translation term is the same everywhere
          in {"{B}"}; the motion term is Q moving relative to {"{B}"}, re-expressed in {"{A}"}.
        </p>
      </div>
    </VizFrame>
  );
}
