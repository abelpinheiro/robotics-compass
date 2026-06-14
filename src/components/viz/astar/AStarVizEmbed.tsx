"use client";

import dynamic from "next/dynamic";

// Lazy-load the visualization so the lesson page ships without the viz bundle
// until it is needed (Golden rule 6).
const AStarViz = dynamic(
  () => import("./AStarViz").then((m) => ({ default: m.AStarViz })),
  {
    ssr: false,
    loading: () => (
      <div className="my-8 grid h-72 place-items-center rounded-card border border-border bg-surface text-sm text-muted">
        Loading visualization…
      </div>
    ),
  },
);

export default function AStarVizEmbed() {
  return <AStarViz />;
}
