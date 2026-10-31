"use client";

import dynamic from "next/dynamic";

const UR20IKViz = dynamic(() => import("./UR20IKViz"), {
  ssr: false,
  loading: () => (
    <div className="my-8 grid h-72 place-items-center rounded-card border border-border bg-surface text-sm text-muted">
      Loading visualization…
    </div>
  ),
});

export default function UR20IKVizEmbed() {
  return <UR20IKViz />;
}
