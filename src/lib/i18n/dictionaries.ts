import type { Locale } from "./config";

export interface Dictionary {
  nav: {
    skipToContent: string;
    curriculum: string;
    lessonsComingSoon: string;
    toggleNav: string;
    relatedCourses: string;
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
    relatedCourses: "Related courses",
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
      "An interactive guide to robotics! I  try to cover all topics regarding the field of robotics and focus on the path planning, my master's line of research. This website is essentially a collection of notes I took while studying each topic, along with visualizations that helped me better understand the concepts.",
    calloutTitle: "Early skeleton",
    calloutBody:
      "The curriculum is still being drafted. Browse the areas in the sidebar, or follow the suggested learning path below.",
    roadmapTitle: "Suggested learning path",
    roadmapSubtitle:
      "How the areas build on each other. Feel free to pick any to start.",
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
    relatedCourses: "Cursos relacionados",
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
      "Um guia interativo de robótica! Procuro cobrir todos os tópicos da área de robótica, com foco em planejamento de trajetórias, minha linha de pesquisa no mestrado. Este site é essencialmente uma coletânea das anotações que fiz ao estudar cada tópico, junto com as visualizações que me ajudaram a entender melhor os conceitos.",
    calloutTitle: "Esqueleto inicial",
    calloutBody:
      "O currículo ainda está sendo redigido. Navegue pelas áreas na barra lateral ou siga o caminho de estudo sugerido abaixo.",
    roadmapTitle: "Caminho de estudo sugerido",
    roadmapSubtitle:
      "Como as áreas se constroem umas sobre as outras. Fique à vontade para começar por qualquer uma.",
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
