"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { localizeHref } from "@/lib/i18n/routing";
import { lessonUiStrings } from "./strings";

/**
 * The question that opens a lesson. The author writes the question as the
 * children; `answer` optionally points at the section that answers it
 * (e.g. "#singularities", or another lesson's path).
 */
export function MotivatingQuestion({ answer, children }: { answer?: string; children: ReactNode }) {
  const { locale } = useLocale();
  const s = lessonUiStrings[locale];
  return (
    <aside
      aria-label={s.motivatingQuestion}
      className="my-8 rounded-card border-l-4 border-accent bg-accent-weak px-5 py-4"
    >
      <p className="!my-0 text-xs font-semibold tracking-wide text-accent uppercase">{s.motivatingQuestion}</p>
      <div className="mt-1 font-serif text-[1.1875rem] leading-snug text-foreground [&_p]:!my-0">{children}</div>
      {answer && (
        <a
          href={localizeHref(locale, answer)}
          className="mt-2 inline-block text-sm font-medium text-accent underline-offset-2 hover:underline"
        >
          {s.whereAnswered} <span aria-hidden="true">→</span>
        </a>
      )}
    </aside>
  );
}
