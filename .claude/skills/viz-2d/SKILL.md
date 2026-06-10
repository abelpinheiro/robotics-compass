---
name: viz-2d
description: >-
  Conventions for 2D visualizations in Robotics Compass using D3 + HTML Canvas —
  the Viz2D wrapper, responsive sizing via ResizeObserver, the animation-loop
  pattern, color roles from design tokens, Canvas-vs-SVG rule of thumb, the
  required text alternative, and the shared grid/graph data model used by the
  search-algorithm family (BFS/DFS/Dijkstra/A*). Use when building or reviewing
  any 2D viz.
---

# 2D visualizations (D3 + Canvas)

2D viz live under `src/components/viz/` and are wired into a lesson's **Visualization** slot.
They are **lazy-loaded** (Golden rule 6) and must have a **text alternative** (Golden rule 5).

## Viz2D wrapper

Every 2D viz renders inside the shared `Viz2D` wrapper (itself inside `VizFrame`):

- Owns a responsive container measured with a **ResizeObserver**; passes `{ width, height }`
  down so drawing code never reads the window directly.
- Default **light theme** (2D viz live in light lessons). Read colors from tokens via
  `getComputedStyle(el).getPropertyValue('--color-…')` so they track the theme — never
  hardcode hex.
- Provides the controls region (buttons, sliders, selects) with proper labels and focus.
- Renders the required text alternative through `VizFrame` (`<figcaption>` + visually-hidden
  description of what the viz shows and its current state).

## Responsive sizing (ResizeObserver)

- Wrap the canvas/SVG in a measured div. On resize, update an internal `{ width, height }`
  state and redraw.
- For Canvas, scale the backing store by `devicePixelRatio` and CSS-size the element so it
  stays crisp on HiDPI.

## Animation-loop pattern

- Use a single `requestAnimationFrame` loop driven by an `isRunning` flag; cancel it on
  unmount and when paused.
- **Honor `prefers-reduced-motion`:** when set, do not auto-animate — render the final/stepped
  state and let the user step manually, or drastically reduce motion.
- Expose **Run / Pause / Step / Reset** and a **speed slider** for algorithm viz; speed maps to
  steps-per-frame or a frame interval, not raw rAF abuse.

## Color roles (from tokens)

Map semantic roles to tokens; do not invent colors:
- start → `--color-success` (start/success)
- goal → `--color-danger` (goal/danger) in light
- path → `--color-accent`
- explored/visited → a muted surface/accent tint (`--color-surface-2` / `--color-accent-weak`)
- frontier/open set → `--color-accent-weak`
- obstacle → `--color-text` / `--color-surface-2` per contrast needs
- grid lines → `--color-border`

Inside a `.theme-dark` wrapper these resolve to the dark viz roles (`path`, `explored`, `goal`).

## Canvas vs SVG — rule of thumb

- **Canvas** for many cells/particles or per-frame redraws (grids, large graphs, point clouds,
  field flows) — hundreds+ of elements or continuous animation.
- **SVG (via D3)** for a modest number of crisp, interactive, individually-hittable elements
  (a few nodes/edges, axes, labels) where accessibility/DOM hit-testing helps.
- D3 is used for **scales, layouts, and math** in both cases; with Canvas you use D3 for
  computation and draw manually.

## Required text alternative

Every viz must describe, in text, what it depicts and (where relevant) its current state — so
a screen-reader user or a reduced-motion user gets the same information. Put it in `VizFrame`'s
figcaption / visually-hidden region. A static fallback image or described end-state is ideal.

## Shared grid/graph data model (search-algorithm family)

Used by `graph-search-bfs-dfs`, `dijkstra`, `a-star`, `weighted-and-anytime-astar`,
`d-star-replanning`, etc. Keep one reusable model:

```ts
type Cell = { row: number; col: number };

type Grid = {
  rows: number;
  cols: number;
  start: Cell;
  goal: Cell;
  obstacles: Set<string>;        // key = `${row},${col}`
};

// A search produces a sequence of steps the animation replays:
type SearchStep = {
  current: Cell;                 // cell being expanded
  frontier: Cell[];             // open set after this expansion
  visited: Cell[];              // closed set after this expansion
};

type SearchResult = {
  steps: SearchStep[];          // replayable timeline
  path: Cell[] | null;          // reconstructed path, or null if none
};
```

Conventions:
- The algorithm is a **pure function** `(grid, options) => SearchResult`; the component just
  replays `steps` and finally draws `path`. This keeps algorithms testable and viz reusable.
- Neighbor model and heuristic (for A*) are options (e.g. 4- vs 8-connected; Manhattan /
  Euclidean / Chebyshev), surfaced as UI controls.
- Cell keys are `"row,col"` strings for Set/Map membership.

The reference A* viz in the `a-star` lesson is the canonical example of this model.
