"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export interface VizSize {
  width: number;
  height: number;
}

/**
 * Wrapper for 2D (D3 + Canvas) visualizations. Measures its container with a
 * ResizeObserver and hands the current { width, height } to a render-prop so
 * drawing code never reads `window` directly. Light theme (2D viz live in
 * light lessons).
 *
 * Usage:
 *   <Viz2D aspectRatio={1}>
 *     {({ width, height }) => <GridCanvas width={width} height={height} />}
 *   </Viz2D>
 */
export function Viz2D({
  children,
  aspectRatio = 16 / 9,
  className,
}: {
  children: (size: VizSize) => ReactNode;
  /** width / height; the box height is derived from the measured width */
  aspectRatio?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const height = width > 0 ? Math.round(width / aspectRatio) : 0;

  return (
    <div
      ref={ref}
      className={`relative w-full overflow-hidden rounded-lg bg-background ${className ?? ""}`}
      style={{ aspectRatio: String(aspectRatio) }}
    >
      {width > 0 && children({ width, height })}
    </div>
  );
}
