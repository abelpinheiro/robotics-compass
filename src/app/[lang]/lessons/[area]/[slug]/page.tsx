import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonLayout } from "@/components/lesson/LessonLayout";
import {
  getAdjacentLessons,
  getAllLessons,
  getLesson,
  getLessonPlacement,
  getPrerequisites,
  isLessonRoutable,
} from "@/lib/curriculum";
import { loadLesson } from "@/lib/content";
import { partLabel } from "@/components/course-map/labels";
import { toLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localeAlternates } from "@/lib/i18n/routing";

type Params = { lang: string; area: string; slug: string };

// Every routable lesson is generated statically for each locale. Other params
// fall through to notFound() below, so the 404 renders inside the site layout
// in the reader's language. Planned and parked lessons are routable only on
// the dev server.
export function generateStaticParams() {
  return getAllLessons()
    .filter((l) => isLessonRoutable(l))
    .map((l) => ({ area: l.area, slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { lang, area, slug } = await params;
  const lessonRef = getLesson(area, slug);
  if (!lessonRef || !isLessonRoutable(lessonRef)) return {};
  const mod = await loadLesson(area, slug, toLocale(lang));
  if (!mod) return {};
  return {
    title: mod.frontmatter.title,
    description: mod.frontmatter.summary || undefined,
    alternates: localeAlternates(toLocale(lang), `/lessons/${area}/${slug}`),
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { lang, area, slug } = await params;
  // Only lessons registered in the curriculum exist, and planned/parked ones
  // have no page outside the dev server.
  const lessonRef = getLesson(area, slug);
  if (!lessonRef || !isLessonRoutable(lessonRef)) notFound();

  const locale = toLocale(lang);
  const mod = await loadLesson(area, slug, locale);
  if (!mod) notFound();

  const { default: Content, frontmatter } = mod;
  const placement = getLessonPlacement(slug);
  const chapter = placement?.chapter;
  const label =
    chapter?.number !== undefined
      ? `${getDictionary(locale).nav.chapter(chapter.number)} · ${chapter.title[locale]}`
      : placement && partLabel(placement.part, locale);

  return (
    <LessonLayout
      locale={locale}
      frontmatter={frontmatter}
      chapterLabel={label}
      status={lessonRef.status}
      difficulty={lessonRef.difficulty}
      prerequisites={getPrerequisites(slug)}
      adjacent={getAdjacentLessons(area, slug)}
    >
      <Content />
    </LessonLayout>
  );
}
