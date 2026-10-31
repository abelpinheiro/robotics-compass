import type { Locale } from "@/lib/i18n/config";

// UI strings for the course-map page, in every supported locale
// (Record<Locale, …> makes a missing translation a type error).

export interface CourseMapStrings {
  title: string;
  intro: string;
  viewsLabel: string;
  toc: string;
  graph: string;
  statusLegend: string;
  /** "Craig, ch. 5" */
  craig: (chapter: string) => string;
  topicsTbd: string;
  partFilterLabel: string;
  allParts: string;
  graphAria: string;
  graphHint: string;
  scrollHint: string;
  externalNote: string;
  requires: string;
  noPrerequisites: string;
}

export const courseMapStrings: Record<Locale, CourseMapStrings> = {
  en: {
    title: "Course map",
    intro:
      "Every part, chapter and lesson of the course, including what is still planned. Chapters 1–11 follow Craig's Introduction to Robotics; Parts IV and V go beyond it, and Part VI is parked for now.",
    viewsLabel: "Course map views",
    toc: "Table of contents",
    graph: "Prerequisite graph",
    statusLegend: "Lessons by status",
    craig: (chapter) => `Craig, ch. ${chapter}`,
    topicsTbd: "Topics to be defined",
    partFilterLabel: "Show",
    allParts: "All parts",
    graphAria:
      "Prerequisite graph: each lesson is a box, and arrows run from a prerequisite to the lessons that need it.",
    graphHint:
      "Hover or focus a lesson to highlight everything it builds on. Dashed boxes are planned; faded boxes are parked.",
    scrollHint: "The graph is wider than the screen: scroll sideways to see all of it.",
    externalNote: "Lighter boxes come from other parts: they are the direct prerequisites of this part.",
    requires: "requires",
    noPrerequisites: "no prerequisites",
  },
  pt: {
    title: "Mapa do curso",
    intro:
      "Todas as partes, capítulos e lições do curso, incluindo o que ainda está planejado. Os capítulos 1–11 seguem o Introduction to Robotics do Craig; as Partes IV e V vão além dele, e a Parte VI está estacionada por enquanto.",
    viewsLabel: "Visualizações do mapa do curso",
    toc: "Sumário",
    graph: "Grafo de pré-requisitos",
    statusLegend: "Lições por status",
    craig: (chapter) => `Craig, cap. ${chapter}`,
    topicsTbd: "Tópicos a definir",
    partFilterLabel: "Mostrar",
    allParts: "Todas as partes",
    graphAria:
      "Grafo de pré-requisitos: cada lição é uma caixa, e as setas vão de um pré-requisito às lições que dependem dele.",
    graphHint:
      "Passe o mouse ou o foco sobre uma lição para destacar tudo em que ela se apoia. Caixas tracejadas estão planejadas; caixas esmaecidas estão estacionadas.",
    scrollHint: "O grafo é mais largo que a tela: role para o lado para vê-lo inteiro.",
    externalNote: "As caixas mais claras vêm de outras partes: são os pré-requisitos diretos desta parte.",
    requires: "requer",
    noPrerequisites: "sem pré-requisitos",
  },
};
