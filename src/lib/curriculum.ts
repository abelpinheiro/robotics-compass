/**
 * Canonical navigation / ordering source for Robotics Compass.
 *
 * This MUST mirror the `robotics-curriculum` skill (areas, slugs, order).
 * Changing the taxonomy requires asking the human first (Golden rule 4).
 *
 * This file is also the single source of truth for each lesson's `difficulty`
 * and `prerequisites` (slugs) — the prerequisite graph powers the lesson
 * prerequisite links, prev/next navigation, and the home-page study roadmap.
 */

export type LessonStatus = "draft" | "in-progress" | "published";
export type Difficulty = "intro" | "core" | "advanced";

export interface LessonRef {
  /** kebab-case topic slug, matches content/<area>/<slug>.mdx */
  slug: string;
  /** humanized, sentence-case display title */
  title: string;
  /** 1-based order within the area */
  order: number;
  status: LessonStatus;
  difficulty: Difficulty;
  /** slugs of prerequisite lessons (a DAG across the whole curriculum) */
  prerequisites: string[];
}

export interface Area {
  slug: string;
  title: string;
  order: number;
  lessons: LessonRef[];
}

export type LessonWithArea = LessonRef & { area: string };

export const curriculum: Area[] = [
  {
    slug: "foundations",
    title: "Foundations",
    order: 1,
    lessons: [
      { slug: "vectors-and-frames", title: "Vectors and frames", order: 1, status: "published", difficulty: "intro", prerequisites: [] },
      { slug: "rotations-2d", title: "Rotations in 2D", order: 2, status: "published", difficulty: "intro", prerequisites: ["vectors-and-frames"] },
      { slug: "rotations-3d", title: "Rotations in 3D (SO(3))", order: 3, status: "draft", difficulty: "core", prerequisites: ["rotations-2d"] },
      { slug: "homogeneous-transforms", title: "Homogeneous transforms (SE(3))", order: 4, status: "draft", difficulty: "core", prerequisites: ["rotations-3d"] },
      { slug: "quaternions", title: "Quaternions", order: 5, status: "draft", difficulty: "core", prerequisites: ["rotations-3d"] },
      { slug: "twists-and-screws", title: "Twists and screws", order: 6, status: "draft", difficulty: "advanced", prerequisites: ["homogeneous-transforms"] },
    ],
  },
  {
    slug: "kinematics",
    title: "Kinematics",
    order: 2,
    lessons: [
      { slug: "forward-kinematics", title: "Forward kinematics", order: 1, status: "draft", difficulty: "core", prerequisites: ["homogeneous-transforms"] },
      { slug: "dh-parameters", title: "DH parameters", order: 2, status: "draft", difficulty: "core", prerequisites: ["forward-kinematics"] },
      { slug: "inverse-kinematics", title: "Inverse kinematics", order: 3, status: "draft", difficulty: "core", prerequisites: ["forward-kinematics"] },
      { slug: "velocity-kinematics", title: "Velocity kinematics", order: 4, status: "draft", difficulty: "core", prerequisites: ["forward-kinematics"] },
      { slug: "jacobians", title: "Jacobians", order: 5, status: "draft", difficulty: "core", prerequisites: ["velocity-kinematics"] },
      { slug: "singularities", title: "Singularities", order: 6, status: "draft", difficulty: "advanced", prerequisites: ["jacobians"] },
    ],
  },
  {
    slug: "dynamics",
    title: "Dynamics",
    order: 3,
    lessons: [
      { slug: "newton-euler", title: "Newton–Euler dynamics", order: 1, status: "draft", difficulty: "core", prerequisites: ["jacobians"] },
      { slug: "lagrangian-dynamics", title: "Lagrangian dynamics", order: 2, status: "draft", difficulty: "core", prerequisites: ["newton-euler"] },
      { slug: "equations-of-motion", title: "Equations of motion", order: 3, status: "draft", difficulty: "core", prerequisites: ["lagrangian-dynamics"] },
      { slug: "contact-and-friction", title: "Contact and friction", order: 4, status: "draft", difficulty: "advanced", prerequisites: ["equations-of-motion"] },
    ],
  },
  {
    slug: "control",
    title: "Control",
    order: 4,
    lessons: [
      { slug: "pid-control", title: "PID control", order: 1, status: "draft", difficulty: "intro", prerequisites: ["equations-of-motion"] },
      { slug: "state-space", title: "State-space control", order: 2, status: "draft", difficulty: "core", prerequisites: ["pid-control"] },
      { slug: "lqr", title: "LQR", order: 3, status: "draft", difficulty: "advanced", prerequisites: ["state-space"] },
      { slug: "trajectory-tracking", title: "Trajectory tracking", order: 4, status: "draft", difficulty: "core", prerequisites: ["state-space"] },
      { slug: "computed-torque", title: "Computed-torque control", order: 5, status: "draft", difficulty: "advanced", prerequisites: ["equations-of-motion", "pid-control"] },
      { slug: "impedance-control", title: "Impedance control", order: 6, status: "draft", difficulty: "advanced", prerequisites: ["computed-torque"] },
    ],
  },
  {
    slug: "reinforcement-learning",
    title: "Reinforcement learning",
    order: 5,
    lessons: [
      { slug: "mdps", title: "Markov decision processes", order: 1, status: "draft", difficulty: "intro", prerequisites: [] },
      { slug: "value-iteration", title: "Value iteration", order: 2, status: "draft", difficulty: "core", prerequisites: ["mdps"] },
      { slug: "policy-iteration", title: "Policy iteration", order: 3, status: "draft", difficulty: "core", prerequisites: ["mdps"] },
      { slug: "monte-carlo", title: "Monte Carlo methods", order: 4, status: "draft", difficulty: "core", prerequisites: ["mdps"] },
      { slug: "temporal-difference", title: "Temporal-difference learning", order: 5, status: "draft", difficulty: "core", prerequisites: ["monte-carlo"] },
      { slug: "q-learning", title: "Q-learning", order: 6, status: "draft", difficulty: "core", prerequisites: ["temporal-difference", "value-iteration"] },
      { slug: "function-approximation", title: "Function approximation", order: 7, status: "draft", difficulty: "core", prerequisites: ["q-learning"] },
      { slug: "dqn", title: "Deep Q-networks (DQN)", order: 8, status: "draft", difficulty: "advanced", prerequisites: ["function-approximation"] },
      { slug: "policy-gradients", title: "Policy gradients", order: 9, status: "draft", difficulty: "advanced", prerequisites: ["mdps"] },
      { slug: "actor-critic", title: "Actor-critic methods", order: 10, status: "draft", difficulty: "advanced", prerequisites: ["policy-gradients", "value-iteration"] },
      { slug: "ppo", title: "Proximal policy optimization (PPO)", order: 11, status: "draft", difficulty: "advanced", prerequisites: ["actor-critic"] },
      { slug: "sac", title: "Soft actor-critic (SAC)", order: 12, status: "draft", difficulty: "advanced", prerequisites: ["actor-critic"] },
      { slug: "exploration-vs-exploitation", title: "Exploration vs exploitation", order: 13, status: "draft", difficulty: "core", prerequisites: ["mdps"] },
      { slug: "reward-shaping", title: "Reward shaping", order: 14, status: "draft", difficulty: "core", prerequisites: ["mdps"] },
    ],
  },
  {
    slug: "path-planning",
    title: "Path planning",
    order: 6,
    lessons: [
      { slug: "configuration-space", title: "Configuration space", order: 1, status: "draft", difficulty: "intro", prerequisites: ["vectors-and-frames"] },
      { slug: "obstacles-and-collision", title: "Obstacles and collision checking", order: 2, status: "draft", difficulty: "core", prerequisites: ["configuration-space"] },
      { slug: "graph-search-bfs-dfs", title: "Graph search: BFS and DFS", order: 3, status: "draft", difficulty: "intro", prerequisites: ["configuration-space"] },
      { slug: "dijkstra", title: "Dijkstra's algorithm", order: 4, status: "draft", difficulty: "core", prerequisites: ["graph-search-bfs-dfs"] },
      { slug: "a-star", title: "A* search", order: 5, status: "draft", difficulty: "core", prerequisites: ["dijkstra"] },
      { slug: "weighted-and-anytime-astar", title: "Weighted and anytime A*", order: 6, status: "draft", difficulty: "advanced", prerequisites: ["a-star"] },
      { slug: "d-star-replanning", title: "D* replanning", order: 7, status: "draft", difficulty: "advanced", prerequisites: ["a-star"] },
      { slug: "prm", title: "Probabilistic roadmaps (PRM)", order: 8, status: "draft", difficulty: "core", prerequisites: ["obstacles-and-collision"] },
      { slug: "rrt", title: "Rapidly-exploring random trees (RRT)", order: 9, status: "draft", difficulty: "core", prerequisites: ["obstacles-and-collision"] },
      { slug: "rrt-connect", title: "RRT-Connect", order: 10, status: "draft", difficulty: "core", prerequisites: ["rrt"] },
      { slug: "rrt-star", title: "RRT*", order: 11, status: "draft", difficulty: "advanced", prerequisites: ["rrt"] },
      { slug: "informed-rrt-star", title: "Informed RRT*", order: 12, status: "draft", difficulty: "advanced", prerequisites: ["rrt-star", "a-star"] },
      { slug: "potential-fields", title: "Potential fields", order: 13, status: "draft", difficulty: "core", prerequisites: ["configuration-space"] },
      { slug: "visibility-graphs", title: "Visibility graphs", order: 14, status: "draft", difficulty: "core", prerequisites: ["configuration-space"] },
      { slug: "cell-decomposition", title: "Cell decomposition", order: 15, status: "draft", difficulty: "core", prerequisites: ["configuration-space"] },
      { slug: "trajectory-optimization", title: "Trajectory optimization", order: 16, status: "draft", difficulty: "advanced", prerequisites: ["configuration-space"] },
      { slug: "kinodynamic-planning", title: "Kinodynamic planning", order: 17, status: "draft", difficulty: "advanced", prerequisites: ["rrt"] },
      { slug: "time-elastic-bands", title: "Time-elastic bands", order: 18, status: "draft", difficulty: "advanced", prerequisites: ["trajectory-optimization"] },
      { slug: "rl-for-path-planning", title: "RL for path planning", order: 19, status: "draft", difficulty: "advanced", prerequisites: ["a-star", "q-learning"] },
      { slug: "learned-heuristics", title: "Learned heuristics", order: 20, status: "draft", difficulty: "advanced", prerequisites: ["a-star", "function-approximation"] },
      { slug: "drl-motion-planning", title: "DRL motion planning", order: 21, status: "draft", difficulty: "advanced", prerequisites: ["rrt", "dqn", "policy-gradients"] },
      { slug: "neural-motion-planners", title: "Neural motion planners", order: 22, status: "draft", difficulty: "advanced", prerequisites: ["drl-motion-planning"] },
      { slug: "sim-to-real-for-planning", title: "Sim-to-real for planning", order: 23, status: "draft", difficulty: "advanced", prerequisites: ["drl-motion-planning"] },
    ],
  },
  {
    slug: "perception",
    title: "Perception",
    order: 7,
    lessons: [
      { slug: "sensors-overview", title: "Sensors overview", order: 1, status: "draft", difficulty: "intro", prerequisites: [] },
      { slug: "camera-models", title: "Camera models", order: 2, status: "draft", difficulty: "core", prerequisites: ["sensors-overview"] },
      { slug: "point-clouds", title: "Point clouds", order: 3, status: "draft", difficulty: "core", prerequisites: ["sensors-overview"] },
      { slug: "feature-detection", title: "Feature detection", order: 4, status: "draft", difficulty: "core", prerequisites: ["camera-models"] },
      { slug: "filtering-basics", title: "Filtering basics", order: 5, status: "draft", difficulty: "core", prerequisites: ["sensors-overview"] },
    ],
  },
  {
    slug: "state-estimation",
    title: "State estimation",
    order: 8,
    lessons: [
      { slug: "bayes-filter", title: "Bayes filter", order: 1, status: "draft", difficulty: "core", prerequisites: ["filtering-basics"] },
      { slug: "kalman-filter", title: "Kalman filter", order: 2, status: "draft", difficulty: "core", prerequisites: ["bayes-filter"] },
      { slug: "extended-kalman-filter", title: "Extended Kalman filter", order: 3, status: "draft", difficulty: "advanced", prerequisites: ["kalman-filter"] },
      { slug: "particle-filter", title: "Particle filter", order: 4, status: "draft", difficulty: "advanced", prerequisites: ["bayes-filter"] },
    ],
  },
  {
    slug: "slam",
    title: "SLAM",
    order: 9,
    lessons: [
      { slug: "localization", title: "Localization", order: 1, status: "draft", difficulty: "core", prerequisites: ["bayes-filter"] },
      { slug: "mapping", title: "Mapping", order: 2, status: "draft", difficulty: "core", prerequisites: ["sensors-overview"] },
      { slug: "graph-slam", title: "Graph SLAM", order: 3, status: "draft", difficulty: "advanced", prerequisites: ["localization", "mapping"] },
      { slug: "loop-closure", title: "Loop closure", order: 4, status: "draft", difficulty: "advanced", prerequisites: ["graph-slam"] },
    ],
  },
  {
    slug: "manipulation",
    title: "Manipulation",
    order: 10,
    lessons: [
      { slug: "grasping-basics", title: "Grasping basics", order: 1, status: "draft", difficulty: "core", prerequisites: ["forward-kinematics", "configuration-space"] },
      { slug: "motion-primitives", title: "Motion primitives", order: 2, status: "draft", difficulty: "advanced", prerequisites: ["grasping-basics", "a-star"] },
    ],
  },
  {
    slug: "mobile-robots",
    title: "Mobile robots",
    order: 11,
    lessons: [
      { slug: "differential-drive", title: "Differential drive", order: 1, status: "draft", difficulty: "intro", prerequisites: ["forward-kinematics"] },
      { slug: "odometry", title: "Odometry", order: 2, status: "draft", difficulty: "core", prerequisites: ["differential-drive", "kalman-filter"] },
      { slug: "local-planning", title: "Local planning", order: 3, status: "draft", difficulty: "core", prerequisites: ["a-star", "configuration-space"] },
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
export function getAllLessons(): LessonWithArea[] {
  return curriculum.flatMap((area) =>
    area.lessons.map((lesson) => ({ ...lesson, area: area.slug })),
  );
}

/** A lesson is shown to readers only once it is past the draft stage. Drafts
 *  are hidden from navigation, the study roadmap, prev/next, and the sitemap
 *  (they remain reachable by direct URL for authoring/preview). */
export function isLessonVisible(lesson: LessonRef): boolean {
  return lesson.status !== "draft";
}

/** Flat list of reader-visible lessons (drafts hidden), in curriculum order. */
export function getVisibleLessons(): LessonWithArea[] {
  return getAllLessons().filter(isLessonVisible);
}

/** Look up a lesson by its (globally unique) slug. */
export function getLessonBySlug(slug: string): LessonWithArea | undefined {
  for (const area of curriculum) {
    const lesson = area.lessons.find((l) => l.slug === slug);
    if (lesson) return { ...lesson, area: area.slug };
  }
  return undefined;
}

/** Resolve a lesson's prerequisite slugs to linkable lessons. */
export function getPrerequisites(slug: string): LessonWithArea[] {
  const lesson = getLessonBySlug(slug);
  if (!lesson) return [];
  return lesson.prerequisites
    .map(getLessonBySlug)
    .filter((l): l is LessonWithArea => l !== undefined && isLessonVisible(l));
}

/** Previous / next lesson in flat curriculum order. */
export function getAdjacentLessons(
  areaSlug: string,
  lessonSlug: string,
): { prev?: LessonWithArea; next?: LessonWithArea } {
  const flat = getVisibleLessons();
  const i = flat.findIndex((l) => l.area === areaSlug && l.slug === lessonSlug);
  if (i < 0) return {};
  return {
    prev: i > 0 ? flat[i - 1] : undefined,
    next: i < flat.length - 1 ? flat[i + 1] : undefined,
  };
}

/**
 * Group every lesson into study levels by its longest prerequisite chain
 * (level 0 = no prerequisites). Gives a recommended study order that respects
 * the dependency graph. Edges are followed only within the curriculum.
 */
export function getStudyLevels(): LessonWithArea[][] {
  const all = getVisibleLessons();
  const bySlug = new Map(all.map((l) => [l.slug, l]));
  const depthCache = new Map<string, number>();
  const visiting = new Set<string>();

  const depth = (slug: string): number => {
    const cached = depthCache.get(slug);
    if (cached !== undefined) return cached;
    const lesson = bySlug.get(slug);
    if (!lesson || lesson.prerequisites.length === 0) {
      depthCache.set(slug, 0);
      return 0;
    }
    if (visiting.has(slug)) return 0; // cycle guard
    visiting.add(slug);
    let max = 0;
    for (const p of lesson.prerequisites) {
      if (bySlug.has(p)) max = Math.max(max, depth(p) + 1);
    }
    visiting.delete(slug);
    depthCache.set(slug, max);
    return max;
  };

  const levels: LessonWithArea[][] = [];
  for (const lesson of all) {
    const d = depth(lesson.slug);
    (levels[d] ??= []).push(lesson);
  }
  // Drop empty levels (filtering hidden lessons can leave gaps).
  return levels.filter((level) => level && level.length > 0);
}
