---
description: Scaffold the empty MDX files of every planned lesson in one content folder (area), in course order.
argument-hint: <area>
---

Scaffold the MDX files for the lessons of one Robotics Compass content folder.

Argument: area = `$1` — a content folder / URL segment (e.g. `control`). Areas are not shown in
navigation; the course map groups lessons by part and chapter (see the **robotics-curriculum**
skill).

Steps:

1. Collect every lesson listed as `$1/<slug>` in the **robotics-curriculum** skill (canonical),
   in course order. If there is none, stop and list the valid areas.
2. Delegate to the **lesson-builder** agent to create **one empty lesson file per topic**, in
   course order, each from the **lesson-template** skill:
   - `content/$1/<slug>.mdx` per topic, with `title` (humanized), `area: $1`, `slug`, the
     correct 1-based `order`, and `summary: ""` empty; the template v2 body (seven fixed empty
     sections with their component hints). No
     `status`, `difficulty`, or `prerequisites` in front-matter.
   - Skip any topic whose file already exists (report it as skipped) — do not overwrite.
3. Confirm every lesson is registered in its chapter in `src/lib/curriculum.ts` with
   `status: "planned"` (flag any proposed `difficulty`/`prerequisites` for the author to review).

Hard rules: **never write educational prose** (rule 1); scaffolded lessons stay `planned` in
`curriculum.ts`; design
tokens only for any UI touched; do not change the taxonomy (rule 4). After scaffolding, run
`pnpm test` and `pnpm build`, and report the full list of files created and any skipped.
