import type { Locale } from "./config";

export interface Dictionary {
  nav: {
    skipToContent: string;
    curriculum: string;
    toggleNav: string;
    relatedCourses: string;
    courseMap: string;
    /** "Part I" */
    part: (numeral: string) => string;
    /** "Chapter 4" */
    chapter: (n: number) => string;
  };
  langToggle: { label: string; en: string; pt: string };
  notFound: { title: string; body: string; home: string };
  badge: { published: string; "in-progress": string; planned: string; parked: string };
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
    outlineTitle: string;
    outlineSubtitle: string;
    openMap: string;
    /** "3 of 18 lessons available" */
    lessonsAvailable: (visible: number, total: number) => string;
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
    toggleNav: "Toggle navigation",
    relatedCourses: "Related courses",
    courseMap: "Course map",
    part: (numeral) => `Part ${numeral}`,
    chapter: (n) => `Chapter ${n}`,
  },
  langToggle: { label: "Change language", en: "EN", pt: "PT" },
  notFound: {
    title: "Page not found",
    body: "This page does not exist, or the lesson is still planned. The course map lists every lesson and what is available.",
    home: "Home",
  },
  badge: { published: "published", "in-progress": "in progress", planned: "planned", parked: "parked" },
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
      "The curriculum is still being drafted. Browse the parts in the sidebar, or open the course map below.",
    outlineTitle: "Course outline",
    outlineSubtitle:
      "Six parts, from spatial descriptions to planning and learning. The course map lists every chapter and the prerequisite graph.",
    openMap: "Open the course map",
    lessonsAvailable: (visible, total) =>
      total === 0
        ? "No lessons yet"
        : `${visible} of ${total} ${total === 1 ? "lesson" : "lessons"} available`,
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
    toggleNav: "Alternar navegação",
    relatedCourses: "Cursos relacionados",
    courseMap: "Mapa do curso",
    part: (numeral) => `Parte ${numeral}`,
    chapter: (n) => `Capítulo ${n}`,
  },
  langToggle: { label: "Mudar idioma", en: "EN", pt: "PT" },
  notFound: {
    title: "Página não encontrada",
    body: "Esta página não existe, ou a lição ainda está planejada. O mapa do curso lista todas as lições e o que já está disponível.",
    home: "Início",
  },
  badge: { published: "publicado", "in-progress": "em progresso", planned: "planejado", parked: "estacionado" },
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
      "O currículo ainda está sendo redigido. Navegue pelas partes na barra lateral ou abra o mapa do curso abaixo.",
    outlineTitle: "Estrutura do curso",
    outlineSubtitle:
      "Seis partes, das descrições espaciais ao planejamento e aprendizado. O mapa do curso mostra todos os capítulos e o grafo de pré-requisitos.",
    openMap: "Abrir o mapa do curso",
    lessonsAvailable: (visible, total) =>
      total === 0
        ? "Ainda sem lições"
        : `${visible} de ${total} ${total === 1 ? "lição disponível" : "lições disponíveis"}`,
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
