// Small pieces shared by the exercise runner and its lazily loaded answer
// areas (interactive widgets, Python).

export type Feedback = { ok: boolean; message: string; detailHtml?: string } | null;

export const Html = ({ html, inline = false }: { html: string; inline?: boolean }) =>
  inline ? <span dangerouslySetInnerHTML={{ __html: html }} /> : <div dangerouslySetInnerHTML={{ __html: html }} />;

export const inputClass =
  "rounded-md border border-border bg-background px-2.5 py-1.5 text-[0.9375rem] text-foreground focus:border-accent";
export const primaryButton =
  "rounded-md border border-accent bg-accent px-3 py-1.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50";
export const secondaryButton =
  "rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-2 disabled:opacity-50";

/** The checked result, announced to screen readers. */
export function Result({ feedback }: { feedback: Feedback }) {
  return (
    <div role="status" aria-live="polite">
      {feedback && (
        <div
          className={`mt-3 rounded-lg border-l-4 bg-surface px-3 py-2 text-[0.9375rem] text-foreground ${
            feedback.ok ? "border-success" : "border-danger"
          }`}
        >
          <p className="!my-0 font-semibold">
            <span aria-hidden="true">{feedback.ok ? "✓ " : "✗ "}</span>
            {feedback.message}
          </p>
          {feedback.detailHtml && <Html html={feedback.detailHtml} />}
        </div>
      )}
    </div>
  );
}
