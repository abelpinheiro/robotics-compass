# Lesson images

Static images used inside lessons live here. Files in `public/` are served from the site root,
so a file at `public/images/<area>/<name>.png` is referenced as `/images/<area>/<name>.png`.

## Convention

- Organize by curriculum area, mirroring `content/`:
  `public/images/<area>/<slug>-<description>.<ext>` — e.g.
  `public/images/foundations/rotations-2d-projection.png`.
- Prefer **SVG** for diagrams (crisp at any size) and **WebP/PNG** for raster images.
- Keep files reasonably small; optimize before committing.

## Using an image in a lesson (MDX)

Markdown image syntax works in any `.mdx` lesson and **must include alt text** (accessibility):

```mdx
![A frame {B} rotated by theta, with its axes projected onto frame {A}](/images/foundations/rotations-2d-projection.svg)
```

Lesson images are styled automatically (full width, rounded, subtle border) via the
`.lesson-prose img` rules in `src/app/globals.css`.

For a caption, wrap it in a figure:

```mdx
<figure>
  ![alt text](/images/<area>/<name>.png)
  <figcaption>Short caption.</figcaption>
</figure>
```

Interactive diagrams should be React visualizations under `src/components/viz/` (see the
`viz-2d` / `viz-3d` skills), not static images.
