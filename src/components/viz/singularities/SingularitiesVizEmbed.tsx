"use client";

import dynamic from "next/dynamic";

// Client-only (canvas + three read window/getComputedStyle) and lazy-loaded
// until the lesson needs it (Golden rule 6).
const SingularitiesViz = dynamic(() => import("./SingularitiesViz"), {
  ssr: false,
  loading: () => (
    <div className="my-8 grid h-72 place-items-center rounded-card border border-border bg-surface text-sm text-muted">
      Loading visualization…
    </div>
  ),
});

export default function SingularitiesVizEmbed() {
  return <SingularitiesViz />;
}
