"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { localizeHref } from "@/lib/i18n/routing";

/**
 * Links written in lesson MDX. Internal links are authored without a locale
 * (e.g. `/lessons/dynamics/newton-euler`); this prefixes the reader's locale
 * so lesson content never needs to know about /<locale>/ URLs. Everything else
 * (external links, anchors, assets) renders as a plain <a>.
 */
export function MdxLink({ href = "", ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { locale } = useLocale();
  const target = localizeHref(locale, href);
  return target !== href ? <Link href={target} {...props} /> : <a href={href} {...props} />;
}
