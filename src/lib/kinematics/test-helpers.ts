// Test-only helpers: a seeded RNG (reproducible random cases) and tolerant
// matrix/vector comparisons.

import { expect } from "vitest";
import type { Mat4 } from "./mat4";

/** mulberry32: small deterministic PRNG returning floats in [0, 1). */
export function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const uniform = (rand: () => number, lo: number, hi: number) => lo + (hi - lo) * rand();

export function expectMatClose(actual: number[][], expected: number[][], tol = 1e-12) {
  expect(actual.length).toBe(expected.length);
  actual.forEach((row, r) => {
    expect(row.length).toBe(expected[r].length);
    row.forEach((v, c) => {
      expect(Math.abs(v - expected[r][c]), `entry [${r}][${c}]`).toBeLessThan(tol);
    });
  });
}

export function expectVecClose(actual: readonly number[], expected: readonly number[], tol = 1e-12) {
  expect(actual.length).toBe(expected.length);
  actual.forEach((v, i) => expect(Math.abs(v - expected[i]), `component ${i}`).toBeLessThan(tol));
}

/** Rotation block of a transform. */
export const rot = (T: Mat4): number[][] => T.slice(0, 3).map((row) => row.slice(0, 3));
