import type { Chapter, Part } from "@/lib/curriculum";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

/** "Parte II · Cinemática e dinâmica de manipuladores", or just the title when unnumbered. */
export function partLabel(part: Part, locale: Locale): string {
  const title = part.title[locale];
  return part.numeral ? `${getDictionary(locale).nav.part(part.numeral)} · ${title}` : title;
}

/** "4 · Jacobianas: velocidades e forças estáticas", or just the title when unnumbered. */
export function chapterLabel(chapter: Chapter, locale: Locale): string {
  const title = chapter.title[locale];
  return chapter.number !== undefined ? `${chapter.number} · ${title}` : title;
}

/** A part whose only chapter is unnumbered (case studies) lists its lessons directly. */
export function hasChapterHeadings(part: Part): boolean {
  return !(part.chapters.length === 1 && part.chapters[0].number === undefined);
}
