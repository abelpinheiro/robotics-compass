import type { Locale } from "@/lib/i18n/config";
import { buildClientExercise } from "@/lib/exercises/build";
import { getExercise, isExerciseVisible } from "@/lib/exercises/registry";
import { ExerciseRunner } from "./ExerciseRunner";
import { exerciseStrings } from "./strings";

/**
 * `<Exercise id="…" />` in a lesson's MDX. Server component: looks the
 * exercise up in the registry, builds its variants (rendered text and answer
 * data) and hands only that data to the client runner. Drafts render on the
 * dev server only; an unknown id shows a notice on the dev server and nothing
 * in production. The lesson page supplies `locale`.
 */
export function Exercise({ id, number, locale }: { id: string; number?: number; locale: Locale }) {
  const dev = process.env.NODE_ENV === "development";
  const def = getExercise(id);
  if (!def) {
    return dev ? (
      <p className="my-6 rounded-lg border border-dashed border-warning px-3 py-2 text-sm text-foreground">
        {exerciseStrings[locale].unknownExercise(id)}
      </p>
    ) : null;
  }
  if (!isExerciseVisible(def, dev)) return null;
  return <ExerciseRunner exercise={buildClientExercise(def, locale)} number={number} />;
}
