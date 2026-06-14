import type { ComponentType } from "react";
import type { LessonFrontmatter } from "@/components/lesson/LessonLayout";

export interface LessonModule {
  /** the compiled MDX body component */
  default: ComponentType;
  /** front-matter exported by remark-mdx-frontmatter */
  frontmatter: LessonFrontmatter;
}

/**
 * Load a lesson's compiled MDX module from content/<area>/<slug>.mdx.
 *
 * The template-literal dynamic import lets the bundler build a context over the
 * content directory so any scaffolded lesson resolves. The route restricts
 * params to known lessons (see generateStaticParams + dynamicParams), so the
 * path is always valid at call time.
 */
export async function loadLesson(
  area: string,
  slug: string,
): Promise<LessonModule> {
  return (await import(`../../content/${area}/${slug}.mdx`)) as LessonModule;
}
