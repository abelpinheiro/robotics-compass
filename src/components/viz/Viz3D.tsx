"use client";

import type { ReactNode } from "react";

/**
 * Wrapper for react-three-fiber scenes. Applies the SCOPED dark theme
 * (`.theme-dark`) around the canvas so the embedded 3D surface uses the dark
 * token palette while the surrounding lesson stays light (Golden rule 2).
 *
 * The actual <Canvas> / scene is passed as children and MUST be dynamically
 * imported with `{ ssr: false }` by the consumer, because three needs `window`
 * (Golden rule 6). See the viz-3d skill.
 *
 * Usage:
 *   const ArmScene = dynamic(() => import("@/components/viz/ArmScene"), { ssr: false });
 *   <Viz3D><ArmScene /></Viz3D>
 */
export function Viz3D({
  children,
  aspectRatio = 16 / 9,
  className,
}: {
  children: ReactNode;
  aspectRatio?: number;
  className?: string;
}) {
  return (
    <div
      data-theme="dark"
      className={`theme-dark relative w-full overflow-hidden rounded-lg bg-background ${className ?? ""}`}
      style={{ aspectRatio: String(aspectRatio) }}
    >
      {children}
    </div>
  );
}
