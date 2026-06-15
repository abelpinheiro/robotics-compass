# Robotics Compass — roadmap

v1 is complete (platform, full draft-lesson taxonomy, two reference visualizations, `.claude/`
tooling). This file tracks **v2 and beyond**. It is a plan, not a commitment — items that change
the curriculum taxonomy, design tokens, or dependencies need explicit sign-off (Golden rule 4).

## Done (post-v1 infrastructure)

- [x] **Math rendering** — `remark-math` + `rehype-katex` (KaTeX) wired into the MDX pipeline.
- [x] **Code highlighting** — `@shikijs/rehype` (Shiki) for fenced code blocks.
- [x] **SEO** — `app/sitemap.ts` (`/sitemap.xml`) + `app/robots.ts` (`/robots.txt`), driven by
  the curriculum. Set `NEXT_PUBLIC_SITE_URL` in production.
- [x] **Reinforcement learning scaffolded** — new `reinforcement-learning` area (14 RL
  fundamentals, order 5, before path-planning) + a DRL-for-planning cluster (path-planning
  19–23). All empty drafts, awaiting prose and visualizations.

## v2 backlog

### Internationalization (EN / PT)
- [ ] English ⇄ Portuguese toggle. Lessons are MDX, so decide: per-language MDX files
  (`content/<area>/<slug>.en.mdx` / `.pt.mdx`) vs a routing locale (`/[lang]/lessons/...`) with
  `next-intl` or the App Router i18n pattern. UI strings (nav, labels) need a small dictionary.
  **Needs a dependency/approach decision before starting.**

### Simulator / playground page
- [ ] A dedicated **dark-themed** playground route (the theme rules already reserve dark for
  this). Good home for a free-roam planner / robot sandbox, separate from the light lessons.

### More visualizations (start with foundations, then kinematics)
- [ ] **Foundations:** interactive `vectors-and-frames`, `rotations-2d`, `rotations-3d` (SO(3)),
  `homogeneous-transforms` (SE(3)), `quaternions` — build on the `Viz2D`/`Viz3D` patterns.
- [ ] **Kinematics:** `dh-parameters`, `inverse-kinematics`, `jacobians` — extend `ArmScene`.

### Content metadata + study roadmap  ← (added per request)
- [ ] Fill `difficulty` and `prerequisites` front-matter for **all** lessons (structural
  metadata, not prose — can be done with the curriculum-architect).
- [ ] Once prerequisites exist, build them into a **`prerequisites` graph** in `curriculum.ts`
  and render a **study-order "roadmap" on the home page** (a recommended path / topological
  order of topics, with the prerequisite edges visualized). Also surface clickable
  prerequisite links on each lesson.

### Platform polish
- [ ] Lesson **prev / next** navigation.
- [ ] Clickable **prerequisite links** on lessons (pairs with the metadata item above).
- [ ] **Search / command palette** over the curriculum.
- [ ] Optional **reading-progress** indicator.
- [ ] Keyboard-accessible wall editing in the A* viz (currently mouse-only).
- [ ] Focus trap + Esc-to-close in the mobile sidebar drawer.
- [ ] **Visual-regression tests** off the existing Playwright setup; **unit tests** for the
  search algorithms.

### Sidebar / navigation UX (to research)
- [ ] **Collapsible area sections** — toggle e.g. "Foundations" to hide/show its lessons.
  Evaluate whether this helps or hurts discoverability before committing.
- [ ] **Large-screen alignment** — on very wide screens the sidebar is not flush-left (the
  shell is centered at `max-w-7xl`). Decide between a full-width shell with a left-pinned
  sidebar vs. the current centered measure.

### Reinforcement learning (research line: path planning via deep RL)
See the proposal below. **Scaffolding the topics needs taxonomy sign-off (Golden rule 4).**

## Proposal: adding reinforcement learning

The user's research is **path planning using deep reinforcement learning**, so RL should be a
first-class, deep area — mirroring how `path-planning` is the deepest classical area. Recommended
structure (hybrid):

1. **New top-level area `reinforcement-learning`** — RL fundamentals, ordered:
   - `mdps` (Markov decision processes) · `value-iteration` · `policy-iteration` ·
     `monte-carlo` · `temporal-difference` · `q-learning` · `function-approximation` ·
     `dqn` (deep Q-networks) · `policy-gradients` · `actor-critic` · `ppo` · `sac` ·
     `exploration-vs-exploitation` · `reward-shaping`.
2. **Deepen `path-planning` with a DRL-for-planning cluster** (the research focus):
   - `rl-for-path-planning` (overview) · `learned-heuristics` (learning A* heuristics) ·
     `drl-motion-planning` · `neural-motion-planners` · `sim-to-real-for-planning`.

Rationale for the split: keep transferable RL theory in its own area (prereq for many fields),
while the *applied* DRL-planning topics live next to the classical planners they compete with —
making comparisons (A* vs learned planner) natural in the visualizations.

Prerequisites would chain: `foundations` → `reinforcement-learning` (MDPs → … → DQN/PPO) →
`path-planning/rl-for-path-planning`. Each topic ships as an empty draft lesson via
`/expand-area reinforcement-learning` once approved.

**Status: approved and scaffolded** as empty draft lessons — `reinforcement-learning` at area
order 5 (before path-planning) and the path-planning DRL cluster at 19–23. A gridworld
**value-iteration / Q-learning** visualization is wired into the `value-iteration` and
`q-learning` lessons (shared MDP, algorithm toggle, value heatmap + greedy-policy arrows,
γ/noise/ε/α sliders, Q-learning episode trajectory). Next steps: author prose; possible later
deepening with `imitation-learning` / `offline-rl`.
