"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { StatusBadge } from "@/components/course-map/StatusBadge";
import { lessonLink } from "./lessonLinks";
import { lessonUiStrings } from "./strings";

/**
 * A step-by-step derivation. The author writes each step as a <ProofStep>
 * (the claim, usually an equation) holding an optional <Why> (the
 * justification, collapsed by default). Steps are numbered automatically, and
 * one button opens or closes every "why?" at once.
 *
 *   <Proof>
 *   <ProofStep>
 *   $$ … $$
 *   <Why prereq="velocity-kinematics">…</Why>
 *   </ProofStep>
 *   </Proof>
 */
export function Proof({ title, children }: { title?: string; children: ReactNode }) {
  const { locale } = useLocale();
  const s = lessonUiStrings[locale];
  const list = useRef<HTMLOListElement>(null);
  const [allOpen, setAllOpen] = useState(false);

  const toggleAll = () => {
    const next = !allOpen;
    list.current?.querySelectorAll<HTMLDetailsElement>("details[data-why]").forEach((d) => {
      d.open = next;
    });
    setAllOpen(next);
  };

  return (
    <section aria-label={title ?? s.proof} className="my-6 rounded-card border border-border px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="!my-0 font-serif font-semibold text-foreground">{title ?? s.proof}</p>
        <button
          type="button"
          onClick={toggleAll}
          aria-pressed={allOpen}
          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface-2 hover:text-foreground"
        >
          {allOpen ? s.collapseAll : s.expandAll}
        </button>
      </div>
      <ol ref={list} className="!my-0 mt-2 list-none !pl-0 [counter-reset:proof-step]">
        {children}
      </ol>
    </section>
  );
}

/** One numbered step of a <Proof>: the claim, then an optional <Why>. */
export function ProofStep({ children }: { children: ReactNode }) {
  return (
    <li className="!my-0 grid grid-cols-[2rem_1fr] gap-3 border-t border-border py-3 first:border-t-0 [counter-increment:proof-step] before:mt-1 before:flex before:h-7 before:w-7 before:items-center before:justify-center before:rounded-full before:bg-surface-2 before:text-xs before:font-semibold before:text-muted before:content-[counter(proof-step)]">
      <div className="min-w-0 [&_.katex-display]:!my-1 [&>p]:!my-1">{children}</div>
    </li>
  );
}

/**
 * The justification of a step, behind a "Why?" toggle. `prereq` (a lesson
 * slug) adds a "Review:" link to the lesson the step relies on; a planned
 * lesson shows its title and status without a link.
 */
export function Why({ prereq, children }: { prereq?: string; children: ReactNode }) {
  const { locale } = useLocale();
  const s = lessonUiStrings[locale];
  const t = getDictionary(locale);
  const link = prereq ? lessonLink(prereq, locale) : undefined;

  return (
    <details data-why className="mt-1">
      <summary className="w-fit cursor-pointer rounded text-[0.9375rem] font-semibold text-accent">{s.why}</summary>
      <div className="mt-2 rounded-lg bg-surface px-3 py-2 text-[0.9375rem] [&>p:first-child]:!mt-0 [&>p:last-child]:!mb-0">
        {children}
        {link && (
          <p className="!mb-0 flex flex-wrap items-center gap-1.5 text-sm">
            <span className="text-muted">{s.review}</span>
            {link.href ? (
              <Link href={link.href} className="font-medium text-accent">
                {link.label}
              </Link>
            ) : (
              <>
                <span className="text-foreground">{link.label}</span>
                {link.status && <StatusBadge status={link.status} label={t.badge[link.status]} />}
              </>
            )}
          </p>
        )}
      </div>
    </details>
  );
}
