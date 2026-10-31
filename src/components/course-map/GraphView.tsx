import Link from "next/link";
import { curriculum, getLessonBySlug, isLessonVisible, type LessonRef, type Part } from "@/lib/curriculum";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/routing";
import { chapterLabel, lessonHref, lessonTitle, partLabel } from "./labels";
import { courseMapStrings } from "./strings";
import { layoutGraph } from "./graphLayout";
import { PrerequisiteGraph } from "./PrerequisiteGraph";

/**
 * Course map, graph view: the whole course, or one part (`focus`) with its
 * direct prerequisites from other parts. Part filter links go to
 * /course-map/graph and /course-map/graph/<part>.
 */
export function GraphView({ locale, focus }: { locale: Locale; focus?: Part }) {
  const t = getDictionary(locale);
  const s = courseMapStrings[locale];
  const layout = layoutGraph(curriculum, focus);

  const describe = (l: LessonRef) => {
    const prereqs = l.prerequisites.map((p) => getLessonBySlug(p)).filter((p): p is LessonRef => !!p);
    const needs = prereqs.length
      ? `${s.requires}: ${prereqs.map((p) => lessonTitle(p, locale)).join(", ")}`
      : s.noPrerequisites;
    return `${lessonTitle(l, locale)} (${t.badge[l.status]}) — ${needs}`;
  };

  const nodes = layout.nodes.map((n) => ({
    slug: n.lesson.slug,
    label: lessonTitle(n.lesson, locale),
    status: n.lesson.status,
    href: isLessonVisible(n.lesson) ? lessonHref(n.lesson, locale) : undefined,
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
        <Link href={localePath(locale, "/course-map/graph")} aria-current={!focus ? "page" : undefined} className={pill(!focus)}>
          {s.allParts}
        </Link>
        {curriculum.map((p) => (
          <Link
            key={p.slug}
            href={localePath(locale, `/course-map/graph/${p.slug}`)}
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
