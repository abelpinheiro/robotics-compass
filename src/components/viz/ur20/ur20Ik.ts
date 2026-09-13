import { ur20FK, type Vec3 } from "@/components/playground/ur20Math";

// Inverse of a 3×3 matrix (rows), or null if singular.
function inv3(m: number[][]): number[][] | null {
  const a = m[0][0], b = m[0][1], c = m[0][2];
  const d = m[1][0], e = m[1][1], f = m[1][2];
  const g = m[2][0], h = m[2][1], k = m[2][2];
  const A = e * k - f * h, B = -(d * k - f * g), C = d * h - e * g;
  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-12) return null;
  const id = 1 / det;
  return [
    [A * id, (c * h - b * k) * id, (b * f - c * e) * id],
    [B * id, (a * k - c * g) * id, (c * d - a * f) * id],
    [C * id, (b * g - a * h) * id, (a * e - b * d) * id],
  ];
}

/**
 * Position-only inverse kinematics for the UR20 by damped least squares:
 *   Δq = Jᵥᵀ (Jᵥ·Jᵥᵀ + λ²I)⁻¹ (x_target − x_current),  q ← q + Δq
 * iterated from a warm start `q`. Returns the solved joints and final residual.
 */
export function ur20IkSolve(
  q: number[],
  target: Vec3,
  iters = 30,
  lambda = 0.06,
  maxStep = 0.35,
): { q: number[]; err: number } {
  let cur = q.slice();
  let err = Infinity;
  for (let it = 0; it < iters; it++) {
    const p = ur20FK(cur);
    const e: Vec3 = [target[0] - p.ee[0], target[1] - p.ee[1], target[2] - p.ee[2]];
    err = Math.hypot(e[0], e[1], e[2]);
    if (err < 1e-4) break;
    // A = Jᵥ·Jᵥᵀ + λ²I  (3×3); Jᵥ's columns are the first 3 rows of each J column.
    const A = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    for (const col of p.cols)
      for (let r = 0; r < 3; r++) for (let s = 0; s < 3; s++) A[r][s] += col[r] * col[s];
    for (let r = 0; r < 3; r++) A[r][r] += lambda * lambda;
    const Ai = inv3(A);
    if (!Ai) break;
    const y: Vec3 = [
      Ai[0][0] * e[0] + Ai[0][1] * e[1] + Ai[0][2] * e[2],
      Ai[1][0] * e[0] + Ai[1][1] * e[1] + Ai[1][2] * e[2],
      Ai[2][0] * e[0] + Ai[2][1] * e[1] + Ai[2][2] * e[2],
    ];
    const dq = p.cols.map((col) => col[0] * y[0] + col[1] * y[1] + col[2] * y[2]);
    const n = Math.hypot(...dq);
    const sc = n > maxStep ? maxStep / n : 1;
    cur = cur.map((v, i) => v + dq[i] * sc);
  }
  return { q: cur, err };
}
