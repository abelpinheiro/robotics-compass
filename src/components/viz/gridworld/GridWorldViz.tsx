"use client";

import { useEffect, useMemo, useState } from "react";
import { Viz2D } from "@/components/viz/Viz2D";
import { VizFrame } from "@/components/viz/VizFrame";
import { GridWorldCanvas } from "./GridWorldCanvas";
import {
  qLearning,
  valueIteration,
  type GridWorld,
} from "./gridworld";

type Algorithm = "value-iteration" | "q-learning";

const ROWS = 5;
const COLS = 7;

function buildWorld(gamma: number, noise: number): GridWorld {
  const walls = new Set<string>([
    "0,2", "1,2", "2,2", // upper wall, gap at rows 3–4
    "2,4", "3,4", "4,4", // lower wall, gap at rows 0–1
  ]);
  const terminals = new Map<string, number>([
    ["0,6", 1], // goal
    ["1,6", -1], // pit
  ]);
  return {
    rows: ROWS,
    cols: COLS,
    walls,
    terminals,
    start: "4,0",
    livingReward: -0.04,
    gamma,
    noise,
  };
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

export default function GridWorldViz({
  defaultAlgorithm = "value-iteration",
}: {
  defaultAlgorithm?: Algorithm;
}) {
  const [algorithm, setAlgorithm] = useState<Algorithm>(defaultAlgorithm);
  const [gamma, setGamma] = useState(0.9);
  const [noise, setNoise] = useState(0.2);
  const [epsilon, setEpsilon] = useState(0.2);
  const [alpha, setAlpha] = useState(0.5);
  const [speed, setSpeed] = useState(6);
  const [running, setRunning] = useState(false);
  const [frameIndex, setFrameIndex] = useState(-1);
  const reducedMotion = usePrefersReducedMotion();

  const world = useMemo(() => buildWorld(gamma, noise), [gamma, noise]);
  const frames = useMemo(
    () =>
      algorithm === "value-iteration"
        ? valueIteration(world)
        : qLearning(world, { epsilon, alpha }),
    [algorithm, world, epsilon, alpha],
  );

  const lastIndex = frames.length - 1;
  const finished = frameIndex >= lastIndex;
  const isPlaying = running && !finished;

  // Reset replay whenever the run changes (render-phase adjustment, no effect).
  const [prevFrames, setPrevFrames] = useState(frames);
  if (prevFrames !== frames) {
    setPrevFrames(frames);
    setFrameIndex(-1);
    setRunning(false);
  }

  useEffect(() => {
    if (!running || finished) return;
    const id = setInterval(() => {
      setFrameIndex((i) => Math.min(i + 1, lastIndex));
    }, 1000 / speed);
    return () => clearInterval(id);
  }, [running, finished, speed, lastIndex]);

  const frame = frames[Math.max(0, Math.min(frameIndex, lastIndex))];

  const handleRun = () => {
    if (finished) {
      setFrameIndex(-1);
      setRunning(!reducedMotion);
      if (reducedMotion) setFrameIndex(lastIndex);
      return;
    }
    if (reducedMotion) {
      setFrameIndex(lastIndex);
      return;
    }
    setRunning((r) => !r);
  };
  const handleStep = () => {
    setRunning(false);
    setFrameIndex((i) => Math.min(i + 1, lastIndex));
  };
  const handleReset = () => {
    setRunning(false);
    setFrameIndex(-1);
  };

  const startValue = frame.values.get(world.start)?.toFixed(2) ?? "0.00";
  const description =
    `A ${ROWS}-by-${COLS} gridworld MDP with a +1 goal and a −1 pit (top-right), walls, ` +
    `a living reward of ${world.livingReward}, discount γ = ${gamma}, and ${Math.round(
      noise * 100,
    )}% action noise. Algorithm: ${
      algorithm === "value-iteration" ? "value iteration" : "Q-learning"
    }. ${frame.label}. Cells are shaded by their value (green positive, red negative) with ` +
    `arrows showing the greedy policy; the start cell value is ${startValue}.` +
    (algorithm === "q-learning"
      ? " The faint line traces the most recent episode."
      : "");

  const btn =
    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const primary = `${btn} bg-accent text-background hover:opacity-90`;
  const secondary = `${btn} border border-border bg-surface text-foreground hover:bg-surface-2`;
  const segBase =
    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors";

  const slider = (
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (v: number) => void,
    fmt: (v: number) => string,
  ) => (
    <label className="flex items-center gap-2 text-sm text-muted">
      {label}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-accent"
        aria-valuetext={fmt(value)}
      />
      <span className="w-10 tabular-nums text-foreground">{fmt(value)}</span>
    </label>
  );

  const controls = (
    <>
      <div
        role="group"
        aria-label="Algorithm"
        className="flex rounded-md border border-border bg-surface p-0.5"
      >
        {(["value-iteration", "q-learning"] as Algorithm[]).map((a) => (
          <button
            key={a}
            type="button"
            aria-pressed={algorithm === a}
            onClick={() => setAlgorithm(a)}
            className={`${segBase} ${
              algorithm === a
                ? "bg-accent text-background"
                : "text-muted hover:text-foreground"
            }`}
          >
            {a === "value-iteration" ? "Value iteration" : "Q-learning"}
          </button>
        ))}
      </div>

      <button type="button" onClick={handleRun} className={primary}>
        {isPlaying ? "Pause" : finished ? "Run again" : "Run"}
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
        disabled={frameIndex < 0}
        className={secondary}
      >
        Reset
      </button>

      {slider("γ", gamma, 0.5, 0.99, 0.01, setGamma, (v) => v.toFixed(2))}
      {slider("Noise", noise, 0, 0.5, 0.05, setNoise, (v) => v.toFixed(2))}
      {algorithm === "q-learning" &&
        slider("ε", epsilon, 0, 1, 0.05, setEpsilon, (v) => v.toFixed(2))}
      {algorithm === "q-learning" &&
        slider("α", alpha, 0.05, 1, 0.05, setAlpha, (v) => v.toFixed(2))}
      {slider("Speed", speed, 1, 30, 1, setSpeed, (v) => String(v))}
    </>
  );

  return (
    <VizFrame
      title="Gridworld: value iteration & Q-learning"
      caption={frame.label}
      textAlternative={description}
      controls={controls}
    >
      <Viz2D aspectRatio={COLS / ROWS}>
        {({ width, height }) => (
          <GridWorldCanvas
            width={width}
            height={height}
            world={world}
            frame={frame}
          />
        )}
      </Viz2D>
    </VizFrame>
  );
}
