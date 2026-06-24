import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonLayout } from "@/components/lesson/LessonLayout";
import {
  getArea,
  getLesson,
  getPrerequisites,
  getAdjacentLessons,
} from "@/lib/curriculum";
import { loadLesson } from "@/lib/content";
import { getLocale } from "@/lib/i18n/server";

type Params = { area: string; slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { area, slug } = await params;
  if (!getLesson(area, slug)) return {};
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
  // Only lessons registered in the curriculum exist.
  if (!getLesson(area, slug)) notFound();

  const mod = await loadLesson(area, slug, await getLocale());
  if (!mod) notFound();

  const { default: Content, frontmatter } = mod;
  const areaTitle = getArea(area)?.title;
  const lessonRef = getLesson(area, slug);

  return (
    <LessonLayout
      frontmatter={frontmatter}
      areaTitle={areaTitle}
      difficulty={lessonRef?.difficulty}
      prerequisites={getPrerequisites(slug)}
      adjacent={getAdjacentLessons(area, slug)}
    >
      <Content />
    </LessonLayout>
  );
}
