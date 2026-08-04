"use client";

import { useEffect, useRef } from "react";
import type { GridWorld } from "./gridworld";
import { cellOf } from "./gridworld";

interface Props {
  width: number;
  height: number;
  world: GridWorld;
  agent: string; // current agent cell key
  /** Outcome distribution to preview (cell key -> probability), or null. */
  preview: Map<string, number> | null;
}

/**
 * Definition-mode gridworld: draws the states (cells), the reward terminals and
 * living-reward cells, walls, the start ring and the agent — plus, when an
 * action is previewed, the stochastic outcome distribution P(s'|s,a) as shaded
 * candidate cells with their probabilities. It deliberately shows NO value
 * function or policy (that is the value-iteration / Q-learning lessons' job).
 * The canvas is aria-hidden; the text alternative lives in VizFrame.
 */
export function MDPGridCanvas({ width, height, world, agent, preview }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const size = Math.floor(Math.min(width / world.cols, height / world.rows));
  const gridW = size * world.cols;
  const gridH = size * world.rows;
  const offX = Math.floor((width - gridW) / 2);
  const offY = Math.floor((height - gridH) / 2);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size <= 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const s = getComputedStyle(canvas);
    const tok = (n: string, fb: string) => s.getPropertyValue(n).trim() || fb;
    const surface = tok("--surface", "#f7f8fa");
    const pos = tok("--success", "#16a34a");
    const neg = tok("--danger", "#e2675f");
    const wall = tok("--muted", "#5b6472");
    const grid = tok("--viz-grid", "#e3e6eb");
    const fg = tok("--foreground", "#1a1f2b");
    const accent = tok("--accent", "#2563eb");
    const accentWeak = tok("--accent-weak", "#eaf1fe");

    const cx = (col: number) => offX + col * size + size / 2;
    const cy = (row: number) => offY + row * size + size / 2;

    for (let r = 0; r < world.rows; r++) {
      for (let c = 0; c < world.cols; c++) {
        const k = `${r},${c}`;
        const x = offX + c * size;
        const y = offY + r * size;
        if (world.walls.has(k)) {
          ctx.fillStyle = wall;
          ctx.fillRect(x, y, size, size);
          continue;
        }
        const term = world.terminals.get(k);
        ctx.fillStyle =
          term === undefined ? surface : term > 0 ? pos : neg;
        ctx.fillRect(x, y, size, size);

        // reward label: terminals show their reward; others the living reward
        ctx.fillStyle = term === undefined ? fg : "#ffffff";
        ctx.font = `${Math.round(size * 0.16)}px ui-monospace, monospace`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        const label =
          term === undefined
            ? `${world.livingReward}`
            : term > 0
              ? `+${term}`
              : `${term}`;
        ctx.fillText(label, x + size * 0.08, y + size * 0.08);
      }
    }

    // Preview of the stochastic outcome distribution P(s'|s,a).
    if (preview) {
      for (const [k, p] of preview) {
        const { row, col } = cellOf(k);
        const x = offX + col * size;
        const y = offY + row * size;
        ctx.globalAlpha = 0.25 + 0.55 * p;
        ctx.fillStyle = accentWeak;
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
        ctx.fillStyle = accent;
        ctx.font = `600 ${Math.round(size * 0.2)}px ui-monospace, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(p.toFixed(2), cx(col), y + size - size * 0.08);
      }
    }

    // Start ring.
    {
      const { row, col } = cellOf(world.start);
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx(col), cy(row), size * 0.34, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Agent.
    {
      const { row, col } = cellOf(agent);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(cx(col), cy(row), size * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(cx(col) - size * 0.06, cy(row) - size * 0.06, size * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }

    // Grid lines.
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= world.cols; i++) {
      const x = offX + i * size + 0.5;
      ctx.moveTo(x, offY);
      ctx.lineTo(x, offY + gridH);
    }
    for (let j = 0; j <= world.rows; j++) {
      const y = offY + j * size + 0.5;
      ctx.moveTo(offX, y);
      ctx.lineTo(offX + gridW, y);
    }
    ctx.stroke();
  }, [width, height, world, agent, preview, size, gridW, gridH, offX, offY]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="touch-none"
      aria-hidden="true"
    />
  );
}
