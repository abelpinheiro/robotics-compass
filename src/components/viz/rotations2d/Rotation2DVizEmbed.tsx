"use client";

import dynamic from "next/dynamic";

const Rotation2DViz = dynamic(() => import("./Rotation2DViz"), {
  ssr: false,
  loading: () => (
    <div className="my-8 grid h-72 place-items-center rounded-card border border-border bg-surface text-sm text-muted">
      Loading visualization…
    </div>
  ),
});

export default function Rotation2DVizEmbed(props: {
  pBody?: { x: number; y: number };
  initialDeg?: number;
  title?: string;
  caption?: string;
}) {
  return <Rotation2DViz {...props} />;
}
