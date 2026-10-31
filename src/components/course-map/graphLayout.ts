import type { Chapter, LessonRef, Part } from "@/lib/curriculum";

// Layout of the prerequisite graph: one horizontal band per part (course
// order), split into one lane per chapter, and one column per prerequisite
// depth (the longest chain of prerequisites behind a lesson, over the whole
// course). Every edge therefore points rightwards, from a prerequisite to a
// lesson that needs it.

export const GRAPH = {
  nodeW: 140,
  nodeH: 34,
  colW: 160,
  rowH: 42,
  /** height of the part label line at the top of each band */
  labelH: 26,
  /** height of the chapter label line at the top of each lane (bands with several lanes) */
  laneLabelH: 18,
  bandGap: 14,
  padX: 12,
  padY: 10,
} as const;

export interface GraphNode {
  lesson: LessonRef;
  part: Part;
  chapter: Chapter;
  depth: number;
  /** row inside the node's (band, depth) column */
  row: number;
  /** shown only as a prerequisite of the focused part */
  external: boolean;
  /** top-left corner */
  x: number;
  y: number;
}

export interface GraphBand {
  part: Part;
  y: number;
  height: number;
}

export interface GraphLane {
  part: Part;
  chapter: Chapter;
  y: number;
  height: number;
  /** false when the lane is its band's only lane (no chapter label drawn) */
  labelled: boolean;
}

export interface GraphLayout {
  nodes: GraphNode[];
  /** prerequisite → lesson */
  edges: { from: string; to: string }[];
  bands: GraphBand[];
  lanes: GraphLane[];
  width: number;
  height: number;
}

/**
 * Longest prerequisite chain behind each lesson (0 = no prerequisites).
 * Prerequisites outside `lessons` are ignored. Throws on a cycle.
 */
export function lessonDepths(lessons: LessonRef[]): Map<string, number> {
  const bySlug = new Map(lessons.map((l) => [l.slug, l]));
  const depth = new Map<string, number>();
  const visiting = new Set<string>();

  const visit = (slug: string): number => {
    const known = depth.get(slug);
    if (known !== undefined) return known;
    if (visiting.has(slug)) throw new Error(`prerequisite cycle through "${slug}"`);
    visiting.add(slug);
    let d = 0;
    for (const p of bySlug.get(slug)?.prerequisites ?? []) {
      if (bySlug.has(p)) d = Math.max(d, visit(p) + 1);
    }
    visiting.delete(slug);
    depth.set(slug, d);
    return d;
  };

  for (const l of lessons) visit(l.slug);
  return depth;
}

/**
 * Lay out the whole course, or only `focus`: that part's lessons plus their
 * direct prerequisites from other parts (`external`), each in its own part's
 * band. Depths are always global, shifted so the leftmost shown column is 0.
 */
export function layoutGraph(parts: Part[], focus?: Part): GraphLayout {
  const entries = parts.flatMap((part) =>
    part.chapters.flatMap((chapter) => chapter.lessons.map((lesson) => ({ lesson, part, chapter }))),
  );
  const depths = lessonDepths(entries.map((e) => e.lesson));

  let shown = entries;
  if (focus) {
    const own = new Set(entries.filter((e) => e.part === focus).map((e) => e.lesson.slug));
    const needed = new Set(own);
    for (const e of entries) if (own.has(e.lesson.slug)) e.lesson.prerequisites.forEach((p) => needed.add(p));
    shown = entries.filter((e) => needed.has(e.lesson.slug));
  }
  const shownDepths = shown.map((e) => depths.get(e.lesson.slug)!);
  const minDepth = Math.min(...shownDepths);
  const maxDepth = Math.max(...shownDepths);

  const nodes: GraphNode[] = [];
  const bands: GraphBand[] = [];
  const lanes: GraphLane[] = [];
  let y = GRAPH.padY;

  for (const part of parts) {
    const chapters = part.chapters.filter((c) => shown.some((e) => e.chapter === c));
    if (chapters.length === 0) continue;
    const labelled = chapters.length > 1;
    const bandY = y;
    y += GRAPH.labelH;
    for (const chapter of chapters) {
      const laneY = y;
      const top = laneY + (labelled ? GRAPH.laneLabelH : 0);
      const rowsAtDepth = new Map<number, number>();
      for (const { lesson } of shown.filter((e) => e.chapter === chapter)) {
        const d = depths.get(lesson.slug)!;
        const row = rowsAtDepth.get(d) ?? 0;
        rowsAtDepth.set(d, row + 1);
        nodes.push({
          lesson,
          part,
          chapter,
          depth: d,
          row,
          external: focus !== undefined && part !== focus,
          x: GRAPH.padX + (d - minDepth) * GRAPH.colW,
          y: top + row * GRAPH.rowH,
        });
      }
      y = top + Math.max(...rowsAtDepth.values()) * GRAPH.rowH;
      lanes.push({ part, chapter, y: laneY, height: y - laneY, labelled });
    }
    bands.push({ part, y: bandY, height: y - bandY });
    y += GRAPH.bandGap;
  }

  const placed = new Set(nodes.map((n) => n.lesson.slug));
  const edges = nodes.flatMap((n) =>
    n.lesson.prerequisites.filter((p) => placed.has(p)).map((p) => ({ from: p, to: n.lesson.slug })),
  );

  return {
    nodes,
    edges,
    bands,
    lanes,
    width: GRAPH.padX * 2 + (maxDepth - minDepth) * GRAPH.colW + GRAPH.nodeW,
    height: y - GRAPH.bandGap + GRAPH.padY,
  };
}

/** Every lesson `slug` builds on, transitively (not including itself). */
export function ancestors(slug: string, edges: { from: string; to: string }[]): Set<string> {
  const into = new Map<string, string[]>();
  for (const { from, to } of edges) (into.get(to) ?? into.set(to, []).get(to)!).push(from);
  const seen = new Set<string>();
  const stack = [...(into.get(slug) ?? [])];
  while (stack.length) {
    const s = stack.pop()!;
    if (seen.has(s)) continue;
    seen.add(s);
    stack.push(...(into.get(s) ?? []));
  }
  return seen;
}
