import {
  getAreaLevels,
  getAreaPrerequisites,
  getFirstVisibleLesson,
} from "@/lib/curriculum";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localizedAreaTitle } from "@/lib/i18n/titles";

// Diagram geometry (viewBox units; the SVG scales to the container width).
const W = 960;
const NODE_W = 190;
const NODE_H = 48;
const ROW_H = 112;
const PAD = 26;

/** Split a long label into at most two balanced lines. */
function wrapLabel(label: string): string[] {
  if (label.length <= 22) return [label];
  const mid = Math.floor(label.length / 2);
  let best = -1;
  for (let i = 0; i < label.length; i++) {
    if (label[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) {
      best = i;
    }
  }
  if (best < 0) return [label];
  return [label.slice(0, best), label.slice(best + 1)];
}

/**
 * Curriculum roadmap as an area-level dependency flow: the 11 areas laid out in
 * topological layers with arrows derived from the lesson prerequisite graph.
 * Each area links to its first ready (non-draft) lesson; areas with none yet are
 * dimmed.
 */
export async function StudyRoadmap() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  const levels = getAreaLevels();
  const deps = getAreaPrerequisites();
  const H = PAD * 2 + NODE_H + (levels.length - 1) * ROW_H;

  const pos = new Map<string, { cx: number; cy: number }>();
  levels.forEach((areas, level) => {
    areas.forEach((area, i) => {
      pos.set(area.slug, {
        cx: (W * (i + 1)) / (areas.length + 1),
        cy: PAD + NODE_H / 2 + level * ROW_H,
      });
    });
  });

  const edges: { from: string; to: string }[] = [];
  for (const [slug, prereqs] of deps) {
    for (const p of prereqs) edges.push({ from: p, to: slug });
  }

  const areas = levels.flat();

  return (
    <section aria-labelledby="study-roadmap-heading">
      <h2
        id="study-roadmap-heading"
        className="mb-1 font-serif text-2xl font-semibold"
      >
        {t.home.roadmapTitle}
      </h2>
      <p className="mb-4 text-sm text-muted">{t.home.roadmapSubtitle}</p>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={t.home.roadmapAria}
      >
        <defs>
          <marker
            id="roadmap-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="var(--muted)" />
          </marker>
        </defs>

        {edges.map(({ from, to }) => {
          const s = pos.get(from);
          const e = pos.get(to);
          if (!s || !e) return null;
          const sy = s.cy + NODE_H / 2;
          const ey = e.cy - NODE_H / 2;
          const my = (sy + ey) / 2;
          return (
            <path
              key={`${from}-${to}`}
              d={`M${s.cx},${sy} C${s.cx},${my} ${e.cx},${my} ${e.cx},${ey}`}
              fill="none"
              stroke="var(--border)"
              strokeWidth="1.5"
              markerEnd="url(#roadmap-arrow)"
            />
          );
        })}

        {areas.map((area) => {
          const p = pos.get(area.slug)!;
          const first = getFirstVisibleLesson(area.slug);
          const href = first ? `/lessons/${area.slug}/${first.slug}` : undefined;
          const title = localizedAreaTitle(area.slug, area.title, locale);
          const lines = wrapLabel(title);
          const x = p.cx - NODE_W / 2;
          const y = p.cy - NODE_H / 2;

          const node = (
            <g>
              <rect
                x={x}
                y={y}
                width={NODE_W}
                height={NODE_H}
                rx={10}
                fill={href ? "var(--surface)" : "var(--surface-2)"}
                stroke={href ? "var(--accent)" : "var(--border)"}
                strokeWidth={href ? 1.5 : 1}
                strokeDasharray={href ? undefined : "4 3"}
              />
              <text
                x={p.cx}
                y={p.cy}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="13"
                fontWeight="600"
                fill={href ? "var(--foreground)" : "var(--muted)"}
              >
                {lines.length === 1 ? (
                  lines[0]
                ) : (
                  <>
                    <tspan x={p.cx} dy="-0.55em">
                      {lines[0]}
                    </tspan>
                    <tspan x={p.cx} dy="1.1em">
                      {lines[1]}
                    </tspan>
                  </>
                )}
              </text>
            </g>
          );

          return href ? (
            <a key={area.slug} href={href} aria-label={title}>
              {node}
            </a>
          ) : (
            <g key={area.slug} aria-label={`${title} — ${t.nav.lessonsComingSoon}`}>
              {node}
            </g>
          );
        })}
      </svg>
    </section>
  );
}
