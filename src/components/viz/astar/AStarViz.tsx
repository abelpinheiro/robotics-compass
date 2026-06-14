"use client";

import { useEffect, useMemo, useState } from "react";
import { Viz2D } from "@/components/viz/Viz2D";
import { VizFrame } from "@/components/viz/VizFrame";
import { GridCanvas } from "./GridCanvas";
import { astar, key, type Cell, type Heuristic } from "./search";

const ROWS = 16;
const COLS = 24;
const START: Cell = { row: 8, col: 2 };
const GOAL: Cell = { row: 7, col: 21 };

function defaultObstacles(): Set<string> {
  const walls = new Set<string>();
  for (let r = 2; r <= 11; r++) walls.add(`${r},12`);
  for (let r = 6; r <= 15; r++) walls.add(`${r},8`);
  for (let r = 4; r <= 13; r++) walls.add(`${r},16`);
  return walls;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

const HEURISTICS: Heuristic[] = ["manhattan", "euclidean", "chebyshev"];

export function AStarViz() {
  const [obstacles, setObstacles] = useState<Set<string>>(defaultObstacles);
  const [heuristic, setHeuristic] = useState<Heuristic>("manhattan");
  const [speed, setSpeed] = useState(24); // steps per second
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);
  const reducedMotion = usePrefersReducedMotion();

  const grid = useMemo(
    () => ({ rows: ROWS, cols: COLS, start: START, goal: GOAL, obstacles }),
    [obstacles],
  );
  const result = useMemo(() => astar(grid, heuristic), [grid, heuristic]);
  const lastIndex = result.steps.length - 1;
  const finished = stepIndex >= lastIndex;
  const isPlaying = running && !finished;

  // Reset the replay whenever the problem (grid or heuristic) changes. Adjusting
  // state during render is React's recommended pattern for this — no effect.
  const [prevResult, setPrevResult] = useState(result);
  if (prevResult !== result) {
    setPrevResult(result);
    setStepIndex(-1);
    setRunning(false);
  }

  // Animation loop. When the search finishes (or is paused) the guard clears the
  // interval; the Run handler honors prefers-reduced-motion.
  useEffect(() => {
    if (!running || finished) return;
    const id = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, lastIndex));
    }, 1000 / speed);
    return () => clearInterval(id);
  }, [running, finished, speed, lastIndex]);

  const view = stepIndex >= 0 ? result.steps[Math.min(stepIndex, lastIndex)] : null;
  const visited = view?.visited ?? [];
  const frontier = view?.frontier ?? [];
  const current = view?.current ?? null;
  const path = finished && stepIndex >= 0 ? result.path : null;

  const handleRun = () => {
    if (finished) {
      setStepIndex(-1);
      setRunning(!reducedMotion);
      if (reducedMotion) setStepIndex(lastIndex);
      return;
    }
    if (reducedMotion) {
      setStepIndex(lastIndex);
      return;
    }
    setRunning((r) => !r);
  };

  const handleStep = () => {
    setRunning(false);
    setStepIndex((i) => Math.min(i + 1, lastIndex));
  };

  const handleReset = () => {
    setRunning(false);
    setStepIndex(-1);
  };

  const toggleObstacle = (cell: Cell) => {
    const k = key(cell);
    if (k === key(START) || k === key(GOAL)) return;
    setObstacles((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const runLabel = isPlaying ? "Pause" : finished ? "Run again" : "Run";
  const description =
    `A ${ROWS}-by-${COLS} grid. Start at row ${START.row + 1}, column ${START.col + 1}; ` +
    `goal at row ${GOAL.row + 1}, column ${GOAL.col + 1}. Using the ${heuristic} heuristic, ` +
    `A* has expanded ${visited.length} cells` +
    (finished
      ? result.path
        ? ` and found a path of ${result.path.length} cells.`
        : " and found no path to the goal."
      : stepIndex < 0
        ? " (not started). Press Run to animate the search."
        : " so far.") +
    " Walls block movement; the open set is expanded in order of estimated total cost.";

  const btn =
    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const primary = `${btn} bg-accent text-background hover:opacity-90`;
  const secondary = `${btn} border border-border bg-surface text-foreground hover:bg-surface-2`;

  const controls = (
    <>
      <button type="button" onClick={handleRun} className={primary}>
        {runLabel}
      </button>
      <button
        type="button"
        onClick={handleStep}
        disabled={isPlaying || finished}
        className={secondary}
      >
        Step
      </button>
      <button
        type="button"
        onClick={handleReset}
        disabled={stepIndex < 0 && !running}
        className={secondary}
      >
        Reset
      </button>
      <button
        type="button"
        onClick={() => setObstacles(new Set())}
        className={secondary}
      >
        Clear walls
      </button>

      <label className="flex items-center gap-2 text-sm text-muted">
        Heuristic
        <select
          value={heuristic}
          onChange={(e) => setHeuristic(e.target.value as Heuristic)}
          className="rounded-md border border-border bg-surface px-2 py-1 text-foreground"
        >
          {HEURISTICS.map((hName) => (
            <option key={hName} value={hName}>
              {hName}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-muted">
        Speed
        <input
          type="range"
          min={2}
          max={60}
          step={1}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="accent-accent"
          aria-valuetext={`${speed} steps per second`}
        />
      </label>
    </>
  );

  return (
    <VizFrame
      title="A* grid search"
      caption="Click a cell to add or remove a wall, then run the search."
      textAlternative={description}
      controls={controls}
    >
      <Viz2D aspectRatio={COLS / ROWS}>
        {({ width, height }) => (
          <GridCanvas
            width={width}
            height={height}
            rows={ROWS}
            cols={COLS}
            start={START}
            goal={GOAL}
            obstacles={obstacles}
            visited={visited}
            frontier={frontier}
            current={current}
            path={path}
            onToggleObstacle={toggleObstacle}
          />
        )}
      </Viz2D>
    </VizFrame>
  );
}
