import type { Locale } from "./config";

export interface Dictionary {
  nav: {
    skipToContent: string;
    curriculum: string;
    lessonsComingSoon: string;
    toggleNav: string;
  };
  langToggle: { label: string; en: string; pt: string };
  badge: { draft: string; "in-progress": string; published: string };
  difficulty: { intro: string; core: string; advanced: string };
  lesson: {
    prerequisites: string;
    previous: string;
    next: string;
    lessonNavigation: string;
  };
  home: {
    kicker: string;
    tagline: string;
    calloutTitle: string;
    calloutBody: string;
    roadmapTitle: string;
    roadmapSubtitle: string;
    roadmapAria: string;
  };
  viz: {
    textDescription: string;
    loading: string;
    run: string;
    pause: string;
    runAgain: string;
    step: string;
    reset: string;
    resetPoint: string;
    clearWalls: string;
    speed: string;
    heuristic: string;
    angle: string;
    roll: string;
    pitch: string;
    yaw: string;
    gamma: string;
    noise: string;
    epsilon: string;
    alpha: string;
    axisAzimuth: string;
    axisElevation: string;
    valueIteration: string;
    qLearning: string;
  };
}

const en: Dictionary = {
  nav: {
    skipToContent: "Skip to content",
    curriculum: "Curriculum",
    lessonsComingSoon: "Lessons coming soon",
    toggleNav: "Toggle navigation",
  },
  langToggle: { label: "Change language", en: "EN", pt: "PT" },
  badge: { draft: "draft", "in-progress": "in progress", published: "published" },
  difficulty: { intro: "intro", core: "core", advanced: "advanced" },
  lesson: {
    prerequisites: "Prerequisites",
    previous: "Previous",
    next: "Next",
    lessonNavigation: "Lesson navigation",
  },
  home: {
    kicker: "Robotics, visualized",
    tagline:
      "An interactive, visualization-first guide to robotics — broad across the field and deepest on path planning. Every topic carries a live, manipulable visualization.",
    calloutTitle: "Early skeleton",
    calloutBody:
      "The curriculum is being authored as draft lessons. Browse the areas in the sidebar, or follow the suggested learning path below — it is ordered by each topic's prerequisites.",
    roadmapTitle: "Suggested learning path",
    roadmapSubtitle:
      "How the areas build on each other — pick any to start.",
    roadmapAria:
      "Curriculum dependency map: areas connected by prerequisite arrows.",
  },
  viz: {
    textDescription: "Text description",
    loading: "Loading visualization…",
    run: "Run",
    pause: "Pause",
    runAgain: "Run again",
    step: "Step",
    reset: "Reset",
    resetPoint: "Reset point",
    clearWalls: "Clear walls",
    speed: "Speed",
    heuristic: "Heuristic",
    angle: "Angle θ",
    roll: "Roll (x)",
    pitch: "Pitch (y)",
    yaw: "Yaw (z)",
    gamma: "γ",
    noise: "Noise",
    epsilon: "ε",
    alpha: "α",
    axisAzimuth: "Axis azimuth",
    axisElevation: "Axis elevation",
    valueIteration: "Value iteration",
    qLearning: "Q-learning",
  },
};

const pt: Dictionary = {
  nav: {
    skipToContent: "Pular para o conteúdo",
    curriculum: "Currículo",
    lessonsComingSoon: "Lições em breve",
    toggleNav: "Alternar navegação",
  },
  langToggle: { label: "Mudar idioma", en: "EN", pt: "PT" },
  badge: { draft: "rascunho", "in-progress": "em progresso", published: "publicado" },
  difficulty: { intro: "introdução", core: "intermediário", advanced: "avançado" },
  lesson: {
    prerequisites: "Pré-requisitos",
    previous: "Anterior",
    next: "Próximo",
    lessonNavigation: "Navegação da lição",
  },
  home: {
    kicker: "Robótica, visualizada",
    tagline:
      "Um guia interativo de robótica, com visualizações em primeiro lugar — amplo no campo e mais profundo em planejamento de trajetórias. Cada tópico traz uma visualização viva e manipulável.",
    calloutTitle: "Esqueleto inicial",
    calloutBody:
      "O currículo está sendo escrito como lições em rascunho. Navegue pelas áreas na barra lateral, ou siga o caminho de estudo sugerido abaixo — ordenado pelos pré-requisitos de cada tópico.",
    roadmapTitle: "Caminho de estudo sugerido",
    roadmapSubtitle:
      "Como as áreas se constroem umas sobre as outras — escolha uma para começar.",
    roadmapAria:
      "Mapa de dependências do currículo: áreas conectadas por setas de pré-requisito.",
  },
  viz: {
    textDescription: "Descrição em texto",
    loading: "Carregando visualização…",
    run: "Executar",
    pause: "Pausar",
    runAgain: "Executar de novo",
    step: "Passo",
    reset: "Reiniciar",
    resetPoint: "Reiniciar ponto",
    clearWalls: "Limpar paredes",
    speed: "Velocidade",
    heuristic: "Heurística",
    angle: "Ângulo θ",
    roll: "Rolagem (x)",
    pitch: "Arfagem (y)",
    yaw: "Guinada (z)",
    gamma: "γ",
    noise: "Ruído",
    epsilon: "ε",
    alpha: "α",
    axisAzimuth: "Azimute do eixo",
    axisElevation: "Elevação do eixo",
    valueIteration: "Iteração de valor",
    qLearning: "Q-learning",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { en, pt };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
