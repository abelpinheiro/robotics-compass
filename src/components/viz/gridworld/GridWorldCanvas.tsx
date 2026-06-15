"use client";

import { useEffect, useRef } from "react";
import type { Action, Cell, Frame, GridWorld } from "./gridworld";
import { cellOf } from "./gridworld";

interface Props {
  width: number;
  height: number;
  world: GridWorld;
  frame: Frame | null;
}

type RGB = [number, number, number];

function parseHex(hex: string): RGB {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function lerp(a: RGB, b: RGB, t: number): string {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

const ARROW: Record<Action, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/**
 * Renders the gridworld: each cell is shaded by its value (danger→neutral→
 * success, from design tokens), terminals show their reward, the greedy policy
 * is drawn as arrows, and the Q-learning episode trajectory is overlaid. The
 * canvas is aria-hidden; the text alternative lives in VizFrame.
 */
export function GridWorldCanvas({ width, height, world, frame }: Props) {
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

    const styles = getComputedStyle(canvas);
    const tok = (n: string) => styles.getPropertyValue(n).trim();
    const neutral = parseHex(tok("--surface"));
    const pos = parseHex(tok("--success"));
    const neg = parseHex(tok("--danger"));
    const wall = tok("--muted");
    const grid = tok("--viz-grid");
    const fg = tok("--foreground");
    const muted = tok("--muted");
    const accent = tok("--accent");

    const cx = (col: number) => offX + col * size + size / 2;
    const cy = (row: number) => offY + row * size + size / 2;

    const valueColor = (v: number) => {
      const t = Math.max(-1, Math.min(1, v));
      return t >= 0 ? lerp(neutral, pos, t) : lerp(neutral, neg, -t);
    };

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
        const v = frame?.values.get(k) ?? 0;
        ctx.fillStyle = valueColor(v);
        ctx.fillRect(x, y, size, size);

        const isTerminal = world.terminals.has(k);

        // Greedy policy arrow (non-terminals).
        const action = frame?.policy.get(k);
        if (action && !isTerminal) {
          const [ax, ay] = ARROW[action];
          const len = size * 0.26;
          ctx.strokeStyle = muted;
          ctx.fillStyle = muted;
          ctx.lineWidth = Math.max(1.5, size * 0.04);
          ctx.beginPath();
          ctx.moveTo(cx(c) - ax * len, cy(r) - ay * len);
          ctx.lineTo(cx(c) + ax * len, cy(r) + ay * len);
          ctx.stroke();
          const head = size * 0.1;
          ctx.beginPath();
          ctx.moveTo(cx(c) + ax * len, cy(r) + ay * len);
          ctx.lineTo(
            cx(c) + ax * len - ax * head - ay * head * 0.7,
            cy(r) + ay * len - ay * head + ax * head * 0.7,
          );
          ctx.lineTo(
            cx(c) + ax * len - ax * head + ay * head * 0.7,
            cy(r) + ay * len - ay * head - ax * head * 0.7,
          );
          ctx.closePath();
          ctx.fill();
        }

        // Value / reward text.
        ctx.fillStyle = fg;
        ctx.font = `${Math.round(size * 0.2)}px ui-monospace, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const label = isTerminal
          ? (v > 0 ? `+${v}` : `${v}`)
          : v.toFixed(2);
        ctx.fillText(label, cx(c), y + size * 0.08);

        if (isTerminal) {
          ctx.strokeStyle = accent;
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
        }
      }
    }

    // Start marker.
    {
      const { row, col } = cellOf(world.start);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx(col), cy(row), size * 0.14, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Q-learning episode trajectory.
    if (frame?.trajectory && frame.trajectory.length > 1) {
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = Math.max(2, size * 0.06);
      ctx.lineJoin = "round";
      ctx.beginPath();
      frame.trajectory.forEach((cell: Cell, i: number) => {
        const px = cx(cell.col);
        const py = cy(cell.row);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.globalAlpha = 1;
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
  }, [width, height, world, frame, size, gridW, gridH, offX, offY]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="touch-none"
      aria-hidden="true"
    />
  );
}
