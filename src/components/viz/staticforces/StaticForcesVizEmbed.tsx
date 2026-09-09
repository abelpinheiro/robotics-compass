"use client";

import dynamic from "next/dynamic";

// Client-only (canvas reads window/getComputedStyle) and lazy-loaded until the
// lesson needs it (Golden rule 6).
const StaticForcesViz = dynamic(() => import("./StaticForcesViz"), {
  ssr: false,
  loading: () => (
    <div className="my-8 grid h-72 place-items-center rounded-card border border-border bg-surface text-sm text-muted">
      Loading visualization…
    </div>
  ),
});

export default function StaticForcesVizEmbed() {
  return <StaticForcesViz />;
}
