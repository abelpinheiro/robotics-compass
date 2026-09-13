"use client";

import { useEffect, useRef, useState } from "react";

interface Pose {
  w: number;
  wMax: number;
}

// dark → green dexterity ramp; w≈0 (singular manifolds) render dark.
function ramp(t: number): [number, number, number] {
  const stops: [number, number, number][] = [
    [10, 22, 16],
    [21, 110, 60],
    [52, 211, 153],
  ];
  const x = Math.max(0, Math.min(1, t)) * 2;
  const i = Math.min(1, Math.floor(x));
  const f = x - i;
  const a = stops[i], b = stops[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

const SUB = ["₁", "₂", "₃", "₄", "₅", "₆", "₇"];

/**
 * Heatmap of the Yoshikawa manipulability index w over a 2-joint slice of the
 * arm's configuration space (the other joints held at the current pose). Bright
 * = dexterous, dark curves = singularities. A marker shows the current config.
 */
export function ManipHeatmap({
  fk,
  theta,
  jointCount,
}: {
  fk: (t: number[]) => Pose;
  theta: number[];
  jointCount: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ja, setJa] = useState(1);
  const [jb, setJb] = useState(2);
  const a = Math.min(ja, jointCount - 1);
  const b = Math.min(jb, jointCount - 1);
  const size = 248;
  const N = 42;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cell = size / N;
    const th = theta.slice();
    for (let i = 0; i < N; i++) {
      const ta = -Math.PI + ((i + 0.5) / N) * 2 * Math.PI;
      th[a] = ta;
      for (let j = 0; j < N; j++) {
        const tb = -Math.PI + ((j + 0.5) / N) * 2 * Math.PI;
        th[b] = tb;
        const p = fk(th);
        const t = Math.sqrt(Math.max(0, Math.min(1, p.w / p.wMax)));
        const [r, g, bl] = ramp(t);
        ctx.fillStyle = `rgb(${r | 0},${g | 0},${bl | 0})`;
        ctx.fillRect(i * cell, size - (j + 1) * cell, cell + 1, cell + 1);
      }
    }

    // current-config marker
    const cx = ((theta[a] + Math.PI) / (2 * Math.PI)) * size;
    const cy = size - ((theta[b] + Math.PI) / (2 * Math.PI)) * size;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.moveTo(cx - 9, cy);
    ctx.lineTo(cx + 9, cy);
    ctx.moveTo(cx, cy - 9);
    ctx.lineTo(cx, cy + 9);
    ctx.stroke();
  }, [fk, theta, a, b]);

  const sel = "rounded border border-border bg-surface px-1 py-0.5 text-xs text-foreground";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-xs text-muted">
        <span>w over</span>
        <select className={sel} value={a} onChange={(e) => setJa(Number(e.target.value))} aria-label="heatmap x joint">
          {Array.from({ length: jointCount }, (_, i) => (
            <option key={i} value={i}>θ{SUB[i]}</option>
          ))}
        </select>
        <span>×</span>
        <select className={sel} value={b} onChange={(e) => setJb(Number(e.target.value))} aria-label="heatmap y joint">
          {Array.from({ length: jointCount }, (_, i) => (
            <option key={i} value={i}>θ{SUB[i]}</option>
          ))}
        </select>
      </div>
      <canvas ref={ref} style={{ width: size, height: size }} className="max-w-full rounded-md border border-border" aria-hidden="true" />
      <p className="text-[11px] text-faint">
        Bright = dexterous; dark curves are singularities (w → 0). Others held at the current pose;
        ⌖ marks it. Axes: θ{SUB[a]} (x) × θ{SUB[b]} (y), −180°…180°.
      </p>
    </div>
  );
}
