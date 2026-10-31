import type { Metadata } from "next";
import { toLocale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/routing";
import { courseMapStrings } from "@/components/course-map/strings";
import { CourseMapHeader } from "@/components/course-map/CourseMapHeader";
import { GraphView } from "@/components/course-map/GraphView";

type Params = Promise<{ lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const locale = toLocale((await params).lang);
  const s = courseMapStrings[locale];
  return {
    title: `${s.graph} · ${s.title}`,
    description: s.intro,
    alternates: localeAlternates(locale, "/course-map/graph"),
  };
}

export default async function CourseMapGraphPage({ params }: { params: Params }) {
  const locale = toLocale((await params).lang);
  return (
    <div>
      <CourseMapHeader locale={locale} view="graph" />
      <GraphView locale={locale} />
    </div>
  );
}
