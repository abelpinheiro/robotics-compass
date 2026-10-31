import { notFound } from "next/navigation";

// Any unknown URL under /<locale>/ renders the localized not-found page inside
// the site layout (instead of Next's bare default 404).
export default function CatchAll() {
  notFound();
}
