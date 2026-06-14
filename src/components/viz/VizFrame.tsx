import type { ReactNode } from "react";

/**
 * The framed container every visualization sits in. Provides consistent
 * border/radius/padding, an optional caption, a controls region, and the
 * REQUIRED text alternative (Golden rule 5) describing what the viz shows.
 *
 * The text alternative is always rendered in a collapsible <details> so it is
 * available to everyone (and to screen readers / reduced-motion users) without
 * depending on the canvas.
 */
export function VizFrame({
  title,
  caption,
  textAlternative,
  controls,
  children,
}: {
  title?: string;
  /** short caption shown under the viz */
  caption?: string;
  /** required: prose description of what the viz depicts and its current state */
  textAlternative: string;
  /** optional controls region (buttons, sliders, selects) */
  controls?: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="my-8 overflow-hidden rounded-card border border-border bg-surface">
      {title && (
        <figcaption className="border-b border-border px-4 py-2.5 font-serif text-sm font-semibold">
          {title}
        </figcaption>
      )}

      <div className="p-3">{children}</div>

      {controls && (
        <div className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-3">
          {controls}
        </div>
      )}

      <div className="border-t border-border px-4 py-2.5 text-sm text-muted">
        {caption && <p className="mb-1">{caption}</p>}
        <details>
          <summary className="cursor-pointer text-xs font-medium text-accent">
            Text description
          </summary>
          <p className="mt-1 text-xs text-muted">{textAlternative}</p>
        </details>
      </div>
    </figure>
  );
}
