import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { getDependents, getLessonBySlug } from "@/lib/curriculum";
import { lessonConnections, lessonLink, seeAlsoLink } from "./lessonLinks";

describe("lessonLink", () => {
  it("links a lesson that has a page, in the reader's locale", () => {
    expect(lessonLink("velocity-kinematics", "pt")).toEqual({
      label: "Cinemática de velocidade",
      href: "/pt/lessons/kinematics/velocity-kinematics",
      status: "published",
    });
  });

  it("keeps a planned lesson's title and status, without a link", () => {
    expect(lessonLink("lagrangian-dynamics", "en")).toEqual({ label: "Lagrangian dynamics", status: "planned" });
  });

  it("returns undefined for an unknown slug", () => {
    expect(lessonLink("no-such-lesson", "en")).toBeUndefined();
  });
});

describe("lessonConnections", () => {
  it("lists prerequisites as 'uses' and dependents as 'leads to', by hand for jacobians", () => {
    const { uses, leadsTo } = lessonConnections("jacobians", "en");
    expect(uses.map((l) => l.label)).toEqual(["Velocity kinematics"]);
    expect(leadsTo.map((l) => l.label)).toEqual([
      "Hybrid position/force control",
      "Redundancy and null space",
      "UR20 (Universal Robots)",
    ]);
    expect(leadsTo.filter((l) => l.href).map((l) => l.href)).toEqual(["/en/lessons/case-studies/ur20"]);
  });

  it("agrees with getDependents for every lesson", () => {
    for (const slug of ["vectors-and-frames", "a-star", "mdps", "ur20"]) {
      expect(lessonConnections(slug, "en").leadsTo.length).toBe(getDependents(slug).length);
    }
  });
});

describe("seeAlsoLink", () => {
  it("resolves lessons, the playground, the course map and external URLs", () => {
    expect(seeAlsoLink("/lessons/case-studies/ur20", "pt")).toMatchObject({ href: "/pt/lessons/case-studies/ur20" });
    expect(seeAlsoLink("/en/lessons/case-studies/ur20", "pt")).toMatchObject({ href: "/pt/lessons/case-studies/ur20" });
    expect(seeAlsoLink("/playground", "pt")).toEqual({ label: "Playground", href: "/pt/playground" });
    expect(seeAlsoLink("/course-map/graph", "pt")).toEqual({ label: "Mapa do curso", href: "/pt/course-map/graph" });
    expect(seeAlsoLink("https://example.org/robots/arm", "en")).toEqual({
      label: "example.org/robots/arm",
      href: "https://example.org/robots/arm",
    });
  });
});

describe("lesson content references", () => {
  const CONTENT = fileURLToPath(new URL("../../../content", import.meta.url));
  const files = readdirSync(CONTENT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) =>
      readdirSync(`${CONTENT}/${d.name}`)
        .filter((f) => f.endsWith(".mdx"))
        .map((f) => `${d.name}/${f}`),
    );

  it("points every <Why prereq> and seeAlso lesson at an existing lesson", () => {
    for (const file of files) {
      const src = readFileSync(`${CONTENT}/${file}`, "utf8");
      for (const [, slug] of src.matchAll(/<Why[^>]*\sprereq="([^"]+)"/g)) {
        expect(getLessonBySlug(slug), `${file}: prereq="${slug}"`).toBeDefined();
      }
      for (const [, slug] of src.matchAll(/^\s*-\s*\/(?:[a-z]{2}\/)?lessons\/[^/]+\/([^/\s]+)\s*$/gm)) {
        expect(getLessonBySlug(slug), `${file}: seeAlso ${slug}`).toBeDefined();
      }
    }
  });
});
