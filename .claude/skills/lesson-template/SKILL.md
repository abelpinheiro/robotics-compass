---
name: lesson-template
description: >-
  The canonical empty MDX lesson scaffold for Robotics Compass (template v2) —
  front-matter fields, the fixed set of empty section placeholders (Intuition,
  Formal definition, Visualization, Worked example, Common pitfalls, Exercises,
  Further reading), and the lesson components (MotivatingQuestion, Proof /
  ProofStep / Why, Exercise blocks, automatic Connections). Use whenever
  creating a new lesson. The scaffold MUST stay empty of educational prose —
  the human author fills it in.
---

# Lesson template

Every lesson is one MDX file at `content/<area>/<slug>.mdx`. It ships **empty**: front-matter
plus section headings with empty placeholders. **Never write educational prose** — no
explanations, definitions, examples, or summaries of the concept (Golden rule 1). You set
structural metadata only.

## Front-matter fields

```yaml
---
title: <Humanized topic name, sentence case>   # structural label, e.g. "A* search"
area: <area-slug>                               # from robotics-curriculum
slug: <topic-slug>                              # from robotics-curriculum
order: <1-based index within the area>          # from robotics-curriculum
summary: ""                                     # LEAVE EMPTY — author writes this
# seeAlso:                                      # optional, the author's choice of links:
#   - /playground                               #   internal paths without a locale,
#   - /lessons/case-studies/ur20                #   or full URLs
---
```

Rules:
- `title`, `area`, `slug`, `order` are filled from the curriculum (structural, not prose).
- `summary` is **left empty** for the human — it describes the concept and is the author's call.
- **`status`, `difficulty`, and `prerequisites` live ONLY in `src/lib/curriculum.ts`** (on the
  `LessonRef`, inside its chapter), not in front-matter. `status` controls visibility: `planned`
  lessons appear only in the course map and have no page in production (the dev server renders
  them for preview); `difficulty`/`prerequisites` form the graph that powers prereq links,
  prev/next navigation, and the course-map graph. **To publish a lesson, set `status:
  "in-progress"` or `"published"` on its `LessonRef` in `curriculum.ts`** (not the MDX). New
  lessons start `status: "planned"` there. Existing lessons may still carry an ignored
  `status`/`difficulty`/`prerequisites` front-matter key; the app does not read them.

## Section placeholders (fixed order, empty)

The body is exactly these seven sections — headings in **sentence case**, each followed by an
empty placeholder comment — plus an optional motivating question before the first section.
The comments show the author which component fits where; they render nothing. The
**Visualization** slot is wired later via `/new-viz`, and exercises arrive with Phase 4.

```mdx
{/* TODO(author): optional motivating question, e.g.
<MotivatingQuestion answer="#formal-definition">
…
</MotivatingQuestion>
*/}

## Intuition

{/* TODO(author): write the intuition for this topic. */}

## Formal definition

{/* TODO(author): write the formal definition. A derivation can use
<Proof>
<ProofStep>
$$ … $$
<Why prereq="lesson-slug">…</Why>
</ProofStep>
</Proof>
*/}

## Visualization

{/* TODO(viz): wire the visualization component here via /new-viz. */}

## Worked example

{/* TODO(author): write a worked example. */}

## Common pitfalls

{/* TODO(author): list common pitfalls. */}

## Exercises

{/* TODO(exercises): place <Exercise id="…" /> blocks here. Exercises live in
content/<area>/<slug>.exercises.ts with a reference solution tested by Vitest (Phase 4). */}

## Further reading

{/* TODO(author): add references and further reading. */}
```

## Full scaffold example (shape only)

```mdx
---
title: A* search
area: path-planning
slug: a-star
order: 5
summary: ""
---

{/* TODO(author): optional motivating question … */}

## Intuition

{/* TODO(author): write the intuition for this topic. */}

## Formal definition

{/* TODO(author): write the formal definition. … */}

## Visualization

{/* TODO(viz): wire the visualization component here via /new-viz. */}

## Worked example

{/* TODO(author): write a worked example. */}

## Common pitfalls

{/* TODO(author): list common pitfalls. */}

## Exercises

{/* TODO(exercises): place <Exercise id="…" /> blocks here. … */}

## Further reading

{/* TODO(author): add references and further reading. */}
```

## Lesson components (template v2)

Registered globally in `src/mdx-components.tsx` — no import needed. They are frames only: the
author writes every word inside them (Golden rule 1). UI labels exist in EN and PT
(`src/components/lesson/strings.ts`).

- **`<MotivatingQuestion answer?>`** — the question that opens the lesson, in a highlighted
  box. `answer` optionally links to where it is answered: a section anchor (`#formal-definition`
  — section headings get ids from their text, accents removed) or a path such as
  `/lessons/kinematics/jacobians` (the locale is added automatically).
- **`<Proof title?>` → `<ProofStep>` → `<Why prereq?>`** — a derivation, numbered
  automatically. Each step holds its claim (usually `$$…$$`) and an optional `<Why>` with the
  justification, collapsed behind "Why?". `prereq` (a lesson slug) adds a "Review:" link to
  that lesson (planned lessons show title and status, no link). One button opens or closes
  every "why?". `src/components/lesson/lessonLinks.test.ts` checks that every `prereq` in
  `content/` names an existing lesson.
- **Exercises** — `ExerciseCard` (level L1 concept · L2 application · L3 analysis · L4
  challenge, progressive hints, solution toggle) is the visual block; Phase 4 adds
  `<Exercise id>`, which fills it from the lesson's exercise data file.
- **Connections** — rendered automatically at the end of every lesson by `LessonLayout`:
  "Builds on" (prerequisites) and "Leads to" (dependents) from `curriculum.ts`, plus the
  author's optional `seeAlso` front-matter links. Nothing to place in the MDX.

A dev-only gallery shows every component with placeholder text: `pnpm dev` →
`/en/dev/components` (or `/pt/…`).

The lesson route (`src/app/[lang]/lessons/[area]/[slug]/`, at `/<locale>/lessons/<area>/<slug>`) renders the front-matter into the
LessonLayout header, the body through `mdx-components`, and the Connections block at the end.
Empty sections render as headings with no content — that is intended; they signal the author
where to write.

## Images

Static lesson images live in `public/images/<area>/` and are referenced from the site root,
e.g. `![alt text](/images/<area>/<name>.svg)`. Always include alt text. They are styled
automatically via `.lesson-prose img`. See `public/images/README.md`. For anything interactive,
use a viz component (see `viz-2d` / `viz-3d`) instead of a static image.
