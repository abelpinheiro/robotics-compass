"use client";

import { useMemo, useState } from "react";
import { Viz2D } from "@/components/viz/Viz2D";
import { VizFrame } from "@/components/viz/VizFrame";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { MDPGridCanvas } from "./MDPGridCanvas";
import {
  type Action,
  type GridWorld,
  move,
  sample,
  transitions,
} from "./gridworld";

// A small classic gridworld MDP. noise / gamma are driven by the sliders.
const BASE: Omit<GridWorld, "noise" | "gamma"> = {
  rows: 3,
  cols: 4,
  walls: new Set(["1,1"]),
  terminals: new Map([
    ["0,3", 1],
    ["1,3", -1],
  ]),
  start: "2,0",
  livingReward: -0.04,
};

const ARROW: Record<Action, string> = { up: "↑", down: "↓", left: "←", right: "→" };
const fmt = (n: number) => (Math.abs(n) < 5e-3 ? 0 : n).toFixed(2);

interface LastMove {
  intended: Action;
  reward: number;
  slipped: boolean;
}

function DirButton({
  action,
  onAct,
  onHover,
  disabled,
}: {
  action: Action;
  onAct: (a: Action) => void;
  onHover: (a: Action | null) => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onAct(action)}
      onMouseEnter={() => onHover(action)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(action)}
      onBlur={() => onHover(null)}
      aria-label={action}
      className="grid h-9 w-9 place-items-center rounded-md border border-border bg-surface text-lg font-medium text-foreground hover:bg-surface-2 disabled:opacity-40"
    >
      {ARROW[action]}
    </button>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
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
        aria-valuetext={display}
      />
      <span className="w-10 tabular-nums text-foreground">{display}</span>
    </label>
  );
}

export default function MDPGridViz() {
  const { t } = useLocale();
  const [noise, setNoise] = useState(0.2);
  const [gamma, setGamma] = useState(0.9);
  const world = useMemo<GridWorld>(() => ({ ...BASE, noise, gamma }), [noise, gamma]);

  const [agent, setAgent] = useState(BASE.start);
  const [ret, setRet] = useState(0);
  const [discount, setDiscount] = useState(1);
  const [steps, setSteps] = useState(0);
  const [done, setDone] = useState(false);
  const [last, setLast] = useState<LastMove | null>(null);
  const [hover, setHover] = useState<Action | null>(null);

  const preview = hover && !done ? transitions(world, agent, hover) : null;

  const reset = () => {
    setAgent(BASE.start);
    setRet(0);
    setDiscount(1);
    setSteps(0);
    setDone(false);
    setLast(null);
  };

  const act = (a: Action) => {
    if (done) return;
    const next = sample(transitions(world, agent, a), Math.random);
    const term = world.terminals.get(next);
    const reward = term === undefined ? world.livingReward : term;
    setRet((g) => g + discount * reward);
    setDiscount((d) => d * gamma);
    setSteps((s) => s + 1);
    setLast({ intended: a, reward, slipped: next !== move(world, agent, a) });
    setAgent(next);
    if (term !== undefined) setDone(true);
  };

  const KEY: Record<string, Action> = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
  };

  const description =
    `A 3x4 gridworld Markov decision process you drive as the agent. States are ` +
    `the cells; the terminals give reward +1 (top-right) and -1, and every step ` +
    `costs ${world.livingReward} (the living reward). Actions are up/down/left/right; ` +
    `transitions are stochastic — with noise ${fmt(noise)} the agent slips to a ` +
    `perpendicular cell, so each move goes as intended with probability ${fmt(1 - noise)} ` +
    `and to each side with ${fmt(noise / 2)}. The discount factor γ = ${fmt(gamma)} ` +
    `weights future rewards. The agent is at cell ${agent}; the discounted return so ` +
    `far is ${fmt(ret)} over ${steps} steps${done ? " (a terminal was reached)" : ""}.`;

  return (
    <VizFrame
      title="Be the agent: a gridworld MDP"
      caption="Drive the agent with the arrows. Transitions are stochastic (the noise slider); γ discounts future rewards. The discounted return updates as you move — no policy is shown, this is just the MDP itself."
      textAlternative={description}
      controls={
        <>
          <div
            role="group"
            aria-label="move the agent"
            tabIndex={0}
            onKeyDown={(e) => {
              const a = KEY[e.key];
              if (a) {
                e.preventDefault();
                act(a);
              }
            }}
            className="grid grid-cols-3 grid-rows-2 gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span />
            <DirButton action="up" onAct={act} onHover={setHover} disabled={done} />
            <span />
            <DirButton action="left" onAct={act} onHover={setHover} disabled={done} />
            <DirButton action="down" onAct={act} onHover={setHover} disabled={done} />
            <DirButton action="right" onAct={act} onHover={setHover} disabled={done} />
          </div>
          <span className="mx-1 h-8 w-px bg-border" />
          <Slider label={t.viz.noise} value={noise} min={0} max={0.5} step={0.05} onChange={setNoise} display={fmt(noise)} />
          <Slider label={t.viz.gamma} value={gamma} min={0} max={1} step={0.05} onChange={setGamma} display={fmt(gamma)} />
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-2"
          >
            {t.viz.reset}
          </button>
        </>
      }
    >
      <Viz2D aspectRatio={4 / 3}>
        {({ width, height }) => (
          <MDPGridCanvas
            width={width}
            height={height}
            world={world}
            agent={agent}
            preview={preview}
          />
        )}
      </Viz2D>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted">
        <span>
          discounted return{" "}
          <span className="font-mono tabular-nums text-foreground">{fmt(ret)}</span>
        </span>
        <span>
          steps <span className="font-mono tabular-nums text-foreground">{steps}</span>
        </span>
        <span>
          {done ? (
            <span className="font-medium text-accent">reached a terminal — reset to replay</span>
          ) : last ? (
            <>
              last: {ARROW[last.intended]} intended ·{" "}
              <span className="text-foreground">
                {last.slipped ? "slipped" : "as intended"}
              </span>{" "}
              (r = {last.reward})
            </>
          ) : (
            "hover an arrow to preview P(s′ | s, a)"
          )}
        </span>
      </div>
    </VizFrame>
  );
}
