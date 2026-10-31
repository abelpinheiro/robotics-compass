import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  curriculum,
  getAdjacentLessons,
  getAllLessons,
  getChapterState,
  getLessonBySlug,
  isLessonRoutable,
  isLessonVisible,
} from "./curriculum";
import { lessonTitlesPt } from "./i18n/titles";

const CONTENT = fileURLToPath(new URL("../../content", import.meta.url));

/** Every content/<area>/<file>.mdx on disk. */
function contentFiles(): { area: string; file: string }[] {
  return readdirSync(CONTENT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) =>
      readdirSync(`${CONTENT}/${d.name}`)
        .filter((f) => f.endsWith(".mdx"))
        .map((file) => ({ area: d.name, file })),
    );
}

describe("course map (curriculum.ts)", () => {
  const lessons = getAllLessons();

  it("has globally unique lesson slugs", () => {
    const slugs = lessons.map((l) => l.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("registers every MDX file under its own folder", () => {
    for (const { area, file } of contentFiles()) {
      const slug = file.replace(/(\.[a-z]{2})?\.mdx$/, "");
      expect(getLessonBySlug(slug)?.area, `content/${area}/${file}`).toBe(area);
      if (file !== `${slug}.mdx`) expect(existsSync(`${CONTENT}/${area}/${slug}.mdx`), file).toBe(true);
    }
  });

  it("has an MDX file for every visible lesson", () => {
    for (const l of lessons.filter(isLessonVisible)) {
      expect(existsSync(`${CONTENT}/${l.area}/${l.slug}.mdx`), l.slug).toBe(true);
    }
  });

  it("references only existing prerequisites, with no cycles", () => {
    for (const l of lessons) {
      for (const p of l.prerequisites) expect(getLessonBySlug(p), `${l.slug} → ${p}`).toBeDefined();
    }
    // Kahn's algorithm: every lesson can be ordered after its prerequisites iff there is no cycle.
    const pending = new Map(lessons.map((l) => [l.slug, l.prerequisites.length]));
    const ready = lessons.filter((l) => l.prerequisites.length === 0).map((l) => l.slug);
    let ordered = 0;
    while (ready.length) {
      const done = ready.pop()!;
      ordered++;
      for (const l of lessons) {
        if (!l.prerequisites.includes(done)) continue;
        const left = pending.get(l.slug)! - 1;
        pending.set(l.slug, left);
        if (left === 0) ready.push(l.slug);
      }
    }
    expect(ordered).toBe(lessons.length);
  });

  it("marks every lesson of the parked part as parked, and no other lesson", () => {
    for (const part of curriculum) {
      for (const chapter of part.chapters) {
        for (const l of chapter.lessons) expect(l.status === "parked", l.slug).toBe(!!part.parked);
      }
    }
  });

  it("numbers chapters 1…N in reading order; parked and case-study chapters are unnumbered", () => {
    const numbered = curriculum.flatMap((p) => p.chapters).filter((c) => c.number !== undefined);
    expect(numbered.map((c) => c.number)).toEqual(numbered.map((_, i) => i + 1));
    for (const part of curriculum) {
      if (part.parked || !part.numeral) {
        for (const c of part.chapters) expect(c.number, c.slug).toBeUndefined();
      }
    }
  });

  it("has a Portuguese title for every lesson", () => {
    for (const l of lessons) expect(lessonTitlesPt[l.slug], l.slug).toBeTruthy();
  });

  it("routes planned and parked lessons only on the dev server", () => {
    for (const l of lessons) {
      expect(isLessonRoutable(l, false), l.slug).toBe(l.status === "published" || l.status === "in-progress");
      expect(isLessonRoutable(l, true), l.slug).toBe(true);
    }
  });

  it("links prev/next between visible lessons in course order", () => {
    expect(getAdjacentLessons("kinematics", "jacobians")).toMatchObject({
      prev: { slug: "velocity-kinematics" },
      next: { slug: "newton-euler" },
    });
    // newton-euler → (planned chapters skipped) → mdps → ur20
    expect(getAdjacentLessons("dynamics", "newton-euler").next?.slug).toBe("mdps");
    expect(getAdjacentLessons("reinforcement-learning", "mdps").next?.slug).toBe("ur20");
    expect(getAdjacentLessons("dynamics", "lagrangian-dynamics")).toEqual({});
  });

  it("shows a chapter as planned until one of its lessons is visible", () => {
    for (const part of curriculum) {
      for (const c of part.chapters) {
        const expected = part.parked ? "parked" : c.lessons.some(isLessonVisible) ? "active" : "planned";
        expect(getChapterState(c, part), c.slug).toBe(expected);
      }
    }
  });
});
