/**
 * Capture responsive screenshots of key pages with Playwright.
 *
 * Usage:
 *   pnpm build && pnpm start        # serve the app (in another terminal)
 *   pnpm screenshots                # writes PNGs to ./screenshots
 *
 * Override the target with BASE_URL, e.g. BASE_URL=http://localhost:3001.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "screenshots";
const WIDTHS = [375, 768, 1440, 1920];

const PAGES = [
  ["home", "/"],
  ["a-star", "/lessons/path-planning/a-star"],
  ["forward-kinematics", "/lessons/kinematics/forward-kinematics"],
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
try {
  for (const [name, path] of PAGES) {
    for (const width of WIDTHS) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(BASE_URL + path, { waitUntil: "networkidle" });
      // Let lazily-loaded 2D/3D visualizations render.
      await page.waitForTimeout(1800);
      await page.screenshot({ path: `${OUT}/${name}-${width}.png`, fullPage: true });
      await page.close();
      console.log(`captured ${name} @ ${width}px`);
    }
  }
} finally {
  await browser.close();
}
