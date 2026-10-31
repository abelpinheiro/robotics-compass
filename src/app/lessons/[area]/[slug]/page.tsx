import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonLayout } from "@/components/lesson/LessonLayout";
import {
  getAdjacentLessons,
  getLesson,
  getLessonPlacement,
  getPrerequisites,
  isLessonRoutable,
} from "@/lib/curriculum";
import { partLabel } from "@/components/course-map/labels";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadLesson } from "@/lib/content";
import { getLocale } from "@/lib/i18n/server";

type Params = { area: string; slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { area, slug } = await params;
  const lessonRef = getLesson(area, slug);
  if (!lessonRef || !isLessonRoutable(lessonRef)) return {};
  const mod = await loadLesson(area, slug, await getLocale());
  if (!mod) return {};
  return {
    title: mod.frontmatter.title,
    description: mod.frontmatter.summary || undefined,
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { area, slug } = await params;
  // Only lessons registered in the curriculum exist, and planned/parked ones
  // have no page outside the dev server.
  const lessonRef = getLesson(area, slug);
  if (!lessonRef || !isLessonRoutable(lessonRef)) notFound();

  const locale = await getLocale();
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
