"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";

/** Placeholder shown while a lazy visualization loads, in the reader's locale. */
export function VizLoading() {
  const { t } = useLocale();
  return (
    <div className="my-8 grid h-72 place-items-center rounded-card border border-border bg-surface text-sm text-muted">
      {t.viz.loading}
    </div>
  );
}
