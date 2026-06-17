"use client";

import dynamic from "next/dynamic";

const SE3Viz = dynamic(() => import("./SE3Viz"), {
  ssr: false,
  loading: () => (
    <div className="my-8 grid h-72 place-items-center rounded-card border border-border bg-surface text-sm text-muted">
      Loading visualization…
    </div>
  ),
});

export default function SE3VizEmbed() {
  return <SE3Viz />;
}
