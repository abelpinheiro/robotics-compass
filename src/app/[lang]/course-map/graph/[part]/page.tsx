import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { curriculum } from "@/lib/curriculum";
import { toLocale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/routing";
import { courseMapStrings } from "@/components/course-map/strings";
import { partLabel } from "@/components/course-map/labels";
import { CourseMapHeader } from "@/components/course-map/CourseMapHeader";
import { GraphView } from "@/components/course-map/GraphView";

type Params = Promise<{ lang: string; part: string }>;

// One static graph page per part and locale; unknown parts are a 404 (rendered
// inside the site layout by notFound() below).
export function generateStaticParams() {
  return curriculum.map((p) => ({ part: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, part: slug } = await params;
  const locale = toLocale(lang);
  const s = courseMapStrings[locale];
  const part = curriculum.find((p) => p.slug === slug);
  return {
    title: `${part ? partLabel(part, locale) : s.graph} · ${s.title}`,
    description: s.intro,
    alternates: localeAlternates(locale, `/course-map/graph/${slug}`),
  };
}

export default async function CourseMapPartGraphPage({ params }: { params: Params }) {
  const { lang, part: slug } = await params;
  const locale = toLocale(lang);
  const focus = curriculum.find((p) => p.slug === slug);
  if (!focus) notFound();
  return (
    <div>
      <CourseMapHeader locale={locale} view="graph" />
      <GraphView locale={locale} focus={focus} />
    </div>
  );
}
