import type { LessonStatus } from "@/lib/curriculum";

// Small uppercase status tag used by the sidebar and the course map. Planned
// and parked items use an outline so they read as "not available yet".
const STYLE: Record<LessonStatus, string> = {
  published: "bg-accent-weak text-accent",
  "in-progress": "bg-surface-2 text-muted",
  planned: "border border-dashed border-faint text-muted",
  parked: "border border-border text-muted",
};

export function StatusBadge({ status, label }: { status: LessonStatus; label: string }) {
  return (
    <span
      className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[0.625rem] leading-none font-medium tracking-wide whitespace-nowrap uppercase ${STYLE[status]}`}
    >
      {label}
    </span>
  );
}
