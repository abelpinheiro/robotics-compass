import type { Locale } from "@/lib/i18n/config";

/**
 * Canonical course map for Robotics Compass: Parts → chapters → lessons.
 *
 * This MUST mirror the `robotics-curriculum` skill (parts, chapters, slugs,
 * order). Changing the taxonomy requires asking the human first (Golden rule 4).
 *
 * Parts I–III follow Craig's chapters 2–13; Parts IV–V go beyond Craig; Part VI
 * is parked (in the map, no pages). This file is also the single source of
 * truth for each lesson's `status`, `difficulty` and `prerequisites` (slugs) —
 * the prerequisite graph powers the lesson prerequisite links, prev/next
 * navigation and the course-map views.
 *
 * A lesson's `area` is only its content folder and URL segment
 * (content/<area>/<slug>.mdx, /lessons/<area>/<slug>); navigation never shows it.
 */

/**
 * - `published` / `in-progress`: has a page, listed in navigation.
 * - `planned`: in the map only; no page in production.
 * - `parked`: in the map only, inside the parked part; no page in production.
 */
export type LessonStatus = "published" | "in-progress" | "planned" | "parked";
export type Difficulty = "intro" | "core" | "advanced";

export interface LessonRef {
  /** kebab-case topic slug, globally unique, matches content/<area>/<slug>.mdx */
  slug: string;
  /** content folder and URL segment */
  area: string;
  /** humanized, sentence-case English title (Portuguese in i18n/titles.ts) */
  title: string;
  status: LessonStatus;
  difficulty: Difficulty;
  /** slugs of prerequisite lessons (a DAG across the whole course map) */
  prerequisites: string[];
}

export interface Chapter {
  slug: string;
  /** reading-order number; parked chapters and case studies have none */
  number?: number;
  /** Craig chapter(s) this chapter follows, e.g. "5" or "12–13" */
  craig?: string;
  title: Record<Locale, string>;
  lessons: LessonRef[];
}

export interface Part {
  slug: string;
  /** Roman numeral; the case-studies section has none */
  numeral?: string;
  title: Record<Locale, string>;
  /** parked parts appear in the map only, and every lesson in them is `parked` */
  parked?: boolean;
  chapters: Chapter[];
}

export const curriculum: Part[] = [
  {
    slug: "position-orientation",
    numeral: "I",
    title: { en: "Position and orientation", pt: "Posição e orientação" },
    chapters: [
      {
        slug: "spatial-descriptions",
        number: 1,
        craig: "2",
        title: { en: "Spatial descriptions and transformations", pt: "Descrições espaciais e transformações" },
        lessons: [
          { slug: "vectors-and-frames", area: "foundations", title: "Vectors and frames", status: "published", difficulty: "intro", prerequisites: [] },
          { slug: "rotations-2d", area: "foundations", title: "Rotations in 2D", status: "published", difficulty: "intro", prerequisites: ["vectors-and-frames"] },
          { slug: "rotations-3d", area: "foundations", title: "Rotations in 3D", status: "published", difficulty: "core", prerequisites: ["rotations-2d"] },
          { slug: "homogeneous-transforms", area: "foundations", title: "Homogeneous transforms", status: "published", difficulty: "core", prerequisites: ["rotations-3d"] },
          { slug: "quaternions", area: "foundations", title: "Quaternions", status: "published", difficulty: "core", prerequisites: ["rotations-3d"] },
        ],
      },
    ],
  },
  {
    slug: "kinematics-dynamics",
    numeral: "II",
    title: { en: "Manipulator kinematics and dynamics", pt: "Cinemática e dinâmica de manipuladores" },
    chapters: [
      {
        slug: "manipulator-kinematics",
        number: 2,
        craig: "3",
        title: { en: "Manipulator kinematics", pt: "Cinemática de manipuladores" },
        lessons: [
          { slug: "modeling-manipulators", area: "kinematics", title: "Modeling Manipulators", status: "published", difficulty: "core", prerequisites: ["homogeneous-transforms"] },
          { slug: "forward-kinematics", area: "kinematics", title: "Forward kinematics", status: "published", difficulty: "core", prerequisites: ["modeling-manipulators"] },
        ],
      },
      {
        slug: "inverse-kinematics",
        number: 3,
        craig: "4",
        title: { en: "Inverse kinematics", pt: "Cinemática inversa" },
        lessons: [
          { slug: "inverse-kinematics", area: "kinematics", title: "Inverse kinematics", status: "published", difficulty: "core", prerequisites: ["forward-kinematics"] },
        ],
      },
      {
        slug: "jacobians",
        number: 4,
        craig: "5",
        title: { en: "Jacobians: velocities and static forces", pt: "Jacobianas: velocidades e forças estáticas" },
        lessons: [
          { slug: "velocity-kinematics", area: "kinematics", title: "Velocity kinematics", status: "published", difficulty: "core", prerequisites: ["forward-kinematics"] },
          { slug: "jacobians", area: "kinematics", title: "Jacobians", status: "published", difficulty: "core", prerequisites: ["velocity-kinematics"] },
        ],
      },
      {
        slug: "manipulator-dynamics",
        number: 5,
        craig: "6",
        title: { en: "Manipulator dynamics", pt: "Dinâmica de manipuladores" },
        lessons: [
          { slug: "newton-euler", area: "dynamics", title: "Newton–Euler dynamics", status: "in-progress", difficulty: "core", prerequisites: ["velocity-kinematics"] },
          { slug: "lagrangian-dynamics", area: "dynamics", title: "Lagrangian dynamics", status: "planned", difficulty: "core", prerequisites: ["newton-euler"] },
          { slug: "equations-of-motion", area: "dynamics", title: "Equations of motion", status: "planned", difficulty: "core", prerequisites: ["lagrangian-dynamics"] },
        ],
      },
      {
        slug: "trajectory-generation",
        number: 6,
        craig: "7",
        title: { en: "Trajectory generation", pt: "Geração de trajetórias" },
        lessons: [
          { slug: "polynomial-trajectories", area: "trajectories", title: "Polynomial trajectories", status: "planned", difficulty: "core", prerequisites: ["inverse-kinematics"] },
          { slug: "lspb-trajectories", area: "trajectories", title: "Linear segments with parabolic blends (LSPB)", status: "planned", difficulty: "core", prerequisites: ["polynomial-trajectories"] },
          { slug: "cartesian-trajectories", area: "trajectories", title: "Cartesian-space trajectories", status: "planned", difficulty: "core", prerequisites: ["lspb-trajectories", "inverse-kinematics"] },
        ],
      },
    ],
  },
  {
    slug: "design-control-programming",
    numeral: "III",
    title: { en: "Design, control and programming", pt: "Projeto, controle e programação" },
    chapters: [
      {
        slug: "mechanism-design",
        number: 7,
        craig: "8",
        title: { en: "Mechanism design", pt: "Projeto de mecanismos" },
        lessons: [],
      },
      {
        slug: "linear-control",
        number: 8,
        craig: "9",
        title: { en: "Linear control", pt: "Controle linear" },
        lessons: [
          { slug: "pid-control", area: "control", title: "PID control", status: "planned", difficulty: "intro", prerequisites: ["equations-of-motion"] },
          { slug: "state-space", area: "control", title: "State-space control", status: "planned", difficulty: "core", prerequisites: ["pid-control"] },
          { slug: "trajectory-tracking", area: "control", title: "Trajectory tracking", status: "planned", difficulty: "core", prerequisites: ["state-space"] },
        ],
      },
      {
        slug: "nonlinear-control",
        number: 9,
        craig: "10",
        title: { en: "Nonlinear control", pt: "Controle não linear" },
        lessons: [
          { slug: "computed-torque", area: "control", title: "Computed-torque control", status: "planned", difficulty: "advanced", prerequisites: ["equations-of-motion", "pid-control"] },
        ],
      },
      {
        slug: "force-control",
        number: 10,
        craig: "11",
        title: { en: "Force control", pt: "Controle de força" },
        lessons: [
          { slug: "impedance-control", area: "control", title: "Impedance control", status: "planned", difficulty: "advanced", prerequisites: ["computed-torque"] },
          { slug: "hybrid-force-position-control", area: "control", title: "Hybrid position/force control", status: "planned", difficulty: "advanced", prerequisites: ["computed-torque", "jacobians"] },
        ],
      },
      {
        slug: "robot-programming",
        number: 11,
        craig: "12–13",
        title: { en: "Robot programming", pt: "Programação de robôs" },
        lessons: [],
      },
    ],
  },
  {
    slug: "advanced-manipulation",
    numeral: "IV",
    title: { en: "Advanced manipulation", pt: "Manipulação avançada" },
    chapters: [
      {
        slug: "screws-and-poe",
        number: 12,
        title: { en: "Screws and the product of exponentials", pt: "Screws e produto de exponenciais" },
        lessons: [
          { slug: "twists-and-screws", area: "foundations", title: "Twists and screws", status: "planned", difficulty: "advanced", prerequisites: ["homogeneous-transforms"] },
          { slug: "product-of-exponentials", area: "kinematics", title: "Product of exponentials", status: "planned", difficulty: "advanced", prerequisites: ["twists-and-screws", "forward-kinematics"] },
        ],
      },
      {
        slug: "redundancy",
        number: 13,
        title: { en: "Redundancy", pt: "Redundância" },
        lessons: [
          { slug: "redundancy-and-null-space", area: "kinematics", title: "Redundancy and null space", status: "planned", difficulty: "advanced", prerequisites: ["jacobians"] },
        ],
      },
      {
        slug: "advanced-dynamics-control",
        number: 14,
        title: { en: "Advanced dynamics and control", pt: "Dinâmica e controle avançados" },
        lessons: [
          { slug: "lqr", area: "control", title: "LQR", status: "planned", difficulty: "advanced", prerequisites: ["state-space"] },
        ],
      },
      {
        slug: "manipulation-and-contact",
        number: 15,
        title: { en: "Manipulation and contact", pt: "Manipulação e contato" },
        lessons: [
          { slug: "contact-and-friction", area: "dynamics", title: "Contact and friction", status: "planned", difficulty: "advanced", prerequisites: ["equations-of-motion"] },
          { slug: "grasping-basics", area: "manipulation", title: "Grasping basics", status: "planned", difficulty: "core", prerequisites: ["forward-kinematics", "configuration-space"] },
          { slug: "motion-primitives", area: "manipulation", title: "Motion primitives", status: "planned", difficulty: "advanced", prerequisites: ["grasping-basics", "a-star"] },
        ],
      },
    ],
  },
  {
    slug: "planning-learning",
    numeral: "V",
    title: { en: "Planning and learning", pt: "Planejamento e aprendizado" },
    chapters: [
      {
        slug: "motion-planning",
        number: 16,
        title: { en: "Motion planning", pt: "Planejamento de movimento" },
        lessons: [
          { slug: "configuration-space", area: "path-planning", title: "Configuration space", status: "planned", difficulty: "intro", prerequisites: ["vectors-and-frames"] },
          { slug: "obstacles-and-collision", area: "path-planning", title: "Obstacles and collision checking", status: "planned", difficulty: "core", prerequisites: ["configuration-space"] },
          { slug: "graph-search-bfs-dfs", area: "path-planning", title: "Graph search: BFS and DFS", status: "planned", difficulty: "intro", prerequisites: ["configuration-space"] },
          { slug: "dijkstra", area: "path-planning", title: "Dijkstra's algorithm", status: "planned", difficulty: "core", prerequisites: ["graph-search-bfs-dfs"] },
          { slug: "a-star", area: "path-planning", title: "A* search", status: "planned", difficulty: "core", prerequisites: ["dijkstra"] },
          { slug: "weighted-and-anytime-astar", area: "path-planning", title: "Weighted and anytime A*", status: "planned", difficulty: "advanced", prerequisites: ["a-star"] },
          { slug: "d-star-replanning", area: "path-planning", title: "D* replanning", status: "planned", difficulty: "advanced", prerequisites: ["a-star"] },
          { slug: "prm", area: "path-planning", title: "Probabilistic roadmaps (PRM)", status: "planned", difficulty: "core", prerequisites: ["obstacles-and-collision"] },
          { slug: "rrt", area: "path-planning", title: "Rapidly-exploring random trees (RRT)", status: "planned", difficulty: "core", prerequisites: ["obstacles-and-collision"] },
          { slug: "rrt-connect", area: "path-planning", title: "RRT-Connect", status: "planned", difficulty: "core", prerequisites: ["rrt"] },
          { slug: "rrt-star", area: "path-planning", title: "RRT*", status: "planned", difficulty: "advanced", prerequisites: ["rrt"] },
          { slug: "informed-rrt-star", area: "path-planning", title: "Informed RRT*", status: "planned", difficulty: "advanced", prerequisites: ["rrt-star", "a-star"] },
          { slug: "potential-fields", area: "path-planning", title: "Potential fields", status: "planned", difficulty: "core", prerequisites: ["configuration-space"] },
          { slug: "visibility-graphs", area: "path-planning", title: "Visibility graphs", status: "planned", difficulty: "core", prerequisites: ["configuration-space"] },
          { slug: "cell-decomposition", area: "path-planning", title: "Cell decomposition", status: "planned", difficulty: "core", prerequisites: ["configuration-space"] },
          { slug: "trajectory-optimization", area: "path-planning", title: "Trajectory optimization", status: "planned", difficulty: "advanced", prerequisites: ["configuration-space"] },
          { slug: "kinodynamic-planning", area: "path-planning", title: "Kinodynamic planning", status: "planned", difficulty: "advanced", prerequisites: ["rrt"] },
          { slug: "time-elastic-bands", area: "path-planning", title: "Time-elastic bands", status: "planned", difficulty: "advanced", prerequisites: ["trajectory-optimization"] },
        ],
      },
      {
        slug: "reinforcement-learning",
        number: 17,
        title: { en: "Reinforcement learning", pt: "Aprendizado por reforço" },
        lessons: [
          { slug: "mdps", area: "reinforcement-learning", title: "Markov decision processes", status: "published", difficulty: "intro", prerequisites: [] },
          { slug: "value-iteration", area: "reinforcement-learning", title: "Value iteration", status: "planned", difficulty: "core", prerequisites: ["mdps"] },
          { slug: "policy-iteration", area: "reinforcement-learning", title: "Policy iteration", status: "planned", difficulty: "core", prerequisites: ["mdps"] },
          { slug: "monte-carlo", area: "reinforcement-learning", title: "Monte Carlo methods", status: "planned", difficulty: "core", prerequisites: ["mdps"] },
          { slug: "temporal-difference", area: "reinforcement-learning", title: "Temporal-difference learning", status: "planned", difficulty: "core", prerequisites: ["monte-carlo"] },
          { slug: "q-learning", area: "reinforcement-learning", title: "Q-learning", status: "planned", difficulty: "core", prerequisites: ["temporal-difference", "value-iteration"] },
          { slug: "function-approximation", area: "reinforcement-learning", title: "Function approximation", status: "planned", difficulty: "core", prerequisites: ["q-learning"] },
          { slug: "dqn", area: "reinforcement-learning", title: "Deep Q-networks (DQN)", status: "planned", difficulty: "advanced", prerequisites: ["function-approximation"] },
          { slug: "policy-gradients", area: "reinforcement-learning", title: "Policy gradients", status: "planned", difficulty: "advanced", prerequisites: ["mdps"] },
          { slug: "actor-critic", area: "reinforcement-learning", title: "Actor-critic methods", status: "planned", difficulty: "advanced", prerequisites: ["policy-gradients", "value-iteration"] },
          { slug: "ppo", area: "reinforcement-learning", title: "Proximal policy optimization (PPO)", status: "planned", difficulty: "advanced", prerequisites: ["actor-critic"] },
          { slug: "sac", area: "reinforcement-learning", title: "Soft actor-critic (SAC)", status: "planned", difficulty: "advanced", prerequisites: ["actor-critic"] },
          { slug: "exploration-vs-exploitation", area: "reinforcement-learning", title: "Exploration vs exploitation", status: "planned", difficulty: "core", prerequisites: ["mdps"] },
          { slug: "reward-shaping", area: "reinforcement-learning", title: "Reward shaping", status: "planned", difficulty: "core", prerequisites: ["mdps"] },
        ],
      },
      {
        slug: "planning-with-learning",
        number: 18,
        title: { en: "Planning with learning", pt: "Planejamento com aprendizado" },
        lessons: [
          { slug: "rl-for-path-planning", area: "path-planning", title: "RL for path planning", status: "planned", difficulty: "advanced", prerequisites: ["a-star", "q-learning"] },
          { slug: "learned-heuristics", area: "path-planning", title: "Learned heuristics", status: "planned", difficulty: "advanced", prerequisites: ["a-star", "function-approximation"] },
          { slug: "drl-motion-planning", area: "path-planning", title: "DRL motion planning", status: "planned", difficulty: "advanced", prerequisites: ["rrt", "dqn", "policy-gradients"] },
          { slug: "neural-motion-planners", area: "path-planning", title: "Neural motion planners", status: "planned", difficulty: "advanced", prerequisites: ["drl-motion-planning"] },
          { slug: "sim-to-real-for-planning", area: "path-planning", title: "Sim-to-real for planning", status: "planned", difficulty: "advanced", prerequisites: ["drl-motion-planning"] },
        ],
      },
    ],
  },
  {
    slug: "mobile-perception",
    numeral: "VI",
    title: { en: "Mobile robots and perception", pt: "Robôs móveis e percepção" },
    parked: true,
    chapters: [
      {
        slug: "mobile-robots",
        title: { en: "Mobile robots", pt: "Robôs móveis" },
        lessons: [
          { slug: "differential-drive", area: "mobile-robots", title: "Differential drive", status: "parked", difficulty: "intro", prerequisites: ["forward-kinematics"] },
          { slug: "odometry", area: "mobile-robots", title: "Odometry", status: "parked", difficulty: "core", prerequisites: ["differential-drive", "kalman-filter"] },
          { slug: "local-planning", area: "mobile-robots", title: "Local planning", status: "parked", difficulty: "core", prerequisites: ["a-star", "configuration-space"] },
        ],
      },
      {
        slug: "aerial-robots",
        title: { en: "Aerial robots", pt: "Robôs aéreos" },
        lessons: [],
      },
      {
        slug: "perception",
        title: { en: "Perception", pt: "Percepção" },
        lessons: [
          { slug: "sensors-overview", area: "perception", title: "Sensors overview", status: "parked", difficulty: "intro", prerequisites: [] },
          { slug: "camera-models", area: "perception", title: "Camera models", status: "parked", difficulty: "core", prerequisites: ["sensors-overview"] },
          { slug: "point-clouds", area: "perception", title: "Point clouds", status: "parked", difficulty: "core", prerequisites: ["sensors-overview"] },
          { slug: "feature-detection", area: "perception", title: "Feature detection", status: "parked", difficulty: "core", prerequisites: ["camera-models"] },
          { slug: "filtering-basics", area: "perception", title: "Filtering basics", status: "parked", difficulty: "core", prerequisites: ["sensors-overview"] },
        ],
      },
      {
        slug: "state-estimation",
        title: { en: "State estimation", pt: "Estimação de estado" },
        lessons: [
          { slug: "bayes-filter", area: "state-estimation", title: "Bayes filter", status: "parked", difficulty: "core", prerequisites: ["filtering-basics"] },
          { slug: "kalman-filter", area: "state-estimation", title: "Kalman filter", status: "parked", difficulty: "core", prerequisites: ["bayes-filter"] },
          { slug: "extended-kalman-filter", area: "state-estimation", title: "Extended Kalman filter", status: "parked", difficulty: "advanced", prerequisites: ["kalman-filter"] },
          { slug: "particle-filter", area: "state-estimation", title: "Particle filter", status: "parked", difficulty: "advanced", prerequisites: ["bayes-filter"] },
        ],
      },
      {
        slug: "slam",
        title: { en: "SLAM", pt: "SLAM" },
        lessons: [
          { slug: "localization", area: "slam", title: "Localization", status: "parked", difficulty: "core", prerequisites: ["bayes-filter"] },
          { slug: "mapping", area: "slam", title: "Mapping", status: "parked", difficulty: "core", prerequisites: ["sensors-overview"] },
          { slug: "graph-slam", area: "slam", title: "Graph SLAM", status: "parked", difficulty: "advanced", prerequisites: ["localization", "mapping"] },
          { slug: "loop-closure", area: "slam", title: "Loop closure", status: "parked", difficulty: "advanced", prerequisites: ["graph-slam"] },
        ],
      },
    ],
  },
  {
    slug: "case-studies",
    title: { en: "Case studies", pt: "Estudos de caso" },
    chapters: [
      {
        slug: "case-studies",
        title: { en: "Case studies", pt: "Estudos de caso" },
        lessons: [
          { slug: "ur20", area: "case-studies", title: "UR20 (Universal Robots)", status: "in-progress", difficulty: "advanced", prerequisites: ["forward-kinematics", "inverse-kinematics", "jacobians", "newton-euler"] },
        ],
      },
    ],
  },
];

/** A lesson with the part and chapter that hold it. */
export interface LessonPlacement {
  lesson: LessonRef;
  part: Part;
  chapter: Chapter;
}

const placements: LessonPlacement[] = curriculum.flatMap((part) =>
  part.chapters.flatMap((chapter) =>
    chapter.lessons.map((lesson) => ({ lesson, part, chapter })),
  ),
);
const placementBySlug = new Map(placements.map((p) => [p.lesson.slug, p]));

/** Every lesson, in course order. */
export function getAllLessons(): LessonRef[] {
  return placements.map((p) => p.lesson);
}

/** Readers see a lesson (navigation, prev/next, sitemap) once it is published or in progress. */
export function isLessonVisible(lesson: LessonRef): boolean {
  return lesson.status === "published" || lesson.status === "in-progress";
}

/**
 * Whether the lesson route renders this lesson. Planned and parked lessons have
 * no page in production; the dev server renders them so the author can preview
 * a lesson while writing it.
 */
export function isLessonRoutable(
  lesson: LessonRef,
  dev = process.env.NODE_ENV === "development",
): boolean {
  return dev || isLessonVisible(lesson);
}

/** Reader-visible lessons, in course order. */
export function getVisibleLessons(): LessonRef[] {
  return getAllLessons().filter(isLessonVisible);
}

/** Look up a lesson by its (globally unique) slug. */
export function getLessonBySlug(slug: string): LessonRef | undefined {
  return placementBySlug.get(slug)?.lesson;
}

/** Look up a single lesson by area + slug (its URL). */
export function getLesson(areaSlug: string, lessonSlug: string): LessonRef | undefined {
  const lesson = getLessonBySlug(lessonSlug);
  return lesson?.area === areaSlug ? lesson : undefined;
}

/** The part and chapter that hold a lesson. */
export function getLessonPlacement(slug: string): LessonPlacement | undefined {
  return placementBySlug.get(slug);
}

/** Resolve a lesson's prerequisite slugs to linkable (visible) lessons. */
export function getPrerequisites(slug: string): LessonRef[] {
  const lesson = getLessonBySlug(slug);
  if (!lesson) return [];
  return lesson.prerequisites
    .map(getLessonBySlug)
    .filter((l): l is LessonRef => l !== undefined && isLessonVisible(l));
}

/** Previous / next visible lesson in course order. */
export function getAdjacentLessons(
  areaSlug: string,
  lessonSlug: string,
): { prev?: LessonRef; next?: LessonRef } {
  const flat = getVisibleLessons();
  const i = flat.findIndex((l) => l.area === areaSlug && l.slug === lessonSlug);
  if (i < 0) return {};
  return {
    prev: i > 0 ? flat[i - 1] : undefined,
    next: i < flat.length - 1 ? flat[i + 1] : undefined,
  };
}

/**
 * How a chapter shows in navigation: `parked` inside the parked part, `planned`
 * when none of its lessons is visible yet, `active` otherwise.
 */
export type ChapterState = "active" | "planned" | "parked";

export function getChapterState(chapter: Chapter, part: Part): ChapterState {
  if (part.parked) return "parked";
  return chapter.lessons.some(isLessonVisible) ? "active" : "planned";
}

/** Count lessons by status, over the whole map or one part. */
export function countByStatus(parts: Part[] = curriculum): Record<LessonStatus, number> {
  const counts: Record<LessonStatus, number> = { published: 0, "in-progress": 0, planned: 0, parked: 0 };
  for (const part of parts) {
    for (const chapter of part.chapters) {
      for (const lesson of chapter.lessons) counts[lesson.status]++;
    }
  }
  return counts;
}
