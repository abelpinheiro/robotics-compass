import type { MetadataRoute } from "next";
import { curriculum, getVisibleLessons } from "@/lib/curriculum";
import { locales } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/routing";
import { SITE_URL } from "@/lib/site";

// Served at /sitemap.xml: every page in every locale (/<locale>/…), each with
// its hreflang alternates, sourced from the curriculum so new lessons appear
// automatically. Planned and parked lessons have no page and are left out.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: { path: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/course-map", priority: 0.8, changeFrequency: "weekly" },
    { path: "/course-map/graph", priority: 0.5, changeFrequency: "weekly" },
    ...curriculum.map((p) => ({ path: `/course-map/graph/${p.slug}`, priority: 0.4, changeFrequency: "weekly" as const })),
    ...getVisibleLessons().map((l) => ({
      path: `/lessons/${l.area}/${l.slug}`,
      priority: 0.7,
      changeFrequency: "monthly" as const,
    })),
  ];

  const absolute = (path: string) => `${SITE_URL}${path}`;
  return pages.flatMap(({ path, priority, changeFrequency }) =>
    locales.map((locale) => {
      const { canonical, languages } = localeAlternates(locale, path);
      return {
        url: absolute(canonical),
        lastModified: now,
        changeFrequency,
        priority,
        alternates: {
          languages: Object.fromEntries(Object.entries(languages).map(([l, p]) => [l, absolute(p)])),
        },
      };
    }),
  );
}
