"use client";

import { useEffect, useRef, useState } from "react";
import { Viz2D } from "@/components/viz/Viz2D";
import { VizFrame } from "@/components/viz/VizFrame";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { InertiaSlider } from "./InertiaSlider";
import { angleUnderTorque, rodInertia, timeToTurn } from "./inertiaMath";
import { rodStrings } from "./strings";
import type { RodStrings } from "./strings";

const L_MAX = 1.6;
const INIT = { m: 1, L: 1.2, frac: 1, tau: 0.1 };
const deg = (rad: number) => ((rad * 180) / Math.PI).toFixed(0);

/** A rod of length L pivoted at distance d from its centre, turned by `angle`. */
function Rod({
  cx,
  cy,
  L,
  d,
  angle,
  color,
  title,
  labelX,
  labelY,
}: {
  cx: number;
  cy: number;
  /** pixels */
  L: number;
  /** pixels */
  d: number;
  angle: number;
  color: string;
  title: string;
  labelX: number;
  labelY: number;
}) {
  const at = (r: number, a: number) => [cx + r * Math.cos(a), cy - r * Math.sin(a)] as const;
  const [x1, y1] = at(d - L / 2, angle);
  const [x2, y2] = at(d + L / 2, angle);
  const [gx, gy] = at(d, angle);
  const [rx, ry] = at(d + L / 2, 0);
  const rArc = L * 0.2;
  // a full turn would start and end at the same point, which SVG draws as nothing
  const swept = Math.min(angle, 2 * Math.PI - 1e-3);
  const [ax, ay] = at(rArc, 0);
  const [bx, by] = at(rArc, swept);
  return (
    <g>
      <line x1={cx} y1={cy} x2={rx} y2={ry} stroke="var(--faint)" strokeDasharray="4 4" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={9} strokeLinecap="round" />
      <circle cx={gx} cy={gy} r={3.5} fill="var(--background)" />
      {swept > 0.02 && (
        <path
          d={`M ${ax} ${ay} A ${rArc} ${rArc} 0 ${swept > Math.PI ? 1 : 0} 0 ${bx} ${by}`}
          fill="none"
          stroke="var(--warning)"
          strokeWidth={2}
        />
      )}
      {/* rotation axis, pointing out of the page */}
      <circle cx={cx} cy={cy} r={7} fill="var(--background)" stroke="var(--foreground)" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={2.2} fill="var(--foreground)" />
      <text x={labelX} y={labelY} textAnchor="middle" fontSize={13} fill="var(--foreground)">
        {title}: <tspan fontWeight={600}>{deg(angle)}°</tspan>
      </text>
    </g>
  );
}

function Graph({
  width,
  height,
  m,
  L,
  d,
  s,
}: {
  width: number;
  height: number;
  m: number;
  L: number;
  d: number;
  s: RodStrings;
}) {
  const [left, right, top, bottom] = [64, 24, 26, 44];
  const max = rodInertia(m, L, L / 2);
  const base = rodInertia(m, L, 0);
  const X = (v: number) => left + (v / (L / 2)) * (width - left - right);
  const Y = (v: number) => height - bottom - (v / (max * 1.08)) * (height - top - bottom);
  const N = 60;
  const pts = Array.from({ length: N + 1 }, (_, i) => {
    const v = (i / N) * (L / 2);
    return [X(v), Y(rodInertia(m, L, v))] as const;
  });
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const I = rodInertia(m, L, d);
  return (
    <svg width={width} height={height} aria-hidden="true" fontSize={12} fill="var(--muted)">
      {/* constant part mL²/12 and the part that grows with d² */}
      <rect x={X(0)} y={Y(base)} width={X(L / 2) - X(0)} height={Y(0) - Y(base)} fill="var(--surface-2)" />
      <polygon points={`${X(0)},${Y(base)} ${line} ${X(L / 2)},${Y(base)}`} fill="var(--accent-weak)" />
      <polyline points={line} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
      <text x={X(L / 4)} y={(Y(0) + Y(base)) / 2 + 4} textAnchor="middle">
        mL²/12
      </text>
      <text x={X(L * 0.44)} y={(Y(base) + Y(rodInertia(m, L, L * 0.44))) / 2 + 8} textAnchor="middle" fill="var(--accent)">
        md²
      </text>

      <line x1={X(0)} y1={Y(0)} x2={X(L / 2)} y2={Y(0)} stroke="var(--muted)" />
      <line x1={X(0)} y1={Y(0)} x2={X(0)} y2={top - 8} stroke="var(--muted)" />
      {[base, max].map((v) => (
        <text key={v} x={X(0) - 8} y={Y(v) + 4} textAnchor="end">
          {v.toFixed(3)}
        </text>
      ))}
      <text x={X(0)} y={12}>{s.inertiaAxisLabel}</text>
      <text x={X(0)} y={Y(0) + 16}>0 ({s.centre})</text>
      <text x={X(L / 2)} y={Y(0) + 16} textAnchor="end">
        L/2 = {(L / 2).toFixed(2)} ({s.end})
      </text>
      <text x={(X(0) + X(L / 2)) / 2} y={height - 8} textAnchor="middle">
        {s.axisDistance}
      </text>

      <line x1={X(d)} y1={Y(0)} x2={X(d)} y2={Y(I)} stroke="var(--foreground)" strokeDasharray="3 3" />
      <circle cx={X(d)} cy={Y(I)} r={5.5} fill="var(--accent)" stroke="var(--background)" strokeWidth={2} />
    </svg>
  );
}

const btn =
  "rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-2";

export default function RodInertiaViz() {
  const { locale, t } = useLocale();
  const s = rodStrings[locale];
  const [p, setP] = useState(INIT);
  // fraction of the run, which lasts while the centred rod makes one full turn
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const last = useRef<number | null>(null);

  const { m, L, tau } = p;
  const d = (p.frac * L) / 2;
  const centreI = rodInertia(m, L, 0);
  const I = rodInertia(m, L, d);
  const duration = timeToTurn(tau, centreI, 2 * Math.PI);
  const time = progress * duration;
  const centreAngle = angleUnderTorque(tau, centreI, time);
  const angle = angleUnderTorque(tau, I, time);

  const done = progress >= 1;
  const isRunning = running && !done;

  useEffect(() => {
    if (!isRunning) return;
    let frame = 0;
    last.current = null;
    const tick = (now: number) => {
      const dt = last.current === null ? 0 : (now - last.current) / 1000;
      last.current = now;
      setProgress((k) => Math.min(1, k + dt / duration));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isRunning, duration]);

  const run = () => {
    if (isRunning) {
      setRunning(false);
      return;
    }
    // reduced motion: jump to the end of the run; the time slider steps through it
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return;
    }
    if (done) setProgress(0);
    setRunning(true);
  };
  const reset = () => {
    setRunning(false);
    setProgress(0);
    setP(INIT);
  };
  const set = (patch: Partial<typeof INIT>) => setP((prev) => ({ ...prev, ...patch }));

  return (
    <VizFrame
      title={s.title}
      caption={s.caption}
      textAlternative={s.description({
        m: m.toFixed(1),
        L: L.toFixed(2),
        d: d.toFixed(2),
        tau: tau.toFixed(2),
        time: time.toFixed(2),
        centreI: centreI.toFixed(3),
        chosenI: I.toFixed(3),
        ratio: (I / centreI).toFixed(2),
        centreAngle: deg(centreAngle),
        chosenAngle: deg(angle),
      })}
      controls={
        <div className="flex w-full flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={btn} onClick={run}>
              {isRunning ? t.viz.pause : done ? t.viz.runAgain : t.viz.run}
            </button>
            <button type="button" className={btn} onClick={reset}>
              {t.viz.reset}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            <InertiaSlider label={s.offset} ariaLabel={s.offset} value={p.frac} min={0} max={1} step={0.02} display={`${d.toFixed(2)} m`} onChange={(frac) => set({ frac })} />
            <InertiaSlider label={s.time} ariaLabel={s.time} value={progress} min={0} max={1} step={0.005} display={`${time.toFixed(2)} s`} onChange={(v) => { setRunning(false); setProgress(v); }} />
            <InertiaSlider label={s.mass} ariaLabel={s.mass} value={m} min={0.5} max={3} step={0.1} display={`${m.toFixed(1)} kg`} onChange={(v) => set({ m: v })} />
            <InertiaSlider label={s.length} ariaLabel={s.length} value={L} min={0.6} max={L_MAX} step={0.05} display={`${L.toFixed(2)} m`} onChange={(v) => set({ L: v })} />
            <InertiaSlider label={s.torque} ariaLabel={s.torque} value={tau} min={0.05} max={0.5} step={0.01} display={`${tau.toFixed(2)} N·m`} onChange={(v) => set({ tau: v })} />
          </div>
        </div>
      }
    >
      <Viz2D aspectRatio={1.75}>
        {({ width, height }) => {
          // Room, in rod lengths, for what the rods can sweep in one run: the centred one a full turn;
          // the other one up to 1 L right and above (d = L/2, 90°) and about 0.8 L left and below.
          const scale = Math.min(width / (2.95 * L_MAX), (height - 36) / (1.85 * L_MAX));
          const unit = L_MAX * scale;
          const x0 = (width - 2.85 * unit) / 2 + 0.5 * unit;
          const cy = 6 + 1.03 * unit;
          return (
            <svg width={width} height={height} aria-hidden="true">
              <Rod cx={x0} cy={cy} L={L * scale} d={0} angle={centreAngle} color="var(--muted)" title={s.centralAxis} labelX={width * 0.27} labelY={height - 10} />
              <Rod cx={x0 + 1.35 * unit} cy={cy} L={L * scale} d={d * scale} angle={angle} color="var(--accent)" title={s.chosenAxis} labelX={width * 0.73} labelY={height - 10} />
            </svg>
          );
        }}
      </Viz2D>
      <Viz2D aspectRatio={2.1} className="mt-3 min-h-52">
        {({ width, height }) => <Graph width={width} height={Math.max(height, 208)} m={m} L={L} d={d} s={s} />}
      </Viz2D>

      <div className="mt-3 flex flex-col gap-1 overflow-x-auto font-mono text-sm tabular-nums">
        <span className="whitespace-nowrap text-foreground">
          I(d) = {centreI.toFixed(3)} + {(m * d * d).toFixed(3)} = <strong className="text-accent">{I.toFixed(3)} kg·m²</strong>
        </span>
        <span className="text-muted">
          I(d) / I(0) = {(I / centreI).toFixed(2)}× <span className="font-sans">{s.ratio}</span>
        </span>
        <span className="text-muted">
          α = τ / I = {(tau / I).toFixed(3)} rad/s² <span className="font-sans">{s.angularAcceleration}</span>
        </span>
      </div>
    </VizFrame>
  );
}
