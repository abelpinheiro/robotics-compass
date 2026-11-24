"use client";

import dynamic from "next/dynamic";
import { VizLoading } from "./VizLoading";

// Client-only and lazy-loaded (Golden rule 6).
const RodInertiaViz = dynamic(() => import("./RodInertiaViz"), { ssr: false, loading: () => <VizLoading /> });

export default function RodInertiaVizEmbed() {
  return <RodInertiaViz />;
}
