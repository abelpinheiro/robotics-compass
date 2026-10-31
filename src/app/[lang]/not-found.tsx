"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/** 404 inside the [lang] layout, in the reader's language. */
export default function NotFound() {
  const { t, href } = useLocale();
  return (
    <div className="lesson-prose">
      <h1 className="text-[2rem] leading-tight font-semibold">{t.notFound.title}</h1>
      <p className="mt-3 text-lg text-muted">{t.notFound.body}</p>
      <p className="mt-6 flex gap-4">
        <Link href={href("/course-map")} className="font-medium text-accent">
          {t.nav.courseMap} →
        </Link>
        <Link href={href("/")} className="font-medium text-accent">
          {t.notFound.home}
        </Link>
      </p>
    </div>
  );
}
