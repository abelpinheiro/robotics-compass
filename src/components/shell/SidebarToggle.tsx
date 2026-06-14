"use client";

import { useSidebar } from "./sidebar-context";

/** Hamburger toggle shown in the header on small screens. */
export function SidebarToggle() {
  const { open, toggle } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-controls="curriculum-nav"
      aria-label="Toggle navigation"
      className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-foreground md:hidden"
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        {open ? (
          <path d="M6 6l12 12M18 6L6 18" />
        ) : (
          <path d="M4 7h16M4 12h16M4 17h16" />
        )}
      </svg>
    </button>
  );
}
