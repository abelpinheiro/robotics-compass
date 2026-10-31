import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import { AppShell } from "@/components/shell/AppShell";
import { SITE_URL } from "@/lib/site";
import { isLocale, locales } from "@/lib/i18n/config";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import "../globals.css";
import "katex/dist/katex.min.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Robotics Compass",
    template: "%s · Robotics Compass",
  },
  description: "An interactive, visualization-first guide to robotics.",
};

// Every page lives under /<locale>/… and is generated statically for each
// locale. The proxy adds the prefix to unprefixed URLs; anything else is a 404.
// (No `dynamicParams = false` here: it would be inherited by every child route
// and turn their 404s into Next's bare fallback page instead of not-found.tsx.)
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html
      lang={lang}
      className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <LocaleProvider locale={lang}>
          <AppShell locale={lang}>{children}</AppShell>
        </LocaleProvider>
      </body>
    </html>
  );
}
