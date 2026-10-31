import Link from "next/link";
import { curriculum, isLessonVisible } from "@/lib/curriculum";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/routing";
import { StatusBadge } from "@/components/course-map/StatusBadge";
import { hasChapterHeadings } from "@/components/course-map/labels";

/**
 * Home-page outline of the course: one card per part (numeral, title, its
 * chapters and how many lessons are available), each linking to that part in
 * the course map, plus a link to the full map.
 */
export function CourseOutline({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);

  return (
    <section aria-labelledby="course-outline-heading">
      <h2 id="course-outline-heading" className="mb-1 font-serif text-2xl font-semibold">
        {t.home.outlineTitle}
      </h2>
      <p className="mb-4 text-sm text-muted">{t.home.outlineSubtitle}</p>

      <ul className="grid gap-3 sm:grid-cols-2">
        {curriculum.map((part) => {
          const lessons = part.chapters.flatMap((c) => c.lessons);
          const visible = lessons.filter(isLessonVisible).length;
          return (
            <li key={part.slug}>
              <Link
                href={localePath(locale, `/course-map#part-${part.slug}`)}
                className="flex h-full flex-col rounded-card border border-border bg-surface p-4 transition-colors hover:border-accent hover:bg-accent-weak"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium tracking-wide text-accent uppercase">
                    {part.numeral ? t.nav.part(part.numeral) : " "}
                  </span>
                  {part.parked && <StatusBadge status="parked" label={t.badge.parked} />}
                </span>
                <span className="mt-1 font-serif text-[1.0625rem] leading-snug font-semibold text-foreground">
                  {part.title[locale]}
                </span>
                {hasChapterHeadings(part) && (
                  <span className="mt-2 text-sm text-muted">
                    {part.chapters.map((c) => c.title[locale]).join(" · ")}
                  </span>
                )}
                {!part.parked && (
                  <span className="mt-auto pt-3 text-xs text-muted">
                    {t.home.lessonsAvailable(visible, lessons.length)}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <Link
        href={localePath(locale, "/course-map")}
        className="mt-4 inline-flex items-center gap-1 font-medium text-accent underline-offset-2 hover:underline"
      >
        {t.home.openMap} <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
