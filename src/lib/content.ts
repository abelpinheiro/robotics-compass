import type { ComponentType } from "react";
import type { LessonFrontmatter } from "@/components/lesson/LessonLayout";
import type { Locale } from "@/lib/i18n/config";

export interface LessonModule {
  /** the compiled MDX body component */
  default: ComponentType;
  /** front-matter exported by remark-mdx-frontmatter */
  frontmatter: LessonFrontmatter;
}

/**
 * Load a lesson's compiled MDX module from content/<area>/<slug>.mdx, preferring
 * the locale-specific file content/<area>/<slug>.<locale>.mdx when it exists
 * (e.g. .pt.mdx) and falling back to the default (English) file.
 *
 * Template-literal dynamic imports let the bundler build a context over the
 * content directory. Returns null when neither file exists so the route can 404.
 */
export async function loadLesson(
  area: string,
  slug: string,
  locale: Locale,
): Promise<LessonModule | null> {
  if (locale !== "en") {
    try {
      return (await import(
        `../../content/${area}/${slug}.${locale}.mdx`
      )) as LessonModule;
    } catch {
      // no translation for this lesson yet — fall back to the default below
    }
  }
  try {
    return (await import(`../../content/${area}/${slug}.mdx`)) as LessonModule;
  } catch {
    return null;
  }
}
