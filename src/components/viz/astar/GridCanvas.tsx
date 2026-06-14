"use client";

import { useEffect, useRef } from "react";
import type { Cell } from "./search";

interface GridCanvasProps {
  width: number;
  height: number;
  rows: number;
  cols: number;
  start: Cell;
  goal: Cell;
  obstacles: Set<string>;
  visited: Cell[];
  frontier: Cell[];
  current: Cell | null;
  path: Cell[] | null;
  onToggleObstacle?: (cell: Cell) => void;
}

/**
 * Canvas renderer for the A* grid. Colors are read from the --viz-* design
 * tokens via getComputedStyle so they track the theme (Golden rule 3). The
 * canvas is aria-hidden — the text alternative lives in VizFrame.
 */
export function GridCanvas({
  width,
  height,
  rows,
  cols,
  start,
  goal,
  obstacles,
  visited,
  frontier,
  current,
  path,
  onToggleObstacle,
}: GridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const size = Math.floor(Math.min(width / cols, height / rows));
  const gridW = size * cols;
  const gridH = size * rows;
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
    const token = (name: string) => styles.getPropertyValue(name).trim();
    const colors = {
      bg: token("--background"),
      explored: token("--viz-explored"),
      frontier: token("--viz-frontier"),
      path: token("--viz-path"),
      start: token("--viz-start"),
      goal: token("--viz-goal"),
      obstacle: token("--viz-obstacle"),
      grid: token("--viz-grid"),
      accent: token("--accent"),
    };

    const fillCell = (cell: Cell, color: string, inset = 0) => {
      ctx.fillStyle = color;
      ctx.fillRect(
        offX + cell.col * size + inset,
        offY + cell.row * size + inset,
        size - inset * 2,
        size - inset * 2,
      );
    };

    ctx.fillStyle = colors.bg;
    ctx.fillRect(offX, offY, gridW, gridH);

    for (const v of visited) fillCell(v, colors.explored);
    for (const f of frontier) fillCell(f, colors.frontier);

    for (const o of obstacles) {
      const [r, c] = o.split(",").map(Number);
      fillCell({ row: r, col: c }, colors.obstacle);
    }

    if (path) {
      const inset = Math.max(1, Math.floor(size * 0.18));
      for (const p of path) fillCell(p, colors.path, inset);
    }

    if (current) {
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(
        offX + current.col * size + 1,
        offY + current.row * size + 1,
        size - 2,
        size - 2,
      );
    }

    fillCell(start, colors.start);
    fillCell(goal, colors.goal);

    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= cols; i++) {
      const x = offX + i * size + 0.5;
      ctx.moveTo(x, offY);
      ctx.lineTo(x, offY + gridH);
    }
    for (let j = 0; j <= rows; j++) {
      const y = offY + j * size + 0.5;
      ctx.moveTo(offX, y);
      ctx.lineTo(offX + gridW, y);
    }
    ctx.stroke();
  }, [
    width,
    height,
    rows,
    cols,
    size,
    gridW,
    gridH,
    offX,
    offY,
    start,
    goal,
    obstacles,
    visited,
    frontier,
    current,
    path,
  ]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!onToggleObstacle) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - offX;
    const y = e.clientY - rect.top - offY;
    if (x < 0 || y < 0 || x >= gridW || y >= gridH) return;
    onToggleObstacle({ row: Math.floor(y / size), col: Math.floor(x / size) });
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      onPointerDown={handlePointerDown}
      className="touch-none"
      aria-hidden="true"
    />
  );
}
