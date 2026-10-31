import { describe, expect, it } from "vitest";
import {
  localeRedirect,
  localePath,
  localizeHref,
  pathLocale,
  stripLocale,
  switchLocalePath,
} from "./routing";

describe("locale paths", () => {
  it("prefixes paths, with the home page as the bare locale", () => {
    expect(localePath("pt", "/")).toBe("/pt");
    expect(localePath("en", "/course-map")).toBe("/en/course-map");
    expect(localePath("pt", "lessons/kinematics/jacobians")).toBe("/pt/lessons/kinematics/jacobians");
  });

  it("reads and strips the prefix, only for supported locales", () => {
    expect(pathLocale("/pt/lessons/a/b")).toBe("pt");
    expect(pathLocale("/en")).toBe("en");
    expect(pathLocale("/lessons/a/b")).toBeUndefined();
    expect(pathLocale("/english")).toBeUndefined();
    expect(stripLocale("/pt/lessons/a/b")).toBe("/lessons/a/b");
    expect(stripLocale("/en")).toBe("/");
    expect(stripLocale("/lessons/a")).toBe("/lessons/a");
  });

  it("switches a page to the other locale", () => {
    expect(switchLocalePath("/en/course-map/graph/planning-learning", "pt")).toBe("/pt/course-map/graph/planning-learning");
    expect(switchLocalePath("/pt", "en")).toBe("/en");
    expect(switchLocalePath("/playground", "pt")).toBe("/pt/playground");
  });
});

describe("localeRedirect (proxy)", () => {
  it("leaves prefixed paths alone", () => {
    expect(localeRedirect("/pt/course-map", "en", "en-US")).toBeNull();
    expect(localeRedirect("/en", undefined, undefined)).toBeNull();
  });

  it("prefers the saved cookie, then Accept-Language, then English", () => {
    expect(localeRedirect("/lessons/kinematics/jacobians", "pt", "en-US,en")).toBe("/pt/lessons/kinematics/jacobians");
    expect(localeRedirect("/", undefined, "pt-BR,pt;q=0.9,en;q=0.8")).toBe("/pt");
    expect(localeRedirect("/", "xx", "fr-FR")).toBe("/en");
    expect(localeRedirect("/course-map", undefined, null)).toBe("/en/course-map");
  });
});

describe("localizeHref (links written without a locale)", () => {
  it("prefixes internal page links, keeping query and hash", () => {
    expect(localizeHref("pt", "/lessons/dynamics/newton-euler")).toBe("/pt/lessons/dynamics/newton-euler");
    expect(localizeHref("en", "/course-map#part-planning-learning")).toBe("/en/course-map#part-planning-learning");
  });

  it("leaves external links, anchors, assets and prefixed links alone", () => {
    for (const href of [
      "https://example.com/x",
      "//cdn.example.com/x",
      "#formal-definition",
      "/images/kinematics/fig.svg",
      "/models/ur20/base.stl",
      "/robots.txt",
      "/pt/course-map",
    ]) {
      expect(localizeHref("en", href), href).toBe(href);
    }
  });
});
