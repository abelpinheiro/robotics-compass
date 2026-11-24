import { describe, expect, it } from "vitest";
import {
  add3,
  angleUnderTorque,
  boxTensor,
  fixedXYZ,
  momentAboutAxis,
  mul3,
  parallelAxisTerm,
  principalAxes,
  rodInertia,
  rotateTensor,
  timeToTurn,
  transpose3,
  unitVector,
} from "./inertiaMath";
import type { Mat3, Vec3 } from "./inertiaMath";

const expectMat = (a: Mat3, b: Mat3, digits = 9) =>
  a.forEach((row, i) => row.forEach((v, j) => expect(v, `[${i}][${j}]`).toBeCloseTo(b[i][j], digits)));
const apply = (a: Mat3, v: Vec3): Vec3 => a.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]) as Vec3;
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// Independent reference: 2-point Gauss–Legendre points per axis integrate the
// quadratic integrands of the tensor exactly, with equal weights.
const G = 1 / Math.sqrt(3) / 2;
function boxPoints(a: number, b: number, c: number): Vec3[] {
  const pts: Vec3[] = [];
  for (const x of [-G, G]) for (const y of [-G, G]) for (const z of [-G, G]) pts.push([a * x, b * y, c * z]);
  return pts;
}
/** Tensor from the component integrals (moments and products), not from P^T P·1 − P P^T. */
function tensorOf(points: Vec3[], m: number): Mat3 {
  const w = m / points.length;
  let [xx, yy, zz, xy, xz, yz] = [0, 0, 0, 0, 0, 0];
  for (const [x, y, z] of points) {
    xx += w * (y * y + z * z);
    yy += w * (x * x + z * z);
    zz += w * (x * x + y * y);
    xy += w * x * y;
    xz += w * x * z;
    yz += w * y * z;
  }
  return [
    [xx, -xy, -xz],
    [-xy, yy, -yz],
    [-xz, -yz, zz],
  ];
}

const [m, a, b, c] = [6, 1.2, 0.6, 0.3];
const R = fixedXYZ(0.4, -0.7, 1.1);
const P: Vec3 = [0.5, -0.3, 0.8];

describe("thin rod", () => {
  it("matches mL²/12 at the centre and mL²/3 at the end (four times as much)", () => {
    expect(rodInertia(2, 1.5, 0)).toBeCloseTo(0.375, 12);
    expect(rodInertia(2, 1.5, 0.75)).toBeCloseTo(1.5, 12);
  });

  it("matches a midpoint-rule integral of r² for an arbitrary offset", () => {
    const [mass, L, d, N] = [1.3, 0.9, 0.2, 4000];
    let sum = 0;
    for (let i = 0; i < N; i++) {
      const x = ((i + 0.5) / N - 0.5) * L;
      sum += (mass / N) * (x - d) ** 2;
    }
    expect(rodInertia(mass, L, d)).toBeCloseTo(sum, 6);
  });

  it("turns as a numerical integration of I·α = τ predicts", () => {
    const [tau, I, T, N] = [0.1, 0.12, 3, 30000];
    const dt = T / N;
    let th = 0;
    let w = 0;
    for (let i = 0; i < N; i++) {
      w += (tau / I) * dt;
      th += w * dt;
    }
    expect(angleUnderTorque(tau, I, T)).toBeCloseTo(th, 3);
  });

  it("inverts the angle, and turns a quarter as far with four times the inertia", () => {
    const t = timeToTurn(0.1, 0.12, 2 * Math.PI);
    expect(angleUnderTorque(0.1, 0.12, t)).toBeCloseTo(2 * Math.PI, 12);
    expect(angleUnderTorque(0.1, 0.48, t)).toBeCloseTo(Math.PI / 2, 12);
  });
});

describe("box tensor", () => {
  it("has the hand-computed values of the default box", () => {
    expectMat(boxTensor(6, 1.2, 0.6, 0.3), [
      [0.225, 0, 0],
      [0, 0.765, 0],
      [0, 0, 0.9],
    ]);
  });

  it("matches the integrals of the definition", () => {
    expectMat(boxTensor(m, a, b, c), tensorOf(boxPoints(a, b, c), m));
  });

  it("reduces to the thin rod when two sides vanish", () => {
    expect(boxTensor(2, 1.5, 0, 0)[2][2]).toBeCloseTo(rodInertia(2, 1.5, 0), 12);
    expect(add3(boxTensor(2, 1.5, 0, 0), parallelAxisTerm(2, [0.75, 0, 0]))[2][2]).toBeCloseTo(1.5, 12);
  });
});

describe("change of reference", () => {
  it("builds a rotation from fixed X–Y–Z angles", () => {
    expectMat(mul3(R, transpose3(R)), [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);
    // X by 90° then Z by 90°: Y → Z → Z, and Z → −Y → X
    const Q = fixedXYZ(Math.PI / 2, 0, Math.PI / 2);
    apply(Q, [0, 1, 0]).forEach((v, i) => expect(v).toBeCloseTo([0, 0, 1][i], 12));
    apply(Q, [0, 0, 1]).forEach((v, i) => expect(v).toBeCloseTo([1, 0, 0][i], 12));
  });

  it("matches the tensor integrated over the rotated and translated box", () => {
    const moved = boxPoints(a, b, c).map((p) => apply(R, p).map((v, i) => v + P[i]) as Vec3);
    expectMat(add3(rotateTensor(R, boxTensor(m, a, b, c)), parallelAxisTerm(m, P)), tensorOf(moved, m));
  });

  it("depends on m(x² + y²) along Z, whatever z is", () => {
    expect(parallelAxisTerm(6, P)[2][2]).toBeCloseTo(6 * (0.25 + 0.09), 12);
  });

  it("gives n^T I n equal to the sum of squared distances to the axis", () => {
    const moved = boxPoints(a, b, c).map((p) => apply(R, p).map((v, i) => v + P[i]) as Vec3);
    const n = unitVector(0.9, 0.4);
    expect(dot(n, n)).toBeCloseTo(1, 12);
    const direct = moved.reduce((s, p) => s + (m / moved.length) * (dot(p, p) - dot(p, n) ** 2), 0);
    const I = add3(rotateTensor(R, boxTensor(m, a, b, c)), parallelAxisTerm(m, P));
    expect(momentAboutAxis(I, n)).toBeCloseTo(direct, 9);
  });

  it("orients azimuth and elevation as labelled", () => {
    unitVector(0, 0).forEach((v, i) => expect(v).toBeCloseTo([1, 0, 0][i], 12));
    unitVector(Math.PI / 2, 0).forEach((v, i) => expect(v).toBeCloseTo([0, 1, 0][i], 12));
    unitVector(0.3, Math.PI / 2).forEach((v, i) => expect(v).toBeCloseTo([0, 0, 1][i], 12));
  });
});

describe("principal axes", () => {
  const cases: [string, Mat3][] = [
    ["rotated box", rotateTensor(R, boxTensor(m, a, b, c))],
    ["rotated and moved box", add3(rotateTensor(R, boxTensor(m, a, b, c)), parallelAxisTerm(m, P))],
    ["diagonal", boxTensor(m, a, b, c)],
    ["cube moved off its centre", add3(boxTensor(1, 0.5, 0.5, 0.5), parallelAxisTerm(1, P))],
  ];
  it.each(cases)("satisfies I·v = λ·v with orthonormal axes: %s", (_, I) => {
    const { moments, axes } = principalAxes(I);
    axes.forEach((v, k) => {
      apply(I, v).forEach((x, i) => expect(x).toBeCloseTo(moments[k] * v[i], 10));
      axes.forEach((u, l) => expect(dot(u, v)).toBeCloseTo(k === l ? 1 : 0, 10));
    });
    expect(moments[0] + moments[1] + moments[2]).toBeCloseTo(I[0][0] + I[1][1] + I[2][2], 10);
    expect(moments[0]).toBeLessThanOrEqual(moments[1]);
    expect(moments[1]).toBeLessThanOrEqual(moments[2]);
  });

  it("recovers the box's own moments and edge directions after a rotation", () => {
    const { moments, axes, repeated } = principalAxes(rotateTensor(R, boxTensor(m, a, b, c)));
    [0.225, 0.765, 0.9].forEach((v, k) => expect(moments[k]).toBeCloseTo(v, 10));
    axes.forEach((v, k) => expect(Math.abs(dot(v, [R[0][k], R[1][k], R[2][k]]))).toBeCloseTo(1, 10));
    expect(repeated).toBe(false);
  });

  it("flags repeated moments", () => {
    expect(principalAxes(boxTensor(2, 0.5, 0.5, 0.5)).repeated).toBe(true);
    expect(principalAxes(rotateTensor(R, boxTensor(2, 1, 0.4, 0.4))).repeated).toBe(true);
  });
});
