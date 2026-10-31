---
name: robotics-curriculum
description: >-
  The canonical Robotics Compass course map — Parts (I–VI plus case studies) →
  numbered chapters (1–11 follow Craig 2–13) → lessons, with each lesson's
  content folder/slug. Use as the source of truth when scaffolding lessons,
  building navigation, or deciding where a topic belongs. Changing this
  taxonomy requires asking the human first.
---

# Robotics curriculum

This is the **canonical taxonomy**. `src/lib/curriculum.ts` must mirror it exactly (same parts,
chapters, lesson slugs, order). **Do not add, remove, reorder, or rename parts, chapters or
lessons without asking** (Golden rule 4).

## Structure

- **Parts** are named by content (no level or status in the name). Part VI is **parked**: it
  appears in the course map, and none of its lessons has a page.
- **Chapters** are numbered 1–18 in reading order; chapters 1–11 follow Craig's *Introduction to
  Robotics* chapters 2–13 (shown as "Craig, ch. N"). Parked chapters and case studies have no
  number.
- **Lessons** live at `content/<area>/<slug>.mdx` and `/lessons/<area>/<slug>`. The `area` is
  only the content folder and URL segment; navigation never shows it, and a lesson keeps its
  area when it moves between chapters (so URLs never break).
- **Status, difficulty and prerequisites** live on each lesson in `src/lib/curriculum.ts`, not
  here and not in front-matter:
  - `published` / `in-progress`: has a page, listed in the sidebar.
  - `planned`: in the course map only; no page in production (the dev server renders it).
  - `parked`: like planned, for lessons of the parked part.
- A chapter with no visible lesson shows in the sidebar as *planned*, without a link.

## Parts, chapters and lessons (in order)

Each lesson is listed as `area/slug` — English title.

### Part I · Position and orientation

**1 · Spatial descriptions and transformations** (Craig 2) — slug `spatial-descriptions`

- `foundations/vectors-and-frames` — Vectors and frames
- `foundations/rotations-2d` — Rotations in 2D
- `foundations/rotations-3d` — Rotations in 3D
- `foundations/homogeneous-transforms` — Homogeneous transforms
- `foundations/quaternions` — Quaternions

### Part II · Manipulator kinematics and dynamics

**2 · Manipulator kinematics** (Craig 3) — slug `manipulator-kinematics`

- `kinematics/modeling-manipulators` — Modeling Manipulators
- `kinematics/forward-kinematics` — Forward kinematics

**3 · Inverse kinematics** (Craig 4) — slug `inverse-kinematics`

- `kinematics/inverse-kinematics` — Inverse kinematics

**4 · Jacobians: velocities and static forces** (Craig 5) — slug `jacobians`

- `kinematics/velocity-kinematics` — Velocity kinematics
- `kinematics/jacobians` — Jacobians

**5 · Manipulator dynamics** (Craig 6) — slug `manipulator-dynamics`

- `dynamics/newton-euler` — Newton–Euler dynamics
- `dynamics/lagrangian-dynamics` — Lagrangian dynamics
- `dynamics/equations-of-motion` — Equations of motion

**6 · Trajectory generation** (Craig 7) — slug `trajectory-generation`

- `trajectories/polynomial-trajectories` — Polynomial trajectories
- `trajectories/lspb-trajectories` — Linear segments with parabolic blends (LSPB)
- `trajectories/cartesian-trajectories` — Cartesian-space trajectories

### Part III · Design, control and programming

**7 · Mechanism design** (Craig 8) — slug `mechanism-design`

- _topics to be defined_

**8 · Linear control** (Craig 9) — slug `linear-control`

- `control/pid-control` — PID control
- `control/state-space` — State-space control
- `control/trajectory-tracking` — Trajectory tracking

**9 · Nonlinear control** (Craig 10) — slug `nonlinear-control`

- `control/computed-torque` — Computed-torque control

**10 · Force control** (Craig 11) — slug `force-control`

- `control/impedance-control` — Impedance control
- `control/hybrid-force-position-control` — Hybrid position/force control

**11 · Robot programming** (Craig 12–13) — slug `robot-programming`

- _topics to be defined_

### Part IV · Advanced manipulation

**12 · Screws and the product of exponentials** — slug `screws-and-poe`

- `foundations/twists-and-screws` — Twists and screws
- `kinematics/product-of-exponentials` — Product of exponentials

**13 · Redundancy** — slug `redundancy`

- `kinematics/redundancy-and-null-space` — Redundancy and null space

**14 · Advanced dynamics and control** — slug `advanced-dynamics-control`

- `control/lqr` — LQR

**15 · Manipulation and contact** — slug `manipulation-and-contact`

- `dynamics/contact-and-friction` — Contact and friction
- `manipulation/grasping-basics` — Grasping basics
- `manipulation/motion-primitives` — Motion primitives

### Part V · Planning and learning

**16 · Motion planning** — slug `motion-planning`

- `path-planning/configuration-space` — Configuration space
- `path-planning/obstacles-and-collision` — Obstacles and collision checking
- `path-planning/graph-search-bfs-dfs` — Graph search: BFS and DFS
- `path-planning/dijkstra` — Dijkstra's algorithm
- `path-planning/a-star` — A* search
- `path-planning/weighted-and-anytime-astar` — Weighted and anytime A*
- `path-planning/d-star-replanning` — D* replanning
- `path-planning/prm` — Probabilistic roadmaps (PRM)
- `path-planning/rrt` — Rapidly-exploring random trees (RRT)
- `path-planning/rrt-connect` — RRT-Connect
- `path-planning/rrt-star` — RRT*
- `path-planning/informed-rrt-star` — Informed RRT*
- `path-planning/potential-fields` — Potential fields
- `path-planning/visibility-graphs` — Visibility graphs
- `path-planning/cell-decomposition` — Cell decomposition
- `path-planning/trajectory-optimization` — Trajectory optimization
- `path-planning/kinodynamic-planning` — Kinodynamic planning
- `path-planning/time-elastic-bands` — Time-elastic bands

**17 · Reinforcement learning** — slug `reinforcement-learning`

- `reinforcement-learning/mdps` — Markov decision processes
- `reinforcement-learning/value-iteration` — Value iteration
- `reinforcement-learning/policy-iteration` — Policy iteration
- `reinforcement-learning/monte-carlo` — Monte Carlo methods
- `reinforcement-learning/temporal-difference` — Temporal-difference learning
- `reinforcement-learning/q-learning` — Q-learning
- `reinforcement-learning/function-approximation` — Function approximation
- `reinforcement-learning/dqn` — Deep Q-networks (DQN)
- `reinforcement-learning/policy-gradients` — Policy gradients
- `reinforcement-learning/actor-critic` — Actor-critic methods
- `reinforcement-learning/ppo` — Proximal policy optimization (PPO)
- `reinforcement-learning/sac` — Soft actor-critic (SAC)
- `reinforcement-learning/exploration-vs-exploitation` — Exploration vs exploitation
- `reinforcement-learning/reward-shaping` — Reward shaping

**18 · Planning with learning** — slug `planning-with-learning`

- `path-planning/rl-for-path-planning` — RL for path planning
- `path-planning/learned-heuristics` — Learned heuristics
- `path-planning/drl-motion-planning` — DRL motion planning
- `path-planning/neural-motion-planners` — Neural motion planners
- `path-planning/sim-to-real-for-planning` — Sim-to-real for planning

### Part VI · Mobile robots and perception (parked)

**Mobile robots** — slug `mobile-robots`

- `mobile-robots/differential-drive` — Differential drive
- `mobile-robots/odometry` — Odometry
- `mobile-robots/local-planning` — Local planning

**Aerial robots** — slug `aerial-robots`

- _topics to be defined_

**Perception** — slug `perception`

- `perception/sensors-overview` — Sensors overview
- `perception/camera-models` — Camera models
- `perception/point-clouds` — Point clouds
- `perception/feature-detection` — Feature detection
- `perception/filtering-basics` — Filtering basics

**State estimation** — slug `state-estimation`

- `state-estimation/bayes-filter` — Bayes filter
- `state-estimation/kalman-filter` — Kalman filter
- `state-estimation/extended-kalman-filter` — Extended Kalman filter
- `state-estimation/particle-filter` — Particle filter

**SLAM** — slug `slam`

- `slam/localization` — Localization
- `slam/mapping` — Mapping
- `slam/graph-slam` — Graph SLAM
- `slam/loop-closure` — Loop closure

### Case studies

**Case studies** — slug `case-studies`

- `case-studies/ur20` — UR20 (Universal Robots)

## Notes for scaffolding

- A new lesson needs a slot here first (ask), then an entry in its chapter in
  `src/lib/curriculum.ts` with `status: "planned"`, its `difficulty` and `prerequisites`, and a
  Portuguese title in `src/lib/i18n/titles.ts`. Its MDX file is optional until the author starts
  writing; `src/lib/curriculum.test.ts` checks that every MDX file is registered under its own
  folder and every visible lesson has its MDX.
- `order` in a lesson's front-matter is legacy structural metadata; navigation order comes only
  from `curriculum.ts`.
