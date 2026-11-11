import { validateSet } from "./schema";
import type { ExerciseDef, ExerciseSet } from "./types";
import jacobians from "../../../content/kinematics/jacobians.exercises";

// Every exercise data file, validated when this module loads (a malformed
// exercise fails the build). Register a new content/<area>/<slug>.exercises.ts
// here; src/lib/exercises/exercises.test.ts fails if one is missing.
export const exerciseSets: ExerciseSet[] = [jacobians].map(validateSet);

const byId = new Map<string, { def: ExerciseDef; lesson: string }>();
for (const set of exerciseSets) {
  for (const def of set.exercises) {
    if (byId.has(def.id)) throw new Error(`duplicate exercise id "${def.id}"`);
    byId.set(def.id, { def, lesson: set.lesson });
  }
}

export function getExercise(id: string): ExerciseDef | undefined {
  return byId.get(id)?.def;
}

export function getExerciseLesson(id: string): string | undefined {
  return byId.get(id)?.lesson;
}

/**
 * Drafts render only on the dev server. In production they are skipped on the
 * server, so their text and answers never reach the HTML or the browser.
 */
export function isExerciseVisible(def: ExerciseDef, dev = process.env.NODE_ENV === "development"): boolean {
  return dev || def.status === "published";
}
