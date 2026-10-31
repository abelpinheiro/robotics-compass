import type { Locale } from "@/lib/i18n/config";

// UI strings of the lesson components (motivating question, proofs, exercise
// card, connections), in every supported locale (Record<Locale, …> makes a
// missing translation a type error). The lesson text itself is the author's.

export type ExerciseLevel = 1 | 2 | 3 | 4;

export interface LessonUiStrings {
  motivatingQuestion: string;
  whereAnswered: string;
  proof: string;
  why: string;
  expandAll: string;
  collapseAll: string;
  /** "Review:" before a prerequisite link */
  review: string;
  /** "Exercise 2", or "Exercise" without a number */
  exercise: (n?: number) => string;
  level: Record<ExerciseLevel, string>;
  /** "Hint 1 of 3" (button) */
  nextHint: (next: number, total: number) => string;
  /** "Hint 1" (label of a revealed hint) */
  hint: (n: number) => string;
  showSolution: string;
  hideSolution: string;
  connections: string;
  uses: string;
  leadsTo: string;
  seeAlso: string;
  playground: string;
}

export const lessonUiStrings: Record<Locale, LessonUiStrings> = {
  en: {
    motivatingQuestion: "Motivating question",
    whereAnswered: "Where we answer it",
    proof: "Derivation",
    why: "Why?",
    expandAll: 'Expand every "why?"',
    collapseAll: 'Collapse every "why?"',
    review: "Review:",
    exercise: (n) => (n === undefined ? "Exercise" : `Exercise ${n}`),
    level: { 1: "concept", 2: "application", 3: "analysis", 4: "challenge" },
    nextHint: (next, total) => `Hint ${next} of ${total}`,
    hint: (n) => `Hint ${n}`,
    showSolution: "Show solution",
    hideSolution: "Hide solution",
    connections: "Connections",
    uses: "Builds on",
    leadsTo: "Leads to",
    seeAlso: "See also",
    playground: "Playground",
  },
  pt: {
    motivatingQuestion: "Pergunta motivadora",
    whereAnswered: "Onde respondemos",
    proof: "Demonstração",
    why: "Por quê?",
    expandAll: 'Expandir todos os "por quê?"',
    collapseAll: 'Recolher todos os "por quê?"',
    review: "Revise:",
    exercise: (n) => (n === undefined ? "Exercício" : `Exercício ${n}`),
    level: { 1: "conceito", 2: "aplicação", 3: "análise", 4: "desafio" },
    nextHint: (next, total) => `Dica ${next} de ${total}`,
    hint: (n) => `Dica ${n}`,
    showSolution: "Ver solução",
    hideSolution: "Esconder solução",
    connections: "Conexões",
    uses: "Usa",
    leadsTo: "Leva a",
    seeAlso: "Veja também",
    playground: "Playground",
  },
};
