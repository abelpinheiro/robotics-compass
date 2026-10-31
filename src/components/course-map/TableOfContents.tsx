import Link from "next/link";
import { curriculum, isLessonVisible } from "@/lib/curriculum";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { chapterLabel, hasChapterHeadings, lessonHref, lessonTitle, partLabel } from "./labels";
import { courseMapStrings } from "./strings";
import { StatusBadge } from "./StatusBadge";

/** Course map, table-of-contents view: every part, chapter and lesson with its status. */
export function TableOfContents({ locale }: { locale: Locale }) {
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
                      <Link href={lessonHref(lesson, locale)} className="text-accent underline-offset-2 hover:underline">
                        {lessonTitle(lesson, locale)}
                      </Link>
                    ) : (
                      <span className="text-muted">{lessonTitle(lesson, locale)}</span>
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
