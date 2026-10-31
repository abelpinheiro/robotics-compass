import { describe, expect, it } from "vitest";
import { formatNumber, renderInline, renderText, renderWithGaps } from "./text";

describe("formatNumber", () => {
  it("uses 4 significant digits by default, fixed decimals on request, a decimal comma in PT", () => {
    expect(formatNumber(0.86602540378, "en")).toBe("0.866");
    expect(formatNumber(0.86602540378, "pt")).toBe("0,866");
    expect(formatNumber(1.5, "en", 2)).toBe("1.50");
    expect(formatNumber(1.5, "pt", 2, true)).toBe("1{,}50");
    expect(formatNumber(120, "pt")).toBe("120");
  });
});

describe("renderText", () => {
  it("splits paragraphs, renders inline and display math, and escapes HTML", () => {
    const html = renderText("Use $x^2$ & **bold**.\n\n$$a = b$$\n\nThird <p>", {}, "en");
    expect(html.startsWith("<p>Use ")).toBe(true);
    expect(html).toContain('class="katex"');
    expect(html).toContain('class="katex-display"');
    expect(html).toContain("&amp; <strong>bold</strong>");
    expect(html).toContain("<p>Third &lt;p&gt;</p>");
  });

  it("interpolates parameters in text and in math, per locale", () => {
    expect(renderInline("L = {{L}} m", { L: 0.5 }, "pt")).toBe("L = 0,5 m");
    expect(renderInline("$L = {{L:2}}$", { L: 0.5 }, "pt")).toContain("0");
    expect(renderInline("$L = {{L:2}}$", { L: 0.5 }, "pt")).not.toContain("{,}");
  });

  it("throws on unknown placeholders and invalid TeX", () => {
    expect(() => renderInline("{{missing}}", {}, "en")).toThrow(/unknown placeholder/);
    expect(() => renderInline("$\\frac{1}$", {}, "en")).toThrow();
  });
});

describe("renderWithGaps", () => {
  it("splits a template at its gap markers", () => {
    const parts = renderWithGaps("A [[first]] then $x$ [[second]].", {}, "en");
    expect(parts.map((p) => ("gap" in p ? `[${p.gap}]` : "html"))).toEqual(["html", "[first]", "html", "[second]", "html"]);
  });
});
