import type { ReactNode } from "react";
import Link from "next/link";
import type { Difficulty, LessonRef, LessonStatus } from "@/lib/curriculum";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/routing";
import { Connections } from "./Connections";
import { localizedLessonTitle } from "@/lib/i18n/titles";

// Front-matter is for content the author writes (title, summary). Structural
// metadata — status, difficulty, prerequisites — lives in src/lib/curriculum.ts
// (the single source of truth) and is passed in as props.
export interface LessonFrontmatter {
  title: string;
  area: string;
  slug: string;
  order: number;
  summary?: string;
  /** optional internal paths (written without a locale) or URLs for "See also" */
  seeAlso?: string[];
}

const DIFFICULTY_DOT: Record<Difficulty, string> = {
  intro: "bg-success",
  core: "bg-accent",
  advanced: "bg-warning",
};

/**
 * Wraps an MDX lesson body: a header rendered from front-matter (title +
 * optional summary) plus structural metadata sourced from the curriculum
 * (chapter, status, difficulty, linked prerequisites), then the lesson prose,
 * then prev/next navigation. Empty author fields stay empty (Golden rule 1).
 */
export function LessonLayout({
  locale,
  slug,
  frontmatter,
  chapterLabel,
  status,
  difficulty,
  prerequisites = [],
  adjacent = {},
  children,
}: {
  locale: Locale;
  /** the lesson's slug in curriculum.ts (drives Connections) */
  slug: string;
  frontmatter: LessonFrontmatter;
  /** localized "Chapter 4 · …" label shown above the title */
  chapterLabel?: string;
  status: LessonStatus;
  difficulty?: Difficulty;
  prerequisites?: LessonRef[];
  adjacent?: { prev?: LessonRef; next?: LessonRef };
  children: ReactNode;
}) {
  const { title, summary } = frontmatter;
  const { prev, next } = adjacent;
  const t = getDictionary(locale);
  const lessonHref = (l: LessonRef) => localePath(locale, `/lessons/${l.area}/${l.slug}`);

  return (
    <article className="lesson-prose">
      <header className="mb-8 border-b border-border pb-6">
        {chapterLabel && (
          <p className="mb-2 text-sm font-medium tracking-wide text-accent uppercase">
            {chapterLabel}
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
                    href={lessonHref(p)}
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

      <Connections slug={slug} locale={locale} seeAlso={frontmatter.seeAlso} />

      {(prev || next) && (
        <nav
          aria-label={t.lesson.lessonNavigation}
          className="mt-12 flex items-stretch justify-between gap-4 border-t border-border pt-6"
        >
          {prev ? (
            <Link
              href={lessonHref(prev)}
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
              href={lessonHref(next)}
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
