import type { Locale } from "@/lib/i18n/config";
import type { Tolerance } from "./check";
import type { Rng } from "./random";

// ---------------------------------------------------------------------------
// Authoring: what an exercise data file (content/<area>/<slug>.exercises.ts)
// defines. Text fields are Record<Locale, string> in the small format of
// text.ts ($math$, **bold**, {{param}}); functions (params, solve, verify) run
// only on the server and in tests, never in the browser.
// ---------------------------------------------------------------------------

export type Text = Record<Locale, string>;
export type Level = 1 | 2 | 3 | 4;
export type Params = Record<string, number | string>;

interface Base<P extends Params> {
  /** globally unique, kebab-case; conventionally "<lesson>-<topic>" */
  id: string;
  /** drafts render only on the dev server, never in production builds */
  status: "draft" | "published";
  level: Level;
  /** number of seeded variants (default: 6 with params, 1 without) */
  variants?: number;
  /** seeded parameters of one variant */
  params?: (rng: Rng) => P;
  statement: Text;
  /** progressive hints, revealed one at a time */
  hints?: Text[];
  /** worked solution; numeric exercises may use {{answer}} */
  solution: Text;
  /**
   * Independent check of the reference solution for one variant (e.g. against
   * the kinematics kernel). Throws on a mismatch; run for every variant by the
   * exercise tests. Required for every kind whose answer is computed.
   */
  verify?: (p: P) => void;
}

export interface NumericDef<P extends Params> extends Base<P> {
  kind: "numeric";
  /** reference answer */
  solve: (p: P) => number;
  tolerance: Tolerance;
  /** TeX, e.g. "\\mathrm{m}^2" */
  unit?: string;
  verify: (p: P) => void;
}

export interface ChoiceOption {
  id: string;
  text: Text;
  correct?: boolean;
  /** shown after the reader picks this option: why it is (in)correct */
  feedback: Text;
}

export interface McqDef<P extends Params> extends Base<P> {
  kind: "mcq";
  options: ChoiceOption[] | ((p: P) => ChoiceOption[]);
  /** shuffle the options per variant (default true) */
  shuffle?: boolean;
}

export interface SymbolicDef<P extends Params> extends Base<P> {
  kind: "symbolic";
  /** variable names the reader may use, e.g. ["t1", "t2"] */
  variables: string[];
  /** sampling range of each variable for the numerical comparison */
  domain: Record<string, [number, number]>;
  /** reference expression in mathjs syntax, e.g. "0.8*cos(t1) + 0.5*cos(t1+t2)" */
  solve: (p: P) => string;
  /** independent JS implementation of the same function (checked against `solve`) */
  evaluate: (p: P, vars: Record<string, number>) => number;
  tolerance: Tolerance;
  verify?: (p: P) => void;
}

export interface OrderDef<P extends Params> extends Base<P> {
  kind: "order";
  /** steps in the correct order; shown shuffled */
  steps: { id: string; text: Text }[];
}

export interface WrongStepDef<P extends Params> extends Base<P> {
  kind: "wrong-step";
  /** exactly one step is `wrong` */
  steps: { id: string; text: Text; wrong?: boolean; feedback: Text }[];
}

export type GapDef<P extends Params> =
  | { kind: "numeric"; solve: (p: P) => number; tolerance: Tolerance; unit?: string }
  | { kind: "choice"; options: string[] | Record<Locale, string[]>; correct: number };

export interface GapsDef<P extends Params> extends Base<P> {
  kind: "gaps";
  /** one paragraph with [[gap-id]] markers (after the statement) */
  template: Text;
  gaps: Record<string, GapDef<P>>;
  verify: (p: P) => void;
}

export type ExerciseDef<P extends Params = Params> =
  | NumericDef<P>
  | McqDef<P>
  | SymbolicDef<P>
  | OrderDef<P>
  | WrongStepDef<P>
  | GapsDef<P>;

export type ExerciseKind = ExerciseDef["kind"];

export interface ExerciseSet {
  /** the lesson slug these exercises belong to */
  lesson: string;
  exercises: ExerciseDef[];
}

/** Type helper: infers each exercise's parameter type from its `params`. */
export function exercise<P extends Params>(def: ExerciseDef<P>): ExerciseDef {
  return def as unknown as ExerciseDef;
}

export function defineExercises(lesson: string, exercises: ExerciseDef[]): ExerciseSet {
  return { lesson, exercises };
}

// ---------------------------------------------------------------------------
// Browser: serializable data for one rendered variant (HTML already rendered,
// answers already computed). No functions, no definitions.
// ---------------------------------------------------------------------------

export type ClientAnswer =
  | { kind: "numeric"; value: number; tolerance: Tolerance; unitHtml?: string }
  | { kind: "mcq"; options: { id: string; html: string; feedbackHtml: string; correct: boolean }[] }
  | { kind: "symbolic"; variables: string[]; points: Record<string, number>[]; values: number[]; tolerance: Tolerance }
  | { kind: "order"; items: { id: string; html: string }[]; correct: string[] }
  | { kind: "wrong-step"; steps: { id: string; html: string; feedbackHtml: string }[]; wrong: string }
  | {
      kind: "gaps";
      parts: ({ html: string } | { gap: string })[];
      gaps: Record<
        string,
        | { kind: "numeric"; value: number; tolerance: Tolerance; unitHtml?: string }
        | { kind: "choice"; options: string[]; correct: number }
      >;
    };

export interface ClientVariant {
  statementHtml: string;
  hintsHtml: string[];
  solutionHtml: string;
  answer: ClientAnswer;
}

export interface ClientExercise {
  id: string;
  level: Level;
  draft: boolean;
  variants: ClientVariant[];
}
