import { rotX, rotY, rotZ } from "@/lib/kinematics/mat4";
import type { Vec3 } from "@/lib/kinematics/mat4";

// Inertia of a single rigid body, as in the lesson "Rigid bodies and inertia":
// scalar moments of a thin rod, the inertia tensor of a box, the parallel-axis
// theorem, the change of orientation and the principal axes. SI units.

export type { Vec3 };
/** 3×3 matrix, row-major. */
export type Mat3 = [Vec3, Vec3, Vec3];

// --- Thin uniform rod ------------------------------------------------------

/** Moment of inertia of a thin rod about a perpendicular axis at distance d from its centre. */
export function rodInertia(m: number, L: number, d: number): number {
  return (m * L * L) / 12 + m * d * d;
}

/** Angle turned from rest after time t under a constant torque about a fixed axis. */
export function angleUnderTorque(tau: number, I: number, t: number): number {
  return (tau / I) * t * t * 0.5;
}

/** Time to turn by `angle` from rest under a constant torque about a fixed axis. */
export function timeToTurn(tau: number, I: number, angle: number): number {
  return Math.sqrt((2 * angle * I) / tau);
}

// --- 3×3 helpers -----------------------------------------------------------

export function mul3(a: Mat3, b: Mat3): Mat3 {
  return a.map((row) =>
    [0, 1, 2].map((j) => row[0] * b[0][j] + row[1] * b[1][j] + row[2] * b[2][j]),
  ) as Mat3;
}

export function transpose3(a: Mat3): Mat3 {
  return [0, 1, 2].map((i) => [a[0][i], a[1][i], a[2][i]]) as Mat3;
}

export function add3(a: Mat3, b: Mat3): Mat3 {
  return a.map((row, i) => row.map((v, j) => v + b[i][j])) as Mat3;
}

/** R = R_Z(γ)·R_Y(β)·R_X(α): rotations about fixed axes X, then Y, then Z (radians). */
export function fixedXYZ(alpha: number, beta: number, gamma: number): Mat3 {
  const r3 = (m: number[][]) => m.slice(0, 3).map((row) => row.slice(0, 3)) as Mat3;
  return mul3(r3(rotZ(gamma)), mul3(r3(rotY(beta)), r3(rotX(alpha))));
}

/** Unit vector from azimuth (from X, about Z) and elevation (from the XY plane), in radians. */
export function unitVector(azimuth: number, elevation: number): Vec3 {
  const c = Math.cos(elevation);
  return [c * Math.cos(azimuth), c * Math.sin(azimuth), Math.sin(elevation)];
}

// --- Inertia tensor --------------------------------------------------------

/** Tensor of a uniform box with sides a (X), b (Y), c (Z), in its centre-of-mass frame {C}. */
export function boxTensor(m: number, a: number, b: number, c: number): Mat3 {
  const k = m / 12;
  return [
    [k * (b * b + c * c), 0, 0],
    [0, k * (a * a + c * c), 0],
    [0, 0, k * (a * a + b * b)],
  ];
}

/** Change of orientation: ^A I = R · ^B I · R^T, with R = ^A_B R and a shared origin. */
export function rotateTensor(R: Mat3, I: Mat3): Mat3 {
  return mul3(mul3(R, I), transpose3(R));
}

/** Parallel-axis term m(P^T P·1₃ − P P^T), with P the centre of mass seen from the new origin. */
export function parallelAxisTerm(m: number, p: Vec3): Mat3 {
  const p2 = p[0] * p[0] + p[1] * p[1] + p[2] * p[2];
  return [0, 1, 2].map((i) =>
    [0, 1, 2].map((j) => m * ((i === j ? p2 : 0) - p[i] * p[j])),
  ) as Mat3;
}

/** Scalar moment about the axis through the origin along the unit vector n: n^T I n. */
export function momentAboutAxis(I: Mat3, n: Vec3): number {
  let s = 0;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s += n[i] * I[i][j] * n[j];
  return s;
}

// --- Principal axes --------------------------------------------------------

export interface PrincipalAxes {
  /** Principal moments, ascending. */
  moments: Vec3;
  /** Unit principal axis of each moment, in the same order. */
  axes: [Vec3, Vec3, Vec3];
  /** True when two principal moments coincide, so their axes are not unique. */
  repeated: boolean;
}

/** Eigenvalues and eigenvectors of a symmetric 3×3 tensor (cyclic Jacobi rotations). */
export function principalAxes(I: Mat3): PrincipalAxes {
  let D = I.map((row) => [...row]) as Mat3;
  let V: Mat3 = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  const scale = Math.max(...I.flat().map(Math.abs), Number.MIN_VALUE);
  for (let sweep = 0; sweep < 30; sweep++) {
    const off = Math.max(Math.abs(D[0][1]), Math.abs(D[0][2]), Math.abs(D[1][2]));
    if (off <= 1e-14 * scale) break;
    for (const [p, q] of [[0, 1], [0, 2], [1, 2]] as const) {
      if (D[p][q] === 0) continue;
      const theta = 0.5 * Math.atan2(2 * D[p][q], D[q][q] - D[p][p]);
      const c = Math.cos(theta);
      const s = Math.sin(theta);
      const J: Mat3 = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ];
      J[p][p] = c;
      J[q][q] = c;
      J[p][q] = s;
      J[q][p] = -s;
      D = mul3(mul3(transpose3(J), D), J);
      V = mul3(V, J);
    }
  }
  const order = [0, 1, 2].sort((i, j) => D[i][i] - D[j][j]);
  const moments = order.map((i) => D[i][i]) as Vec3;
  const axes = order.map((i) => [V[0][i], V[1][i], V[2][i]]) as [Vec3, Vec3, Vec3];
  const close = (x: number, y: number) => Math.abs(x - y) <= 1e-9 * scale;
  return {
    moments,
    axes,
    repeated: close(moments[0], moments[1]) || close(moments[1], moments[2]),
  };
}
