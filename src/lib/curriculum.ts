/**
 * Canonical navigation / ordering source for Robotics Compass.
 *
 * This MUST mirror the `robotics-curriculum` skill (areas, slugs, order).
 * Changing the taxonomy requires asking the human first (Golden rule 4).
 *
 * Each lesson has a matching content/<area>/<slug>.mdx scaffold and is rendered
 * by the dynamic route src/app/lessons/[area]/[slug]/.
 */

export type LessonStatus = "draft" | "in-progress" | "published";

export interface LessonRef {
  /** kebab-case topic slug, matches content/<area>/<slug>.mdx */
  slug: string;
  /** humanized, sentence-case display title */
  title: string;
  /** 1-based order within the area */
  order: number;
  status: LessonStatus;
}

export interface Area {
  /** kebab-case area slug, matches content/<area>/ */
  slug: string;
  /** sentence-case display title */
  title: string;
  /** 1-based order within the curriculum */
  order: number;
  lessons: LessonRef[];
}

/**
 * Areas in canonical order. Path planning is intentionally the deepest area;
 * reinforcement-learning precedes it so RL theory leads into DRL-for-planning.
 */
export const curriculum: Area[] = [
  {
    slug: "foundations",
    title: "Foundations",
    order: 1,
    lessons: [
      { slug: "vectors-and-frames", title: "Vectors and frames", order: 1, status: "draft" },
      { slug: "rotations-2d", title: "Rotations in 2D", order: 2, status: "draft" },
      { slug: "rotations-3d", title: "Rotations in 3D (SO(3))", order: 3, status: "draft" },
      { slug: "homogeneous-transforms", title: "Homogeneous transforms (SE(3))", order: 4, status: "draft" },
      { slug: "quaternions", title: "Quaternions", order: 5, status: "draft" },
      { slug: "twists-and-screws", title: "Twists and screws", order: 6, status: "draft" },
    ],
  },
  {
    slug: "kinematics",
    title: "Kinematics",
    order: 2,
    lessons: [
      { slug: "forward-kinematics", title: "Forward kinematics", order: 1, status: "draft" },
      { slug: "dh-parameters", title: "DH parameters", order: 2, status: "draft" },
      { slug: "inverse-kinematics", title: "Inverse kinematics", order: 3, status: "draft" },
      { slug: "velocity-kinematics", title: "Velocity kinematics", order: 4, status: "draft" },
      { slug: "jacobians", title: "Jacobians", order: 5, status: "draft" },
      { slug: "singularities", title: "Singularities", order: 6, status: "draft" },
    ],
  },
  {
    slug: "dynamics",
    title: "Dynamics",
    order: 3,
    lessons: [
      { slug: "newton-euler", title: "Newton–Euler dynamics", order: 1, status: "draft" },
      { slug: "lagrangian-dynamics", title: "Lagrangian dynamics", order: 2, status: "draft" },
      { slug: "equations-of-motion", title: "Equations of motion", order: 3, status: "draft" },
      { slug: "contact-and-friction", title: "Contact and friction", order: 4, status: "draft" },
    ],
  },
  {
    slug: "control",
    title: "Control",
    order: 4,
    lessons: [
      { slug: "pid-control", title: "PID control", order: 1, status: "draft" },
      { slug: "state-space", title: "State-space control", order: 2, status: "draft" },
      { slug: "lqr", title: "LQR", order: 3, status: "draft" },
      { slug: "trajectory-tracking", title: "Trajectory tracking", order: 4, status: "draft" },
      { slug: "computed-torque", title: "Computed-torque control", order: 5, status: "draft" },
      { slug: "impedance-control", title: "Impedance control", order: 6, status: "draft" },
    ],
  },
  {
    slug: "reinforcement-learning",
    title: "Reinforcement learning",
    order: 5,
    lessons: [
      { slug: "mdps", title: "Markov decision processes", order: 1, status: "draft" },
      { slug: "value-iteration", title: "Value iteration", order: 2, status: "draft" },
      { slug: "policy-iteration", title: "Policy iteration", order: 3, status: "draft" },
      { slug: "monte-carlo", title: "Monte Carlo methods", order: 4, status: "draft" },
      { slug: "temporal-difference", title: "Temporal-difference learning", order: 5, status: "draft" },
      { slug: "q-learning", title: "Q-learning", order: 6, status: "draft" },
      { slug: "function-approximation", title: "Function approximation", order: 7, status: "draft" },
      { slug: "dqn", title: "Deep Q-networks (DQN)", order: 8, status: "draft" },
      { slug: "policy-gradients", title: "Policy gradients", order: 9, status: "draft" },
      { slug: "actor-critic", title: "Actor-critic methods", order: 10, status: "draft" },
      { slug: "ppo", title: "Proximal policy optimization (PPO)", order: 11, status: "draft" },
      { slug: "sac", title: "Soft actor-critic (SAC)", order: 12, status: "draft" },
      { slug: "exploration-vs-exploitation", title: "Exploration vs exploitation", order: 13, status: "draft" },
      { slug: "reward-shaping", title: "Reward shaping", order: 14, status: "draft" },
    ],
  },
  {
    slug: "path-planning",
    title: "Path planning",
    order: 6,
    lessons: [
      { slug: "configuration-space", title: "Configuration space", order: 1, status: "draft" },
      { slug: "obstacles-and-collision", title: "Obstacles and collision checking", order: 2, status: "draft" },
      { slug: "graph-search-bfs-dfs", title: "Graph search: BFS and DFS", order: 3, status: "draft" },
      { slug: "dijkstra", title: "Dijkstra's algorithm", order: 4, status: "draft" },
      { slug: "a-star", title: "A* search", order: 5, status: "draft" },
      { slug: "weighted-and-anytime-astar", title: "Weighted and anytime A*", order: 6, status: "draft" },
      { slug: "d-star-replanning", title: "D* replanning", order: 7, status: "draft" },
      { slug: "prm", title: "Probabilistic roadmaps (PRM)", order: 8, status: "draft" },
      { slug: "rrt", title: "Rapidly-exploring random trees (RRT)", order: 9, status: "draft" },
      { slug: "rrt-connect", title: "RRT-Connect", order: 10, status: "draft" },
      { slug: "rrt-star", title: "RRT*", order: 11, status: "draft" },
      { slug: "informed-rrt-star", title: "Informed RRT*", order: 12, status: "draft" },
      { slug: "potential-fields", title: "Potential fields", order: 13, status: "draft" },
      { slug: "visibility-graphs", title: "Visibility graphs", order: 14, status: "draft" },
      { slug: "cell-decomposition", title: "Cell decomposition", order: 15, status: "draft" },
      { slug: "trajectory-optimization", title: "Trajectory optimization", order: 16, status: "draft" },
      { slug: "kinodynamic-planning", title: "Kinodynamic planning", order: 17, status: "draft" },
      { slug: "time-elastic-bands", title: "Time-elastic bands", order: 18, status: "draft" },
      { slug: "rl-for-path-planning", title: "RL for path planning", order: 19, status: "draft" },
      { slug: "learned-heuristics", title: "Learned heuristics", order: 20, status: "draft" },
      { slug: "drl-motion-planning", title: "DRL motion planning", order: 21, status: "draft" },
      { slug: "neural-motion-planners", title: "Neural motion planners", order: 22, status: "draft" },
      { slug: "sim-to-real-for-planning", title: "Sim-to-real for planning", order: 23, status: "draft" },
    ],
  },
  {
    slug: "perception",
    title: "Perception",
    order: 7,
    lessons: [
      { slug: "sensors-overview", title: "Sensors overview", order: 1, status: "draft" },
      { slug: "camera-models", title: "Camera models", order: 2, status: "draft" },
      { slug: "point-clouds", title: "Point clouds", order: 3, status: "draft" },
      { slug: "feature-detection", title: "Feature detection", order: 4, status: "draft" },
      { slug: "filtering-basics", title: "Filtering basics", order: 5, status: "draft" },
    ],
  },
  {
    slug: "state-estimation",
    title: "State estimation",
    order: 8,
    lessons: [
      { slug: "bayes-filter", title: "Bayes filter", order: 1, status: "draft" },
      { slug: "kalman-filter", title: "Kalman filter", order: 2, status: "draft" },
      { slug: "extended-kalman-filter", title: "Extended Kalman filter", order: 3, status: "draft" },
      { slug: "particle-filter", title: "Particle filter", order: 4, status: "draft" },
    ],
  },
  {
    slug: "slam",
    title: "SLAM",
    order: 9,
    lessons: [
      { slug: "localization", title: "Localization", order: 1, status: "draft" },
      { slug: "mapping", title: "Mapping", order: 2, status: "draft" },
      { slug: "graph-slam", title: "Graph SLAM", order: 3, status: "draft" },
      { slug: "loop-closure", title: "Loop closure", order: 4, status: "draft" },
    ],
  },
  {
    slug: "manipulation",
    title: "Manipulation",
    order: 10,
    lessons: [
      { slug: "grasping-basics", title: "Grasping basics", order: 1, status: "draft" },
      { slug: "motion-primitives", title: "Motion primitives", order: 2, status: "draft" },
    ],
  },
  {
    slug: "mobile-robots",
    title: "Mobile robots",
    order: 11,
    lessons: [
      { slug: "differential-drive", title: "Differential drive", order: 1, status: "draft" },
      { slug: "odometry", title: "Odometry", order: 2, status: "draft" },
      { slug: "local-planning", title: "Local planning", order: 3, status: "draft" },
    ],
  },
];

/** Look up an area by slug. */
export function getArea(slug: string): Area | undefined {
  return curriculum.find((a) => a.slug === slug);
}

/** Look up a single lesson by area + slug. */
export function getLesson(
  areaSlug: string,
  lessonSlug: string,
): LessonRef | undefined {
  return getArea(areaSlug)?.lessons.find((l) => l.slug === lessonSlug);
}

/** Flat list of every lesson with its area, in curriculum order. */
export function getAllLessons(): Array<LessonRef & { area: string }> {
  return curriculum.flatMap((area) =>
    area.lessons.map((lesson) => ({ ...lesson, area: area.slug })),
  );
}
