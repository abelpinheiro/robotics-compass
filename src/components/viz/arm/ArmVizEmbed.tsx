"use client";

import dynamic from "next/dynamic";

// Dynamically import with ssr:false — three needs `window` — and lazy-load the
// whole viz bundle until the lesson needs it (Golden rule 6).
const ArmViz = dynamic(() => import("./ArmViz"), {
  ssr: false,
  loading: () => (
    <div className="my-8 grid h-72 place-items-center rounded-card border border-border bg-surface text-sm text-faint">
      Loading visualization…
    </div>
  ),
});

export default function ArmVizEmbed() {
  return <ArmViz />;
}
