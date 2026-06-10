---
description: Scaffold every standard empty draft lesson for one curriculum area, in order.
argument-hint: <area>
---

Scaffold all standard lessons for a Robotics Compass curriculum area.

Argument: area = `$1`

Steps:

1. Look up area `$1` in the **robotics-curriculum** skill (canonical). If `$1` is not a valid
   area, stop and list the valid areas. Read the full ordered topic list for that area.
2. Delegate to the **lesson-builder** agent to create **one empty draft lesson per topic**, in
   taxonomy order, each from the **lesson-template** skill:
   - `content/$1/<slug>.mdx` per topic, with `title` (humanized), `area: $1`, `slug`, the
     correct 1-based `order`, `status: draft`; `summary`/`difficulty`/`prerequisites` empty;
     the seven fixed empty sections.
   - Skip any topic whose file already exists (report it as skipped) — do not overwrite.
3. Register every new lesson in `src/lib/curriculum.ts` so the Sidebar shows the whole area in
   order.

Hard rules: **never write educational prose** (rule 1); every lesson `status: draft`; design
tokens only for any UI touched; do not change the taxonomy (rule 4). After scaffolding, run
`pnpm build` to confirm all routes render, and report the full list of files created and any
skipped.
