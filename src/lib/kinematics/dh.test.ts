import { describe, expect, it } from "vitest";
import { geometricJacobian, modifiedDH, modifiedDHFrames, type JointType, type ModifiedDHRow } from "./dh";
import { chain, cross, mul, origin, rotX, rotZ, sub, transX, transZ, zAxis, type Mat4 } from "./mat4";
import { expectMatClose, expectVecClose, rot, seededRandom, uniform } from "./test-helpers";

const deg = (d: number) => (d * Math.PI) / 180;

describe("modifiedDH", () => {
  it("equals Rot_X(α)·Trans_X(a)·Rot_Z(θ)·Trans_Z(d) built from elementary matrices", () => {
    const rand = seededRandom(1);
    for (let k = 0; k < 200; k++) {
      const row: ModifiedDHRow = {
        alpha: uniform(rand, -Math.PI, Math.PI),
        a: uniform(rand, -2, 2),
        d: uniform(rand, -2, 2),
        theta: uniform(rand, -Math.PI, Math.PI),
      };
      const reference = chain(rotX(row.alpha), transX(row.a), rotZ(row.theta), transZ(row.d));
      expectMatClose(modifiedDH(row), reference);
    }
  });

  it("chains frames cumulatively: ^0_iT = ^0_{i-1}T · ^{i-1}_iT", () => {
    const rows: ModifiedDHRow[] = [
      { alpha: 0, a: 0, d: 0.3, theta: 0.4 },
      { alpha: -Math.PI / 2, a: 0.1, d: 0, theta: -0.7 },
      { alpha: 0, a: 0.8, d: 0.05, theta: 1.1 },
    ];
    const frames = modifiedDHFrames(rows);
    expect(frames).toHaveLength(3);
    expectMatClose(frames[0], modifiedDH(rows[0]));
    expectMatClose(frames[2], chain(...rows.map(modifiedDH)));
  });
});

// The 2R planar arm of the kinematics lessons, in Craig's convention:
//   i | α_{i-1} | a_{i-1} | d_i | θ_i
//   1 |   0     |   0     | 0   | θ1
//   2 |   0     |   L1    | 0   | θ2
//   T |   0     |   L2    | 0   | 0
const planar2R = (L1: number, L2: number, t1: number, t2: number): ModifiedDHRow[] => [
  { alpha: 0, a: 0, d: 0, theta: t1 },
  { alpha: 0, a: L1, d: 0, theta: t2 },
  { alpha: 0, a: L2, d: 0, theta: 0 },
];

describe("2R planar arm (modified DH)", () => {
  it("matches a hand-computed reference pose", () => {
    // L1 = L2 = 1, θ1 = 30°, θ2 = 45°:
    // X = cos 30° + cos 75° = 0.866025403784 + 0.258819045103
    // Y = sin 30° + sin 75° = 0.5 + 0.965925826289
    const [f1, f2, fT] = modifiedDHFrames(planar2R(1, 1, deg(30), deg(45)));
    expectVecClose(origin(fT), [1.124844448887, 1.465925826289, 0], 1e-11);
    expectVecClose(origin(f1), [0, 0, 0]); // frame {1} sits at the base joint
    expectVecClose(origin(f2), [Math.cos(deg(30)), Math.sin(deg(30)), 0]); // {2} at the elbow
  });

  it("gives X = L1c1 + L2c12, Y = L1s1 + L2s12 and R = Rot_Z(θ1+θ2)", () => {
    const rand = seededRandom(2);
    for (let k = 0; k < 200; k++) {
      const L1 = uniform(rand, 0.2, 2), L2 = uniform(rand, 0.2, 2);
      const t1 = uniform(rand, -Math.PI, Math.PI), t2 = uniform(rand, -Math.PI, Math.PI);
      const fT = modifiedDHFrames(planar2R(L1, L2, t1, t2))[2];
      expectVecClose(origin(fT), [
        L1 * Math.cos(t1) + L2 * Math.cos(t1 + t2),
        L1 * Math.sin(t1) + L2 * Math.sin(t1 + t2),
        0,
      ]);
      expectMatClose(rot(fT), rot(rotZ(t1 + t2)));
    }
  });

  it("has the Jacobian of the lessons, det J = L1·L2·sin θ2", () => {
    const rand = seededRandom(3);
    for (let k = 0; k < 200; k++) {
      const L1 = uniform(rand, 0.2, 2), L2 = uniform(rand, 0.2, 2);
      const t1 = uniform(rand, -Math.PI, Math.PI), t2 = uniform(rand, -Math.PI, Math.PI);
      const [f1, f2, fT] = modifiedDHFrames(planar2R(L1, L2, t1, t2));
      const J = geometricJacobian([f1, f2], fT);
      const s1 = Math.sin(t1), c1 = Math.cos(t1);
      const s12 = Math.sin(t1 + t2), c12 = Math.cos(t1 + t2);
      expectMatClose(J, [
        [-L1 * s1 - L2 * s12, -L2 * s12],
        [L1 * c1 + L2 * c12, L2 * c12],
        [0, 0],
        [0, 0],
        [0, 0],
        [1, 1],
      ]);
      const det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
      expect(det).toBeCloseTo(L1 * L2 * Math.sin(t2), 12);
    }
  });

  it("agrees with the classic-DH rule Z_{i-1} × (P_n − P_{i-1}) on classic frames", () => {
    // Classic (standard) DH places frame {i} at the distal end of link i:
    // A_i = Rot_Z(θ_i)·Trans_Z(d_i)·Trans_X(a_i)·Rot_X(α_i), with a_1 = L1, a_2 = L2.
    const L1 = 0.9, L2 = 0.6, t1 = 0.7, t2 = -1.3;
    const A1 = mul(rotZ(t1), transX(L1));
    const A2 = mul(rotZ(t2), transX(L2));
    const classicFrames: Mat4[] = [chain(), A1, chain(A1, A2)]; // {0}, {1}, {2}
    const pn = origin(classicFrames[2]);
    const classicCols = [0, 1].map((i) => {
      const z = zAxis(classicFrames[i]);
      return [...cross(z, sub(pn, origin(classicFrames[i]))), ...z];
    });
    const classicJ = Array.from({ length: 6 }, (_, r) => classicCols.map((c) => c[r]));

    const [f1, f2, fT] = modifiedDHFrames(planar2R(L1, L2, t1, t2));
    expectMatClose(geometricJacobian([f1, f2], fT), classicJ);
  });
});

describe("geometricJacobian", () => {
  // Finite-difference reference: the linear rows are ∂P_T/∂q_i; the angular rows
  // are the axis ω with Ṙ·Rᵀ = [ω]×, estimated from a central difference of R.
  function numericJacobian(rows: (q: number[]) => ModifiedDHRow[], q: number[], h = 1e-6): number[][] {
    const tool = (qq: number[]) => {
      const frames = modifiedDHFrames(rows(qq));
      return frames[frames.length - 1];
    };
    const cols = q.map((_, i) => {
      const qp = q.slice(), qm = q.slice();
      qp[i] += h;
      qm[i] -= h;
      const Tp = tool(qp), Tm = tool(qm), T0 = tool(q);
      const lin = sub(origin(Tp), origin(Tm)).map((v) => v / (2 * h));
      const Rdot = rot(Tp).map((row, r) => row.map((v, c) => (v - rot(Tm)[r][c]) / (2 * h)));
      const R = rot(T0);
      // S = Ṙ·Rᵀ is skew-symmetric; ω = (S32, S13, S21)
      const S = Rdot.map((row) => [0, 1, 2].map((c) => row[0] * R[c][0] + row[1] * R[c][1] + row[2] * R[c][2]));
      return [...lin, S[2][1], S[0][2], S[1][0]];
    });
    return Array.from({ length: 6 }, (_, r) => cols.map((c) => c[r]));
  }

  it("matches finite differences on random spatial 6R chains", () => {
    const rand = seededRandom(4);
    for (let k = 0; k < 50; k++) {
      const geom = Array.from({ length: 6 }, () => ({
        alpha: uniform(rand, -Math.PI, Math.PI),
        a: uniform(rand, -1, 1),
        d: uniform(rand, -1, 1),
      }));
      const toolRow = { alpha: 0, a: uniform(rand, 0, 0.5), d: uniform(rand, 0, 0.5), theta: 0 };
      const rows = (q: number[]) => [...geom.map((g, i) => ({ ...g, theta: q[i] })), toolRow];
      const q = Array.from({ length: 6 }, () => uniform(rand, -Math.PI, Math.PI));
      const frames = modifiedDHFrames(rows(q));
      const J = geometricJacobian(frames.slice(0, 6), frames[6]);
      expectMatClose(J, numericJacobian(rows, q), 1e-7);
    }
  });

  it("handles prismatic joints (column [Z_i; 0])", () => {
    const rand = seededRandom(5);
    const types: JointType[] = ["revolute", "prismatic", "revolute"];
    const geom = [
      { alpha: 0, a: 0, theta: 0, d: 0.4 },
      { alpha: -Math.PI / 2, a: 0.2, theta: 0.3, d: 0 },
      { alpha: Math.PI / 2, a: 0, theta: 0, d: 0.1 },
    ];
    // q drives θ for revolute joints and d for the prismatic one.
    const rows = (q: number[]) => [
      ...geom.map((g, i) => (types[i] === "prismatic" ? { ...g, d: q[i] } : { ...g, theta: q[i] })),
      { alpha: 0, a: 0.3, d: 0, theta: 0 },
    ];
    for (let k = 0; k < 50; k++) {
      const q = [uniform(rand, -3, 3), uniform(rand, 0.1, 1), uniform(rand, -3, 3)];
      const frames = modifiedDHFrames(rows(q));
      expectMatClose(geometricJacobian(frames.slice(0, 3), frames[3], types), numericJacobian(rows, q), 1e-7);
    }
  });
});
