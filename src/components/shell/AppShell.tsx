import type { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { SidebarProvider } from "./sidebar-context";
import { getServerDictionary } from "@/lib/i18n/server";

/**
 * Top-level light-theme layout: a skip link, the Header, then a two-column body
 * (Sidebar + main content with a comfortable reading measure). Wraps every page
 * via the root layout.
 */
export async function AppShell({ children }: { children: ReactNode }) {
  const t = await getServerDictionary();
  return (
    <SidebarProvider>
      <div className="min-h-dvh bg-background">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:shadow-md"
        >
          {t.nav.skipToContent}
        </a>

        <Header />

        <div className="flex w-full">
          <Sidebar />
          <main
            id="main-content"
            className="min-w-0 flex-1 px-4 pt-8 pb-16 sm:px-8 sm:pt-10"
          >
            <div className="mx-auto max-w-[72ch]">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
