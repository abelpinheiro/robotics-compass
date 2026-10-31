// Answer checking, shared by the browser (ExerciseRunner) and the tests. Pure
// functions over the serializable answer data built on the server: nothing
// here needs the exercise definition or its reference solution code.

export interface Tolerance {
  /** absolute tolerance */
  abs?: number;
  /** relative tolerance, as a fraction of |reference| */
  rel?: number;
}

/**
 * Parse a number typed by a reader: accepts a decimal comma or point,
 * scientific notation and surrounding spaces ("0,5", " -1.2e-3 "). Returns
 * null for anything else (including thousands separators or units).
 */
export function parseNumber(input: string): number | null {
  const s = input.trim().replace(/\s+/g, "").replace(",", ".");
  if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(s)) return null;
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
}

/** |value − reference| within max(abs, rel·|reference|). */
export function withinTolerance(value: number, reference: number, tol: Tolerance): boolean {
  const allowed = Math.max(tol.abs ?? 0, (tol.rel ?? 0) * Math.abs(reference));
  return Math.abs(value - reference) <= allowed;
}

export type CheckResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "wrong"; detail?: string };

export function checkNumeric(input: string, answer: { value: number; tolerance: Tolerance }): CheckResult {
  const v = parseNumber(input);
  if (v === null) return { ok: false, reason: "invalid" };
  return withinTolerance(v, answer.value, answer.tolerance) ? { ok: true } : { ok: false, reason: "wrong" };
}

/** Evaluates a compiled expression for a scope of variable values. */
export type Evaluator = (scope: Record<string, number>) => number;

/**
 * Symbolic answers are checked numerically: the reader's expression is
 * evaluated at the sample points the server chose, and every value must match
 * the reference values. `compile` turns the input into an evaluator (mathjs in
 * the browser and in tests) and throws on a syntax error.
 */
export function checkSymbolic(
  input: string,
  answer: { variables: string[]; points: Record<string, number>[]; values: number[]; tolerance: Tolerance },
  compile: (expression: string) => Evaluator,
): CheckResult {
  if (input.trim() === "") return { ok: false, reason: "invalid" };
  let evaluate: Evaluator;
  try {
    evaluate = compile(input);
  } catch {
    return { ok: false, reason: "invalid" };
  }
  for (let i = 0; i < answer.points.length; i++) {
    let v: number;
    try {
      v = evaluate(answer.points[i]);
    } catch (e) {
      // e.g. a variable that is not in the scope
      return { ok: false, reason: "invalid", detail: e instanceof Error ? e.message : undefined };
    }
    if (typeof v !== "number" || !Number.isFinite(v)) return { ok: false, reason: "invalid" };
    if (!withinTolerance(v, answer.values[i], answer.tolerance)) return { ok: false, reason: "wrong" };
  }
  return { ok: true };
}

/** Order answers: the reader's sequence of step ids must equal the correct one. */
export function checkOrder(ids: string[], correct: string[]): CheckResult & { inPlace: number } {
  const inPlace = ids.filter((id, i) => id === correct[i]).length;
  return inPlace === correct.length && ids.length === correct.length
    ? { ok: true, inPlace }
    : { ok: false, reason: "wrong", inPlace };
}
