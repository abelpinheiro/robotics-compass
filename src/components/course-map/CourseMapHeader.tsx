import Link from "next/link";
import { countByStatus, type LessonStatus } from "@/lib/curriculum";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/routing";
import { courseMapStrings } from "./strings";
import { StatusBadge } from "./StatusBadge";

const STATUSES: LessonStatus[] = ["published", "in-progress", "planned", "parked"];

/**
 * Course map header: title, intro, lesson counts by status, and the two view
 * links (table of contents at /course-map, graph at /course-map/graph).
 * Planned and parked lessons appear in the map but are never links.
 */
export function CourseMapHeader({ locale, view }: { locale: Locale; view: "toc" | "graph" }) {
  const t = getDictionary(locale);
  const s = courseMapStrings[locale];
  const counts = countByStatus();
  const isGraph = view === "graph";

  const viewLink = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${
      active ? "bg-accent-weak text-accent" : "text-muted hover:bg-surface-2 hover:text-foreground"
    }`;

  return (
    <>
      <h1 className="font-serif text-[2rem] leading-tight font-semibold">{s.title}</h1>
      <p className="mt-3 text-lg text-muted">{s.intro}</p>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
        <span className="sr-only">{s.statusLegend}:</span>
        {STATUSES.map((st) => (
          <span key={st} className="inline-flex items-center gap-1.5">
            <StatusBadge status={st} label={t.badge[st]} />
            <span className="tabular-nums">{counts[st]}</span>
          </span>
        ))}
      </div>

      <nav aria-label={s.viewsLabel} className="mt-6 flex gap-1 border-b border-border pb-2">
        <Link
          href={localePath(locale, "/course-map")}
          aria-current={!isGraph ? "page" : undefined}
          className={viewLink(!isGraph)}
        >
          {s.toc}
        </Link>
        <Link
          href={localePath(locale, "/course-map/graph")}
          aria-current={isGraph ? "page" : undefined}
          className={viewLink(isGraph)}
        >
          {s.graph}
        </Link>
      </nav>
    </>
  );
}
