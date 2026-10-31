"use client";

import { useId, useRef, type PointerEvent } from "react";
import type { Locale } from "@/lib/i18n/config";
import { planarArmPoints, snapAngle, type PlanarArmSetup } from "@/lib/exercises/planarArm";
import type { ExerciseStrings } from "./strings";

// The planar arm the reader moves in interactive exercises: an SVG drawing in
// the lesson's light theme. Dragging the end of link i turns joint i (the
// links after it follow); each joint also has a slider for the keyboard. The
// paragraph under the drawing is its text alternative. Kinematics come from
// lib/exercises/planarArm (modified DH through the shared kernel).

const SIZE = 320;
const SUBSCRIPTS = "₀₁₂₃₄₅₆₇₈₉";
const subscript = (n: number) => [...String(n)].map((d) => SUBSCRIPTS[Number(d)]).join("");

function formatNumber(v: number, locale: Locale, decimals: number) {
  const s = (Math.abs(v) < 0.5 * 10 ** -decimals ? 0 : v).toFixed(decimals);
  return locale === "pt" ? s.replace(".", ",") : s;
}
const formatAngle = (v: number, locale: Locale) => `${formatNumber(v, locale, Number.isInteger(v) ? 0 : 1).replace("-", "−")}°`;

export function PlanarArmWidget({
  setup,
  angles,
  onChange,
  s,
  locale,
}: {
  setup: PlanarArmSetup;
  angles: number[];
  onChange: (angles: number[]) => void;
  s: ExerciseStrings;
  locale: Locale;
}) {
  const id = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<number | null>(null);
  const step = setup.step ?? 1;

  const reach = setup.links.reduce((a, b) => a + b, 0);
  const extent = Math.max(reach, setup.target ? Math.hypot(...setup.target) : 0) * 1.12;
  const scale = SIZE / (2 * extent);
  const toSvg = ([x, y]: [number, number]) => [SIZE / 2 + x * scale, SIZE / 2 - y * scale] as const;
  const points = planarArmPoints(setup.links, angles);
  const svgPoints = points.map(toSvg);
  const tip = points[points.length - 1];

  const xy = ([x, y]: [number, number]) =>
    `(${formatNumber(x, locale, 2).replace("-", "−")}${s.coordinateSeparator}${formatNumber(y, locale, 2).replace("-", "−")})`;
  const description = [
    angles.map((a, i) => `θ${subscript(i + 1)} = ${formatAngle(a, locale)}`).join(", "),
    setup.showTip || setup.target ? s.tipAt(xy(tip)) : null,
    setup.target ? s.targetAt(xy(setup.target)) : null,
  ]
    .filter(Boolean)
    .join("; ");

  /** Turn joint i so that link i points at the pointer. */
  const dragTo = (i: number, e: PointerEvent) => {
    const box = svgRef.current?.getBoundingClientRect();
    if (!box) return;
    const sx = ((e.clientX - box.left) / box.width) * SIZE;
    const sy = ((e.clientY - box.top) / box.height) * SIZE;
    const [px, py] = [(sx - SIZE / 2) / scale, (SIZE / 2 - sy) / scale];
    const [jx, jy] = points[i];
    const absolute = (Math.atan2(py - jy, px - jx) * 180) / Math.PI;
    const before = angles.slice(0, i).reduce((a, b) => a + b, 0);
    const next = [...angles];
    next[i] = snapAngle(absolute - before, step);
    if (next[i] !== angles[i]) onChange(next);
  };

  return (
    <figure className="!my-0">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-labelledby={`${id}-desc`}
        className="mx-auto block w-full max-w-[22rem] touch-none rounded-lg border border-border bg-surface select-none"
      >
        <line x1={0} y1={SIZE / 2} x2={SIZE} y2={SIZE / 2} stroke="var(--border)" />
        <line x1={SIZE / 2} y1={0} x2={SIZE / 2} y2={SIZE} stroke="var(--border)" />
        <circle cx={SIZE / 2} cy={SIZE / 2} r={reach * scale} fill="none" stroke="var(--border)" strokeDasharray="4 4" />
        {setup.target && (
          <g stroke="var(--viz-goal)" strokeWidth={2} fill="none">
            <circle cx={toSvg(setup.target)[0]} cy={toSvg(setup.target)[1]} r={9} />
            <circle cx={toSvg(setup.target)[0]} cy={toSvg(setup.target)[1]} r={2} fill="var(--viz-goal)" />
          </g>
        )}
        <rect x={SIZE / 2 - 11} y={SIZE / 2 - 5} width={22} height={18} rx={3} fill="var(--surface-2)" stroke="var(--muted)" />
        {svgPoints.slice(1).map(([x, y], i) => (
          <line
            key={i}
            x1={svgPoints[i][0]}
            y1={svgPoints[i][1]}
            x2={x}
            y2={y}
            stroke="var(--foreground)"
            strokeWidth={6}
            strokeLinecap="round"
          />
        ))}
        {svgPoints.slice(0, -1).map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={6} fill="var(--background)" stroke="var(--foreground)" strokeWidth={2} />
        ))}
        <circle cx={svgPoints[svgPoints.length - 1][0]} cy={svgPoints[svgPoints.length - 1][1]} r={6} fill="var(--accent)" />
        {/* drag handles at the end of each link (invisible, larger than the joints) */}
        {svgPoints.slice(1).map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={16}
            fill="transparent"
            className="cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => {
              dragging.current = i;
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => dragging.current === i && dragTo(i, e)}
            onPointerUp={() => (dragging.current = null)}
            onPointerCancel={() => (dragging.current = null)}
          />
        ))}
      </svg>
      <figcaption id={`${id}-desc`} className="mt-2 text-center font-mono text-sm text-foreground tabular-nums">
        <span className="sr-only">{s.arm}: </span>
        {description}
      </figcaption>
      <div className="mt-3 space-y-1.5">
        {angles.map((a, i) => (
          <label key={i} className="flex items-center gap-3 text-sm text-muted">
            <span className="w-6 font-mono text-foreground">θ{subscript(i + 1)}</span>
            <input
              type="range"
              min={-180}
              max={180}
              step={step}
              value={a}
              aria-label={s.jointAngle(i + 1)}
              aria-valuetext={formatAngle(a, locale)}
              onChange={(e) => {
                const next = [...angles];
                next[i] = Number(e.target.value);
                onChange(next);
              }}
              className="min-w-0 flex-1 accent-accent"
            />
            <span className="w-14 text-right font-mono text-foreground tabular-nums">{formatAngle(a, locale)}</span>
          </label>
        ))}
        <p className="!my-0 text-xs text-muted">{s.armHelp}</p>
      </div>
    </figure>
  );
}
