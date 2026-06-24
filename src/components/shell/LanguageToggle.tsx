"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { locales, type Locale } from "@/lib/i18n/config";

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div
      role="group"
      aria-label={t.langToggle.label}
      className="flex rounded-md border border-border bg-surface p-0.5 text-xs"
    >
      {locales.map((l: Locale) => (
        <button
          key={l}
          type="button"
          aria-pressed={locale === l}
          onClick={() => setLocale(l)}
          className={`rounded px-2 py-1 font-medium transition-colors ${
            locale === l
              ? "bg-accent text-background"
              : "text-muted hover:text-foreground"
          }`}
        >
          {t.langToggle[l]}
        </button>
      ))}
    </div>
  );
}
