# Robotics Compass

An interactive, **visualization-first** website for learning robotics. It is structured like a
robotics textbook, but every topic carries a live, manipulable visualization. Coverage is broad
across robotics and deepest on **path planning**.

The site ships as a skeleton of **empty draft lessons** that a human author fills with prose over
time. The code provides the platform, the scaffolding, and the visualizations.

> **Project law lives in [CLAUDE.md](./CLAUDE.md).** Read it before contributing — it defines the
> golden rules (never write lesson prose, theme discipline, design tokens, accessibility,
> performance) that this codebase follows.

## Tech stack

- **Next.js (App Router) + TypeScript** (strict)
- **Tailwind CSS v4** — CSS-first, driven by the design-token CSS variables in
  [`src/app/globals.css`](./src/app/globals.css)
- **MDX** lessons via `@next/mdx` (+ `remark-frontmatter`, `remark-mdx-frontmatter`)
- **3D:** `@react-three/fiber` + `@react-three/drei` (`three`)
- **2D:** `d3` + HTML Canvas
- **pnpm** (via corepack) · **Vercel**-friendly, no vendor lock-in

## Getting started

Requires **Node 20+**. pnpm is provided through corepack — no global install needed.

```bash
corepack enable                # activates pnpm
pnpm install                   # install dependencies
pnpm dev                       # http://localhost:3000
```

### Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint (flat config) |
| `pnpm screenshots` | Capture responsive screenshots (requires a running server; see below) |

## Project structure

```
content/                       # lesson MDX — one file per topic
  <area>/<slug>.mdx
src/
  app/
    layout.tsx                 # root layout (light theme default) + fonts + AppShell
    globals.css                # design tokens (:root + .theme-dark) + Tailwind
    page.tsx                   # home
    lessons/[area]/[slug]/     # dynamic route that renders content/*.mdx
  mdx-components.tsx           # global MDX component map
  components/
    shell/                     # AppShell, Header (compass logo), Sidebar nav
    lesson/                    # LessonLayout, Callout
    viz/                       # VizFrame, Viz2D, Viz3D wrappers + viz impls
  lib/
    curriculum.ts             # taxonomy / nav config — single source of truth
    content.ts                # MDX loading helper
```

- **Lessons** live in `content/<area>/<slug>.mdx` and are rendered by the dynamic route
  `src/app/lessons/[area]/[slug]/`. Adding a lesson = add an MDX file **and** register it in
  `src/lib/curriculum.ts`.
- **`src/lib/curriculum.ts`** is the canonical navigation/ordering source — the sidebar reads
  from it. It mirrors the `robotics-curriculum` skill.
- **Visualizations** are React components under `src/components/viz/`, lazy-loaded and wired into
  a lesson's `Visualization` section.
- Import app code via the `@/…` path alias (maps to `src/…`).

## Adding content with Claude Code

This repo is set up for [Claude Code](https://claude.com/claude-code). The fastest way to grow the
site is the slash commands in [`.claude/commands/`](./.claude/commands):

| Command | Use |
| --- | --- |
| `/new-lesson <area> <topic-slug>` | Scaffold one empty draft lesson and wire it into the nav |
| `/expand-area <area>` | Scaffold every standard lesson for an area, in order |
| `/new-viz <lesson-slug> <2d\|3d> <brief>` | Build a visualization and wire it into a lesson |
| `/audit-ui` | Review recent UI changes against the design system + golden rules |

These delegate to the agents in [`.claude/agents/`](./.claude/agents) (curriculum-architect,
lesson-builder, viz-engineer, design-system-guardian) and follow the skills in
[`.claude/skills/`](./.claude/skills) (design-system, robotics-curriculum, lesson-template,
viz-2d, viz-3d).

### Adding a lesson by hand

1. Create `content/<area>/<slug>.mdx` from the **lesson-template** scaffold: front-matter
   (`title`, `area`, `slug`, `order`, `summary`, `difficulty`, `prerequisites`,
   `status: draft`) plus the seven empty section placeholders (Intuition · Formal definition ·
   Visualization · Worked example · Common pitfalls · Exercises · Further reading).
2. Register the lesson in `src/lib/curriculum.ts` under its area, in order.
3. Leave all educational prose empty — the human author writes it (golden rule 1).

### Adding a visualization by hand

1. Build the component under `src/components/viz/` following the **viz-2d** (D3 + Canvas) or
   **viz-3d** (react-three-fiber) conventions. Read colors from the `--viz-*` design tokens; never
   hardcode them.
2. Create a small `*Embed` wrapper that `dynamic()`-imports it (`ssr: false` for 3D) so it is
   lazy-loaded.
3. In the lesson MDX, `import` the embed and place it in the `## Visualization` section.

The reference implementations are the **A\* grid search** (2D, in the `a-star` lesson) and the
**2-link forward-kinematics arm** (3D, in the `forward-kinematics` lesson).

## Design system & theme

- The academic **light theme is the global default**. **Dark theme is scoped** to simulator pages
  and embedded 3D canvas wrappers via `.theme-dark` / `data-theme="dark"` — never a global toggle.
- Every color/font/spacing value comes from a **design token** (CSS variable). See
  [`.claude/skills/design-system`](./.claude/skills/design-system/SKILL.md).

## Accessibility

WCAG **AA** contrast, full keyboard navigation, visible focus states, honored
`prefers-reduced-motion`, and a **text alternative** for every visualization (via `VizFrame`).

## Responsive screenshots

With the app running (`pnpm build && pnpm start` in one terminal):

```bash
pnpm screenshots                          # captures home + both viz lessons at 375/768/1440/1920px
BASE_URL=http://localhost:3001 pnpm screenshots   # custom target
```

Output is written to `screenshots/` (gitignored).

## Deployment

Deploy to Vercel (or any Node host) with `pnpm build` / `pnpm start`. No vendor-specific code is
used.
