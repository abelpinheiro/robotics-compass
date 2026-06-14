"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { curriculum } from "@/lib/curriculum";

/**
 * Curriculum navigation, grouped by area in taxonomy order, read from
 * `src/lib/curriculum.ts`. The current lesson is marked with
 * `aria-current="page"`. On small screens it collapses behind a toggle and
 * opens as an overlay drawer; on md+ it is a sticky left column.
 *
 * Phase 2: areas have no lessons yet, so each area renders as a heading. Phase 3
 * populates lessons and the links become live.
 */
export function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const asideClass = open
    ? "fixed inset-y-0 left-0 z-40 w-72 overflow-y-auto border-r border-border bg-surface p-4 md:sticky md:top-14 md:z-auto md:block md:h-[calc(100dvh-3.5rem)] md:w-64 md:shrink-0"
    : "hidden md:sticky md:top-14 md:block md:h-[calc(100dvh-3.5rem)] md:w-64 md:shrink-0 md:overflow-y-auto border-r border-border bg-surface p-4";

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="curriculum-nav"
        className="fixed bottom-5 left-5 z-50 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium shadow-md md:hidden"
      >
        {open ? "Close" : "Menu"}
      </button>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      <aside id="curriculum-nav" className={asideClass}>
        <nav aria-label="Curriculum" className="text-sm">
          <ul className="space-y-6">
            {curriculum.map((area) => (
              <li key={area.slug}>
                <h2 className="mb-2 font-serif text-[0.8125rem] font-semibold tracking-wide text-faint uppercase">
                  {area.title}
                </h2>
                {area.lessons.length === 0 ? (
                  <p className="text-xs text-faint italic">Lessons coming soon</p>
                ) : (
                  <ul className="space-y-0.5">
                    {area.lessons.map((lesson) => {
                      const href = `/lessons/${area.slug}/${lesson.slug}`;
                      const current = pathname === href;
                      return (
                        <li key={lesson.slug}>
                          <Link
                            href={href}
                            aria-current={current ? "page" : undefined}
                            onClick={() => setOpen(false)}
                            className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 transition-colors ${
                              current
                                ? "bg-accent-weak font-medium text-accent"
                                : "text-muted hover:bg-surface-2 hover:text-foreground"
                            }`}
                          >
                            <span>{lesson.title}</span>
                            {lesson.status === "draft" && (
                              <span className="rounded-sm bg-surface-2 px-1.5 py-0.5 text-[0.625rem] font-medium tracking-wide text-faint uppercase">
                                draft
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
