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
  // interactive (planar arm)
  arm: string;
  jointAngle: (joint: number) => string;
  armHelp: string;
  tipAt: (xy: string) => string;
  targetAt: (xy: string) => string;
  /** separator between the coordinates of a point: "," in English, ";" in Portuguese (decimal comma) */
  coordinateSeparator: string;
  resetArm: string;
  showOnArm: string;
  // Python
  codeLabel: string;
  editorHelp: string;
  runCode: string;
  loadingPython: string;
  running: string;
  resetCode: string;
  pythonUnavailable: string;
  timeLimit: (seconds: number) => string;
  missingFunction: (name: string) => string;
  codeError: string;
  line: (n: number) => string;
  casesPassed: (k: number, n: number) => string;
  testCases: string;
  expected: string;
  got: string;
  wrongShape: string;
  output: string;
  referenceCode: string;
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
    arm: "Planar arm",
    jointAngle: (j) => `Joint ${j} angle`,
    armHelp: "Drag a joint or the tip, or use the sliders (arrow keys).",
    tipAt: (xy) => `tip at ${xy} m`,
    targetAt: (xy) => `target at ${xy} m`,
    coordinateSeparator: ", ",
    resetArm: "Back to the start",
    showOnArm: "Show it on the arm",
    codeLabel: "Python code",
    editorHelp: "Tab indents. To leave the editor with the keyboard, press Esc, then Tab. Ctrl+Enter runs the code.",
    runCode: "Run and check",
    loadingPython: "Loading Python (about 15 MB, first time only)…",
    running: "Running…",
    resetCode: "Restore the starting code",
    pythonUnavailable: "Could not load Python. Check your connection and try again.",
    timeLimit: (sec) => `The code ran for more than ${sec} s and was stopped. Is there an infinite loop?`,
    missingFunction: (name) => `Your code does not define a function named ${name}.`,
    codeError: "Your code raised an error before the function could be called:",
    line: (n) => `line ${n}`,
    casesPassed: (k, n) => `${k} of ${n} test cases pass.`,
    testCases: "Test cases",
    expected: "Expected",
    got: "Got",
    wrongShape: "wrong shape",
    output: "Output",
    referenceCode: "Reference solution (Python)",
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
    arm: "Braço planar",
    jointAngle: (j) => `Ângulo da junta ${j}`,
    armHelp: "Arraste uma junta ou a ponta, ou use os controles deslizantes (setas do teclado).",
    tipAt: (xy) => `ponta em ${xy} m`,
    targetAt: (xy) => `alvo em ${xy} m`,
    coordinateSeparator: "; ",
    resetArm: "Voltar ao início",
    showOnArm: "Mostrar no braço",
    codeLabel: "Código Python",
    editorHelp: "Tab indenta. Para sair do editor pelo teclado, aperte Esc e depois Tab. Ctrl+Enter executa o código.",
    runCode: "Executar e verificar",
    loadingPython: "Carregando o Python (cerca de 15 MB, só na primeira vez)…",
    running: "Executando…",
    resetCode: "Restaurar o código inicial",
    pythonUnavailable: "Não foi possível carregar o Python. Verifique a conexão e tente de novo.",
    timeLimit: (sec) => `O código passou de ${sec} s e foi interrompido. Há um loop infinito?`,
    missingFunction: (name) => `O seu código não define uma função chamada ${name}.`,
    codeError: "O seu código deu erro antes de a função ser chamada:",
    line: (n) => `linha ${n}`,
    casesPassed: (k, n) => `${k} de ${n} casos de teste passam.`,
    testCases: "Casos de teste",
    expected: "Esperado",
    got: "Obtido",
    wrongShape: "formato (shape) errado",
    output: "Saída",
    referenceCode: "Solução de referência (Python)",
  },
};
