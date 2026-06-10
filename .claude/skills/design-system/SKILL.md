---
name: design-system
description: >-
  The Robotics Compass design system — design tokens (light default + scoped
  dark), typography scale, spacing/radius, light/dark theme rules, and the core
  component patterns (AppShell, Header, Sidebar, LessonLayout, Callout, VizFrame,
  Viz2D, Viz3D). Use whenever building or reviewing UI, styling a component, or
  deciding a color/font/spacing value.
---

# Design system

The single source of truth for look and feel. **Every color, font, and spacing value comes
from a token.** Never hardcode literals in a component (Golden rule 3).

## Tokens

Defined as CSS variables in `src/app/globals.css`. **Light lives on `:root`** and is the
global default. **Dark lives on `.theme-dark`** (and `[data-theme="dark"]`) and is applied
**only** to simulator/playground pages and 3D canvas wrappers — never globally (Golden rule 2).

### Light (default — academic)

| Role | Value |
| --- | --- |
| `--color-bg` | `#FFFFFF` |
| `--color-surface` | `#F7F8FA` |
| `--color-surface-2` | `#EEF1F5` |
| `--color-border` | `#E3E6EB` |
| `--color-text` | `#1A1F2B` |
| `--color-text-muted` | `#5B6472` |
| `--color-text-faint` | `#9AA1AC` |
| `--color-accent` | `#2563EB` |
| `--color-accent-weak` | `#EAF1FE` |
| `--color-success` / start | `#16A34A` |
| `--color-danger` / goal | `#E2675F` |
| `--color-warning` | `#D97706` |

### Dark (simulator + 3D canvases only)

| Role | Value |
| --- | --- |
| `--color-bg` | `#0B0F17` |
| `--color-surface` | `#0F1620` |
| `--color-surface-2` | `#16202C` |
| `--color-border` | `#1E2A38` |
| `--color-text` | `#E6EDF3` |
| `--color-text-muted` | `#8AA0B2` |
| `--color-text-faint` | `#56657A` |
| `--color-accent` | `#38BDF8` |
| `--color-accent-weak` | `#0E2A30` |
| `--color-success` / start | `#34D399` |
| `--color-goal` | `#F472B6` |
| `--color-path` | `#38BDF8` |
| `--color-explored` | `#1E3A4A` |

The viz color roles (`start`, `goal`, `path`, `explored`) map to success/danger/accent in
light and to their dedicated dark values inside a `.theme-dark` canvas wrapper. Visualizations
should read these from CSS variables (via `getComputedStyle`) so they track the theme.

## Tailwind v4 wiring

Tokens are exposed to Tailwind through the `@theme` mapping in `globals.css`, e.g.
`--color-accent` → `bg-accent`, `text-accent`, `border-accent`. Prefer the semantic token
utilities (`bg-surface`, `text-muted`, `border-border`) over raw Tailwind palette classes
(`bg-blue-600`) — raw palette classes are a Golden-rule-3 violation.

## Typography

- **Headings:** Source Serif 4, weights 500/600, **sentence case**. h1 32px · h2 24px · h3 19px.
- **Body:** Inter, 16–17px, line-height **1.7**.
- **Code:** JetBrains Mono.
- Fonts are loaded with `next/font/google` in the root layout and exposed as CSS variables
  (`--font-sans`, `--font-serif`, `--font-mono`).

## Spacing, radius, borders

- Generous whitespace; lean on a consistent spacing rhythm (Tailwind spacing scale is fine —
  it is unitless layout, not a brand color/font).
- **Radius:** 8px default, 12px for cards.
- **Borders:** 1px, subtle — always `--color-border`.

## Core component patterns

All live under `src/components/`.

- **AppShell** (`shell/`) — top-level layout: Header + Sidebar + main content column. Light
  theme. Holds the reading-width content measure and consistent page padding.
- **Header** (`shell/`) — slim top bar with the **compass logo** (a simple compass/needle SVG
  mark) + wordmark, links to home. Keyboard reachable, visible focus ring (`--color-accent`).
- **Sidebar** (`shell/`) — curriculum navigation, grouped by area in taxonomy order, reads
  from `src/lib/curriculum.ts`. Shows lesson status (e.g. a `draft` marker). Collapsible on
  small screens; current page marked with `aria-current="page"`.
- **LessonLayout** (`lesson/`) — wraps MDX lesson body: serif headings, 1.7 body leading,
  comfortable reading measure (~68ch), section spacing. Renders front-matter (title, summary,
  difficulty, prerequisites, status) as a lesson header.
- **Callout** (`lesson/`) — boxed note (info / warning / success variants) using
  `accent-weak` / `warning` / `success` token backgrounds with AA-contrast text.
- **VizFrame** (`viz/`) — the framed container every visualization sits in: caption, a
  **required text-alternative** (`<figcaption>` / visually-hidden description), and controls
  region. Provides consistent border/radius/padding.
- **Viz2D** (`viz/`) — wrapper for D3 + Canvas viz: ResizeObserver-based responsive sizing,
  light theme by default. See the `viz-2d` skill.
- **Viz3D** (`viz/`) — wrapper for react-three-fiber scenes: applies the **dark** canvas
  theme, dynamic import with `ssr: false`, `frameloop="demand"`. See the `viz-3d` skill.

## Accessibility & motion (always)

- WCAG **AA** contrast for all text and meaningful UI.
- Full keyboard navigation; **visible focus** states (never remove outlines without a
  replacement focus ring).
- Honor `prefers-reduced-motion`: gate animations/auto-running loops behind it.
- Every visualization needs a **text alternative** describing what it shows.

When in doubt about a value, it is a token — add/extend the token, don't hardcode. Changing a
token requires asking first (Golden rule 4).
