import type { ReactNode } from "react";

type CalloutVariant = "info" | "warning" | "success";

const VARIANTS: Record<
  CalloutVariant,
  { container: string; defaultTitle: string }
> = {
  // The variant is conveyed by the colored border + the title word, so the
  // title text stays at foreground color to guarantee AA contrast (the accent/
  // warning/success tokens are too light for small text on their tints).
  info: { container: "border-accent/60 bg-accent-weak", defaultTitle: "Note" },
  warning: {
    container: "border-warning/60 bg-warning/10",
    defaultTitle: "Warning",
  },
  success: {
    container: "border-success/60 bg-success/10",
    defaultTitle: "Tip",
  },
};

/**
 * Boxed note for lessons. Token-driven backgrounds/borders with AA-contrast
 * text. The title acts as a semantic label for the note.
 */
export function Callout({
  variant = "info",
  title,
  children,
}: {
  variant?: CalloutVariant;
  title?: string;
  children: ReactNode;
}) {
  const styles = VARIANTS[variant];
  return (
    <div
      role="note"
      className={`my-6 rounded-card border-l-4 px-4 py-3 ${styles.container}`}
    >
      <p className="mb-1 font-serif text-sm font-semibold tracking-wide text-foreground">
        {title ?? styles.defaultTitle}
      </p>
      <div className="text-sm text-foreground/90">{children}</div>
    </div>
  );
}
