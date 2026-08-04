"use client";

import dynamic from "next/dynamic";

const MDPGridViz = dynamic(() => import("./MDPGridViz"), {
  ssr: false,
  loading: () => (
    <div className="my-8 grid h-72 place-items-center rounded-card border border-border bg-surface text-sm text-muted">
      Loading visualization…
    </div>
  ),
});

export default function MDPGridVizEmbed() {
  return <MDPGridViz />;
}
