import type { ReactNode } from "react";
import Link from "next/link";
import type { Difficulty, LessonWithArea } from "@/lib/curriculum";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localizedAreaTitle, localizedLessonTitle } from "@/lib/i18n/titles";

export interface LessonFrontmatter {
  title: string;
  area: string;
  slug: string;
  order: number;
  summary?: string;
  status: "draft" | "in-progress" | "published";
}

const DIFFICULTY_DOT: Record<Difficulty, string> = {
  intro: "bg-success",
  core: "bg-accent",
  advanced: "bg-warning",
};

/**
 * Wraps an MDX lesson body: a header rendered from front-matter (title +
 * optional summary) plus structural metadata sourced from the curriculum
 * (status, difficulty, linked prerequisites), then the lesson prose, then
 * prev/next navigation. Empty author fields stay empty (Golden rule 1).
 */
export async function LessonLayout({
  frontmatter,
  areaTitle,
  difficulty,
  prerequisites = [],
  adjacent = {},
  children,
}: {
  frontmatter: LessonFrontmatter;
  areaTitle?: string;
  difficulty?: Difficulty;
  prerequisites?: LessonWithArea[];
  adjacent?: { prev?: LessonWithArea; next?: LessonWithArea };
  children: ReactNode;
}) {
  const { title, summary, status, area } = frontmatter;
  const { prev, next } = adjacent;
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <article className="lesson-prose">
      <header className="mb-8 border-b border-border pb-6">
        {areaTitle && (
          <p className="mb-2 text-sm font-medium tracking-wide text-accent uppercase">
            {localizedAreaTitle(area, areaTitle, locale)}
          </p>
        )}
        <h1 className="text-[2rem] leading-tight font-semibold">{title}</h1>

        {summary && <p className="mt-3 text-lg text-muted">{summary}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-surface-2 px-2.5 py-1 font-medium tracking-wide text-muted uppercase">
            {t.badge[status]}
          </span>
          {difficulty && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 font-medium text-foreground">
              <span className={`h-2 w-2 rounded-full ${DIFFICULTY_DOT[difficulty]}`} />
              {t.difficulty[difficulty]}
            </span>
          )}
          {prerequisites.length > 0 && (
            <span className="text-muted">
              {t.lesson.prerequisites}:{" "}
              {prerequisites.map((p, i) => (
                <span key={p.slug}>
                  <Link
                    href={`/lessons/${p.area}/${p.slug}`}
                    className="text-accent underline underline-offset-2"
                  >
                    {localizedLessonTitle(p.slug, p.title, locale)}
                  </Link>
                  {i < prerequisites.length - 1 ? ", " : ""}
                </span>
              ))}
            </span>
          )}
        </div>
      </header>

      {children}

      {(prev || next) && (
        <nav
          aria-label={t.lesson.lessonNavigation}
          className="mt-12 flex items-stretch justify-between gap-4 border-t border-border pt-6"
        >
          {prev ? (
            <Link
              href={`/lessons/${prev.area}/${prev.slug}`}
              className="group flex max-w-[48%] flex-col rounded-lg border border-border px-4 py-3 hover:bg-surface-2"
            >
              <span className="text-xs text-muted">← {t.lesson.previous}</span>
              <span className="mt-0.5 text-sm font-medium text-foreground group-hover:text-accent">
                {localizedLessonTitle(prev.slug, prev.title, locale)}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={`/lessons/${next.area}/${next.slug}`}
              className="group ml-auto flex max-w-[48%] flex-col rounded-lg border border-border px-4 py-3 text-right hover:bg-surface-2"
            >
              <span className="text-xs text-muted">{t.lesson.next} →</span>
              <span className="mt-0.5 text-sm font-medium text-foreground group-hover:text-accent">
                {localizedLessonTitle(next.slug, next.title, locale)}
              </span>
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}
