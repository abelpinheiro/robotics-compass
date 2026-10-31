import { getDependents, getLessonBySlug, isLessonVisible, type LessonStatus } from "@/lib/curriculum";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath, pathLocale, stripLocale } from "@/lib/i18n/routing";
import { localizedLessonTitle } from "@/lib/i18n/titles";
import { lessonUiStrings } from "./strings";

// Resolution of the links the lesson components show (a proof step's
// prerequisite, the Connections block). Lessons are linked only when they have
// a page; planned ones keep their title and status but no link.

export interface ResolvedLink {
  label: string;
  /** absent for lessons without a page (planned / parked) */
  href?: string;
  status?: LessonStatus;
}

/** A lesson by slug, in the reader's locale. Unknown slugs return undefined. */
export function lessonLink(slug: string, locale: Locale): ResolvedLink | undefined {
  const lesson = getLessonBySlug(slug);
  if (!lesson) return undefined;
  return {
    label: localizedLessonTitle(lesson.slug, lesson.title, locale),
    href: isLessonVisible(lesson) ? localePath(locale, `/lessons/${lesson.area}/${lesson.slug}`) : undefined,
    status: lesson.status,
  };
}

/** What a lesson builds on (its prerequisites) and what builds on it (its dependents). */
export function lessonConnections(slug: string, locale: Locale): { uses: ResolvedLink[]; leadsTo: ResolvedLink[] } {
  const lesson = getLessonBySlug(slug);
  const resolve = (slugs: string[]) =>
    slugs.map((s) => lessonLink(s, locale)).filter((l): l is ResolvedLink => l !== undefined);
  return {
    uses: resolve(lesson?.prerequisites ?? []),
    leadsTo: resolve(getDependents(slug).map((l) => l.slug)),
  };
}

/**
 * An author's "see also" entry from front-matter: an internal path written
 * without a locale (`/lessons/<area>/<slug>`, `/playground`, `/course-map…`)
 * or an external URL.
 */
export function seeAlsoLink(entry: string, locale: Locale): ResolvedLink {
  if (/^https?:\/\//.test(entry)) {
    const url = new URL(entry);
    return { label: `${url.hostname}${url.pathname === "/" ? "" : url.pathname}`, href: entry };
  }
  const path = pathLocale(entry) ? stripLocale(entry) : entry;
  const lesson = path.match(/^\/lessons\/[^/]+\/([^/?#]+)/);
  if (lesson) return lessonLink(lesson[1], locale) ?? { label: path };
  if (path.startsWith("/playground")) return { label: lessonUiStrings[locale].playground, href: localePath(locale, path) };
  if (path.startsWith("/course-map")) return { label: getDictionary(locale).nav.courseMap, href: localePath(locale, path) };
  return { label: path, href: localePath(locale, path) };
}
