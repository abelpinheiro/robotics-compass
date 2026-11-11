import { describe, expect, it } from "vitest";
import { compile } from "mathjs";
import { checkNumeric, checkOrder, checkSymbolic, parseNumber, withinTolerance } from "./check";
import { createRng, hashString, variantRng } from "./random";

const mathjsCompile = (expr: string) => {
  const code = compile(expr);
  return (scope: Record<string, number>) => code.evaluate({ ...scope }) as number;
};

describe("parseNumber", () => {
  it("accepts decimal commas and points, signs, exponents and spaces", () => {
    expect(parseNumber("0,5")).toBe(0.5);
    expect(parseNumber(" -1.25 ")).toBe(-1.25);
    expect(parseNumber("1.2e-3")).toBe(0.0012);
    expect(parseNumber(".5")).toBe(0.5);
    expect(parseNumber("+3")).toBe(3);
  });

  it("rejects anything that is not a plain number", () => {
    for (const s of ["", "abc", "1,000.5", "0.5 m", "1/2", "--1", "NaN", "Infinity"]) {
      expect(parseNumber(s), s).toBeNull();
    }
  });
});

describe("tolerances", () => {
  it("uses the larger of the absolute and relative tolerance", () => {
    expect(withinTolerance(1.009, 1, { rel: 0.01 })).toBe(true);
    expect(withinTolerance(1.011, 1, { rel: 0.01 })).toBe(false);
    expect(withinTolerance(0.0009, 0, { abs: 1e-3, rel: 0.01 })).toBe(true);
    expect(checkNumeric("0,866", { value: Math.sqrt(3) / 2, tolerance: { abs: 1e-3 } })).toEqual({ ok: true });
    expect(checkNumeric("0.85", { value: Math.sqrt(3) / 2, tolerance: { abs: 1e-3 } })).toMatchObject({ ok: false, reason: "wrong" });
    expect(checkNumeric("x", { value: 1, tolerance: { abs: 1 } })).toMatchObject({ ok: false, reason: "invalid" });
  });
});

describe("checkSymbolic (numerical comparison)", () => {
  const points = [
    { t1: 0.3, t2: -1.1 },
    { t1: 2.0, t2: 0.4 },
    { t1: -0.7, t2: 2.9 },
  ];
  const ref = (p: { t1: number; t2: number }) => 0.8 * Math.cos(p.t1) + 0.5 * Math.cos(p.t1 + p.t2);
  const answer = { variables: ["t1", "t2"], points, values: points.map(ref), tolerance: { abs: 1e-6 } };

  it("accepts any expression equal to the reference", () => {
    expect(checkSymbolic("0.8*cos(t1) + 0.5*cos(t1+t2)", answer, mathjsCompile)).toEqual({ ok: true });
    expect(checkSymbolic("0.8 cos(t1) + 0.5 (cos(t1)cos(t2) - sin(t1)sin(t2))", answer, mathjsCompile)).toEqual({ ok: true });
  });

  it("rejects a different expression, a syntax error and an unknown variable", () => {
    expect(checkSymbolic("0.8*cos(t1) + 0.5*cos(t2)", answer, mathjsCompile)).toMatchObject({ reason: "wrong" });
    expect(checkSymbolic("0.8*cos(t1", answer, mathjsCompile)).toMatchObject({ reason: "invalid" });
    expect(checkSymbolic("0.8*cos(theta1)", answer, mathjsCompile)).toMatchObject({ reason: "invalid" });
    expect(checkSymbolic("", answer, mathjsCompile)).toMatchObject({ reason: "invalid" });
  });
});

describe("checkOrder", () => {
  it("counts steps in place", () => {
    expect(checkOrder(["a", "b", "c"], ["a", "b", "c"])).toEqual({ ok: true, inPlace: 3 });
    expect(checkOrder(["b", "a", "c"], ["a", "b", "c"])).toMatchObject({ ok: false, inPlace: 1 });
  });
});

describe("seeded randomness", () => {
  it("is deterministic per seed and differs between variants", () => {
    const a = createRng(42), b = createRng(42);
    expect([a.next(), a.int(1, 6), a.pick(["x", "y", "z"])]).toEqual([b.next(), b.int(1, 6), b.pick(["x", "y", "z"])]);
    expect(variantRng("ex", 0).next()).not.toBe(variantRng("ex", 1).next());
    expect(hashString("jacobians-2r-det")).toBe(hashString("jacobians-2r-det"));
  });

  it("keeps int and uniform within their bounds, and shuffles into a permutation", () => {
    const r = createRng(7);
    for (let i = 0; i < 500; i++) {
      const k = r.int(-2, 3);
      expect(k).toBeGreaterThanOrEqual(-2);
      expect(k).toBeLessThanOrEqual(3);
      const u = r.uniform(0.4, 1.2, 2);
      expect(u).toBeGreaterThanOrEqual(0.4);
      expect(u).toBeLessThanOrEqual(1.2);
    }
    expect(r.shuffle([1, 2, 3, 4, 5]).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
