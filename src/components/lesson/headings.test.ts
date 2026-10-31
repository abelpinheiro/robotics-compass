import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { slugify, textOf } from "./headings";

describe("heading ids", () => {
  it("slugifies headings in both languages", () => {
    expect(slugify("Formal definition")).toBe("formal-definition");
    expect(slugify("Definição formal")).toBe("definicao-formal");
    expect(slugify("  Static Forces: The Jacobian Duality ")).toBe("static-forces-the-jacobian-duality");
    expect(slugify("Erros comuns (common pitfalls)")).toBe("erros-comuns-common-pitfalls");
    expect(slugify("—")).toBe("");
  });

  it("reads the text of nested heading children", () => {
    const node = ["Velocity ", createElement("em", null, "kinematics"), " ", 2];
    expect(textOf(node)).toBe("Velocity kinematics 2");
    expect(slugify(textOf(node))).toBe("velocity-kinematics-2");
  });
});
