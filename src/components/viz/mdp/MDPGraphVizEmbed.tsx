"use client";

import dynamic from "next/dynamic";

// No WebGL here, but keep it lazy-loaded and client-only for consistency with
// the other viz embeds (Golden rule 6).
const MDPGraphViz = dynamic(() => import("./MDPGraphViz"), {
  ssr: false,
  loading: () => (
    <div className="my-8 grid h-64 place-items-center rounded-card border border-border bg-surface text-sm text-muted">
      Loading visualization…
    </div>
  ),
});

export default function MDPGraphVizEmbed() {
  return <MDPGraphViz />;
}
