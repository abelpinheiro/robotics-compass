"use client";

import { useMemo, useState } from "react";
import type { LessonStatus } from "@/lib/curriculum";
import { GRAPH, ancestors } from "./graphLayout";

export interface GraphNodeView {
  slug: string;
  /** localized lesson title */
  label: string;
  status: LessonStatus;
  /** set for visible lessons only */
  href?: string;
  /** shown only as a prerequisite of the focused part */
  external: boolean;
  x: number;
  y: number;
  /** accessible name / tooltip: title, status and prerequisites */
  description: string;
}

export interface GraphBandView {
  key: string;
  label: string;
  y: number;
  height: number;
}

/** A chapter lane inside a band; only lanes of multi-chapter bands are labelled. */
export interface GraphLaneView {
  key: string;
  label: string;
  y: number;
  first: boolean;
}

const BOX: Record<LessonStatus, { fill: string; stroke: string; dash?: string; text: string }> = {
  published: { fill: "var(--background)", stroke: "var(--accent)", text: "var(--foreground)" },
  "in-progress": { fill: "var(--background)", stroke: "var(--warning)", text: "var(--foreground)" },
  planned: { fill: "var(--background)", stroke: "var(--muted)", dash: "4 3", text: "var(--muted)" },
  parked: { fill: "var(--surface-2)", stroke: "var(--border)", text: "var(--muted)" },
};

/** Split a title into at most two lines of ~`max` characters, with an ellipsis if it overflows. */
function wrap(label: string, max = 21): string[] {
  const words = label.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (line && (line + " " + w).length > max) {
      lines.push(line);
      line = w;
    } else {
      line = line ? `${line} ${w}` : w;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= 2) return lines;
  const second = lines.slice(1).join(" ");
  return [lines[0], second.length > max ? `${second.slice(0, max - 1).trimEnd()}…` : second];
}

/**
 * The prerequisite graph of the course map: part bands, lessons as boxes styled
 * by status, arrows from prerequisite to dependent. Hovering or focusing a
 * lesson highlights everything it builds on. Visible lessons are links; the
 * full structure is also given as text by the page (Golden rule 5).
 */
export function PrerequisiteGraph({
  nodes,
  edges,
  bands,
  lanes,
  width,
  height,
  ariaLabel,
}: {
  nodes: GraphNodeView[];
  edges: { from: string; to: string }[];
  bands: GraphBandView[];
  lanes: GraphLaneView[];
  width: number;
  height: number;
  ariaLabel: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const bySlug = useMemo(() => new Map(nodes.map((n) => [n.slug, n])), [nodes]);
  const lit = useMemo(() => {
    if (!active) return null;
    const set = ancestors(active, edges);
    set.add(active);
    return set;
  }, [active, edges]);

  const { nodeW, nodeH, padX } = GRAPH;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="group"
      aria-label={ariaLabel}
      className="block"
    >
      <defs>
        <marker id="prereq-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--faint)" />
        </marker>
        <marker id="prereq-arrow-lit" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
        </marker>
      </defs>

      <g aria-hidden="true">
        {bands.map((b) => (
          <g key={b.key}>
            <rect x={0} y={b.y} width={width} height={b.height} rx={8} fill="var(--surface)" />
            <text
              x={padX}
              y={b.y + 17}
              fontSize="11"
              fontWeight="600"
              letterSpacing="0.06em"
              fill="var(--muted)"
            >
              {b.label.toUpperCase()}
            </text>
          </g>
        ))}

        {lanes.map((l) => (
          <g key={l.key}>
            {!l.first && <line x1={padX} x2={width - padX} y1={l.y} y2={l.y} stroke="var(--border)" />}
            <text x={padX} y={l.y + 13} fontSize="10.5" fontWeight="600" fill="var(--muted)">
              {l.label}
            </text>
          </g>
        ))}

        {edges.map(({ from, to }) => {
          const a = bySlug.get(from);
          const b = bySlug.get(to);
          if (!a || !b) return null;
          const x1 = a.x + nodeW;
          const y1 = a.y + nodeH / 2;
          const x2 = b.x - 2;
          const y2 = b.y + nodeH / 2;
          const dx = Math.max(24, (x2 - x1) / 2);
          const on = lit?.has(from) && lit.has(to);
          return (
            <path
              key={`${from}>${to}`}
              d={`M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`}
              fill="none"
              stroke={on ? "var(--accent)" : "var(--faint)"}
              strokeWidth={on ? 2 : 1.1}
              opacity={lit && !on ? 0.25 : 1}
              markerEnd={on ? "url(#prereq-arrow-lit)" : "url(#prereq-arrow)"}
            />
          );
        })}
      </g>

      {nodes.map((n) => {
        const box = BOX[n.status];
        const lines = wrap(n.label);
        const dim = lit ? !lit.has(n.slug) : false;
        const opacity = dim ? 0.25 : n.external || n.status === "parked" ? 0.6 : 1;
        const cx = n.x + nodeW / 2;
        const cy = n.y + nodeH / 2;
        const body = (
          <>
            <title>{n.description}</title>
            <rect
              x={n.x}
              y={n.y}
              width={nodeW}
              height={nodeH}
              rx={6}
              fill={box.fill}
              stroke={lit?.has(n.slug) ? "var(--accent)" : box.stroke}
              strokeWidth={n.slug === active ? 2.5 : 1.4}
              strokeDasharray={box.dash}
            />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="11"
              fontWeight={n.href ? 600 : 500}
              fill={box.text}
            >
              {lines.length === 1 ? (
                lines[0]
              ) : (
                <>
                  <tspan x={cx} dy="-0.6em">
                    {lines[0]}
                  </tspan>
                  <tspan x={cx} dy="1.2em">
                    {lines[1]}
                  </tspan>
                </>
              )}
            </text>
          </>
        );
        const handlers = {
          onMouseEnter: () => setActive(n.slug),
          onMouseLeave: () => setActive(null),
        };
        return n.href ? (
          <a
            key={n.slug}
            href={n.href}
            aria-label={n.description}
            style={{ opacity }}
            className="motion-safe:transition-opacity"
            onFocus={() => setActive(n.slug)}
            onBlur={() => setActive(null)}
            {...handlers}
          >
            {body}
          </a>
        ) : (
          <g key={n.slug} aria-hidden="true" opacity={opacity} className="motion-safe:transition-opacity" {...handlers}>
            {body}
          </g>
        );
      })}
    </svg>
  );
}
