/**
 * Gridworld MDP plus value iteration (model-based planning) and Q-learning
 * (model-free). Both are pure functions returning a replayable timeline of
 * Frames the component animates (see the viz-2d skill).
 *
 * The world is a grid with walls, terminal cells (rewards), a per-step living
 * reward, a discount gamma, and action noise (stochastic transitions). Actions
 * are 4-connected.
 */

export interface Cell {
  row: number;
  col: number;
}

export type Action = "up" | "down" | "left" | "right";

export const ACTIONS: Action[] = ["up", "down", "left", "right"];

export interface GridWorld {
  rows: number;
  cols: number;
  walls: Set<string>; // `${row},${col}`
  terminals: Map<string, number>; // cell -> terminal reward
  start: string; // start cell key (for Q-learning)
  livingReward: number; // per-step reward in non-terminal cells
  gamma: number;
  noise: number; // probability of slipping perpendicular to the intended action
}

/** A single replay frame: the value of each cell, the greedy action per cell,
 *  an optional episode trajectory (Q-learning), and a status label. */
export interface Frame {
  values: Map<string, number>;
  policy: Map<string, Action>;
  trajectory?: Cell[];
  label: string;
}

export const key = (c: Cell): string => `${c.row},${c.col}`;
export const cellOf = (k: string): Cell => {
  const [row, col] = k.split(",").map(Number);
  return { row, col };
};

const DIRS: Record<Action, [number, number]> = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1],
};

const PERP: Record<Action, [Action, Action]> = {
  up: ["left", "right"],
  down: ["left", "right"],
  left: ["up", "down"],
  right: ["up", "down"],
};

function listStates(world: GridWorld): string[] {
  const out: string[] = [];
  for (let r = 0; r < world.rows; r++) {
    for (let c = 0; c < world.cols; c++) {
      const k = `${r},${c}`;
      if (!world.walls.has(k)) out.push(k);
    }
  }
  return out;
}

/** Move one cell in a direction, staying put if blocked by a wall or boundary. */
function move(world: GridWorld, k: string, dir: Action): string {
  const { row, col } = cellOf(k);
  const [dr, dc] = DIRS[dir];
  const nr = row + dr;
  const nc = col + dc;
  if (
    nr < 0 ||
    nr >= world.rows ||
    nc < 0 ||
    nc >= world.cols ||
    world.walls.has(`${nr},${nc}`)
  ) {
    return k;
  }
  return `${nr},${nc}`;
}

/** Stochastic transition model: intended direction with prob (1 - noise),
 *  each perpendicular direction with prob noise/2. */
function transitions(
  world: GridWorld,
  k: string,
  action: Action,
): Map<string, number> {
  const probs = new Map<string, number>();
  const add = (target: string, p: number) =>
    probs.set(target, (probs.get(target) ?? 0) + p);
  add(move(world, k, action), 1 - world.noise);
  const [p1, p2] = PERP[action];
  add(move(world, k, p1), world.noise / 2);
  add(move(world, k, p2), world.noise / 2);
  return probs;
}

function argmaxIdx(values: number[], rng?: () => number): number {
  let best = -Infinity;
  let ties: number[] = [];
  values.forEach((v, i) => {
    if (v > best) {
      best = v;
      ties = [i];
    } else if (v === best) {
      ties.push(i);
    }
  });
  if (rng && ties.length > 1) return ties[Math.floor(rng() * ties.length)];
  return ties[0];
}

function qActionValues(
  world: GridWorld,
  k: string,
  V: Map<string, number>,
): number[] {
  return ACTIONS.map((a) => {
    let q = 0;
    for (const [s2, p] of transitions(world, k, a)) q += p * (V.get(s2) ?? 0);
    return q;
  });
}

function greedyPolicy(
  world: GridWorld,
  V: Map<string, number>,
): Map<string, Action> {
  const policy = new Map<string, Action>();
  for (const s of listStates(world)) {
    if (world.terminals.has(s)) continue;
    policy.set(s, ACTIONS[argmaxIdx(qActionValues(world, s, V))]);
  }
  return policy;
}

// ---------------------------------------------------------------------------
// Value iteration (model-based)
// ---------------------------------------------------------------------------

export function valueIteration(
  world: GridWorld,
  { maxSweeps = 80, theta = 1e-4 }: { maxSweeps?: number; theta?: number } = {},
): Frame[] {
  const states = listStates(world);
  const V = new Map<string, number>();
  for (const s of states) V.set(s, world.terminals.get(s) ?? 0);

  const frames: Frame[] = [];
  const snapshot = (label: string): Frame => ({
    values: new Map(V),
    policy: greedyPolicy(world, V),
    label,
  });
  frames.push(snapshot("Initial values"));

  for (let sweep = 1; sweep <= maxSweeps; sweep++) {
    const next = new Map(V);
    let delta = 0;
    for (const s of states) {
      if (world.terminals.has(s)) continue;
      const best = Math.max(...qActionValues(world, s, V));
      const val = world.livingReward + world.gamma * best;
      next.set(s, val);
      delta = Math.max(delta, Math.abs(val - (V.get(s) ?? 0)));
    }
    for (const [k2, v] of next) V.set(k2, v);
    frames.push(snapshot(`Sweep ${sweep} · Δ = ${delta.toFixed(3)}`));
    if (delta < theta) break;
  }
  return frames;
}

// ---------------------------------------------------------------------------
// Q-learning (model-free) — one frame per episode
// ---------------------------------------------------------------------------

/** Deterministic PRNG so a run (and its replay / reset) is reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sample(probs: Map<string, number>, rng: () => number): string {
  let x = rng();
  let last = "";
  for (const [k2, p] of probs) {
    last = k2;
    if (x < p) return k2;
    x -= p;
  }
  return last;
}

export function qLearning(
  world: GridWorld,
  {
    episodes = 60,
    maxSteps = 40,
    alpha = 0.5,
    epsilon = 0.2,
    seed = 12345,
  }: {
    episodes?: number;
    maxSteps?: number;
    alpha?: number;
    epsilon?: number;
    seed?: number;
  } = {},
): Frame[] {
  const rng = mulberry32(seed);
  const Q = new Map<string, number[]>();
  for (const s of listStates(world)) Q.set(s, [0, 0, 0, 0]);

  const snapshot = (traj: Cell[] | undefined, label: string): Frame => {
    const values = new Map<string, number>();
    const policy = new Map<string, Action>();
    for (const s of listStates(world)) {
      if (world.terminals.has(s)) {
        values.set(s, world.terminals.get(s) ?? 0);
        continue;
      }
      const qs = Q.get(s)!;
      values.set(s, Math.max(...qs));
      policy.set(s, ACTIONS[argmaxIdx(qs)]);
    }
    return { values, policy, trajectory: traj?.slice(), label };
  };

  const frames: Frame[] = [snapshot(undefined, "Initial Q (all zero)")];

  for (let ep = 1; ep <= episodes; ep++) {
    let s = world.start;
    const traj: Cell[] = [cellOf(s)];
    let ret = 0;
    let disc = 1;

    for (let step = 0; step < maxSteps; step++) {
      if (world.terminals.has(s)) break;
      const qs = Q.get(s)!;
      const a = rng() < epsilon ? Math.floor(rng() * 4) : argmaxIdx(qs, rng);
      const action = ACTIONS[a];
      const s2 = sample(transitions(world, s, action), rng);
      const r = world.terminals.has(s2)
        ? (world.terminals.get(s2) ?? 0)
        : world.livingReward;
      ret += disc * r;
      disc *= world.gamma;
      const maxNext = world.terminals.has(s2) ? 0 : Math.max(...Q.get(s2)!);
      qs[a] += alpha * (r + world.gamma * maxNext - qs[a]);
      traj.push(cellOf(s2));
      s = s2;
    }
    frames.push(snapshot(traj, `Episode ${ep} · return ${ret.toFixed(2)}`));
  }
  return frames;
}
