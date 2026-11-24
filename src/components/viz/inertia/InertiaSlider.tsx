"use client";

import type { ReactNode } from "react";

/** A labelled range input with its current value, shared by the inertia widgets. */
export function InertiaSlider({
  label,
  ariaLabel,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: ReactNode;
  ariaLabel: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span className="w-28 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-w-0 flex-1 accent-accent"
        aria-label={ariaLabel}
        aria-valuetext={display}
      />
      <span className="w-20 shrink-0 text-right tabular-nums text-foreground">{display}</span>
    </label>
  );
}
