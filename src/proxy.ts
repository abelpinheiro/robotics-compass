import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE } from "@/lib/i18n/config";
import { localeRedirect } from "@/lib/i18n/routing";

/**
 * Every page lives under /<locale>/…. A request without a locale prefix (the
 * bare domain, or an old /lessons/… link) is redirected to the reader's
 * language: the toggle's saved choice, else the browser language.
 */
export function proxy(request: NextRequest) {
  const target = localeRedirect(
    request.nextUrl.pathname,
    request.cookies.get(LOCALE_COOKIE)?.value,
    request.headers.get("accept-language"),
  );
  if (!target) return;
  const url = request.nextUrl.clone();
  url.pathname = target;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, static assets (any path with a dot) and the metadata routes.
  matcher: ["/((?!_next|api|images|models|sitemap.xml|robots.txt|.*\\..*).*)"],
};
