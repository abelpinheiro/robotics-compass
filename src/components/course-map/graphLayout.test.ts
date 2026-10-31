import { describe, expect, it } from "vitest";
import { curriculum, getAllLessons, type LessonRef } from "@/lib/curriculum";
import { GRAPH, ancestors, layoutGraph, lessonDepths } from "./graphLayout";

const lesson = (slug: string, prerequisites: string[] = []): LessonRef => ({
  slug,
  area: "x",
  title: slug,
  status: "planned",
  difficulty: "core",
  prerequisites,
});

describe("lessonDepths", () => {
  it("is the longest prerequisite chain, by hand", () => {
    const d = lessonDepths([
      lesson("a"),
      lesson("b", ["a"]),
      lesson("c", ["a", "b"]),
      lesson("d"),
      lesson("e", ["d", "outside"]), // prerequisites outside the set are ignored
    ]);
    expect(Object.fromEntries(d)).toEqual({ a: 0, b: 1, c: 2, d: 0, e: 1 });
  });

  it("rejects a cycle", () => {
    expect(() => lessonDepths([lesson("a", ["c"]), lesson("b", ["a"]), lesson("c", ["b"])])).toThrow(/cycle/);
  });
});

describe("layoutGraph (whole course)", () => {
  const g = layoutGraph(curriculum);
  const at = new Map(g.nodes.map((n) => [n.lesson.slug, n]));

  it("places every lesson once and draws every prerequisite edge", () => {
    expect(g.nodes.length).toBe(getAllLessons().length);
    const refs = getAllLessons().reduce((sum, l) => sum + l.prerequisites.length, 0);
    expect(g.edges.length).toBe(refs);
  });

  it("points every edge rightwards, from prerequisite to lesson", () => {
    for (const { from, to } of g.edges) expect(at.get(from)!.x, `${from} → ${to}`).toBeLessThan(at.get(to)!.x);
  });

  it("never overlaps two boxes and keeps each box inside its part band and the canvas", () => {
    const cells = new Set(g.nodes.map((n) => `${n.x},${n.y}`));
    expect(cells.size).toBe(g.nodes.length);
    for (const n of g.nodes) {
      const band = g.bands.find((b) => b.part === n.part)!;
      expect(n.y).toBeGreaterThanOrEqual(band.y + GRAPH.labelH);
      expect(n.y + GRAPH.nodeH).toBeLessThanOrEqual(band.y + band.height);
      expect(n.x + GRAPH.nodeW).toBeLessThanOrEqual(g.width);
      expect(n.y + GRAPH.nodeH).toBeLessThanOrEqual(g.height);
    }
  });

  it("puts each box in its chapter's lane, lanes in chapter order inside their band", () => {
    for (const n of g.nodes) {
      const lane = g.lanes.find((l) => l.chapter === n.chapter)!;
      expect(n.y, n.lesson.slug).toBeGreaterThanOrEqual(lane.y + (lane.labelled ? GRAPH.laneLabelH : 0));
      expect(n.y + GRAPH.nodeH, n.lesson.slug).toBeLessThanOrEqual(lane.y + lane.height);
    }
    for (const band of g.bands) {
      const lanes = g.lanes.filter((l) => l.part === band.part);
      expect(lanes.map((l) => l.chapter)).toEqual(band.part.chapters.filter((c) => c.lessons.length > 0));
      for (let i = 1; i < lanes.length; i++) expect(lanes[i].y).toBe(lanes[i - 1].y + lanes[i - 1].height);
    }
  });

  it("orders bands like the parts, without overlap", () => {
    expect(g.bands.map((b) => b.part.slug)).toEqual(curriculum.map((p) => p.slug));
    for (let i = 1; i < g.bands.length; i++) {
      expect(g.bands[i].y).toBeGreaterThanOrEqual(g.bands[i - 1].y + g.bands[i - 1].height);
    }
  });
});

describe("layoutGraph (one part in focus)", () => {
  const part = curriculum.find((p) => p.slug === "kinematics-dynamics")!;
  const g = layoutGraph(curriculum, part);

  it("shows the part plus only its direct prerequisites from other parts", () => {
    const own = part.chapters.flatMap((c) => c.lessons.map((l) => l.slug));
    const external = g.nodes.filter((n) => n.external).map((n) => n.lesson.slug);
    expect(g.nodes.filter((n) => !n.external).map((n) => n.lesson.slug)).toEqual(own);
    // modeling-manipulators needs homogeneous-transforms (Part I); nothing else comes from outside.
    expect(external).toEqual(["homogeneous-transforms"]);
  });

  it("starts at the left edge", () => {
    expect(Math.min(...g.nodes.map((n) => n.x))).toBe(GRAPH.padX);
  });
});

describe("ancestors", () => {
  it("collects every transitive prerequisite", () => {
    const { edges } = layoutGraph(curriculum);
    expect([...ancestors("jacobians", edges)].sort()).toEqual(
      [
        "forward-kinematics",
        "homogeneous-transforms",
        "modeling-manipulators",
        "rotations-2d",
        "rotations-3d",
        "vectors-and-frames",
        "velocity-kinematics",
      ].sort(),
    );
    expect(ancestors("vectors-and-frames", edges).size).toBe(0);
  });
});
