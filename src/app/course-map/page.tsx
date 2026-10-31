import type { Metadata } from "next";
import Link from "next/link";
import {
  countByStatus,
  curriculum,
  getLessonBySlug,
  isLessonVisible,
  type LessonRef,
  type LessonStatus,
} from "@/lib/curriculum";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { localizedLessonTitle } from "@/lib/i18n/titles";
import { chapterLabel, hasChapterHeadings, partLabel } from "@/components/course-map/labels";
import { courseMapStrings } from "@/components/course-map/strings";
import { StatusBadge } from "@/components/course-map/StatusBadge";
import { layoutGraph } from "@/components/course-map/graphLayout";
import { PrerequisiteGraph } from "@/components/course-map/PrerequisiteGraph";

type SearchParams = { view?: string; part?: string };

export async function generateMetadata(): Promise<Metadata> {
  const s = courseMapStrings[await getLocale()];
  return { title: s.title, description: s.intro };
}

const STATUSES: LessonStatus[] = ["published", "in-progress", "planned", "parked"];

const title = (l: LessonRef, locale: Locale) => localizedLessonTitle(l.slug, l.title, locale);
const href = (l: LessonRef) => `/lessons/${l.area}/${l.slug}`;

/**
 * The course map: every part, chapter and lesson, as a table of contents or as
 * a prerequisite graph (`?view=graph`, optionally `&part=<slug>`). Planned and
 * parked lessons appear here but are never links (they have no page).
 */
export default async function CourseMapPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const s = courseMapStrings[locale];
  const { view, part: partSlug } = await searchParams;
  const isGraph = view === "graph";
  const counts = countByStatus();

  const viewLink = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${
      active ? "bg-accent-weak text-accent" : "text-muted hover:bg-surface-2 hover:text-foreground"
    }`;

  return (
    <div>
      <h1 className="font-serif text-[2rem] leading-tight font-semibold">{s.title}</h1>
      <p className="mt-3 text-lg text-muted">{s.intro}</p>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
        <span className="sr-only">{s.statusLegend}:</span>
        {STATUSES.map((st) => (
          <span key={st} className="inline-flex items-center gap-1.5">
            <StatusBadge status={st} label={t.badge[st]} />
            <span className="tabular-nums">{counts[st]}</span>
          </span>
        ))}
      </div>

      <nav aria-label={s.viewsLabel} className="mt-6 flex gap-1 border-b border-border pb-2">
        <Link href="/course-map" aria-current={!isGraph ? "page" : undefined} className={viewLink(!isGraph)}>
          {s.toc}
        </Link>
        <Link
          href="/course-map?view=graph"
          aria-current={isGraph ? "page" : undefined}
          className={viewLink(isGraph)}
        >
          {s.graph}
        </Link>
      </nav>

      {isGraph ? (
        <GraphView locale={locale} partSlug={partSlug} />
      ) : (
        <TableOfContents locale={locale} />
      )}
    </div>
  );
}

function TableOfContents({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const s = courseMapStrings[locale];
  return (
    <div className="mt-8 space-y-10">
      {curriculum.map((part) => (
        <section key={part.slug} id={`part-${part.slug}`} aria-labelledby={`toc-${part.slug}`} className="scroll-mt-20">
          <h2 id={`toc-${part.slug}`} className="flex flex-wrap items-center gap-3 font-serif text-2xl font-semibold">
            {partLabel(part, locale)}
            {part.parked && <StatusBadge status="parked" label={t.badge.parked} />}
          </h2>
          {part.chapters.map((chapter) => (
            <div key={chapter.slug} className="mt-5">
              {hasChapterHeadings(part) && (
                <h3 className="font-serif text-[1.1875rem] font-semibold">
                  {chapterLabel(chapter, locale)}
                  {chapter.craig && (
                    <span className="ml-2 font-sans text-sm font-normal text-muted">{s.craig(chapter.craig)}</span>
                  )}
                </h3>
              )}
              <ul className="mt-2 space-y-1">
                {chapter.lessons.length === 0 && <li className="text-sm text-muted italic">{s.topicsTbd}</li>}
                {chapter.lessons.map((lesson) => (
                  <li key={lesson.slug} className="flex items-center gap-2">
                    {isLessonVisible(lesson) ? (
                      <Link href={href(lesson)} className="text-accent underline-offset-2 hover:underline">
                        {title(lesson, locale)}
                      </Link>
                    ) : (
                      <span className="text-muted">{title(lesson, locale)}</span>
                    )}
                    {lesson.status !== "published" && !part.parked && (
                      <StatusBadge status={lesson.status} label={t.badge[lesson.status]} />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

function GraphView({ locale, partSlug }: { locale: Locale; partSlug?: string }) {
  const t = getDictionary(locale);
  const s = courseMapStrings[locale];
  const focus = curriculum.find((p) => p.slug === partSlug);
  const layout = layoutGraph(curriculum, focus);

  const describe = (l: LessonRef) => {
    const prereqs = l.prerequisites.map((p) => getLessonBySlug(p)).filter((p): p is LessonRef => !!p);
    const needs = prereqs.length
      ? `${s.requires}: ${prereqs.map((p) => title(p, locale)).join(", ")}`
      : s.noPrerequisites;
    return `${title(l, locale)} (${t.badge[l.status]}) — ${needs}`;
  };

  const nodes = layout.nodes.map((n) => ({
    slug: n.lesson.slug,
    label: title(n.lesson, locale),
    status: n.lesson.status,
    href: isLessonVisible(n.lesson) ? href(n.lesson) : undefined,
    external: n.external,
    x: n.x,
    y: n.y,
    description: describe(n.lesson),
  }));
  const bands = layout.bands.map((b) => ({ key: b.part.slug, label: partLabel(b.part, locale), y: b.y, height: b.height }));
  const lanes = layout.lanes
    .filter((l) => l.labelled)
    .map((l) => ({
      key: l.chapter.slug,
      label: chapterLabel(l.chapter, locale),
      y: l.y,
      first: l.part.chapters.find((c) => layout.lanes.some((x) => x.chapter === c)) === l.chapter,
    }));

  const pill = (active: boolean) =>
    `rounded-full border px-2.5 py-1 text-xs font-medium ${
      active
        ? "border-accent bg-accent-weak text-accent"
        : "border-border text-muted hover:bg-surface-2 hover:text-foreground"
    }`;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={s.partFilterLabel}>
        <span className="mr-1 text-sm text-muted">{s.partFilterLabel}:</span>
        <Link href="/course-map?view=graph" aria-current={!focus ? "page" : undefined} className={pill(!focus)}>
          {s.allParts}
        </Link>
        {curriculum.map((p) => (
          <Link
            key={p.slug}
            href={`/course-map?view=graph&part=${p.slug}`}
            aria-current={focus === p ? "page" : undefined}
            className={pill(focus === p)}
          >
            {p.numeral ? t.nav.part(p.numeral) : p.title[locale]}
          </Link>
        ))}
      </div>

      <p className="mt-3 text-sm text-muted">
        {s.graphHint} {focus ? s.externalNote : s.scrollHint}
      </p>

      {/* Spans the full width of <main> (an inline-size container), not just the reading column. */}
      <figure className="mt-4 ml-[calc(50%-50cqw)] w-[100cqw] overflow-hidden rounded-card border border-border bg-background">
        <div className="overflow-x-auto p-3">
          <PrerequisiteGraph
            nodes={nodes}
            edges={layout.edges}
            bands={bands}
            lanes={lanes}
            width={layout.width}
            height={layout.height}
            ariaLabel={s.graphAria}
          />
        </div>
        <figcaption className="border-t border-border px-4 py-2.5 text-sm text-muted">
          <details>
            <summary className="cursor-pointer text-xs font-medium text-accent">{t.viz.textDescription}</summary>
            <div className="mt-2 space-y-3 text-xs">
              {layout.bands.map((b) => (
                <div key={b.part.slug}>
                  <p className="font-semibold text-foreground">{partLabel(b.part, locale)}</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">
                    {layout.nodes
                      .filter((n) => n.part === b.part)
                      .map((n) => (
                        <li key={n.lesson.slug}>{describe(n.lesson)}</li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        </figcaption>
      </figure>
    </div>
  );
}
