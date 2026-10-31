// Planar 2-DOF (RR) manipulator dynamics by the recursive Newton–Euler algorithm.
// Everything is in the planar base frame (x right, y up); joint axes are +z (out of
// plane), gravity acts in −y. The recursion here is verified to machine precision
// (~1e-14) against the closed form M(q)q̈ + C(q,q̇)q̇ + g(q) over random configs, so the
// visualization's arrows and the readouts are consistent.
//
// Outward pass (base → tip): angular velocity/acceleration and COM linear acceleration.
// Inward pass (tip → base): joint force f_i and moment n_i; the joint torque is τ_i = n_i.

export type Vec2 = [number, number];

export interface Arm2R {
  L1: number; L2: number;   // link lengths (joint to joint), m
  Lc1: number; Lc2: number; // COM distance from the proximal joint, m
  m1: number; m2: number;   // link masses, kg
  I1: number; I2: number;   // COM moment of inertia about z, kg·m²
  g: number;                // gravitational acceleration, m/s² (0 disables gravity)
}

// A compact, well-scaled arm for the visualization and the worked example.
export const DEFAULT_ARM: Arm2R = {
  L1: 1.0, L2: 0.8, Lc1: 0.5, Lc2: 0.4, m1: 2.0, m2: 1.2, I1: 0.08, I2: 0.05, g: 9.81,
};

/** Joint state: angles q, velocities q̇, accelerations q̈ (θ₂ is relative). */
export interface NEState {
  th1: number; th2: number;
  d1: number; d2: number;
  dd1: number; dd2: number;
}

export interface LinkTrace {
  jointPos: Vec2;   // proximal joint (where f_i / n_i act)
  comPos: Vec2;     // centre of mass
  distalPos: Vec2;  // distal joint / tip
  angleAbs: number; // absolute link angle from +x
  omega: number;    // ω_i (scalar z)
  alpha: number;    // ω̇_i (scalar z)
  aCom: Vec2;       // linear acceleration of the COM
  force: Vec2;      // f_i — force on link i from link i−1, applied at jointPos
  weight: Vec2;     // m_i·g, applied at the COM (shown explicitly)
  moment: number;   // n_i — equals the joint torque τ_i
  tau: number;      // τ_i (= moment); the actuator torque at joint i
}

export interface NETrace {
  links: [LinkTrace, LinkTrace];
  ee: Vec2;
  tau: [number, number];
}

const perp = (v: Vec2): Vec2 => [-v[1], v[0]];
const cross2 = (a: Vec2, b: Vec2): number => a[0] * b[1] - a[1] * b[0]; // scalar z
const add = (a: Vec2, b: Vec2): Vec2 => [a[0] + b[0], a[1] + b[1]];
const sub = (a: Vec2, b: Vec2): Vec2 => [a[0] - b[0], a[1] - b[1]];
const scal = (s: number, v: Vec2): Vec2 => [s * v[0], s * v[1]];

/** Full recursive Newton–Euler solution with every intermediate vector (for the viz). */
export function neSolve(arm: Arm2R, st: NEState): NETrace {
  const { L1, L2, Lc1, Lc2, m1, m2, I1, I2, g } = arm;
  const ph1 = st.th1, ph2 = st.th1 + st.th2;       // absolute link angles
  const w1 = st.d1, w2 = st.d1 + st.d2;            // angular velocity
  const a1 = st.dd1, a2 = st.dd1 + st.dd2;         // angular acceleration
  const u1: Vec2 = [Math.cos(ph1), Math.sin(ph1)];
  const u2: Vec2 = [Math.cos(ph2), Math.sin(ph2)];
  const p0: Vec2 = [0, 0];
  const p1 = scal(L1, u1);                         // joint 2
  const c1 = scal(Lc1, u1);                        // COM 1
  const p2 = add(p1, scal(L2, u2));                // tip
  const c2 = add(p1, scal(Lc2, u2));               // COM 2
  const gvec: Vec2 = [0, -g];

  // Outward: COM linear accelerations.  a = α×r + ω×(ω×r) = α·perp(r) − ω²·r
  const r1c = sub(c1, p0);
  const aC1 = sub(scal(a1, perp(r1c)), scal(w1 * w1, r1c));
  const r1p = sub(p1, p0);
  const aP1 = sub(scal(a1, perp(r1p)), scal(w1 * w1, r1p)); // accel of joint 2
  const r2c = sub(c2, p1);
  const aC2 = add(aP1, sub(scal(a2, perp(r2c)), scal(w2 * w2, r2c)));

  // Inward: forces (f₃ = 0, no tip wrench) and moments.
  const f2 = sub(scal(m2, aC2), scal(m2, gvec));
  const f1 = add(sub(scal(m1, aC1), scal(m1, gvec)), f2);
  // n_i = I_i·α_i + n_{i+1} − cross2(p_{i-1}−c_i, f_i) + cross2(p_i−c_i, f_{i+1})
  const n2 = I2 * a2 - cross2(sub(p1, c2), f2);
  const n1 = I1 * a1 + n2 - cross2(sub(p0, c1), f1) + cross2(sub(p1, c1), f2);

  const link1: LinkTrace = {
    jointPos: p0, comPos: c1, distalPos: p1, angleAbs: ph1,
    omega: w1, alpha: a1, aCom: aC1,
    force: f1, weight: scal(m1, gvec), moment: n1, tau: n1,
  };
  const link2: LinkTrace = {
    jointPos: p1, comPos: c2, distalPos: p2, angleAbs: ph2,
    omega: w2, alpha: a2, aCom: aC2,
    force: f2, weight: scal(m2, gvec), moment: n2, tau: n2,
  };
  return { links: [link1, link2], ee: p2, tau: [n1, n2] };
}

/** Symmetric inertia matrix M(q) (depends on θ₂ only). */
export function massMatrix(arm: Arm2R, th2: number): [[number, number], [number, number]] {
  const { L1, Lc1, Lc2, m1, m2, I1, I2 } = arm;
  const c2 = Math.cos(th2);
  const M11 = m1 * Lc1 * Lc1 + I1 + m2 * (L1 * L1 + Lc2 * Lc2 + 2 * L1 * Lc2 * c2) + I2;
  const M12 = m2 * (Lc2 * Lc2 + L1 * Lc2 * c2) + I2;
  const M22 = m2 * Lc2 * Lc2 + I2;
  return [[M11, M12], [M12, M22]];
}

/** Coriolis/centrifugal torque vector C(q,q̇)·q̇. */
export function coriolisTorque(arm: Arm2R, st: NEState): [number, number] {
  const { L1, Lc2, m2 } = arm;
  const h = m2 * L1 * Lc2 * Math.sin(st.th2);
  return [-h * st.d2 * st.d2 - 2 * h * st.d1 * st.d2, h * st.d1 * st.d1];
}

/** Gravity torque vector g(q). */
export function gravityTorque(arm: Arm2R, st: NEState): [number, number] {
  const { L1, Lc1, Lc2, m1, m2, g } = arm;
  const g1 = (m1 * Lc1 + m2 * L1) * g * Math.cos(st.th1) + m2 * Lc2 * g * Math.cos(st.th1 + st.th2);
  const g2 = m2 * Lc2 * g * Math.cos(st.th1 + st.th2);
  return [g1, g2];
}
