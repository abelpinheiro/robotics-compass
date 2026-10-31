import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { StatusBadge } from "@/components/course-map/StatusBadge";
import { lessonConnections, seeAlsoLink, type ResolvedLink } from "./lessonLinks";
import { lessonUiStrings } from "./strings";

/**
 * End-of-lesson connections, rendered for every lesson by LessonLayout: what
 * the lesson builds on and what builds on it (both from the prerequisite graph
 * in curriculum.ts), plus the author's optional `seeAlso` front-matter links.
 */
export function Connections({ slug, locale, seeAlso = [] }: { slug: string; locale: Locale; seeAlso?: string[] }) {
  const s = lessonUiStrings[locale];
  const t = getDictionary(locale);
  const { uses, leadsTo } = lessonConnections(slug, locale);
  const also = seeAlso.map((entry) => seeAlsoLink(entry, locale));
  const rows = [
    { label: s.uses, links: uses },
    { label: s.leadsTo, links: leadsTo },
    { label: s.seeAlso, links: also },
  ].filter((r) => r.links.length > 0);
  if (rows.length === 0) return null;

  const item = (link: ResolvedLink) =>
    link.href ? (
      <Link href={link.href} className="text-accent underline-offset-2 hover:underline">
        {link.label}
      </Link>
    ) : (
      <span className="inline-flex items-center gap-1.5 text-muted">
        {link.label}
        {link.status && <StatusBadge status={link.status} label={t.badge[link.status]} />}
      </span>
    );

  return (
    <section aria-labelledby="connections-heading" className="mt-12 rounded-card border border-border px-5 py-4">
      <h2 id="connections-heading" className="!mt-0 !mb-3 font-serif !text-xl font-semibold">
        {s.connections}
      </h2>
      <dl className="grid grid-cols-1 gap-x-5 gap-y-2 sm:grid-cols-[8rem_1fr]">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="pt-0.5 text-xs font-semibold tracking-wide text-muted uppercase">{row.label}</dt>
            <dd className="!m-0 flex flex-wrap items-center gap-x-2 gap-y-1">
              {row.links.map((link, i) => (
                <span key={`${link.label}-${i}`} className="inline-flex items-center gap-2">
                  {item(link)}
                  {i < row.links.length - 1 && <span aria-hidden="true" className="text-faint">·</span>}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
