import type { Locale } from "./config";

// Portuguese titles. English titles come from src/lib/curriculum.ts; these are
// the PT overrides used when the locale is "pt".
const areaTitlesPt: Record<string, string> = {
  foundations: "Fundamentos",
  kinematics: "Cinemática",
  dynamics: "Dinâmica",
  control: "Controle",
  "reinforcement-learning": "Aprendizado por reforço",
  "path-planning": "Planejamento de trajetórias",
  perception: "Percepção",
  "state-estimation": "Estimação de estado",
  slam: "SLAM",
  manipulation: "Manipulação",
  "mobile-robots": "Robôs móveis",
};

const lessonTitlesPt: Record<string, string> = {
  // foundations
  "vectors-and-frames": "Vetores e referenciais",
  "rotations-2d": "Rotações em 2D",
  "rotations-3d": "Rotações em 3D (SO(3))",
  "homogeneous-transforms": "Transformações homogêneas (SE(3))",
  quaternions: "Quatérnios",
  "twists-and-screws": "Twists e screws",
  // kinematics
  "forward-kinematics": "Cinemática direta",
  "dh-parameters": "Parâmetros DH",
  "inverse-kinematics": "Cinemática inversa",
  "velocity-kinematics": "Cinemática de velocidade",
  jacobians: "Jacobianas",
  singularities: "Singularidades",
  // dynamics
  "newton-euler": "Dinâmica de Newton–Euler",
  "lagrangian-dynamics": "Dinâmica lagrangiana",
  "equations-of-motion": "Equações de movimento",
  "contact-and-friction": "Contato e atrito",
  // control
  "pid-control": "Controle PID",
  "state-space": "Controle em espaço de estados",
  lqr: "LQR",
  "trajectory-tracking": "Seguimento de trajetória",
  "computed-torque": "Controle por torque computado",
  "impedance-control": "Controle de impedância",
  // reinforcement-learning
  mdps: "Processos de decisão de Markov",
  "value-iteration": "Iteração de valor",
  "policy-iteration": "Iteração de política",
  "monte-carlo": "Métodos de Monte Carlo",
  "temporal-difference": "Aprendizado por diferença temporal",
  "q-learning": "Q-learning",
  "function-approximation": "Aproximação de função",
  dqn: "Deep Q-networks (DQN)",
  "policy-gradients": "Gradientes de política",
  "actor-critic": "Métodos ator-crítico",
  ppo: "Proximal policy optimization (PPO)",
  sac: "Soft actor-critic (SAC)",
  "exploration-vs-exploitation": "Exploração vs. aproveitamento",
  "reward-shaping": "Modelagem de recompensa",
  // path-planning
  "configuration-space": "Espaço de configuração",
  "obstacles-and-collision": "Obstáculos e verificação de colisão",
  "graph-search-bfs-dfs": "Busca em grafos: BFS e DFS",
  dijkstra: "Algoritmo de Dijkstra",
  "a-star": "Busca A*",
  "weighted-and-anytime-astar": "A* ponderado e anytime",
  "d-star-replanning": "Replanejamento D*",
  prm: "Roadmaps probabilísticos (PRM)",
  rrt: "Árvores aleatórias de exploração rápida (RRT)",
  "rrt-connect": "RRT-Connect",
  "rrt-star": "RRT*",
  "informed-rrt-star": "RRT* informado",
  "potential-fields": "Campos potenciais",
  "visibility-graphs": "Grafos de visibilidade",
  "cell-decomposition": "Decomposição em células",
  "trajectory-optimization": "Otimização de trajetória",
  "kinodynamic-planning": "Planejamento cinodinâmico",
  "time-elastic-bands": "Bandas elásticas no tempo",
  "rl-for-path-planning": "RL para planejamento de trajetórias",
  "learned-heuristics": "Heurísticas aprendidas",
  "drl-motion-planning": "Planejamento de movimento com DRL",
  "neural-motion-planners": "Planejadores de movimento neurais",
  "sim-to-real-for-planning": "Sim-to-real para planejamento",
  // perception
  "sensors-overview": "Visão geral de sensores",
  "camera-models": "Modelos de câmera",
  "point-clouds": "Nuvens de pontos",
  "feature-detection": "Detecção de características",
  "filtering-basics": "Fundamentos de filtragem",
  // state-estimation
  "bayes-filter": "Filtro de Bayes",
  "kalman-filter": "Filtro de Kalman",
  "extended-kalman-filter": "Filtro de Kalman estendido",
  "particle-filter": "Filtro de partículas",
  // slam
  localization: "Localização",
  mapping: "Mapeamento",
  "graph-slam": "Graph SLAM",
  "loop-closure": "Fechamento de loop",
  // manipulation
  "grasping-basics": "Fundamentos de preensão",
  "motion-primitives": "Primitivas de movimento",
  // mobile-robots
  "differential-drive": "Tração diferencial",
  odometry: "Odometria",
  "local-planning": "Planejamento local",
};

export function localizedAreaTitle(
  slug: string,
  enTitle: string,
  locale: Locale,
): string {
  return locale === "pt" ? (areaTitlesPt[slug] ?? enTitle) : enTitle;
}

export function localizedLessonTitle(
  slug: string,
  enTitle: string,
  locale: Locale,
): string {
  return locale === "pt" ? (lessonTitlesPt[slug] ?? enTitle) : enTitle;
}
