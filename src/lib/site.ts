/**
 * Canonical site origin used for metadata, sitemap, and robots.
 * Set NEXT_PUBLIC_SITE_URL in the environment (e.g. on Vercel) for production;
 * falls back to localhost in development.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");
