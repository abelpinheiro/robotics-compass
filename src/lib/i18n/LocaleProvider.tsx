"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "./config";
import { dictionaries, type Dictionary } from "./dictionaries";
import { localePath, switchLocalePath } from "./routing";

interface LocaleContextValue {
  locale: Locale;
  t: Dictionary;
  /** Go to the current page in another locale (and remember the choice). */
  setLocale: (locale: Locale) => void;
  /** Prefix an app path with the current locale, e.g. "/course-map" → "/pt/course-map". */
  href: (path: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * The active locale comes from the URL (/<locale>/…, passed down by the
 * [lang] layout). Switching language navigates to the same page under the
 * other prefix; the cookie only remembers the choice for unprefixed URLs.
 */
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      router.push(switchLocalePath(pathname, next));
    },
    [router, pathname],
  );
  const href = useCallback((path: string) => localePath(locale, path), [locale]);

  return (
    <LocaleContext.Provider value={{ locale, t: dictionaries[locale], setLocale, href }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}
