---
name: lesson-template
description: >-
  The canonical empty MDX lesson scaffold for Robotics Compass — front-matter
  fields plus the fixed set of empty section placeholders (Intuition, Formal
  definition, Visualization, Worked example, Common pitfalls, Exercises, Further
  reading). Use whenever creating a new lesson. The scaffold MUST stay empty of
  educational prose — the human author fills it in.
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
difficulty: ""                                  # LEAVE EMPTY — author sets (e.g. intro/core/advanced)
prerequisites: []                               # LEAVE EMPTY — author lists prereq slugs
status: draft                                   # always draft on scaffold
---
```

Rules:
- `title`, `area`, `slug`, `order`, `status` are filled from the curriculum (structural, not
  prose).
- `summary`, `difficulty`, `prerequisites` are **left empty** for the human — these describe
  the concept and are the author's call.
- `status` is always `draft` when scaffolding.

## Section placeholders (fixed order, empty)

The body is exactly these seven sections — headings in **sentence case**, each followed by an
empty author placeholder comment. The **Visualization** section carries an empty component slot
comment (a real viz is wired later via `/new-viz`, not at scaffold time).

```mdx
## Intuition

{/* TODO(author): write the intuition for this topic. */}

## Formal definition

{/* TODO(author): write the formal definition. */}

## Visualization

{/* TODO(viz): wire the visualization component here via /new-viz. */}

## Worked example

{/* TODO(author): write a worked example. */}

## Common pitfalls

{/* TODO(author): list common pitfalls. */}

## Exercises

{/* TODO(author): add exercises. */}

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
difficulty: ""
prerequisites: []
status: draft
---

## Intuition

{/* TODO(author): write the intuition for this topic. */}

## Formal definition

{/* TODO(author): write the formal definition. */}

## Visualization

{/* TODO(viz): wire the visualization component here via /new-viz. */}

## Worked example

{/* TODO(author): write a worked example. */}

## Common pitfalls

{/* TODO(author): list common pitfalls. */}

## Exercises

{/* TODO(author): add exercises. */}

## Further reading

{/* TODO(author): add references and further reading. */}
```

The lesson route (`src/app/lessons/[area]/[slug]/`) renders the front-matter into the
LessonLayout header and the body through `mdx-components`. Empty sections render as headings
with no content — that is intended; they signal the author where to write.
