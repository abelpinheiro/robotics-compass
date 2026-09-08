// Kinematics + singularity math shared by the 2D canvas and the 3D scene.
//
// Two robots:
//  - SCARA: positioning is a 2R planar arm (θ1, θ2) at a fixed height, plus a
//    vertical prismatic (d3) and a tool rotation (θ4). Its ONLY kinematic
//    singularities come from the elbow: det of the planar 2×2 Jacobian is
//    L1·L2·sin θ2, so the arm is singular at θ2 = 0 (fully extended → OUTER
//    workspace boundary) and θ2 = π (fully folded → INNER boundary). The
//    prismatic/tool joints never create a singularity (their axes stay parallel).
//  - 6-DOF: an anthropomorphic arm with a spherical wrist (standard DH). It has
//    genuine INTERIOR singularities — wrist (axes 4 & 6 align, θ5 = 0), elbow
//    (arm straightened), shoulder (wrist centre over the base axis) — plus the
//    boundary one at full extension. Detected numerically from det(J).

export type Vec3 = [number, number, number];
export type RobotKind = "scara" | "sixdof";

// ---------------------------------------------------------------------------
// SCARA (analytic, planar 2R + vertical prismatic + tool)
// ---------------------------------------------------------------------------

export const SCARA = {
  L1: 1.4, // upper link (shoulder → elbow)
  L2: 1.1, // fore link  (elbow → tool)
  baseH: 0.9, // height of the planar arm above the ground
  d3Max: 0.8, // prismatic travel (downward from baseH)
};

export interface ScaraState {
  theta1: number; // rad
  theta2: number; // rad
  d3: number; // 0..d3Max, downward
  theta4: number; // tool rotation (no effect on singularity)
}

export interface ScaraPose {
  /** planar joint positions in the arm plane (x right, y forward) */
  shoulder: Vec3; // base of link 1 (at baseH)
  elbow: Vec3;
  tool: Vec3;
  /** manipulability of the positional 2R Jacobian: w = L1·L2·|sin θ2| */
  w: number;
  wMax: number; // L1·L2  (w at θ2 = ±90°)
  detJ: number; // signed det of the planar 2×2 Jacobian (L1·L2·sin θ2)
}

export function scaraFK(s: ScaraState): ScaraPose {
  const { L1, L2, baseH } = SCARA;
  const z = baseH - s.d3;
  const shoulder: Vec3 = [0, 0, baseH];
  const c1 = Math.cos(s.theta1);
  const s1 = Math.sin(s.theta1);
  const elbow: Vec3 = [L1 * c1, L1 * s1, baseH];
  const a12 = s.theta1 + s.theta2;
  const tool: Vec3 = [L1 * c1 + L2 * Math.cos(a12), L1 * s1 + L2 * Math.sin(a12), z];
  const detJ = L1 * L2 * Math.sin(s.theta2);
  return { shoulder, elbow, tool, w: Math.abs(detJ), wMax: L1 * L2, detJ };
}

/** Outer/inner radii of the annular reachable workspace of the 2R arm. */
export const scaraWorkspace = () => ({
  outer: SCARA.L1 + SCARA.L2, // θ2 = 0
  inner: Math.abs(SCARA.L1 - SCARA.L2), // θ2 = π
});

// ---------------------------------------------------------------------------
// 6-DOF anthropomorphic arm with a spherical wrist (standard DH)
// ---------------------------------------------------------------------------

// [a, alpha, d] per link; theta is the variable joint angle. All revolute.
export const SIXDOF_DH: { a: number; alpha: number; d: number }[] = [
  { a: 0, alpha: Math.PI / 2, d: 1.0 }, // 1: base rotation, shoulder lift axis
  { a: 1.4, alpha: 0, d: 0 }, // 2: upper arm
  { a: 0, alpha: Math.PI / 2, d: 0 }, // 3: elbow
  { a: 0, alpha: -Math.PI / 2, d: 1.3 }, // 4: forearm / wrist roll
  { a: 0, alpha: Math.PI / 2, d: 0 }, // 5: wrist pitch
  { a: 0, alpha: 0, d: 0.5 }, // 6: wrist roll + tool
];

export type Mat4 = number[]; // row-major 4×4 (length 16)

function mat4Identity(): Mat4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function mat4Mul(A: Mat4, B: Mat4): Mat4 {
  const C = new Array(16).fill(0) as Mat4;
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += A[r * 4 + k] * B[k * 4 + c];
      C[r * 4 + c] = sum;
    }
  return C;
}

/** Standard (distal) DH homogeneous transform A_i. */
function dhMatrix(a: number, alpha: number, d: number, theta: number): Mat4 {
  const ct = Math.cos(theta), st = Math.sin(theta);
  const ca = Math.cos(alpha), sa = Math.sin(alpha);
  return [
    ct, -st * ca, st * sa, a * ct,
    st, ct * ca, -ct * sa, a * st,
    0, sa, ca, d,
    0, 0, 0, 1,
  ];
}

const origin = (T: Mat4): Vec3 => [T[3], T[7], T[11]];
const zAxis = (T: Mat4): Vec3 => [T[2], T[6], T[10]];

export interface SixDofPose {
  /** origins of frames {0..6} in base coords (7 points) */
  points: Vec3[];
  /** z-axis of each frame {0..6} in base coords (for drawing joint cylinders) */
  zAxes: Vec3[];
  ee: Vec3;
  wristCenter: Vec3; // origin of frame {4} (spherical-wrist intersection)
  w: number; // Yoshikawa manipulability = |det J|
  wMax: number;
  detJ: number;
}

const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

/** |det| of an n×n matrix (rows) via Gaussian elimination with partial pivot. */
function detN(rows: number[][]): number {
  const n = rows.length;
  const m = rows.map((r) => r.slice());
  let det = 1;
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(m[r][col]) > Math.abs(m[piv][col])) piv = r;
    if (Math.abs(m[piv][col]) < 1e-12) return 0;
    if (piv !== col) {
      [m[col], m[piv]] = [m[piv], m[col]];
      det = -det;
    }
    det *= m[col][col];
    for (let r = col + 1; r < n; r++) {
      const f = m[r][col] / m[col][col];
      for (let c = col; c < n; c++) m[r][c] -= f * m[col][c];
    }
  }
  return det;
}

// Max of |det J| over the exposed joint ranges (computed once via the probe),
// used to normalise the manipulability bar.
const SIXDOF_WMAX = 3.8;

export function sixDofFK(theta: number[]): SixDofPose {
  const Ts: Mat4[] = [mat4Identity()];
  let T = mat4Identity();
  for (let i = 0; i < 6; i++) {
    const { a, alpha, d } = SIXDOF_DH[i];
    T = mat4Mul(T, dhMatrix(a, alpha, d, theta[i]));
    Ts.push(T);
  }
  const points = Ts.map(origin);
  const zAxes = Ts.map(zAxis);
  const ee = points[6];

  // geometric Jacobian: column i = [ z_{i-1} × (o_6 − o_{i-1}) ; z_{i-1} ]
  const cols: number[][] = [];
  for (let i = 0; i < 6; i++) {
    const zPrev = zAxes[i];
    const oPrev = points[i];
    const lin = cross(zPrev, sub(ee, oPrev));
    cols.push([lin[0], lin[1], lin[2], zPrev[0], zPrev[1], zPrev[2]]);
  }
  // J is 6×6 with columns cols[i]; build rows for the determinant.
  const J: number[][] = Array.from({ length: 6 }, (_, r) => cols.map((c) => c[r]));
  const detJ = detN(J);

  return {
    points,
    zAxes,
    ee,
    wristCenter: points[4],
    w: Math.abs(detJ),
    wMax: SIXDOF_WMAX,
    detJ,
  };
}

// Canonical singular configurations for the 6-DOF arm (joint angles in rad).
// Each drives det(J) → 0; verified numerically by the probe script.
export const SIXDOF_SINGULARITIES: {
  key: string;
  label: string;
  kind: "interior" | "boundary";
  theta: number[];
  note: string;
}[] = [
  {
    key: "wrist",
    label: "Wrist singularity",
    kind: "interior",
    theta: [0, -0.7, 0.7, 0, 0, 0], // θ5 = 0 → wrist roll axes 4 & 6 align
    note: "Joint 5 at 0°: the two wrist roll axes (4 and 6) line up, so the wrist loses a rotational DOF. This happens deep inside the workspace.",
  },
  {
    key: "elbow",
    label: "Elbow singularity",
    kind: "boundary",
    theta: [0, -0.7, Math.PI / 2, 0, 0.9, 0], // θ3 = π/2 → arm extended
    note: "The elbow straightens the arm out toward the edge of its reach — a boundary singularity where the tool cannot move further outward.",
  },
  {
    key: "shoulder",
    label: "Shoulder singularity",
    kind: "interior",
    theta: [0, -1.054, 0.493, 0, 0.9, 0], // wrist centre over the base axis z0
    note: "The wrist centre sits directly on the base rotation axis z₀, so joint 1 can spin without moving the tool — an interior singularity.",
  },
];

// A comfortable non-singular "home" pose.
export const SIXDOF_HOME = [0, -0.7, 1.1, 0, 0.9, 0];
