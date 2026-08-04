"use client";

import { useState } from "react";
import { VizFrame } from "@/components/viz/VizFrame";

interface Outcome {
  to: string;
  p: number;
  r: number;
}
interface StateDef {
  id: string;
  x: number;
  y: number;
  terminal?: number;
  actions?: Record<string, Outcome[]>;
}

const R = 34;

// A tiny 3-state MDP that shows the formal pieces: two actions with stochastic
// transitions P(s'|s,a) and rewards R. C is a terminal (goal) state.
const STATES: Record<string, StateDef> = {
  A: {
    id: "A",
    x: 120,
    y: 150,
    actions: {
      go: [
        { to: "B", p: 0.8, r: -1 },
        { to: "A", p: 0.2, r: -1 },
      ],
      wait: [{ to: "A", p: 1, r: -2 }],
    },
  },
  B: {
    id: "B",
    x: 320,
    y: 150,
    actions: {
      go: [
        { to: "C", p: 0.7, r: 10 },
        { to: "A", p: 0.3, r: -3 },
      ],
      wait: [{ to: "B", p: 1, r: -2 }],
    },
  },
  C: { id: "C", x: 520, y: 150, terminal: 10 },
};

const fmtR = (r: number) => (r >= 0 ? `+${r}` : `${r}`);

function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      {label}
      <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            aria-pressed={value === o}
            className={`rounded px-2.5 py-1 text-sm font-medium ${
              value === o ? "bg-accent text-white" : "text-muted hover:bg-surface-2"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function MDPGraphViz() {
  const [sel, setSel] = useState<string>("A");
  const actions = Object.keys(STATES[sel].actions ?? {});
  const [action, setAction] = useState<string>("go");
  const activeAction = actions.includes(action) ? action : actions[0];
  const outcomes = STATES[sel].actions?.[activeAction] ?? [];

  const selectState = (s: string) => {
    setSel(s);
    const first = Object.keys(STATES[s].actions ?? {})[0];
    if (first) setAction(first);
  };

  const description =
    `A three-state Markov decision process shown as a transition graph. States A, ` +
    `B and the terminal goal C are nodes; selecting a state and one of its actions ` +
    `(go / wait) draws that action's stochastic transitions with their probabilities ` +
    `P(s'|s,a) and rewards R. Currently: state ${sel}, action "${activeAction}" — ` +
    outcomes
      .map((o) => `to ${o.to} with p=${o.p}, r=${fmtR(o.r)}`)
      .join("; ") +
    `. Terminal C yields reward +${STATES.C.terminal}.`;

  const src = STATES[sel];

  return (
    <VizFrame
      title="A 3-state MDP as a transition graph"
      caption="Pick a state and an action to see its transitions: each arrow is a possible next state, labelled with its probability P(s′ | s, a) and reward R. C is the terminal (goal)."
      textAlternative={description}
      controls={
        <>
          <Segmented
            label="State"
            options={["A", "B"] as const}
            value={sel as "A" | "B"}
            onChange={selectState}
          />
          <Segmented
            label="Action"
            options={actions as ("go" | "wait")[]}
            value={activeAction as "go" | "wait"}
            onChange={setAction}
          />
        </>
      }
    >
      <div className="rounded-lg border border-border bg-background p-1">
        <svg
          viewBox="0 0 640 260"
          className="block w-full"
          style={{ maxHeight: 300 }}
          role="img"
          aria-label="MDP transition graph"
        >
          <defs>
            <marker
              id="mdp-arrow"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="4.5"
              orient="auto"
            >
              <path d="M0,0 L9,4.5 L0,9 z" style={{ fill: "var(--accent)" }} />
            </marker>
          </defs>

          {/* edges for the selected action */}
          {outcomes.map((o, i) => {
            const dst = STATES[o.to];
            const label = (
              <>
                <tspan style={{ fill: "var(--accent)" }}>p={o.p}</tspan>
                <tspan style={{ fill: "var(--warning)" }}> · r {fmtR(o.r)}</tspan>
              </>
            );
            if (o.to === sel) {
              // self-loop above the node
              const lx = src.x;
              const ly = src.y - R;
              return (
                <g key={i}>
                  <path
                    d={`M ${lx - 14},${ly - 2} C ${lx - 40},${ly - 60} ${lx + 40},${ly - 60} ${lx + 14},${ly - 2}`}
                    fill="none"
                    style={{ stroke: "var(--accent)" }}
                    strokeWidth={2}
                    markerEnd="url(#mdp-arrow)"
                  />
                  <text
                    x={lx}
                    y={ly - 58}
                    textAnchor="middle"
                    fontSize="14"
                    fontFamily="ui-sans-serif, system-ui, sans-serif"
                  >
                    {label}
                  </text>
                </g>
              );
            }
            // straight edge src -> dst
            const dx = dst.x - src.x;
            const dy = dst.y - src.y;
            const len = Math.hypot(dx, dy);
            const ux = dx / len;
            const uy = dy / len;
            const x1 = src.x + ux * R;
            const y1 = src.y + uy * R;
            const x2 = dst.x - ux * (R + 6);
            const y2 = dst.y - uy * (R + 6);
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2 - 14;
            return (
              <g key={i}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  style={{ stroke: "var(--accent)" }}
                  strokeWidth={2}
                  markerEnd="url(#mdp-arrow)"
                />
                <text
                  x={mx}
                  y={my}
                  textAnchor="middle"
                  fontSize="14"
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* nodes */}
          {Object.values(STATES).map((s) => {
            const isTerminal = s.terminal !== undefined;
            return (
              <g key={s.id}>
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={R}
                  style={{
                    fill: isTerminal ? "var(--accent-weak)" : "var(--surface)",
                    stroke:
                      s.id === sel
                        ? "var(--accent)"
                        : isTerminal
                          ? "var(--success)"
                          : "var(--border)",
                  }}
                  strokeWidth={s.id === sel ? 3 : 2}
                />
                <text
                  x={s.x}
                  y={s.y - (isTerminal ? 4 : 0)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="20"
                  fontWeight="600"
                  style={{ fill: "var(--foreground)" }}
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                >
                  {s.id}
                </text>
                {isTerminal && (
                  <text
                    x={s.x}
                    y={s.y + 16}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="13"
                    style={{ fill: "var(--success)" }}
                    fontFamily="ui-monospace, monospace"
                  >
                    +{s.terminal}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </VizFrame>
  );
}
