import type { Locale } from "@/lib/i18n/config";
import type { Condition, PyValue, Tolerance } from "./check";
import type { PlanarArmQuantity, PlanarArmSetup } from "./planarArm";
import type { PyArg } from "./python";
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

export interface ConditionDef extends Condition {
  quantity: PlanarArmQuantity;
  /** shown when this condition fails (the first failing one is shown) */
  feedback?: Text;
}

export interface InteractiveDef<P extends Params> extends Base<P> {
  kind: "interactive";
  /** the widget the reader manipulates (lib/exercises/planarArm.ts) */
  widget: "planar-arm";
  setup: (p: P) => PlanarArmSetup;
  /** ranges the widget's quantities must fall in; every one must hold */
  conditions: (p: P) => ConditionDef[];
  /**
   * A reference state that meets the conditions (joint angles in degrees),
   * shown on the widget with the solution. Texts can quote it as
   * {{ref1}}, {{ref2}}, …
   */
  solve: (p: P) => number[];
  verify: (p: P) => void;
}

export interface PythonDef<P extends Params> extends Base<P> {
  kind: "python";
  /** name of the function the reader writes */
  entry: string;
  /** code the editor starts with: imports and the signature, no solution */
  starter: string;
  /** reference implementation: shown with the solution and run by the tests */
  reference: string;
  /** the argument lists the function is called with in one variant */
  cases: (p: P, rng: Rng) => PyArg[][];
  /** expected return value for one case, computed in TypeScript (e.g. by the kernel) */
  solve: (args: PyArg[], p: P) => PyValue;
  /** independent check of `solve` for one case; throws on a mismatch */
  verifyCase: (args: PyArg[], expected: PyValue, p: P) => void;
  tolerance: Tolerance;
}

export type ExerciseDef<P extends Params = Params> =
  | NumericDef<P>
  | McqDef<P>
  | SymbolicDef<P>
  | OrderDef<P>
  | WrongStepDef<P>
  | GapsDef<P>
  | InteractiveDef<P>
  | PythonDef<P>;

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
    }
  | {
      kind: "interactive";
      widget: "planar-arm";
      setup: PlanarArmSetup;
      conditions: (Condition & { feedbackHtml?: string })[];
      reference: number[];
    }
  | {
      kind: "python";
      entry: string;
      starter: string;
      reference: string;
      cases: { args: PyArg[]; expected: PyValue }[];
      tolerance: Tolerance;
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
