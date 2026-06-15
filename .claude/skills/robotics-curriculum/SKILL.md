---
name: robotics-curriculum
description: >-
  The canonical Robotics Compass curriculum taxonomy — the full ordered list of
  areas and topics (path planning is the deepest area), with per-area
  prerequisite notes. Use as the source of truth when scaffolding lessons,
  building the sidebar/nav config, or deciding lesson order and slugs. Changing
  this taxonomy requires asking the human first.
---

# Robotics curriculum

This is the **canonical taxonomy**. `src/lib/curriculum.ts` must mirror it exactly (same
areas, same slugs, same order). **Do not add, remove, reorder, or rename topics without
asking** (Golden rule 4). Path planning is intentionally the deepest area.

Every topic becomes **one empty draft lesson** at `content/<area>/<slug>.mdx` with
`status: draft`. Order below is the authoring/nav order.

## Areas and topics (in order)

### 1. foundations
_Prereqs: none — entry point for the whole site._
1. `vectors-and-frames`
2. `rotations-2d`
3. `rotations-3d` (SO(3))
4. `homogeneous-transforms` (SE(3))
5. `quaternions`
6. `twists-and-screws`

### 2. kinematics
_Prereqs: foundations (frames, SE(3))._
1. `forward-kinematics`
2. `dh-parameters`
3. `inverse-kinematics`
4. `velocity-kinematics`
5. `jacobians`
6. `singularities`

### 3. dynamics
_Prereqs: kinematics (jacobians)._
1. `newton-euler`
2. `lagrangian-dynamics`
3. `equations-of-motion`
4. `contact-and-friction`

### 4. control
_Prereqs: dynamics (equations of motion), some linear algebra._
1. `pid-control`
2. `state-space`
3. `lqr`
4. `trajectory-tracking`
5. `computed-torque`
6. `impedance-control`

### 5. reinforcement-learning
_Prereqs: foundations; probability basics. RL theory that feeds the
DRL-for-planning cluster in path-planning. Research focus: path planning via deep RL._
1. `mdps`
2. `value-iteration`
3. `policy-iteration`
4. `monte-carlo`
5. `temporal-difference`
6. `q-learning`
7. `function-approximation`
8. `dqn`
9. `policy-gradients`
10. `actor-critic`
11. `ppo`
12. `sac`
13. `exploration-vs-exploitation`
14. `reward-shaping`

### 6. path-planning  ← deepest area
_Prereqs: foundations (configuration spaces build on frames); graph topics are
self-contained but build on each other in order. The DRL-for-planning cluster
(19–23) builds on reinforcement-learning._
1. `configuration-space`
2. `obstacles-and-collision`
3. `graph-search-bfs-dfs`
4. `dijkstra`
5. `a-star`
6. `weighted-and-anytime-astar`
7. `d-star-replanning`
8. `prm`
9. `rrt`
10. `rrt-connect`
11. `rrt-star`
12. `informed-rrt-star`
13. `potential-fields`
14. `visibility-graphs`
15. `cell-decomposition`
16. `trajectory-optimization`
17. `kinodynamic-planning`
18. `time-elastic-bands`
19. `rl-for-path-planning`
20. `learned-heuristics`
21. `drl-motion-planning`
22. `neural-motion-planners`
23. `sim-to-real-for-planning`

### 7. perception
_Prereqs: foundations; basic linear algebra._
1. `sensors-overview`
2. `camera-models`
3. `point-clouds`
4. `feature-detection`
5. `filtering-basics`

### 8. state-estimation
_Prereqs: perception (filtering-basics), probability basics._
1. `bayes-filter`
2. `kalman-filter`
3. `extended-kalman-filter`
4. `particle-filter`

### 9. slam
_Prereqs: state-estimation, perception._
1. `localization`
2. `mapping`
3. `graph-slam`
4. `loop-closure`

### 10. manipulation
_Prereqs: kinematics, control, path-planning._
1. `grasping-basics`
2. `motion-primitives`

### 11. mobile-robots
_Prereqs: kinematics, state-estimation, path-planning._
1. `differential-drive`
2. `odometry`
3. `local-planning`

## Notes for scaffolding

- Area slugs are the directory names under `content/` (kebab-case as written above).
- Topic slugs are the MDX filenames (kebab-case as written above).
- `order` in each lesson's front-matter is its 1-based index within its area (the numbers
  above).
- Prerequisite notes above are area-level guidance; per-lesson `prerequisites` front-matter is
  filled by the human author (leave it as an empty list when scaffolding unless told otherwise).
