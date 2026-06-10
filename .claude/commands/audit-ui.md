---
description: Review recent UI changes against the design system and Golden rules.
argument-hint: (optional) path or area to focus on
---

Audit Robotics Compass UI against the design system and Golden rules.

Optional focus: `$ARGUMENTS` (a path, component, or area to scope the review; if empty, review
the recent changes — start from `git diff` / recently modified files under `src/` and
`content/`).

Delegate to the **design-system-guardian** agent. It must check, per the **design-system**
skill:

1. **Design tokens (rule 3)** — no hardcoded colors/fonts/spacing; no raw Tailwind palette
   classes in place of semantic token utilities. (Sweep for `#hex`, `rgb(`, `hsl(`, raw
   palette classes.)
2. **Theme rules (rule 2)** — light is the global default; dark only on simulator/playground
   pages and 3D canvas wrappers, scoped, never global or on reading surfaces.
3. **Typography** — serif headings (32/24/19, weight 500/600, sentence case), Inter body 16–17
   / 1.7, JetBrains Mono code, radius 8/12, 1px subtle borders.
4. **Accessibility (rule 5)** — WCAG AA contrast, keyboard nav, visible focus, reduced-motion
   honored, every visualization has a text alternative.
5. **Performance (rule 6)** — viz lazy-loaded; 3D uses `frameloop="demand"`, disposes
   resources, dynamic-imports `three` with `ssr:false`.

Output a concise report grouped by the checklist, each finding with **`file:line`**, the rule
broken, and a concrete token-compliant fix. Flag anything that should become a question to the
human (e.g. a value wanting a new token — tokens change only with approval).
