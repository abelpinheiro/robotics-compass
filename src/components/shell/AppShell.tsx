import type { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { SidebarProvider } from "./sidebar-context";

/**
 * Top-level light-theme layout: a skip link, the Header, then a two-column body
 * (Sidebar + main content with a comfortable reading measure). Wraps every page
 * via the root layout.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-dvh bg-background">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:shadow-md"
        >
          Skip to content
        </a>

        <Header />

        <div className="mx-auto flex w-full max-w-7xl px-0 sm:px-6">
          <Sidebar />
          <main
            id="main-content"
            className="min-w-0 flex-1 px-4 pt-8 pb-16 sm:px-8 sm:pt-10"
          >
            <div className="mx-auto max-w-[68ch]">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
