# Robotics Compass — project law

This file is authoritative for every session in this repo. Read it before doing anything.
If a request conflicts with the **Golden rules** below, stop and raise it.

## Project goal

Robotics Compass (https://robotics-compass.vercel.app) is an interactive, **visualization-first**
website for learning robotics, written by the author alongside their master's studies. It is
structured like a robotics textbook (Craig is the main reference), every topic carries a live,
manipulable visualization, and it is **bilingual (EN/PT)**. It also has a dark **playground**
(`/<locale>/playground`) with real robots (UR20, KUKA KR6, LBR iiwa) and a SCARA, and **case studies**
of specific robots. Tonal inspiration: `robotics101-viscircuit.web.app` — calm, academic, precise.

The current direction is to turn it from "notes with visualizations" into a **study platform**
(course map, exercises, progress, a richer playground) without losing what exists. The phased
plan for that work is tracked outside this file; each phase is one branch.

The author writes the theory. Our job is the platform, the scaffolding, the math (equations),
figures, visualizations, and tested kernels — never the educational writing (Golden rule 1).

## Tech stack (use exactly this)

- **Next.js (App Router) + TypeScript** in strict mode
- **Tailwind CSS v4** (CSS-first, driven by the CSS-variable design tokens below)
- **MDX** for lessons via `@next/mdx` (+ `remark-frontmatter`, `remark-mdx-frontmatter`,
  `remark-gfm`); math with `remark-math` + `rehype-katex` (KaTeX); code with `@shikijs/rehype`
- **3D:** `@react-three/fiber` + `@react-three/drei` (`three`); real robots via `urdf-loader`
- **2D:** `d3` + HTML Canvas
- **Tests:** Vitest (`src/**/*.test.ts`); Playwright only for screenshots
- **Package manager:** `pnpm` (activated via corepack)
- **Fonts** via `next/font/google`: Inter (body), Source Serif 4 (headings), JetBrains Mono (code)
- **Host:** Vercel — but keep everything portable, no vendor-specific code

Do not add, remove, or swap any of these without asking first (see Golden rule 4).

## Golden rules (do not break these)

1. **Never write lesson prose.** The author writes every explanation, definition,
   demonstration, and example; do not fill educational content even if you know it. In a
   lesson you may contribute equations (KaTeX), figures, and visualizations, leaving the
   surrounding text as `TODO(author)` placeholders. To change existing lesson content,
   **propose the diff and wait for approval**. Exercises are the one exception: you may draft
   them, always with `status: "draft"`, kept out of the production build until the author
   approves them, and every answer needs a reference solution in code verified by an
   automated test. (See `.claude/skills/lesson-template`.)
2. **Theme discipline.** The academic **light theme is the global default** for all
   reading/lesson pages. **Dark theme is used only** for (a) dedicated simulator/playground
   pages and (b) embedded 3D canvases inside otherwise-light lessons. It is applied via a
   scoped `.theme-dark` class / `data-theme="dark"` wrapper — **never a global toggle.**
3. **Always use design tokens.** Never hardcode a color, font, or spacing value in a
   component. Pull from the CSS variables / Tailwind theme defined in `globals.css`.
4. **Ask before assuming.** Before adding any dependency, changing the curriculum taxonomy,
   changing design tokens, creating a new agent or skill, or making any ambiguous decision —
   stop and ask. Never guess. When a decision has to be made without asking, flag it
   explicitly in the summary.
5. **Accessibility is required.** WCAG AA contrast, full keyboard navigation, visible focus
   states, honor `prefers-reduced-motion`, and every visualization must have a text
   alternative.
6. **Performance.** Lazy-load visualizations. For 3D use `frameloop="demand"` when the scene
   is idle and dispose geometries/materials. Dynamically import anything that touches `three`
   with `ssr: false` (it needs `window`).
7. **Work in small phases.** One phase per branch (local branches for now; one PR per phase
   once PRs are opened). After each phase, summarize exactly what changed and stop for
   confirmation. Use conventional commits, one concern per commit.
8. **Modified (Craig) DH everywhere.** Link transforms are
   ^{i-1}_iT = Rot_X(α_{i-1})·Trans_X(a_{i-1})·Rot_Z(θ_i)·Trans_Z(d_i), and joint i acts about
   Z_i. Use the shared kernel in `src/lib/kinematics/`. The classic (standard) convention
   appears only where a source publishes it (e.g. the UR20 table) and must be labelled
   "classic" wherever it is shown.
9. **Bilingual UI (EN/PT).** Every new UI string exists in both languages — in
   `src/lib/i18n/dictionaries.ts` or in a colocated `Record<Locale, …>` strings module, so a
   missing translation is a type error. Portuguese text keeps the English technical term in
   parentheses, e.g. "cinemática direta (forward kinematics)".
10. **Test the math.** Every math kernel (FK, IK, Jacobians, dynamics, trajectories) has Vitest
    tests against independently computed references (closed forms, elementary-matrix
    compositions, finite differences, hand-computed values). The author is the only reviewer,
    so automated verification is mandatory.

## File-structure conventions

```
robotics-compass/
├─ CLAUDE.md                      # this file — project law
├─ next.config.mjs                # MDX + pageExtensions
├─ postcss.config.mjs             # Tailwind v4 plugin
├─ eslint.config.mjs              # flat config (eslint-config-next)
├─ tsconfig.json                  # strict
├─ vitest.config.mts              # unit tests (src/**/*.test.ts)
├─ content/                       # lesson MDX — ONE file per topic
│  ├─ <area>/<slug>.mdx           # English (default), e.g. content/path-planning/a-star.mdx
│  └─ <area>/<slug>.pt.mdx        # optional Portuguese translation (falls back to English)
├─ docs/ROADMAP.md                # backlog
├─ src/
│  ├─ proxy.ts                    # redirects unprefixed URLs to /<locale>/… (cookie, then browser)
│  ├─ app/
│  │  ├─ globals.css              # design tokens (:root + .theme-dark) + Tailwind
│  │  ├─ sitemap.ts, robots.ts    # metadata routes (sitemap: every locale + hreflang)
│  │  └─ [lang]/                  # every page, statically generated per locale (en, pt)
│  │     ├─ layout.tsx            # root layout, light theme default, <html lang>
│  │     ├─ page.tsx              # home (course outline by part)
│  │     ├─ course-map/           # table of contents; graph/ and graph/[part]/ views
│  │     ├─ lessons/[area]/[slug]/ # lesson route renders content/*.mdx
│  │     ├─ playground/           # dark simulator page
│  │     └─ not-found.tsx         # localized 404 (+ [...rest] catch-all)
│  ├─ mdx-components.tsx          # global MDX component map (locale-aware links)
│  ├─ components/
│  │  ├─ shell/                   # AppShell, Header (compass logo), Sidebar, LanguageToggle
│  │  ├─ lesson/                  # LessonLayout, Callout, section primitives
│  │  ├─ course-map/              # labels, status badge, prerequisite graph + its tested layout
│  │  ├─ viz/                     # VizFrame, Viz2D, Viz3D wrappers + viz impls
│  │  └─ playground/              # RobotPlayground + per-robot math (URDF chains)
│  └─ lib/
│     ├─ curriculum.ts            # course map (parts → chapters → lessons) — single source of truth
│     ├─ content.ts               # MDX loading (locale file first, then English)
│     ├─ i18n/                    # locale config + URL routing helpers, dictionaries, PT titles
│     └─ kinematics/              # shared math kernel (4×4 transforms, modified DH)
└─ public/                        # static assets (images/<area>/, models/ for URDF meshes)
```

Conventions:
- **Lessons live in `content/<area>/<slug>.mdx`** and are rendered by the dynamic route
  `src/app/[lang]/lessons/[area]/[slug]/` at `/<locale>/lessons/<area>/<slug>`. Adding a lesson = add an MDX file + register it in the
  curriculum config; never hand-author 70 route folders.
- **`src/lib/curriculum.ts` is the canonical course map**: Parts (I–VI plus case studies) →
  numbered chapters (1–11 follow Craig 2–13) → lessons. It holds each lesson's `status`,
  `difficulty`, and `prerequisites`, plus its `area`, which is only the content folder and URL
  segment (never shown in navigation). Front-matter carries only author content (`title`,
  `summary`) plus structural `area`/`slug`/`order`. `curriculum.ts` must mirror
  `.claude/skills/robotics-curriculum`; `src/lib/curriculum.test.ts` checks it against
  `content/`.
- **Lesson statuses:** `published` and `in-progress` have a page and appear in navigation;
  `planned` and `parked` (the parked Part VI) appear only in the course map, with **no page in
  production** (the dev server renders them, so the author can preview while writing).
  Publishing = switching `status` to `in-progress` or `published`.
- **Translations:** a lesson's Portuguese version is the sibling `<slug>.pt.mdx`, written by
  the author like any other lesson prose. PT titles for navigation live in
  `src/lib/i18n/titles.ts`.
- **Locale URLs:** every page lives at `/<locale>/…` (`en`, `pt`) and is statically
  generated. The locale comes from the route param (`params.lang` → `toLocale`, or
  `useLocale()` in client code) — never from cookies or headers in render code, which would
  make pages dynamic. Build internal links with `localePath(locale, path)` /
  `useLocale().href(path)`. Links inside lesson MDX are written without a locale
  (`/lessons/…`); `MdxLink` adds it. The `locale` cookie only remembers the toggle's choice
  for unprefixed URLs (handled in `src/proxy.ts`).
- Visualizations are React components under `src/components/viz/`, lazy-loaded and wired into
  a lesson's `Visualization` section slot. Their math lives in a separate, tested module.
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
- `pnpm test` — Vitest, single run (`pnpm test:watch` to watch)
