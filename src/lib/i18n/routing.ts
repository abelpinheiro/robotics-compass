import { detectLocale, isLocale, locales, type Locale } from "./config";

// URL-based locale routing: every page lives under /<locale>/… (app/[lang]/).
// These helpers are pure so the proxy, the language toggle and links share one
// definition (and are tested).

/** `/pt/lessons/a/b` for ("pt", "/lessons/a/b"); `/pt` for ("pt", "/"). */
export function localePath(locale: Locale, path: string): string {
  if (path === "/" || path === "") return `/${locale}`;
  return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}

/** The locale a pathname starts with, if any. */
export function pathLocale(pathname: string): Locale | undefined {
  const first = pathname.split("/")[1];
  return isLocale(first) ? first : undefined;
}

/** The pathname without its locale prefix (always starts with "/"). */
export function stripLocale(pathname: string): string {
  const locale = pathLocale(pathname);
  if (!locale) return pathname || "/";
  return pathname.slice(locale.length + 1) || "/";
}

/** The same page in another locale (adds the prefix when there is none). */
export function switchLocalePath(pathname: string, locale: Locale): string {
  return localePath(locale, stripLocale(pathname));
}

/**
 * Where a request without a locale prefix should be redirected: the locale
 * saved by the language toggle (cookie), else the browser language
 * (Accept-Language), else the default. Returns null when the path already has
 * a locale.
 */
export function localeRedirect(
  pathname: string,
  cookieLocale: string | undefined,
  acceptLanguage: string | null | undefined,
): string | null {
  if (pathLocale(pathname)) return null;
  const locale = isLocale(cookieLocale) ? cookieLocale : detectLocale(acceptLanguage);
  return localePath(locale, pathname);
}

/**
 * Prefix an internal link written without a locale (e.g. `/lessons/…` in a
 * lesson's MDX) with the current locale. External links, anchors, static
 * assets (any path with a file extension, /images/, /models/) and links that
 * already carry a locale are returned unchanged.
 */
export function localizeHref(locale: Locale, href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  if (pathLocale(href)) return href;
  const path = href.split(/[?#]/)[0];
  if (/^\/(images|models)\//.test(path) || /\.[a-z0-9]+$/i.test(path)) return href;
  return localePath(locale, href);
}

/** Metadata `alternates` for a page: its canonical URL plus one per locale (hreflang). */
export function localeAlternates(locale: Locale, path: string) {
  return {
    canonical: localePath(locale, path),
    languages: Object.fromEntries(locales.map((l) => [l, localePath(l, path)])) as Record<Locale, string>,
  };
}
