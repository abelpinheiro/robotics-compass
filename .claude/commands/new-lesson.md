---
description: Scaffold a single empty planned lesson (front-matter + empty sections) in its chapter of the course map.
argument-hint: <area> <topic-slug>
---

Create one empty planned lesson for Robotics Compass.

Arguments: `$ARGUMENTS`
- area = `$1` (the content folder / URL segment)
- topic slug = `$2`

Delegate to the **lesson-builder** agent. It must:

1. Validate `$1`/`$2` against the **robotics-curriculum** skill (canonical taxonomy): the lesson
   must already have a slot in a chapter. If it does not, stop and ask — do not invent topics.
2. Create `content/$1/$2.mdx` from the **lesson-template** skill exactly: front-matter with
   `title` (humanized, sentence case), `area: $1`, `slug: $2`, correct `order`, and
   `summary: ""` left empty; the template v2 body (optional motivating-question comment, the
   seven fixed empty sections with their component hints). No `status`, `difficulty`, or
   `prerequisites` in front-matter.
3. Make sure the lesson is registered in its chapter in `src/lib/curriculum.ts` with
   `status: "planned"`, its proposed `difficulty` and `prerequisites` (flag them for the author
   to review), and a PT title in `src/lib/i18n/titles.ts`. Planned lessons render only on the
   dev server; the author publishes by switching the status. Set SEO metadata from the title
   only. Do not create the `.pt.mdx` translation — the author writes it.

Hard rules: **never write educational prose** (Golden rule 1); `status: "planned"` in
`curriculum.ts`; design tokens only for any UI touched. After building, run `pnpm test` (the
course-map integrity tests) and `pnpm build`, and report the exact files created/changed.
