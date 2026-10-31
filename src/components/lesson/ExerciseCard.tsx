"use client";

import { useId, useState, type ReactNode } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { lessonUiStrings, type ExerciseLevel } from "./strings";

/**
 * The visual exercise block: title, level (L1–L4), statement, progressive
 * hints (one more per click), and a solution behind a toggle. It only
 * presents content; the exercise data, answer checking and seeded parameters
 * come in Phase 4 (an `<Exercise id>` that fills this card, with the answer
 * input in the `answer` slot).
 */
export function ExerciseCard({
  number,
  level,
  statement,
  hints = [],
  solution,
  answer,
}: {
  number?: number;
  level: ExerciseLevel;
  statement: ReactNode;
  hints?: ReactNode[];
  solution?: ReactNode;
  /** answer input + check button (Phase 4) */
  answer?: ReactNode;
}) {
  const { locale } = useLocale();
  const s = lessonUiStrings[locale];
  const [shown, setShown] = useState(0);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const id = useId();
  const titleId = `${id}-title`;
  const solutionId = `${id}-solution`;
  const button =
    "rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-2";

  return (
    <article aria-labelledby={titleId} className="my-6 rounded-card border border-border px-4 py-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={titleId} className="!my-0 font-serif !text-[1.0625rem] font-semibold">
          {s.exercise(number)}
        </h3>
        <span className="rounded-sm bg-surface-2 px-1.5 py-0.5 text-[0.6875rem] font-semibold tracking-wide text-muted uppercase">
          L{level} · {s.level[level]}
        </span>
      </header>

      <div className="mt-2 [&>p:first-child]:!mt-0">{statement}</div>

      {(answer || hints.length > 0 || solution) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {answer}
          {shown < hints.length && (
            <button type="button" className={button} onClick={() => setShown(shown + 1)}>
              {s.nextHint(shown + 1, hints.length)}
            </button>
          )}
          {solution && (
            <button
              type="button"
              className={button}
              aria-expanded={solutionOpen}
              aria-controls={solutionId}
              onClick={() => setSolutionOpen(!solutionOpen)}
            >
              {solutionOpen ? s.hideSolution : s.showSolution}
            </button>
          )}
        </div>
      )}

      <div aria-live="polite">
        {hints.slice(0, shown).map((hint, i) => (
          <div key={i} className="mt-3 rounded-lg bg-surface px-3 py-2 text-[0.9375rem]">
            <span className="font-semibold text-foreground">{s.hint(i + 1)}:</span> {hint}
          </div>
        ))}
      </div>

      {solution && (
        <div
          id={solutionId}
          hidden={!solutionOpen}
          className="mt-3 rounded-lg border-l-4 border-success bg-surface px-3 py-2 text-[0.9375rem]"
        >
          {solution}
        </div>
      )}
    </article>
  );
}
