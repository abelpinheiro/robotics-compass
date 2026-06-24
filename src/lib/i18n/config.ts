export const locales = ["en", "pt"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "pt";
}

/**
 * Pick a supported locale from an Accept-Language header (browser/OS language).
 * Falls back to the default locale.
 */
export function detectLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return defaultLocale;
  const langs = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0].trim().toLowerCase());
  for (const lang of langs) {
    if (lang.startsWith("pt")) return "pt";
    if (lang.startsWith("en")) return "en";
  }
  return defaultLocale;
}
