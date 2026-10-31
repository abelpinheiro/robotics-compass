import { isValidElement, type ReactNode } from "react";

/** Plain text of a heading's children (strings, numbers and nested elements). */
export function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

/** URL-fragment id for a heading: "Definição formal" → "definicao-formal". */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Lesson headings get ids so links can point at a section (e.g. a motivating
// question's "where we answer it", or a deep link to a lesson section).
export function H2({ children }: { children?: ReactNode }) {
  return <h2 id={slugify(textOf(children)) || undefined}>{children}</h2>;
}

export function H3({ children }: { children?: ReactNode }) {
  return <h3 id={slugify(textOf(children)) || undefined}>{children}</h3>;
}
