import { describe, expect, it } from "vitest";
import { expectVecClose, seededRandom, uniform } from "@/lib/kinematics/test-helpers";
import { L1, L2, L3, fkTCP, type P3 } from "@/components/viz/fk/fkMath";
import { solveIK } from "./ikMath";

// A random target inside the reachable shell: shoulder-centred distance in
// (|L2 − L3|, L2 + L3), at any azimuth, away from the base axis.
function reachableTarget(rand: () => number): P3 {
  const dist = uniform(rand, Math.abs(L2 - L3) + 0.05, L2 + L3 - 0.05);
  const elev = uniform(rand, -1.4, 1.4);
  const az = uniform(rand, -Math.PI, Math.PI);
  const r = dist * Math.cos(elev);
  return [r * Math.cos(az), r * Math.sin(az), L1 + dist * Math.sin(elev)];
}

describe("solveIK (3-DOF arm)", () => {
  it("round-trips through FK on both elbow branches", () => {
    const rand = seededRandom(20);
    for (let k = 0; k < 300; k++) {
      const target = reachableTarget(rand);
      for (const elbow of ["up", "down"] as const) {
        const sol = solveIK(target, elbow);
        expect(sol.reachable).toBe(true);
        expectVecClose(fkTCP(sol.pose), target, 1e-9);
      }
    }
  });

  it("returns two distinct joint solutions for the same target", () => {
    const target: P3 = [1.5, 0.6, 1.8];
    const up = solveIK(target, "up").pose, down = solveIK(target, "down").pose;
    expect(Math.abs(up.t3 - down.t3)).toBeGreaterThan(1);
    expectVecClose(fkTCP(up), fkTCP(down), 1e-9);
  });

  it("flags an out-of-reach target and stops on the workspace boundary", () => {
    const sol = solveIK([5, 0, L1], "down");
    expect(sol.reachable).toBe(false);
    expectVecClose(fkTCP(sol.pose), [L2 + L3, 0, L1], 1e-9);
  });
});
