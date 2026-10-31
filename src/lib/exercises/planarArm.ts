import { geometricJacobian, modifiedDHFrames, type ModifiedDHRow } from "@/lib/kinematics/dh";
import { origin } from "@/lib/kinematics/mat4";

// The planar nR arm of interactive exercises, modelled in modified (Craig) DH
// through the shared kernel: every joint i turns about Z_i (out of the plane),
// link i has length L_i along X_i, and the tool frame {T} sits at the end of
// the last link. Shared by the widget (browser) and the tests.

/** Widget setup of one exercise variant. Angles in degrees, lengths in metres. */
export interface PlanarArmSetup {
  links: number[];
  /** joint angles the arm starts at */
  initial: number[];
  /** a point to reach, drawn as a marker */
  target?: [number, number];
  /** show the tip coordinates while the reader moves the arm (default false) */
  showTip?: boolean;
  /** joint angle step of the controls (default 1°) */
  step?: number;
}

/**
 * Quantities an exercise can set conditions on:
 * - x, y: tip position (m); phi: tip orientation (degrees)
 * - detJ: determinant of the 2×2 position Jacobian (2R only, m²)
 * - w: manipulability √det(J Jᵀ) of the position Jacobian
 * - elbowHeight: signed distance (m) of joint 2 from the line base → tip,
 *   positive to its left (above it, for a tip to the right of the base)
 * - targetDistance: distance from the tip to the target (m)
 * A quantity that is undefined for the arm (detJ for n ≠ 2, targetDistance
 * without a target, elbowHeight with the tip on the base) is NaN.
 */
export const planarArmQuantities = ["x", "y", "phi", "detJ", "w", "elbowHeight", "targetDistance"] as const;
export type PlanarArmQuantity = (typeof planarArmQuantities)[number];

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Modified DH table of the arm: one row per joint plus the tool row {T}. */
export function planarArmRows(links: number[], anglesDeg: number[]): ModifiedDHRow[] {
  return [
    ...links.map((_, i) => ({ alpha: 0, a: i === 0 ? 0 : links[i - 1], d: 0, theta: rad(anglesDeg[i]) })),
    { alpha: 0, a: links[links.length - 1], d: 0, theta: 0 },
  ];
}

/** Base, the other joints and the tip, as plane coordinates (m). */
export function planarArmPoints(links: number[], anglesDeg: number[]): [number, number][] {
  return modifiedDHFrames(planarArmRows(links, anglesDeg)).map((T) => [T[0][3], T[1][3]]);
}

export function planarArmValues(
  setup: Pick<PlanarArmSetup, "links" | "target">,
  anglesDeg: number[],
): Record<PlanarArmQuantity, number> {
  const frames = modifiedDHFrames(planarArmRows(setup.links, anglesDeg));
  const tool = frames[frames.length - 1];
  const [x, y] = origin(tool);
  const J = geometricJacobian(frames.slice(0, -1), tool);
  const [jx, jy] = [J[0], J[1]];
  const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);
  const gram = dot(jx, jx) * dot(jy, jy) - dot(jx, jy) ** 2;
  const [ex, ey] = origin(frames[1]);
  const r = Math.hypot(x, y);
  return {
    x,
    y,
    phi: deg(Math.atan2(tool[1][0], tool[0][0])),
    detJ: setup.links.length === 2 ? jx[0] * jy[1] - jx[1] * jy[0] : NaN,
    w: Math.sqrt(Math.max(0, gram)),
    elbowHeight: setup.links.length >= 2 && r > 1e-9 ? (x * ey - y * ex) / r : NaN,
    targetDistance: setup.target ? Math.hypot(x - setup.target[0], y - setup.target[1]) : NaN,
  };
}

/** An angle rounded to the controls' step and wrapped into (−180°, 180°]. */
export function snapAngle(angle: number, step = 1): number {
  const snapped = Math.round(angle / step) * step;
  const wrapped = snapped - 360 * Math.ceil((snapped - 180) / 360);
  return Number(wrapped.toFixed(6));
}
