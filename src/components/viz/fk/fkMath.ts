// Shared geometry + math for the 3-DOF arm used by both the forward-kinematics
// and inverse-kinematics visualizations. Keeping the chain here (not inside a
// component) means the FK viz and the IK solver invert exactly the same
// transform the 3D scene draws.

import { modifiedDH, type ModifiedDHRow } from "@/lib/kinematics/dh";
import { chain, origin, type Mat4, type Vec3 } from "@/lib/kinematics/mat4";

export type { Mat4 };
export type P3 = Vec3;

// Link lengths of the 3-DOF arm (base column, upper arm, forearm).
export const L1 = 1.2;
export const L2 = 1.3;
export const L3 = 1.0;

/** Joint angles in degrees: base yaw, shoulder pitch, elbow pitch. */
export interface Pose {
  t1: number;
  t2: number;
  t3: number;
}

export const toRad = (d: number) => (d * Math.PI) / 180;
export const toDeg = (r: number) => (r * 180) / Math.PI;

/**
 * Modified (Craig) DH table of the arm, angles in radians:
 *
 *   i | α_{i-1} | a_{i-1} | d_i | θ_i
 *   1 |   0     |   0     | L1  | θ1
 *   2 |  −90°   |   0     | 0   | θ2
 *   3 |   0     |   L2    | 0   | θ3
 *   T |   0     |   L3    | 0   | 0      ← tool frame {T}, fixed
 *
 * Z_1 is the vertical base axis; Z_2 and Z_3 are the horizontal shoulder and
 * elbow axes. α_1 = −90° makes a positive θ2 or θ3 pitch the arm downward.
 */
export function dhTable(p: Pose): ModifiedDHRow[] {
  return [
    { alpha: 0, a: 0, d: L1, theta: toRad(p.t1) },
    { alpha: -Math.PI / 2, a: 0, d: 0, theta: toRad(p.t2) },
    { alpha: 0, a: L2, d: 0, theta: toRad(p.t3) },
    { alpha: 0, a: L3, d: 0, theta: 0 },
  ];
}

/** The link transforms ⁰₁T, ¹₂T, ²₃T, ³_TT and the chained base-to-tool ⁰_TT. */
export function linkMatrices(p: Pose) {
  const [T01, T12, T23, T3T] = dhTable(p).map(modifiedDH);
  const T0T = chain(T01, T12, T23, T3T);
  return { T01, T12, T23, T3T, T0T };
}

/** Forward kinematics: joint angles (deg) → TCP position in the base frame. */
export function fkTCP(p: Pose): P3 {
  return origin(linkMatrices(p).T0T);
}
