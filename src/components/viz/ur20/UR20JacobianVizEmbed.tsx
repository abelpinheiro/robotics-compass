"use client";

import dynamic from "next/dynamic";

const UR20JacobianViz = dynamic(() => import("./UR20JacobianViz"), {
  ssr: false,
  loading: () => (
    <div className="my-8 grid h-72 place-items-center rounded-card border border-border bg-surface text-sm text-muted">
      Loading visualization…
    </div>
  ),
});

export default function UR20JacobianVizEmbed() {
  return <UR20JacobianViz />;
}
