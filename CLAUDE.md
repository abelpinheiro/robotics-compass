# Robotics Compass — project law

This file is authoritative for every session in this repo. Read it before doing anything.
If a request conflicts with the **Golden rules** below, stop and raise it.

## Project goal

Robotics Compass is an interactive, **visualization-first** website for learning robotics.
It is structured like a robotics textbook, but every topic carries a live, manipulable
visualization. Coverage is broad (all major robotics areas) and deepest on **path planning**.
Tonal inspiration: `robotics101-viscircuit.web.app` — calm, academic, precise.

The site ships as a skeleton of **empty draft lessons** that a human author fills with prose
over time. Our job is the platform, the scaffolding, and the visualizations — never the
educational writing.

## Tech stack (use exactly this)

- **Next.js (App Router) + TypeScript** in strict mode
- **Tailwind CSS v4** (CSS-first, driven by the CSS-variable design tokens below)
- **MDX** for lessons via `@next/mdx` (+ `remark-frontmatter`, `remark-mdx-frontmatter`)
- **3D:** `@react-three/fiber` + `@react-three/drei` (`three`)
- **2D:** `d3` + HTML Canvas
- **Package manager:** `pnpm` (activated via corepack)
- **Fonts** via `next/font/google`: Inter (body), Source Serif 4 (headings), JetBrains Mono (code)
- **Host:** Vercel — but keep everything portable, no vendor-specific code

Do not add, remove, or swap any of these without asking first (see Golden rule 4).

## Golden rules (do not break these)

1. **Never write lesson prose.** Lessons are scaffolded empty — front-matter plus empty
   section placeholders. The human writes every explanation, definition, and example. Do not
   fill educational content even if you know it. (See `.claude/skills/lesson-template`.)
2. **Theme discipline.** The academic **light theme is the global default** for all
   reading/lesson pages. **Dark theme is used only** for (a) dedicated simulator/playground
   pages and (b) embedded 3D canvases inside otherwise-light lessons. It is applied via a
   scoped `.theme-dark` class / `data-theme="dark"` wrapper — **never a global toggle.**
3. **Always use design tokens.** Never hardcode a color, font, or spacing value in a
   component. Pull from the CSS variables / Tailwind theme defined in `globals.css`.
4. **Ask before assuming.** Before adding any dependency, changing the curriculum taxonomy,
   changing design tokens, or making any ambiguous decision — stop and ask. Never guess.
5. **Accessibility is required.** WCAG AA contrast, full keyboard navigation, visible focus
   states, honor `prefers-reduced-motion`, and every visualization must have a text
   alternative.
6. **Performance.** Lazy-load visualizations. For 3D use `frameloop="demand"` when the scene
   is idle and dispose geometries/materials. Dynamically import anything that touches `three`
   with `ssr: false` (it needs `window`).
7. **Work in small phases.** After each phase, summarize exactly what changed and stop for
   confirmation. Use conventional commits, one concern per commit.

## File-structure conventions

```
robotics-compass/
├─ CLAUDE.md                      # this file — project law
├─ next.config.mjs                # MDX + pageExtensions
├─ postcss.config.mjs             # Tailwind v4 plugin
├─ eslint.config.mjs              # flat config (eslint-config-next)
├─ tsconfig.json                  # strict
├─ content/                       # lesson MDX — ONE file per topic
│  └─ <area>/<slug>.mdx           # e.g. content/path-planning/a-star.mdx
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx               # root layout, light theme default
│  │  ├─ globals.css              # design tokens (:root + .theme-dark) + Tailwind
│  │  ├─ page.tsx                 # home
│  │  └─ lessons/[area]/[slug]/   # dynamic lesson route renders content/*.mdx
│  ├─ mdx-components.tsx          # global MDX component map
│  ├─ components/
│  │  ├─ shell/                   # AppShell, Header (compass logo), Sidebar
│  │  ├─ lesson/                  # LessonLayout, Callout, section primitives
│  │  └─ viz/                     # VizFrame, Viz2D, Viz3D wrappers + viz impls
│  └─ lib/
│     ├─ curriculum.ts            # taxonomy / nav config — single source of truth
│     └─ content.ts               # MDX loading + front-matter helpers
└─ public/                        # static assets
```

Conventions:
- **Lessons live in `content/<area>/<slug>.mdx`** and are rendered by the dynamic route
  `src/app/lessons/[area]/[slug]/`. Adding a lesson = add an MDX file + register it in the
  curriculum config; never hand-author 70 route folders.
- **`src/lib/curriculum.ts` is the canonical nav/ordering source.** The sidebar and
  prerequisite links read from it. It must mirror `.claude/skills/robotics-curriculum`.
- Visualizations are React components under `src/components/viz/`, lazy-loaded and wired into
  a lesson's `Visualization` section slot.
- Path aliases: import app code via `@/…` (maps to `src/…`).

## Design tokens (single source of truth)

Implemented as CSS variables in `src/app/globals.css`: **light is `:root`**; **dark is the
`.theme-dark` class** (scoped — see Golden rule 2). Components must reference tokens, never
literals.

**Light (default — academic):**
`bg #FFFFFF` · `surface #F7F8FA` · `surface-2 #EEF1F5` · `border #E3E6EB`
`text #1A1F2B` · `text-muted #5B6472` · `text-faint #9AA1AC`
`accent #2563EB` · `accent-weak #EAF1FE`
`start/success #16A34A` · `goal/danger #E2675F` · `warning #D97706`

**Dark (simulator + 3D canvases only):**
`bg #0B0F17` · `surface #0F1620` · `surface-2 #16202C` · `border #1E2A38`
`text #E6EDF3` · `text-muted #8AA0B2` · `text-faint #56657A`
`accent #38BDF8` · `accent-weak #0E2A30`
`start/success #34D399` · `goal #F472B6` · `path #38BDF8` · `explored #1E3A4A`

**Typography scale:** h1 32px / h2 24px / h3 19px (Source Serif 4, weight 500/600);
body 16–17px, line-height 1.7 (Inter); code JetBrains Mono. **Sentence case headings.**
Generous whitespace. **Radius:** 8px default, 12px cards. **Borders:** 1px, subtle.

Full details and component patterns live in `.claude/skills/design-system`.

## Claude Code configuration in this repo

- **Skills** (`.claude/skills/*/SKILL.md`): design-system, robotics-curriculum,
  lesson-template, viz-2d, viz-3d.
- **Agents** (`.claude/agents/*.md`): curriculum-architect, lesson-builder, viz-engineer,
  design-system-guardian.
- **Commands** (`.claude/commands/*.md`): `/new-lesson`, `/new-viz`, `/expand-area`,
  `/audit-ui`.

## Commands

- `pnpm dev` — dev server
- `pnpm build` — production build
- `pnpm start` — serve production build
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` — ESLint (flat config)
