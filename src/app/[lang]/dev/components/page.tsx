import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { toLocale } from "@/lib/i18n/config";
import { Connections } from "@/components/lesson/Connections";
import Gallery from "./gallery.mdx";

export const metadata: Metadata = { title: "Lesson components", robots: { index: false } };

/**
 * Dev-only gallery of the lesson template v2 components (pnpm dev →
 * /<locale>/dev/components), rendered through real MDX with placeholder text.
 * In production builds it is a 404.
 */
export default async function ComponentGallery({ params }: { params: Promise<{ lang: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const locale = toLocale((await params).lang);
  return (
    <article className="lesson-prose">
      <h1 className="text-[2rem] leading-tight font-semibold">Lesson components (dev)</h1>
      <Gallery />
      <Connections slug="jacobians" locale={locale} seeAlso={["/playground", "/lessons/case-studies/ur20"]} />
    </article>
  );
}
