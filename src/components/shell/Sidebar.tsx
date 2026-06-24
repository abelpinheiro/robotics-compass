"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { curriculum } from "@/lib/curriculum";
import { useSidebar } from "./sidebar-context";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { localizedAreaTitle, localizedLessonTitle } from "@/lib/i18n/titles";

const STORAGE_KEY = "rc-collapsed-areas";

// Tiny external store for the persisted set of collapsed areas. Using
// useSyncExternalStore keeps it hydration-safe (server snapshot = none
// collapsed) without setting state inside an effect.
const listeners = new Set<() => void>();
function readStore(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}
function writeStore(value: string) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/**
 * Curriculum navigation, grouped by area in taxonomy order, read from
 * `src/lib/curriculum.ts`. Each area is a collapsible section (collapsed set
 * persisted to localStorage; the current lesson's area is always shown). The
 * current lesson is marked with `aria-current="page"`. On small screens the
 * whole nav collapses behind the header toggle as an overlay drawer; on md+ it
 * is a sticky left column.
 */
export function Sidebar() {
  const { open, close } = useSidebar();
  const { locale, t } = useLocale();
  const pathname = usePathname();

  const raw = useSyncExternalStore(subscribe, readStore, () => "[]");
  const collapsed = useMemo(
    () => new Set<string>(JSON.parse(raw) as string[]),
    [raw],
  );

  const toggleArea = (slug: string) => {
    const next = new Set(collapsed);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    writeStore(JSON.stringify([...next]));
  };

  const currentArea = pathname.startsWith("/lessons/")
    ? pathname.split("/")[2]
    : undefined;

  const asideClass = open
    ? "fixed top-14 bottom-0 left-0 z-40 w-72 max-w-[85vw] overflow-y-auto border-r border-border bg-surface p-4 shadow-xl md:sticky md:top-14 md:z-auto md:block md:h-[calc(100dvh-3.5rem)] md:w-64 md:max-w-none md:shrink-0 md:shadow-none"
    : "hidden md:sticky md:top-14 md:block md:h-[calc(100dvh-3.5rem)] md:w-64 md:shrink-0 md:overflow-y-auto border-r border-border bg-surface p-4";

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed top-14 right-0 bottom-0 left-0 z-30 bg-black/30 md:hidden"
          aria-hidden="true"
          onClick={close}
        />
      )}

      <aside id="curriculum-nav" className={asideClass}>
        <nav aria-label="Curriculum" className="text-sm">
          <ul className="space-y-3">
            {curriculum.map((area) => {
              const isOpen =
                !collapsed.has(area.slug) || area.slug === currentArea;
              const listId = `area-${area.slug}-list`;
              return (
                <li key={area.slug}>
                  <button
                    type="button"
                    id={`area-${area.slug}`}
                    onClick={() => toggleArea(area.slug)}
                    aria-expanded={isOpen}
                    aria-controls={listId}
                    className="flex w-full items-center justify-between gap-2 rounded-md py-1 text-left font-serif text-[0.8125rem] font-semibold tracking-wide text-muted uppercase hover:text-foreground"
                  >
                    <span>{localizedAreaTitle(area.slug, area.title, locale)}</span>
                    <Chevron open={isOpen} />
                  </button>
                  {isOpen && (
                    <ul
                      id={listId}
                      aria-labelledby={`area-${area.slug}`}
                      className="mt-1 space-y-0.5"
                    >
                      {area.lessons.map((lesson) => {
                        const href = `/lessons/${area.slug}/${lesson.slug}`;
                        const current = pathname === href;
                        return (
                          <li key={lesson.slug}>
                            <Link
                              href={href}
                              aria-current={current ? "page" : undefined}
                              onClick={close}
                              className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 transition-colors ${
                                current
                                  ? "bg-accent-weak font-medium text-accent"
                                  : "text-muted hover:bg-surface-2 hover:text-foreground"
                              }`}
                            >
                              <span>
                                {localizedLessonTitle(
                                  lesson.slug,
                                  lesson.title,
                                  locale,
                                )}
                              </span>
                              {lesson.status === "draft" && (
                                <span className="rounded-sm bg-surface-2 px-1.5 py-0.5 text-[0.625rem] font-medium tracking-wide text-muted uppercase">
                                  {t.badge.draft}
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
