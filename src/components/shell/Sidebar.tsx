"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  curriculum,
  getChapterState,
  getLessonPlacement,
  isLessonVisible,
} from "@/lib/curriculum";
import { useSidebar } from "./sidebar-context";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { localizedLessonTitle } from "@/lib/i18n/titles";
import { chapterLabel, hasChapterHeadings } from "@/components/course-map/labels";
import { StatusBadge } from "@/components/course-map/StatusBadge";

const STORAGE_KEY = "rc-collapsed-parts";

// Optional external courses for readers who want to go further (institution
// names are language-neutral, so not part of the translation dictionary).
const COURSES = [
  {
    label: "Hugging Face — Robotics Course",
    href: "https://huggingface.co/learn/robotics-course",
  },
  {
    label: "Univ. of Michigan — Online Robotics",
    href: "https://robotics.umich.edu/academics/courses/online-courses/",
  },
  {
    label: "ETH Zürich — Robot Learning",
    href: "https://cvg.ethz.ch/lectures/Robot-Learning/",
  },
];

// Tiny external store for the persisted set of collapsed parts. Using
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
 * Course navigation read from `src/lib/curriculum.ts`: a link to the course
 * map, then Parts → chapters → visible lessons. Each part is a collapsible
 * section (collapsed set persisted to localStorage; the current lesson's part
 * is always shown). Chapters with nothing visible yet show as "planned" without
 * a link; the parked part is a single line. The current lesson is marked with
 * `aria-current="page"`. On small screens the whole nav collapses behind the
 * header toggle as an overlay drawer; on md+ it is a sticky left column.
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

  const togglePart = (slug: string) => {
    const next = new Set(collapsed);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    writeStore(JSON.stringify([...next]));
  };

  const currentPart = pathname.startsWith("/lessons/")
    ? getLessonPlacement(pathname.split("/")[3] ?? "")?.part.slug
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
        <Link
          href="/course-map"
          onClick={close}
          aria-current={pathname === "/course-map" ? "page" : undefined}
          className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-accent hover:bg-accent-weak"
        >
          <span>{t.nav.courseMap}</span>
          <span aria-hidden="true">→</span>
        </Link>

        <nav aria-label={t.nav.curriculum} className="text-sm">
          <ul className="space-y-3">
            {curriculum.map((part) => {
              const heading = (
                <span>
                  {part.numeral && (
                    <span className="block text-[0.6875rem] font-medium tracking-wide text-accent uppercase">
                      {t.nav.part(part.numeral)}
                    </span>
                  )}
                  <span className="block font-serif text-[0.9375rem] leading-snug font-semibold">
                    {part.title[locale]}
                  </span>
                </span>
              );
              if (part.parked) {
                return (
                  <li key={part.slug} className="flex items-start justify-between gap-2 py-1 text-muted">
                    {heading}
                    <StatusBadge status="parked" label={t.badge.parked} />
                  </li>
                );
              }
              const isOpen = !collapsed.has(part.slug) || part.slug === currentPart;
              const listId = `part-${part.slug}-list`;
              return (
                <li key={part.slug}>
                  <button
                    type="button"
                    id={`part-${part.slug}`}
                    onClick={() => togglePart(part.slug)}
                    aria-expanded={isOpen}
                    aria-controls={listId}
                    className="flex w-full items-start justify-between gap-2 rounded-md py-1 text-left text-foreground hover:text-accent"
                  >
                    {heading}
                    <Chevron open={isOpen} />
                  </button>
                  {isOpen && (
                    <ul
                      id={listId}
                      aria-labelledby={`part-${part.slug}`}
                      className="mt-1 space-y-0.5 border-l-2 border-border pl-2"
                    >
                      {part.chapters.map((chapter) => {
                        const state = getChapterState(chapter, part);
                        const title = chapterLabel(chapter, locale);
                        if (state !== "active") {
                          return (
                            <li
                              key={chapter.slug}
                              className="flex items-center justify-between gap-2 px-1 py-1 text-[0.8125rem] text-muted"
                            >
                              <span>{title}</span>
                              <StatusBadge status="planned" label={t.badge.planned} />
                            </li>
                          );
                        }
                        const lessons = chapter.lessons.filter(isLessonVisible);
                        return (
                          <li key={chapter.slug}>
                            {hasChapterHeadings(part) && (
                              <p className="mt-2 px-1 pb-0.5 text-[0.8125rem] font-semibold text-foreground">
                                {title}
                              </p>
                            )}
                            <ul className="space-y-0.5">
                              {lessons.map((lesson) => {
                                const href = `/lessons/${lesson.area}/${lesson.slug}`;
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
                                      <span>{localizedLessonTitle(lesson.slug, lesson.title, locale)}</span>
                                      {lesson.status === "in-progress" && (
                                        <StatusBadge status="in-progress" label={t.badge["in-progress"]} />
                                      )}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
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

        <div className="mt-6 border-t border-border pt-4">
          <p className="mb-2 font-serif text-[0.8125rem] font-semibold tracking-wide text-muted uppercase">
            {t.nav.relatedCourses}
          </p>
          <ul className="space-y-0.5 text-sm">
            {COURSES.map((course) => (
              <li key={course.href}>
                <a
                  href={course.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                >
                  <span>{course.label}</span>
                  <ExternalLinkIcon />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 text-faint"
    >
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
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
