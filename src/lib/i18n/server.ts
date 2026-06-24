import "server-only";
import { cookies, headers } from "next/headers";
import {
  LOCALE_COOKIE,
  defaultLocale,
  detectLocale,
  isLocale,
  type Locale,
} from "./config";
import { getDictionary } from "./dictionaries";

/**
 * Resolve the active locale on the server: the `locale` cookie if set
 * (persisted choice / toggle), otherwise the browser/OS language from the
 * Accept-Language header, otherwise the default. Reading cookies/headers makes
 * consuming routes dynamic — required for cookie-based i18n without /[lang]/
 * route segments.
 */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const headerStore = await headers();
  return detectLocale(headerStore.get("accept-language")) ?? defaultLocale;
}

export async function getServerDictionary() {
  return getDictionary(await getLocale());
}
