import type { ReactNode } from "react";

export interface LessonFrontmatter {
  title: string;
  area: string;
  slug: string;
  order: number;
  summary?: string;
  difficulty?: string;
  prerequisites?: string[];
  status: "draft" | "in-progress" | "published";
}

/**
 * Wraps an MDX lesson body: a header rendered from front-matter (title +
 * optional summary/meta) followed by the lesson prose at a comfortable reading
 * measure with the academic typography scale (h1 32 here, h2/h3 via
 * `.lesson-prose` in globals.css).
 *
 * Empty author fields (summary/difficulty/prerequisites) are simply not
 * rendered — they stay empty until the human fills them (Golden rule 1).
 */
export function LessonLayout({
  frontmatter,
  areaTitle,
  children,
}: {
  frontmatter: LessonFrontmatter;
  areaTitle?: string;
  children: ReactNode;
}) {
  const { title, summary, difficulty, prerequisites, status } = frontmatter;

  return (
    <article className="lesson-prose">
      <header className="mb-8 border-b border-border pb-6">
        {areaTitle && (
          <p className="mb-2 text-sm font-medium tracking-wide text-accent uppercase">
            {areaTitle}
          </p>
        )}
        <h1 className="text-[2rem] leading-tight font-semibold">{title}</h1>

        {summary && (
          <p className="mt-3 text-lg text-muted">{summary}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <StatusBadge status={status} />
          {difficulty && (
            <span className="rounded-full bg-surface-2 px-2.5 py-1 font-medium text-muted">
              {difficulty}
            </span>
          )}
          {prerequisites && prerequisites.length > 0 && (
            <span className="text-faint">
              Prerequisites: {prerequisites.join(", ")}
            </span>
          )}
        </div>
      </header>

      {children}
    </article>
  );
}

function StatusBadge({ status }: { status: LessonFrontmatter["status"] }) {
  const label = status.replace("-", " ");
  const tone =
    status === "published"
      ? "bg-success/15 text-success"
      : status === "in-progress"
        ? "bg-warning/15 text-warning"
        : "bg-surface-2 text-faint";
  return (
    <span
      className={`rounded-full px-2.5 py-1 font-medium tracking-wide uppercase ${tone}`}
    >
      {label}
    </span>
  );
}
