import type { Metadata } from "next";
import { Callout } from "@/components/lesson/Callout";
import { CourseOutline } from "@/components/CourseOutline";
import { toLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localeAlternates } from "@/lib/i18n/routing";

type Params = Promise<{ lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  return { alternates: localeAlternates(toLocale(lang), "/") };
}

export default async function Home({ params }: { params: Params }) {
  const { lang } = await params;
  const locale = toLocale(lang);
  const t = getDictionary(locale);
  return (
    <div>
      <div className="lesson-prose">
        <p className="mb-2 text-sm font-medium tracking-wide text-accent uppercase">
          {t.home.kicker}
        </p>
        <h1 className="text-[2rem] leading-tight font-semibold">
          Robotics Compass
        </h1>
        <p className="mt-3 text-lg text-muted">{t.home.tagline}</p>

        <Callout variant="info" title={t.home.calloutTitle}>
          {t.home.calloutBody}
        </Callout>
      </div>

      <div className="mt-10">
        <CourseOutline locale={locale} />
      </div>
    </div>
  );
}
