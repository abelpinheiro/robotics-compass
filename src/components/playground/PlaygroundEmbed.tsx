"use client";

import dynamic from "next/dynamic";

// Client-only + lazy: the playground drives a three.js scene, which needs
// `window` (Golden rule 6). A full-screen dark loading state avoids a
// light-shell flash before the simulator mounts.
const RobotPlayground = dynamic(() => import("./RobotPlayground"), {
  ssr: false,
  loading: () => (
    <div
      data-theme="dark"
      className="theme-dark fixed inset-0 z-40 grid place-items-center bg-background text-sm text-muted"
    >
      Loading simulator…
    </div>
  ),
});

export default function PlaygroundEmbed() {
  return <RobotPlayground />;
}
