/**
 * Canonical navigation / ordering source for Robotics Compass.
 *
 * This MUST mirror the `robotics-curriculum` skill (areas, slugs, order).
 * Changing the taxonomy requires asking the human first (Golden rule 4).
 *
 * Phase 2 establishes the types and the ordered AREA list (needed by the app
 * shell + Sidebar). Phase 3 populates each area's `lessons` and creates the
 * matching `content/<area>/<slug>.mdx` files and the dynamic lesson route.
 */

export type LessonStatus = "draft" | "in-progress" | "published";

export interface LessonRef {
  /** kebab-case topic slug, matches content/<area>/<slug>.mdx */
  slug: string;
  /** humanized, sentence-case display title */
  title: string;
  /** 1-based order within the area */
  order: number;
  status: LessonStatus;
}

export interface Area {
  /** kebab-case area slug, matches content/<area>/ */
  slug: string;
  /** sentence-case display title */
  title: string;
  /** 1-based order within the curriculum */
  order: number;
  lessons: LessonRef[];
}

/**
 * Areas in canonical order. Path planning is intentionally the deepest area.
 * `lessons` are filled in Phase 3.
 */
export const curriculum: Area[] = [
  { slug: "foundations", title: "Foundations", order: 1, lessons: [] },
  { slug: "kinematics", title: "Kinematics", order: 2, lessons: [] },
  { slug: "dynamics", title: "Dynamics", order: 3, lessons: [] },
  { slug: "control", title: "Control", order: 4, lessons: [] },
  { slug: "path-planning", title: "Path planning", order: 5, lessons: [] },
  { slug: "perception", title: "Perception", order: 6, lessons: [] },
  { slug: "state-estimation", title: "State estimation", order: 7, lessons: [] },
  { slug: "slam", title: "SLAM", order: 8, lessons: [] },
  { slug: "manipulation", title: "Manipulation", order: 9, lessons: [] },
  { slug: "mobile-robots", title: "Mobile robots", order: 10, lessons: [] },
];

/** Look up an area by slug. */
export function getArea(slug: string): Area | undefined {
  return curriculum.find((a) => a.slug === slug);
}

/** Look up a single lesson by area + slug. */
export function getLesson(
  areaSlug: string,
  lessonSlug: string,
): LessonRef | undefined {
  return getArea(areaSlug)?.lessons.find((l) => l.slug === lessonSlug);
}

/** Flat list of every lesson with its area, in curriculum order. */
export function getAllLessons(): Array<LessonRef & { area: string }> {
  return curriculum.flatMap((area) =>
    area.lessons.map((lesson) => ({ ...lesson, area: area.slug })),
  );
}
