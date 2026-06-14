import type { ReactNode } from "react";

type CalloutVariant = "info" | "warning" | "success";

const VARIANTS: Record<
  CalloutVariant,
  { container: string; label: string; defaultTitle: string }
> = {
  info: {
    container: "border-accent/40 bg-accent-weak",
    label: "text-accent",
    defaultTitle: "Note",
  },
  warning: {
    container: "border-warning/40 bg-warning/10",
    label: "text-warning",
    defaultTitle: "Warning",
  },
  success: {
    container: "border-success/40 bg-success/10",
    label: "text-success",
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
      <p
        className={`mb-1 font-serif text-sm font-semibold tracking-wide ${styles.label}`}
      >
        {title ?? styles.defaultTitle}
      </p>
      <div className="text-sm text-foreground/90">{children}</div>
    </div>
  );
}
