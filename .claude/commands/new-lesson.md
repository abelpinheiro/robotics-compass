---
description: Scaffold a single empty draft lesson (front-matter + empty sections) and wire it into nav.
argument-hint: <area> <topic-slug>
---

Create one empty draft lesson for Robotics Compass.

Arguments: `$ARGUMENTS`
- area = `$1`
- topic slug = `$2`

Delegate to the **lesson-builder** agent. It must:

1. Validate `$1`/`$2` against the **robotics-curriculum** skill (canonical taxonomy). If the
   area or topic is not in the taxonomy, stop and ask — do not invent topics.
2. Create `content/$1/$2.mdx` from the **lesson-template** skill exactly: front-matter with
   `title` (humanized, sentence case), `area: $1`, `slug: $2`, correct `order`, `status: draft`;
   `summary`, `difficulty`, `prerequisites` left empty; the seven fixed empty sections.
3. Register the lesson in `src/lib/curriculum.ts` so the Sidebar shows it in the right area and
   order, and ensure the dynamic lesson route renders it. Set SEO metadata from the title only.

Hard rules: **never write educational prose** (Golden rule 1); `status: draft`; design tokens
only for any UI touched. After building, verify the route renders (`pnpm build`) and report the
exact files created/changed.
