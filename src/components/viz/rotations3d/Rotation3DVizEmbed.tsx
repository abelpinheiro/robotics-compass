"use client";

import dynamic from "next/dynamic";

const Rotation3DViz = dynamic(() => import("./Rotation3DViz"), {
  ssr: false,
  loading: () => (
    <div className="my-8 grid h-72 place-items-center rounded-card border border-border bg-surface text-sm text-muted">
      Loading visualization…
    </div>
  ),
});

export default function Rotation3DVizEmbed() {
  return <Rotation3DViz />;
}
