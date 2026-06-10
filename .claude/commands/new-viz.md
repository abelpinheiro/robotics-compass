---
description: Build a 2D or 3D visualization and wire it into a lesson's Visualization slot.
argument-hint: <lesson-slug> <2d|3d> <short brief>
---

Build a visualization for Robotics Compass and wire it into a lesson.

Arguments: `$ARGUMENTS`
- lesson slug = `$1`
- kind = `$2` (`2d` or `3d`)
- brief = the remaining words ($3 onward) — a short description of what to visualize

Delegate to the **viz-engineer** agent. It must:

1. Locate the lesson `content/<area>/$1.mdx` (find its area from `src/lib/curriculum.ts`). If
   the lesson does not exist, stop and suggest `/new-lesson` first.
2. Build the viz under `src/components/viz/` following the right skill:
   - `2d` → **viz-2d** (D3 + Canvas; Viz2D wrapper; ResizeObserver; pure-function algorithm
     returning replayable steps for the search family; token color roles; light theme).
   - `3d` → **viz-3d** (react-three-fiber; Viz3D dark wrapper; `dynamic(..., { ssr:false })`;
     `frameloop="demand"` + `invalidate()`; dispose; nested joint groups for arms).
3. Add labeled, keyboard-operable controls and the required **text alternative**; lazy-load the
   component and replace the `{/* TODO(viz) */}` placeholder in the lesson's Visualization
   section, inside `VizFrame`.

Hard rules: design tokens only (rule 3); correct theme (rule 2); accessibility incl. text
alternative + reduced-motion (rule 5); performance budget (rule 6); **no new dependencies
without asking** (rule 4); **no lesson prose** (rule 1). Verify it renders and `pnpm build`
passes; report files changed and how the viz is controlled.
