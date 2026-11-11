import type { Locale } from "@/lib/i18n/config";

// UI strings of the exercise runner, in every supported locale
// (Record<Locale, …> makes a missing translation a type error).

export interface ExerciseStrings {
  check: string;
  correct: string;
  incorrect: string;
  invalidNumber: string;
  invalidExpression: (variables: string[]) => string;
  yourAnswer: string;
  expression: string;
  variables: (variables: string[]) => string;
  chooseOption: string;
  chooseWrongStep: string;
  moveUp: (n: number) => string;
  moveDown: (n: number) => string;
  inPlace: (k: number, n: number) => string;
  gap: (n: number) => string;
  gapsWrong: (k: number, n: number) => string;
  anotherVersion: string;
  draft: string;
  loading: string;
  unknownExercise: (id: string) => string;
}

export const exerciseStrings: Record<Locale, ExerciseStrings> = {
  en: {
    check: "Check",
    correct: "Correct!",
    incorrect: "Not yet. Try again, or reveal a hint.",
    invalidNumber: "Type a number (with a decimal point or comma).",
    invalidExpression: (v) => `I could not read that expression. Use ${v.join(", ")}, numbers, + − * / ^, sin, cos and parentheses.`,
    yourAnswer: "Your answer",
    expression: "Expression",
    variables: (v) => `Variables: ${v.join(", ")}`,
    chooseOption: "Choose an option",
    chooseWrongStep: "Choose the wrong step",
    moveUp: (n) => `Move step ${n} up`,
    moveDown: (n) => `Move step ${n} down`,
    inPlace: (k, n) => `${k} of ${n} steps are in the right place.`,
    gap: (n) => `Gap ${n}`,
    gapsWrong: (k, n) => `${k} of ${n} gaps are right.`,
    anotherVersion: "Another version",
    draft: "draft",
    loading: "Checking…",
    unknownExercise: (id) => `Unknown exercise id "${id}" (shown on the dev server only).`,
  },
  pt: {
    check: "Verificar",
    correct: "Correto!",
    incorrect: "Ainda não. Tente de novo ou revele uma dica.",
    invalidNumber: "Digite um número (com vírgula ou ponto decimal).",
    invalidExpression: (v) => `Não consegui ler essa expressão. Use ${v.join(", ")}, números, + − * / ^, sin, cos e parênteses.`,
    yourAnswer: "Sua resposta",
    expression: "Expressão",
    variables: (v) => `Variáveis: ${v.join(", ")}`,
    chooseOption: "Escolha uma opção",
    chooseWrongStep: "Escolha o passo errado",
    moveUp: (n) => `Subir o passo ${n}`,
    moveDown: (n) => `Descer o passo ${n}`,
    inPlace: (k, n) => `${k} de ${n} passos estão no lugar certo.`,
    gap: (n) => `Lacuna ${n}`,
    gapsWrong: (k, n) => `${k} de ${n} lacunas estão certas.`,
    anotherVersion: "Outra versão",
    draft: "rascunho",
    loading: "Verificando…",
    unknownExercise: (id) => `Exercício desconhecido "${id}" (aviso só no servidor de desenvolvimento).`,
  },
};
