import Link from "next/link";
import { getStudyLevels, type Difficulty } from "@/lib/curriculum";

const DIFFICULTY_DOT: Record<Difficulty, string> = {
  intro: "bg-success",
  core: "bg-accent",
  advanced: "bg-warning",
};

/**
 * A recommended study order derived from the prerequisite graph: lessons are
 * grouped into steps by their longest prerequisite chain (Step 1 = no
 * prerequisites), so each step only depends on earlier ones.
 */
export function StudyRoadmap() {
  const levels = getStudyLevels();

  return (
    <section aria-labelledby="study-roadmap-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id="study-roadmap-heading" className="font-serif text-2xl font-semibold">
          Suggested learning path
        </h2>
        <ul className="flex items-center gap-3 text-xs text-muted">
          {(["intro", "core", "advanced"] as Difficulty[]).map((d) => (
            <li key={d} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${DIFFICULTY_DOT[d]}`} />
              {d}
            </li>
          ))}
        </ul>
      </div>

      <ol className="space-y-5">
        {levels.map((lessons, i) => (
          <li key={i} className="flex gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-muted"
            >
              {i + 1}
            </span>
            <ul className="flex flex-wrap gap-2">
              {lessons.map((lesson) => (
                <li key={`${lesson.area}/${lesson.slug}`}>
                  <Link
                    href={`/lessons/${lesson.area}/${lesson.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-surface-2 hover:text-accent"
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${DIFFICULTY_DOT[lesson.difficulty]}`}
                    />
                    {lesson.title}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
