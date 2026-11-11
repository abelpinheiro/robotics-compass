import katex from "katex";
import type { Locale } from "@/lib/i18n/config";

// Renders exercise text (statements, hints, solutions, options) to HTML on the
// server. A deliberately small format, so exercise data files stay plain TS:
//   - blank lines separate paragraphs; a paragraph that is only $$…$$ is display math
//   - $…$ inline math and $$…$$ display math (KaTeX; errors throw, so tests catch them)
//   - **bold**, *italic*, `code`
//   - {{name}} or {{name:2}} interpolates a parameter (2 = fixed decimals); numbers
//     use a decimal comma in Portuguese ("0,5" in text, "0{,}5" inside math)

export type Values = Record<string, number | string>;

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** Format a number for display: fixed decimals when given, else up to 4 significant digits. */
export function formatNumber(value: number, locale: Locale, decimals?: number, inMath = false): string {
  const s = decimals === undefined ? String(Number(value.toPrecision(4))) : value.toFixed(decimals);
  if (locale !== "pt") return s;
  return s.replace(".", inMath ? "{,}" : ",");
}

function interpolate(text: string, values: Values, locale: Locale, inMath: boolean): string {
  return text.replace(/\{\{\s*([A-Za-z_][\w]*)\s*(?::(\d+))?\s*\}\}/g, (_, name: string, dec?: string) => {
    if (!(name in values)) throw new Error(`unknown placeholder {{${name}}}`);
    const v = values[name];
    return typeof v === "number" ? formatNumber(v, locale, dec === undefined ? undefined : Number(dec), inMath) : String(v);
  });
}

function math(tex: string, displayMode: boolean): string {
  return katex.renderToString(tex, { displayMode, throwOnError: true, output: "html", strict: "ignore" });
}

function markup(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

/** One paragraph's content (no <p>), with inline and display math. */
export function renderInline(text: string, values: Values, locale: Locale): string {
  let html = "";
  let last = 0;
  for (const m of text.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g)) {
    html += markup(escapeHtml(interpolate(text.slice(last, m.index), values, locale, false)));
    const display = m[1] !== undefined;
    html += math(interpolate(display ? m[1] : m[2], values, locale, true), display);
    last = m.index! + m[0].length;
  }
  html += markup(escapeHtml(interpolate(text.slice(last), values, locale, false)));
  if (html.includes("{{")) throw new Error(`unresolved placeholder in "${text}"`);
  return html;
}

/** A block of text: paragraphs separated by blank lines. */
export function renderText(text: string, values: Values, locale: Locale): string {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const b = block.trim();
      const display = b.match(/^\$\$([\s\S]+)\$\$$/);
      if (display) return math(interpolate(display[1], values, locale, true), true);
      return `<p>${renderInline(b.replace(/\s*\n\s*/g, " "), values, locale)}</p>`;
    })
    .join("");
}

/** Render a TeX snippet on its own (e.g. a unit). */
export function renderTex(tex: string, values: Values, locale: Locale): string {
  return math(interpolate(tex, values, locale, true), false);
}

/**
 * Split a one-paragraph template at its [[gap]] markers into rendered HTML
 * pieces and gap ids, e.g. "a [[x]] b" → [{html:"a "}, {gap:"x"}, {html:" b"}].
 */
export function renderWithGaps(text: string, values: Values, locale: Locale): ({ html: string } | { gap: string })[] {
  const parts: ({ html: string } | { gap: string })[] = [];
  const flat = text.trim().replace(/\s*\n\s*/g, " ");
  let last = 0;
  for (const m of flat.matchAll(/\[\[([a-z0-9-]+)\]\]/g)) {
    const before = flat.slice(last, m.index);
    if (before) parts.push({ html: renderInline(before, values, locale) });
    parts.push({ gap: m[1] });
    last = m.index! + m[0].length;
  }
  const rest = flat.slice(last);
  if (rest) parts.push({ html: renderInline(rest, values, locale) });
  return parts;
}
