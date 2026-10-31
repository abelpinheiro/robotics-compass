import type { MetadataRoute } from "next";
import { getVisibleLessons } from "@/lib/curriculum";
import { SITE_URL } from "@/lib/site";

// Served at /sitemap.xml. Lists the home page, the course map and every
// visible lesson, sourced from the curriculum so new lessons appear automatically.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const lessons: MetadataRoute.Sitemap = getVisibleLessons().map((lesson) => ({
    url: `${SITE_URL}/lessons/${lesson.area}/${lesson.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/course-map`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...lessons,
  ];
}
