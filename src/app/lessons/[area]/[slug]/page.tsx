import type { Metadata } from "next";
import { LessonLayout } from "@/components/lesson/LessonLayout";
import {
  getArea,
  getAllLessons,
  getLesson,
  getPrerequisites,
  getAdjacentLessons,
} from "@/lib/curriculum";
import { loadLesson } from "@/lib/content";

// Only pre-generated lessons exist; unknown area/slug → 404 automatically.
export const dynamicParams = false;

type Params = { area: string; slug: string };

export function generateStaticParams(): Params[] {
  return getAllLessons().map((lesson) => ({
    area: lesson.area,
    slug: lesson.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { area, slug } = await params;
  const { frontmatter } = await loadLesson(area, slug);
  return {
    title: frontmatter.title,
    description: frontmatter.summary || undefined,
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { area, slug } = await params;
  const { default: Content, frontmatter } = await loadLesson(area, slug);
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
