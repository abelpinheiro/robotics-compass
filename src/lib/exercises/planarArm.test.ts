import { describe, expect, it } from "vitest";
import { expectVecClose, seededRandom, uniform } from "@/lib/kinematics/test-helpers";
import { planarArmPoints, planarArmValues, snapAngle } from "./planarArm";

// The arm's quantities against closed forms written out by hand for the 2R
// and 3R planar arms (independent of the DH kernel the module uses).

const rad = (d: number) => (d * Math.PI) / 180;

describe("planar arm", () => {
  const rand = seededRandom(7);
  const cases = Array.from({ length: 20 }, () => ({
    L1: uniform(rand, 0.2, 1.2),
    L2: uniform(rand, 0.2, 1.2),
    t1: uniform(rand, -180, 180),
    t2: uniform(rand, -180, 180),
  }));

  it("puts the joints and the tip where the 2R closed form does", () => {
    for (const { L1, L2, t1, t2 } of cases) {
      const [c1, s1, c12, s12] = [Math.cos(rad(t1)), Math.sin(rad(t1)), Math.cos(rad(t1 + t2)), Math.sin(rad(t1 + t2))];
      const pts = planarArmPoints([L1, L2], [t1, t2]);
      expect(pts).toHaveLength(3);
      expectVecClose(pts[0], [0, 0]);
      expectVecClose(pts[1], [L1 * c1, L1 * s1]);
      expectVecClose(pts[2], [L1 * c1 + L2 * c12, L1 * s1 + L2 * s12]);
    }
  });

  it("gives x, y, phi, det J and the manipulability of the 2R arm", () => {
    for (const { L1, L2, t1, t2 } of cases) {
      const v = planarArmValues({ links: [L1, L2] }, [t1, t2]);
      const s2 = Math.sin(rad(t2));
      expect(v.x).toBeCloseTo(L1 * Math.cos(rad(t1)) + L2 * Math.cos(rad(t1 + t2)), 12);
      expect(v.y).toBeCloseTo(L1 * Math.sin(rad(t1)) + L2 * Math.sin(rad(t1 + t2)), 12);
      expect(Math.cos(rad(v.phi))).toBeCloseTo(Math.cos(rad(t1 + t2)), 12);
      expect(Math.sin(rad(v.phi))).toBeCloseTo(Math.sin(rad(t1 + t2)), 12);
      expect(v.detJ).toBeCloseTo(L1 * L2 * s2, 12);
      // a square J: √det(J Jᵀ) = |det J|
      expect(v.w).toBeCloseTo(Math.abs(L1 * L2 * s2), 9);
      expect(v.targetDistance).toBeNaN();
    }
  });

  it("measures the elbow height from the base–tip line: −L1·L2·sin θ2 / |tip|", () => {
    for (const { L1, L2, t1, t2 } of cases) {
      const v = planarArmValues({ links: [L1, L2] }, [t1, t2]);
      expect(v.elbowHeight).toBeCloseTo((-L1 * L2 * Math.sin(rad(t2))) / Math.hypot(v.x, v.y), 9);
    }
    // tip to the right of the base: θ2 < 0 lifts the elbow above the line, θ2 > 0 drops it
    expect(planarArmValues({ links: [0.8, 0.5] }, [30, -60]).elbowHeight).toBeGreaterThan(0);
    expect(planarArmValues({ links: [0.8, 0.5] }, [-30, 60]).elbowHeight).toBeLessThan(0);
    // folded equal links put the tip on the base: undefined
    expect(planarArmValues({ links: [0.5, 0.5] }, [20, 180]).elbowHeight).toBeNaN();
  });

  it("measures the distance to the target", () => {
    const v = planarArmValues({ links: [0.8, 0.5], target: [1, 0.2] }, [0, 0]);
    expect(v.targetDistance).toBeCloseTo(Math.hypot(1.3 - 1, 0 - 0.2), 12);
  });

  it("handles a 3R arm: tip, orientation, manipulability; det J undefined", () => {
    const [L1, L2, L3, t1, t2, t3] = [0.6, 0.4, 0.2, 25, -40, 70];
    const v = planarArmValues({ links: [L1, L2, L3] }, [t1, t2, t3]);
    const a = [rad(t1), rad(t1 + t2), rad(t1 + t2 + t3)];
    expect(v.x).toBeCloseTo(L1 * Math.cos(a[0]) + L2 * Math.cos(a[1]) + L3 * Math.cos(a[2]), 12);
    expect(v.y).toBeCloseTo(L1 * Math.sin(a[0]) + L2 * Math.sin(a[1]) + L3 * Math.sin(a[2]), 12);
    expect(v.phi).toBeCloseTo(t1 + t2 + t3, 9);
    expect(v.detJ).toBeNaN();
    // hand-built 2×3 position Jacobian: column i = ∂(x, y)/∂θi
    const col = (k: number) => {
      const [L, A] = [[L1, L2, L3].slice(k), a.slice(k)];
      return [-L.reduce((s, l, i) => s + l * Math.sin(A[i]), 0), L.reduce((s, l, i) => s + l * Math.cos(A[i]), 0)];
    };
    const J = [0, 1, 2].map(col);
    const [xx, yy, xy] = [J.reduce((s, c) => s + c[0] ** 2, 0), J.reduce((s, c) => s + c[1] ** 2, 0), J.reduce((s, c) => s + c[0] * c[1], 0)];
    expect(v.w).toBeCloseTo(Math.sqrt(xx * yy - xy ** 2), 9);
  });

  it("snaps angles to the step and wraps them into (−180°, 180°]", () => {
    expect(snapAngle(12.4)).toBe(12);
    expect(snapAngle(12.6)).toBe(13);
    expect(snapAngle(12.3, 0.5)).toBe(12.5);
    expect(snapAngle(190)).toBe(-170);
    expect(snapAngle(-180)).toBe(180);
    expect(snapAngle(-190)).toBe(170);
    expect(snapAngle(540)).toBe(180);
  });
});
