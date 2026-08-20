import { L1, L2, L3, toDeg } from "@/components/viz/fk/fkMath";
import type { P3, Pose } from "@/components/viz/fk/fkMath";

export type Elbow = "up" | "down";

export interface IKSolution {
  /** Solved joint angles, in degrees. */
  pose: Pose;
  /** Was the raw target inside the reachable workspace (no clamping needed)? */
  reachable: boolean;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Analytical (geometric) inverse kinematics for the 3-DOF arm.
 *
 * The base yaw θ₁ swings the arm's working plane to face the target; inside that
 * plane a standard planar 2R problem (law of cosines) solves the shoulder θ₂ and
 * elbow θ₃. The two 2R branches are the classic elbow-up / elbow-down solutions.
 * Targets outside the reachable annulus are clamped onto its nearest point so the
 * arm still shows a sensible closest pose; `reachable` reports whether the raw
 * target actually fit.
 *
 * This inverts fkMath's chain exactly: feeding the returned pose back through
 * `fkTCP` reproduces the (clamped) target.
 */
export function solveIK(target: P3, elbow: Elbow): IKSolution {
  const [x, y, z] = target;

  const r0 = Math.hypot(x, y);
  const t1 = r0 < 1e-6 ? 0 : Math.atan2(y, x);

  // Planar 2R in the (r, s) plane: r is the horizontal reach, s is measured
  // downward from the shoulder height L1 (so the shoulder sits at the origin).
  const r = r0;
  const s = L1 - z;
  const dist = Math.hypot(r, s);
  const maxR = L2 + L3;
  const minR = Math.abs(L2 - L3);
  const reachable = dist <= maxR + 1e-9 && dist >= minR - 1e-9;

  // Clamp onto the reachable annulus for the closest-pose fallback.
  let rc = r, sc = s;
  if (dist > maxR && dist > 1e-9) {
    const k = maxR / dist;
    rc = r * k;
    sc = s * k;
  } else if (dist < minR && dist > 1e-9) {
    const k = minR / dist;
    rc = r * k;
    sc = s * k;
  }

  const c3 = clamp((rc * rc + sc * sc - L2 * L2 - L3 * L3) / (2 * L2 * L3), -1, 1);
  const t3 = (elbow === "up" ? -1 : 1) * Math.acos(c3);
  const t2 = Math.atan2(sc, rc) - Math.atan2(L3 * Math.sin(t3), L2 + L3 * Math.cos(t3));

  return { pose: { t1: toDeg(t1), t2: toDeg(t2), t3: toDeg(t3) }, reachable };
}
