import { describe, it } from "vitest";
import { chain, origin, rotX, rotY, rotZ, transX, transZ, zAxis } from "@/lib/kinematics/mat4";
import { modifiedDHFrames } from "@/lib/kinematics/dh";
import { expectMatClose, expectVecClose, rot, seededRandom, uniform } from "@/lib/kinematics/test-helpers";
import { L1, L2, L3, dhTable, fkTCP, linkMatrices, toRad, type Pose } from "./fkMath";

const randomPose = (rand: () => number): Pose => ({
  t1: uniform(rand, -180, 180),
  t2: uniform(rand, -180, 180),
  t3: uniform(rand, -180, 180),
});

describe("3-DOF arm, modified DH", () => {
  it("puts the TCP at (L2 + L3, 0, L1) in the zero pose", () => {
    expectVecClose(fkTCP({ t1: 0, t2: 0, t3: 0 }), [L2 + L3, 0, L1]);
  });

  it("matches the closed-form position for random poses", () => {
    const rand = seededRandom(10);
    for (let k = 0; k < 300; k++) {
      const p = randomPose(rand);
      const [t1, t2, t3] = [toRad(p.t1), toRad(p.t2), toRad(p.t3)];
      const reach = L2 * Math.cos(t2) + L3 * Math.cos(t2 + t3);
      expectVecClose(fkTCP(p), [
        Math.cos(t1) * reach,
        Math.sin(t1) * reach,
        L1 - L2 * Math.sin(t2) - L3 * Math.sin(t2 + t3),
      ]);
    }
  });

  it("chains ⁰_TT = ⁰₁T·¹₂T·²₃T·³_TT", () => {
    const rand = seededRandom(11);
    for (let k = 0; k < 50; k++) {
      const p = randomPose(rand);
      const { T01, T12, T23, T3T, T0T } = linkMatrices(p);
      expectMatClose(T0T, chain(T01, T12, T23, T3T));
      expectMatClose(T0T, modifiedDHFrames(dhTable(p))[3]);
    }
  });

  it("aligns Z_2 and Z_3 with the horizontal shoulder/elbow axis", () => {
    const rand = seededRandom(12);
    for (let k = 0; k < 50; k++) {
      const p = randomPose(rand);
      const [, f2, f3] = modifiedDHFrames(dhTable(p));
      const axis = [-Math.sin(toRad(p.t1)), Math.cos(toRad(p.t1)), 0];
      expectVecClose(zAxis(f2), axis);
      expectVecClose(zAxis(f3), axis);
    }
  });

  it("draws the same arm as the previous ad-hoc chain (frames differ by Rot_X(−90°))", () => {
    // Previous widget chain: Rot_Z(θ1)·Trans_Z(L1)·Rot_Y(θ2)·Trans_X(L2)·Rot_Y(θ3)·Trans_X(L3).
    const rand = seededRandom(13);
    for (let k = 0; k < 100; k++) {
      const p = randomPose(rand);
      const old = chain(
        rotZ(toRad(p.t1)), transZ(L1),
        rotY(toRad(p.t2)), transX(L2),
        rotY(toRad(p.t3)), transX(L3),
      );
      const { T0T } = linkMatrices(p);
      expectVecClose(origin(T0T), origin(old));
      expectMatClose(rot(T0T), rot(chain(old, rotX(-Math.PI / 2))));
    }
  });
});
