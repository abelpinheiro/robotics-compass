/**
 * A* grid search as a pure function returning a replayable timeline of steps.
 * The component replays `steps` and finally draws `path` (see the viz-2d skill).
 * Movement is 4-connected with unit step cost; the heuristic is selectable.
 */

export interface Cell {
  row: number;
  col: number;
}

export type Heuristic = "manhattan" | "euclidean" | "chebyshev";

export interface Grid {
  rows: number;
  cols: number;
  start: Cell;
  goal: Cell;
  obstacles: Set<string>; // keys are `${row},${col}`
}

export interface SearchStep {
  current: Cell; // cell expanded at this step
  frontier: Cell[]; // open set after this expansion
  visited: Cell[]; // closed set after this expansion
}

export interface SearchResult {
  steps: SearchStep[];
  path: Cell[] | null; // reconstructed path, or null if unreachable
}

export const key = (c: Cell): string => `${c.row},${c.col}`;

const HEURISTICS: Record<Heuristic, (a: Cell, b: Cell) => number> = {
  manhattan: (a, b) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col),
  euclidean: (a, b) => Math.hypot(a.row - b.row, a.col - b.col),
  chebyshev: (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col)),
};

const DELTAS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

export function astar(grid: Grid, heuristic: Heuristic = "manhattan"): SearchResult {
  const h = HEURISTICS[heuristic];
  const startK = key(grid.start);
  const goalK = key(grid.goal);

  const gScore = new Map<string, number>([[startK, 0]]);
  const fScore = new Map<string, number>([[startK, h(grid.start, grid.goal)]]);
  const cameFrom = new Map<string, Cell>();
  const open = new Map<string, Cell>([[startK, grid.start]]);
  const closed = new Set<string>();
  const visited: Cell[] = [];
  const steps: SearchStep[] = [];

  const inBounds = (r: number, c: number) =>
    r >= 0 && r < grid.rows && c >= 0 && c < grid.cols;

  const neighbors = (cell: Cell): Cell[] => {
    const out: Cell[] = [];
    for (const [dr, dc] of DELTAS) {
      const nr = cell.row + dr;
      const nc = cell.col + dc;
      if (inBounds(nr, nc) && !grid.obstacles.has(`${nr},${nc}`)) {
        out.push({ row: nr, col: nc });
      }
    }
    return out;
  };

  while (open.size > 0) {
    // Pop the open-set cell with the lowest f (linear scan; grids are small).
    let currentK = "";
    let current: Cell = grid.start;
    let best = Infinity;
    for (const [k, cell] of open) {
      const f = fScore.get(k) ?? Infinity;
      if (f < best) {
        best = f;
        currentK = k;
        current = cell;
      }
    }

    open.delete(currentK);
    closed.add(currentK);
    visited.push(current);

    steps.push({
      current,
      frontier: [...open.values()],
      visited: [...visited],
    });

    if (currentK === goalK) {
      const path: Cell[] = [];
      let cur: Cell | undefined = current;
      while (cur) {
        path.unshift(cur);
        cur = cameFrom.get(key(cur));
      }
      return { steps, path };
    }

    for (const nb of neighbors(current)) {
      const nbK = key(nb);
      if (closed.has(nbK)) continue;
      const tentative = (gScore.get(currentK) ?? Infinity) + 1;
      if (tentative < (gScore.get(nbK) ?? Infinity)) {
        cameFrom.set(nbK, current);
        gScore.set(nbK, tentative);
        fScore.set(nbK, tentative + h(nb, grid.goal));
        if (!open.has(nbK)) open.set(nbK, nb);
      }
    }
  }

  return { steps, path: null };
}
