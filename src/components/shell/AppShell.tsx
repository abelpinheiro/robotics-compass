import type { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { SidebarProvider } from "./sidebar-context";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

/**
 * Top-level light-theme layout: a skip link, the Header, then a two-column body
 * (Sidebar + main content with a comfortable reading measure). Wraps every page
 * via the root layout.
 */
export function AppShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const t = getDictionary(locale);
  return (
    <SidebarProvider>
      <div className="min-h-dvh bg-background">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:shadow-md"
        >
          {t.nav.skipToContent}
        </a>

        <Header locale={locale} />

        <div className="flex w-full">
          <Sidebar />
          {/* An inline-size container, so a wide figure (the course-map graph)
              can span all of <main> beyond the reading column via cqw units. */}
          <main
            id="main-content"
            className="@container min-w-0 flex-1 px-4 pt-8 pb-16 sm:px-8 sm:pt-10"
          >
            <div className="mx-auto max-w-[72ch]">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
