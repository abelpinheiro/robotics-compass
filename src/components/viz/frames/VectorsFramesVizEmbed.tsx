"use client";

import dynamic from "next/dynamic";

// Dynamically import with ssr:false — three needs `window` — and lazy-load.
const VectorsFramesViz = dynamic(() => import("./VectorsFramesViz"), {
  ssr: false,
  loading: () => (
    <div className="my-8 grid h-72 place-items-center rounded-card border border-border bg-surface text-sm text-muted">
      Loading visualization…
    </div>
  ),
});

export default function VectorsFramesVizEmbed() {
  return <VectorsFramesViz />;
}
