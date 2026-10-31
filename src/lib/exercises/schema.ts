import { z } from "zod";
import type { ExerciseSet } from "./types";

// Runtime validation of exercise data files. The registry validates every set
// when it loads, so a malformed exercise fails the build (and the tests) with
// a message naming the exercise and the field.

const text = z.object({ en: z.string().trim().min(1), pt: z.string().trim().min(1) });
const fn = z.custom<(...args: never[]) => unknown>((v) => typeof v === "function", "expected a function");
const tolerance = z
  .object({ abs: z.number().nonnegative().optional(), rel: z.number().nonnegative().optional() })
  .refine((t) => (t.abs ?? 0) > 0 || (t.rel ?? 0) > 0, "tolerance needs abs > 0 or rel > 0");

const base = {
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "kebab-case id"),
  status: z.enum(["draft", "published"]),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  variants: z.number().int().min(1).max(20).optional(),
  params: fn.optional(),
  statement: text,
  hints: z.array(text).optional(),
  solution: text,
  verify: fn.optional(),
};

const option = z.object({ id: z.string().min(1), text, correct: z.boolean().optional(), feedback: text });
const gap = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("numeric"), solve: fn, tolerance, unit: z.string().optional() }),
  z.object({
    kind: z.literal("choice"),
    options: z.union([z.array(z.string().min(1)).min(2), z.object({ en: z.array(z.string()).min(2), pt: z.array(z.string()).min(2) })]),
    correct: z.number().int().nonnegative(),
  }),
]);

export const exerciseSchema = z.discriminatedUnion("kind", [
  z.object({ ...base, kind: z.literal("numeric"), solve: fn, tolerance, unit: z.string().optional(), verify: fn }),
  z.object({
    ...base,
    kind: z.literal("mcq"),
    options: z.union([z.array(option).min(2), fn]),
    shuffle: z.boolean().optional(),
  }),
  z.object({
    ...base,
    kind: z.literal("symbolic"),
    variables: z.array(z.string().regex(/^[A-Za-z]\w*$/)).min(1),
    domain: z.record(z.string(), z.tuple([z.number(), z.number()])),
    solve: fn,
    evaluate: fn,
    tolerance,
  }),
  z.object({
    ...base,
    kind: z.literal("order"),
    steps: z.array(z.object({ id: z.string().min(1), text })).min(2),
  }),
  z.object({
    ...base,
    kind: z.literal("wrong-step"),
    steps: z
      .array(z.object({ id: z.string().min(1), text, wrong: z.boolean().optional(), feedback: text }))
      .min(2)
      .refine((s) => s.filter((x) => x.wrong).length === 1, "exactly one step must be wrong"),
  }),
  z.object({ ...base, kind: z.literal("gaps"), template: text, gaps: z.record(z.string(), gap), verify: fn }),
]);

export const exerciseSetSchema = z.object({ lesson: z.string().min(1), exercises: z.array(exerciseSchema) });

/** Validate a set, throwing a readable error that names the lesson and exercise. */
export function validateSet(set: ExerciseSet): ExerciseSet {
  const result = exerciseSetSchema.safeParse(set);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue.path.map(String).join(".");
    const at = typeof issue.path[1] === "number" ? ` (${set.exercises[issue.path[1]]?.id ?? "?"})` : "";
    throw new Error(`invalid exercise in lesson "${set.lesson}"${at} at ${path}: ${issue.message}`);
  }
  return set;
}
