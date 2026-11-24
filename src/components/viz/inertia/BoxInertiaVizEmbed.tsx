"use client";

import dynamic from "next/dynamic";
import { VizLoading } from "./VizLoading";

// Client-only and lazy-loaded (Golden rule 6).
const BoxInertiaViz = dynamic(() => import("./BoxInertiaViz"), { ssr: false, loading: () => <VizLoading /> });

export default function BoxInertiaVizEmbed() {
  return <BoxInertiaViz />;
}
