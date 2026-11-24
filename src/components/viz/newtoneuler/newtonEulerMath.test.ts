import { describe, expect, it } from "vitest";
import { cross, rotZ, sub as sub3 } from "@/lib/kinematics/mat4";
import type { Vec3 } from "@/lib/kinematics/mat4";
import { expectMatClose, expectVecClose, seededRandom, uniform } from "@/lib/kinematics/test-helpers";
import { coriolisTorque, DEFAULT_ARM, gravityTorque, massMatrix, neSolve } from "./newtonEulerMath";
import type { Arm2R, NEState, Vec2 } from "./newtonEulerMath";

// --- Random cases ----------------------------------------------------------

function randomArm(rand: () => number): Arm2R {
  const u = (lo: number, hi: number) => uniform(rand, lo, hi);
  return {
    L1: u(0.3, 1.5), L2: u(0.3, 1.5), Lc1: u(0.1, 1.2), Lc2: u(0.1, 1.2),
    m1: u(0.5, 4), m2: u(0.5, 4), I1: u(0.01, 0.5), I2: u(0.01, 0.5), g: u(0, 12),
  };
}

function randomState(rand: () => number): NEState {
  const u = (r: number) => uniform(rand, -r, r);
  return { th1: u(Math.PI), th2: u(Math.PI), d1: u(3), d2: u(3), dd1: u(5), dd2: u(5) };
}

const cases = (() => {
  const rand = seededRandom(2026);
  return Array.from({ length: 50 }, () => ({ arm: randomArm(rand), st: randomState(rand) }));
})();

// --- Reference 1: Craig's 3D recursion in link frames, as in the lesson -----

type M3 = number[][];
const apply = (R: M3, v: Vec3): Vec3 => R.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]) as Vec3;
const transpose = (R: M3): M3 => [0, 1, 2].map((i) => [R[0][i], R[1][i], R[2][i]]);
const plus = (...vs: Vec3[]): Vec3 => [0, 1, 2].map((i) => vs.reduce((s, v) => s + v[i], 0)) as Vec3;
const times = (s: number, v: Vec3): Vec3 => [s * v[0], s * v[1], s * v[2]];
const rot3 = (t: number): M3 => rotZ(t).slice(0, 3).map((r) => r.slice(0, 3));

/** Relative acceleration ω̇×P + ω×(ω×P) of a point P fixed in the link. */
const rigid = (w: Vec3, dw: Vec3, p: Vec3): Vec3 => plus(cross(dw, p), cross(w, cross(w, p)));

/** All quantities of link i in frame {i}; gravity enters as the base acceleration −g. */
function craigRecursion(arm: Arm2R, st: NEState) {
  const links = [
    { P: [0, 0, 0] as Vec3, Pc: [arm.Lc1, 0, 0] as Vec3, m: arm.m1, I: arm.I1, th: st.th1, d: st.d1, dd: st.dd1 },
    { P: [arm.L1, 0, 0] as Vec3, Pc: [arm.Lc2, 0, 0] as Vec3, m: arm.m2, I: arm.I2, th: st.th2, d: st.d2, dd: st.dd2 },
  ];
  let w: Vec3 = [0, 0, 0], dw: Vec3 = [0, 0, 0], dv: Vec3 = [0, arm.g, 0];
  const out = links.map((l) => {
    const R = transpose(rot3(l.th)); // ^{i+1}_i R
    dv = apply(R, plus(rigid(w, dw, l.P), dv));
    const wR = apply(R, w);
    dw = plus(apply(R, dw), cross(wR, [0, 0, l.d]), [0, 0, l.dd]);
    w = plus(wR, [0, 0, l.d]);
    const dvc = plus(rigid(w, dw, l.Pc), dv);
    const Iw = (v: Vec3): Vec3 => [0, 0, l.I * v[2]]; // planar motion: only I_zz matters
    return { w, dw, dv, dvc, F: times(l.m, dvc), N: plus(Iw(dw), cross(w, Iw(w))) };
  });
  let f: Vec3 = [0, 0, 0], n: Vec3 = [0, 0, 0];
  const wrench: { f: Vec3; n: Vec3 }[] = [];
  for (let i = 1; i >= 0; i--) {
    const next = links[i + 1];
    const R = next ? rot3(next.th) : rot3(0); // ^i_{i+1} R
    const P: Vec3 = next ? next.P : [0, 0, 0];
    const fNext = apply(R, f);
    n = plus(out[i].N, apply(R, n), cross(links[i].Pc, out[i].F), cross(P, fNext));
    f = plus(fNext, out[i].F);
    wrench[i] = { f, n };
  }
  return out.map((o, i) => ({ ...o, ...wrench[i] }));
}

// --- Reference 2: positions only, from which everything else is differentiated

/** Centres of mass from plain trigonometry. */
function coms(arm: Arm2R, q: Vec2): [Vec2, Vec2] {
  const [a, b] = [q[0], q[0] + q[1]];
  return [
    [arm.Lc1 * Math.cos(a), arm.Lc1 * Math.sin(a)],
    [arm.L1 * Math.cos(a) + arm.Lc2 * Math.cos(b), arm.L1 * Math.sin(a) + arm.Lc2 * Math.sin(b)],
  ];
}

/** q along the motion with the given q, q̇, q̈ at t = 0. */
const along = (st: NEState, t: number): Vec2 => [
  st.th1 + st.d1 * t + 0.5 * st.dd1 * t * t,
  st.th2 + st.d2 * t + 0.5 * st.dd2 * t * t,
];

/** 4th-order central differences. */
const diff = (f: (x: number) => number, h = 1e-3) =>
  (8 * (f(h) - f(-h)) - (f(2 * h) - f(-2 * h))) / (12 * h);
const diff2 = (f: (x: number) => number, h = 1e-2) =>
  (-f(2 * h) + 16 * f(h) - 30 * f(0) + 16 * f(-h) - f(-2 * h)) / (12 * h * h);

/** Kinetic energy, with the velocity of each centre of mass by finite differences of its position. */
function kinetic(arm: Arm2R, q: Vec2, qd: Vec2): number {
  const at = (i: 0 | 1, k: 0 | 1) =>
    diff((e) => coms(arm, [q[0] + e * qd[0], q[1] + e * qd[1]])[i][k]);
  const v2 = (i: 0 | 1) => at(i, 0) ** 2 + at(i, 1) ** 2;
  return 0.5 * (arm.m1 * v2(0) + arm.I1 * qd[0] ** 2 + arm.m2 * v2(1) + arm.I2 * (qd[0] + qd[1]) ** 2);
}

function potential(arm: Arm2R, q: Vec2): number {
  const [c1, c2] = coms(arm, q);
  return arm.g * (arm.m1 * c1[1] + arm.m2 * c2[1]);
}

/** τ_k = d/dt(∂T/∂q̇_k) − ∂T/∂q_k + ∂U/∂q_k, every derivative by finite differences. */
function lagrangeTorque(arm: Arm2R, st: NEState): Vec2 {
  const bump = (v: Vec2, k: 0 | 1, e: number): Vec2 => (k === 0 ? [v[0] + e, v[1]] : [v[0], v[1] + e]);
  const qd = (t: number): Vec2 => [st.d1 + st.dd1 * t, st.d2 + st.dd2 * t];
  const q0 = along(st, 0);
  return ([0, 1] as const).map((k) => {
    // T is quadratic in q̇, so a central difference with a unit step is exact.
    const momentum = (t: number) =>
      (kinetic(arm, along(st, t), bump(qd(t), k, 1)) - kinetic(arm, along(st, t), bump(qd(t), k, -1))) / 2;
    const dT = diff((e) => kinetic(arm, bump(q0, k, e), qd(0)));
    const dU = diff((e) => potential(arm, bump(q0, k, e)));
    return diff(momentum) - dT + dU;
  }) as Vec2;
}

const toLink = (v: Vec2, angle: number): Vec2 => [
  Math.cos(angle) * v[0] + Math.sin(angle) * v[1],
  -Math.sin(angle) * v[0] + Math.cos(angle) * v[1],
];

// ---------------------------------------------------------------------------

describe("worked example of the lesson", () => {
  const rad = Math.PI / 180;
  const st: NEState = { th1: 30 * rad, th2: 60 * rad, d1: 1, d2: 2, dd1: 1, dd2: 1 };
  const ref = craigRecursion(DEFAULT_ARM, st);
  const tr = neSolve(DEFAULT_ARM, st);

  // The table of content/dynamics/newton-euler*.mdx, link by link.
  const table = [
    { w: 1, dw: 1, dv: [4.905, 8.496], dvc: [4.405, 8.996], F: [8.81, 17.991], N: 0.08, f: [10.505, 26.125], n: 18.349 },
    { w: 3, dw: 2, dv: [10.176, 1.366], dvc: [6.576, 2.166], F: [7.891, 2.599], N: 0.1, f: [7.891, 2.599], n: 1.14 },
  ];
  const round = 0.00051; // the table has three decimals

  it.each([0, 1])("link %i: the recursion reproduces the published table", (i) => {
    const r = ref[i], t = table[i];
    expectVecClose([r.w[2], r.dw[2], r.N[2], r.n[2]], [t.w, t.dw, t.N, t.n], round);
    expectVecClose(r.dv.slice(0, 2), t.dv, round);
    expectVecClose(r.dvc.slice(0, 2), t.dvc, round);
    expectVecClose(r.F.slice(0, 2), t.F, round);
    expectVecClose(r.f.slice(0, 2), t.f, round);
  });

  it.each([0, 1])("link %i: the kernel agrees with the published table", (i) => {
    const l = tr.links[i], t = table[i];
    expectVecClose([l.omega, l.alpha, l.moment], [t.w, t.dw, t.n], round);
    expectVecClose(toLink([l.aCom[0], l.aCom[1] + DEFAULT_ARM.g], l.angleAbs), t.dvc, round);
    expectVecClose(toLink(l.force, l.angleAbs), t.f, round);
  });

  it("τ, computed by hand", () => {
    // M(60°) = [[2.502, 0.482], [0.482, 0.242]], h = 0.48 sin 60°, link 2 vertical (cos 90° = 0).
    const h = 0.24 * Math.sqrt(3);
    const g1 = (2 * 0.5 + 1.2 * 1) * 9.81 * (Math.sqrt(3) / 2);
    const expected = [2.502 + 0.482 - 8 * h + g1, 0.482 + 0.242 + h];
    expectVecClose(tr.tau, expected, 1e-12);
    expectVecClose(tr.tau, [18.349, 1.14], round);
  });
});

describe("hand-computed cases", () => {
  const still: NEState = { th1: 0, th2: 0, d1: 0, d2: 0, dd1: 0, dd2: 0 };

  it("arm held horizontal: each joint carries the weights beyond it", () => {
    const { tau, links } = neSolve(DEFAULT_ARM, still);
    // τ2 = m2 g l_c2, τ1 = m1 g l_c1 + m2 g (l1 + l_c2)
    expectVecClose(tau, [9.81 * (2 * 0.5 + 1.2 * 1.4), 9.81 * 1.2 * 0.4], 1e-12);
    expectVecClose(links[0].force, [0, 3.2 * 9.81], 1e-12);
    expectVecClose(links[1].force, [0, 1.2 * 9.81], 1e-12);
    expectVecClose(links[0].weight, [0, -2 * 9.81], 1e-12);
  });

  it("arm straight up or straight down: no torque at rest", () => {
    for (const th1 of [Math.PI / 2, -Math.PI / 2])
      expectVecClose(neSolve(DEFAULT_ARM, { ...still, th1 }).tau, [0, 0], 1e-12);
  });

  it("straight arm spinning at a constant rate without gravity: pure centripetal pull", () => {
    const arm = { ...DEFAULT_ARM, g: 0 };
    const { tau, links } = neSolve(arm, { ...still, d1: 2 });
    expectVecClose(tau, [0, 0], 1e-12);
    expectVecClose(links[1].force, [-1.2 * 4 * 1.4, 0], 1e-12);
    expectVecClose(links[0].force, [-4 * (2 * 0.5 + 1.2 * 1.4), 0], 1e-12);
  });

  it("a massless second link leaves a single pendulum: τ1 = (I1 + m1 l_c1²) θ̈1 + m1 g l_c1 cos θ1", () => {
    const arm = { ...DEFAULT_ARM, m2: 0, I2: 0 };
    const { tau } = neSolve(arm, { th1: 0.4, th2: 1.1, d1: 1.3, d2: -0.7, dd1: 2, dd2: -3 });
    expectVecClose(tau, [0.58 * 2 + 2 * 9.81 * 0.5 * Math.cos(0.4), 0], 1e-12);
  });
});

describe("recursion (neSolve)", () => {
  it("matches Craig's recursion in link frames", () => {
    for (const { arm, st } of cases) {
      const tr = neSolve(arm, st);
      craigRecursion(arm, st).forEach((r, i) => {
        const l = tr.links[i];
        expectVecClose([l.omega, l.alpha, l.moment], [r.w[2], r.dw[2], r.n[2]], 1e-11);
        // The reference has gravity in the base acceleration; the kernel keeps it apart.
        expectVecClose(toLink([l.aCom[0], l.aCom[1] + arm.g], l.angleAbs), r.dvc.slice(0, 2), 1e-11);
        expectVecClose(toLink(l.force, l.angleAbs), r.f.slice(0, 2), 1e-11);
      });
    }
  });

  it("τ matches Lagrange's equations with every derivative by finite differences", () => {
    for (const { arm, st } of cases) expectVecClose(neSolve(arm, st).tau, lagrangeTorque(arm, st), 1e-5);
  });

  it("the COM accelerations match the second derivative of the positions", () => {
    for (const { arm, st } of cases) {
      const tr = neSolve(arm, st);
      for (const i of [0, 1] as const)
        for (const k of [0, 1] as const)
          expect(tr.links[i].aCom[k]).toBeCloseTo(diff2((t) => coms(arm, along(st, t))[i][k], 1e-3), 4);
    }
  });

  it("geometry: joints, centres of mass and tip", () => {
    for (const { arm, st } of cases) {
      const [l1, l2] = neSolve(arm, st).links;
      const [c1, c2] = coms(arm, [st.th1, st.th2]);
      expectVecClose(l1.jointPos, [0, 0]);
      expectVecClose(l1.comPos, c1);
      expectVecClose(l2.comPos, c2);
      expectVecClose(l2.jointPos, l1.distalPos);
      const tip = [
        arm.L1 * Math.cos(st.th1) + arm.L2 * Math.cos(st.th1 + st.th2),
        arm.L1 * Math.sin(st.th1) + arm.L2 * Math.sin(st.th1 + st.th2),
      ];
      expectVecClose(l2.distalPos, tip);
      expectVecClose(neSolve(arm, st).ee, tip);
    }
  });

  it("each link is in balance: forces and moments about a point that is not a joint", () => {
    const ref: Vec3 = [0.7, -1.3, 0];
    const v3 = (v: Vec2): Vec3 => [v[0], v[1], 0];
    for (const { arm, st } of cases) {
      const { links } = neSolve(arm, st);
      links.forEach((l, i) => {
        const next = links[i + 1];
        const m = i === 0 ? arm.m1 : arm.m2;
        const I = i === 0 ? arm.I1 : arm.I2;
        const fOut: Vec2 = next ? next.force : [0, 0];
        const net: Vec2 = [l.force[0] + l.weight[0] - fOut[0], l.force[1] + l.weight[1] - fOut[1]];
        expectVecClose(net, [m * l.aCom[0], m * l.aCom[1]], 1e-11);
        const about = (p: Vec2, f: Vec2) => cross(sub3(v3(p), ref), v3(f))[2];
        const moment =
          l.moment - (next ? next.moment : 0) + about(l.jointPos, l.force) + about(l.comPos, l.weight) -
          about(l.distalPos, fOut);
        const inertial = I * l.alpha + about(l.comPos, [m * l.aCom[0], m * l.aCom[1]]);
        expect(Math.abs(moment - inertial)).toBeLessThan(1e-10);
      });
    }
  });

  it("the power of the joints is the rate of change of the energy", () => {
    for (const { arm, st } of cases) {
      const energy = (t: number) => {
        const q = along(st, t);
        return kinetic(arm, q, [st.d1 + st.dd1 * t, st.d2 + st.dd2 * t]) + potential(arm, q);
      };
      const { tau } = neSolve(arm, st);
      expect(tau[0] * st.d1 + tau[1] * st.d2).toBeCloseTo(diff(energy), 4);
    }
  });

  it("the torques are the moments at the joints", () => {
    for (const { arm, st } of cases) {
      const { tau, links } = neSolve(arm, st);
      expect([links[0].tau, links[1].tau, links[0].moment, links[1].moment]).toEqual([...tau, ...tau]);
    }
  });
});

describe("closed form", () => {
  it("M q̈ + C q̇ + g equals the torques of the recursion", () => {
    for (const { arm, st } of cases) {
      const M = massMatrix(arm, st.th2);
      const c = coriolisTorque(arm, st), g = gravityTorque(arm, st);
      const tau = [0, 1].map((i) => M[i][0] * st.dd1 + M[i][1] * st.dd2 + c[i] + g[i]);
      expectVecClose(neSolve(arm, st).tau, tau, 1e-11);
    }
  });

  it("the kinetic energy is ½ q̇ᵀ M q̇", () => {
    for (const { arm, st } of cases) {
      const M = massMatrix(arm, st.th2);
      const T = 0.5 * (M[0][0] * st.d1 ** 2 + 2 * M[0][1] * st.d1 * st.d2 + M[1][1] * st.d2 ** 2);
      expect(T).toBeCloseTo(kinetic(arm, [st.th1, st.th2], [st.d1, st.d2]), 8);
    }
  });

  it("M is symmetric and positive definite, and does not depend on θ1", () => {
    for (const { arm, st } of cases) {
      const M = massMatrix(arm, st.th2);
      expectMatClose([[M[0][1]]], [[M[1][0]]]);
      expect(M[0][0]).toBeGreaterThan(0);
      expect(M[0][0] * M[1][1] - M[0][1] * M[1][0]).toBeGreaterThan(0);
      // Columns of M: torques for unit accelerations, at rest and without gravity, at any θ1.
      const column = (dd1: number, dd2: number) =>
        neSolve({ ...arm, g: 0 }, { th1: st.th1, th2: st.th2, d1: 0, d2: 0, dd1, dd2 }).tau;
      const [a, b] = [column(1, 0), column(0, 1)];
      expectMatClose([[a[0], b[0]], [a[1], b[1]]], M, 1e-11);
    }
  });

  it("the gravity torque is the gradient of the potential energy", () => {
    for (const { arm, st } of cases) {
      const grad = [
        diff((e) => potential(arm, [st.th1 + e, st.th2])),
        diff((e) => potential(arm, [st.th1, st.th2 + e])),
      ];
      expectVecClose(gravityTorque(arm, st), grad, 1e-8);
    }
  });

  it("the Coriolis and centrifugal torques follow from the derivative of M", () => {
    for (const { arm, st } of cases) {
      // c_k = Ṁ q̇ − ½ ∂(q̇ᵀ M q̇)/∂q_k; M depends on θ2 only.
      const dM = [0, 1].map((i) => [0, 1].map((j) => diff((e) => massMatrix(arm, st.th2 + e)[i][j])));
      const qd = [st.d1, st.d2];
      const dMqd = dM.map((r) => r[0] * qd[0] + r[1] * qd[1]);
      const quad = qd[0] * dMqd[0] + qd[1] * dMqd[1];
      expectVecClose(coriolisTorque(arm, st), [st.d2 * dMqd[0], st.d2 * dMqd[1] - 0.5 * quad], 1e-8);
    }
  });
});
