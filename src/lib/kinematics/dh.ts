import { cross, mul, origin, sub, zAxis, type Mat4 } from "./mat4";

// Denavit–Hartenberg kernel. The site uses the MODIFIED (Craig) convention
// throughout; anything built on the classic (standard) convention must be
// labelled "classic" where it is shown.

/** One row of a modified (Craig) DH table. Angles in radians, lengths in metres. */
export interface ModifiedDHRow {
  /** α_{i-1}: twist about X_{i-1} */
  alpha: number;
  /** a_{i-1}: length along X_{i-1} */
  a: number;
  /** d_i: offset along Z_i */
  d: number;
  /** θ_i: angle about Z_i */
  theta: number;
}

/**
 * Modified (Craig) DH link transform
 * ^{i-1}_iT = Rot_X(α_{i-1})·Trans_X(a_{i-1})·Rot_Z(θ_i)·Trans_Z(d_i).
 */
export function modifiedDH({ alpha, a, d, theta }: ModifiedDHRow): Mat4 {
  const ct = Math.cos(theta), st = Math.sin(theta);
  const ca = Math.cos(alpha), sa = Math.sin(alpha);
  return [
    [ct, -st, 0, a],
    [st * ca, ct * ca, -sa, -d * sa],
    [st * sa, ct * sa, ca, d * ca],
    [0, 0, 0, 1],
  ];
}

/** Cumulative frames ^0_1T, ^0_2T, …, ^0_nT of a modified-DH chain. */
export function modifiedDHFrames(rows: ModifiedDHRow[]): Mat4[] {
  const frames: Mat4[] = [];
  rows.forEach((row, i) => {
    const T = modifiedDH(row);
    frames.push(i === 0 ? T : mul(frames[i - 1], T));
  });
  return frames;
}

export type JointType = "revolute" | "prismatic";

/**
 * Geometric Jacobian, expressed in the base frame, of a modified-DH chain.
 *
 * In Craig's convention joint i moves about (or along) Z_i — the Z axis of
 * frame {i}, whose origin P_i lies on that axis. With frames[i-1] = ^0_iT and
 * P_T the origin of the tool frame {T}, column i is
 *   revolute:  [ Z_i × (P_T − P_i) ; Z_i ]
 *   prismatic: [ Z_i ; 0 ]
 * Returns the 6×n matrix as rows (first three rows linear, last three angular).
 */
export function geometricJacobian(
  frames: Mat4[],
  tool: Mat4,
  types: JointType[] = frames.map(() => "revolute"),
): number[][] {
  const pT = origin(tool);
  const cols = frames.map((T, i) => {
    const z = zAxis(T);
    if (types[i] === "prismatic") return [z[0], z[1], z[2], 0, 0, 0];
    const lin = cross(z, sub(pT, origin(T)));
    return [lin[0], lin[1], lin[2], z[0], z[1], z[2]];
  });
  return Array.from({ length: 6 }, (_, r) => cols.map((c) => c[r]));
}
