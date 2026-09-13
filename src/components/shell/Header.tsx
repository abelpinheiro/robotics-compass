import Link from "next/link";
import { CompassLogo } from "./CompassLogo";
import { SidebarToggle } from "./SidebarToggle";
import { LanguageToggle } from "./LanguageToggle";

/**
 * Slim top bar: compass logo + wordmark linking home. Light theme, sticky.
 * Keyboard reachable with a visible focus ring (handled globally in
 * globals.css).
 */
export function Header() {
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/90 backdrop-blur">
      <div className="flex h-full items-center gap-2 px-4 sm:px-6">
        <SidebarToggle />
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md py-1 font-serif text-lg font-semibold tracking-tight"
        >
          <span className="text-accent">
            <CompassLogo className="h-6 w-6" />
          </span>
          <span>Robotics Compass</span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/playground"
            className="rounded-md px-2 py-1 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground"
          >
            Playground
          </Link>
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
