// UR20 forward kinematics + geometric Jacobian, computed from the SAME joint
// chain as public/models/ur20/ur20.urdf (official UR ROS description, BSD-3), so
// the numeric readouts match the displayed mesh exactly. Each joint transform is
// Trans(xyz)·RPY(rpy)·Rz(θ); all six axes are local +z. Lengths in metres.

export type Vec3 = [number, number, number];
export const UR20_JOINT_NAMES = [
  "shoulder_pan_joint",
  "shoulder_lift_joint",
  "elbow_joint",
  "wrist_1_joint",
  "wrist_2_joint",
  "wrist_3_joint",
];

// static parent→child transforms (before the joint rotation about local z)
const CHAIN: { xyz: Vec3; rpy: Vec3 }[] = [
  { xyz: [0, 0, 0.2363], rpy: [0, 0, 0] },
  { xyz: [0, 0, 0], rpy: [1.570796327, 0, 0] },
  { xyz: [-0.862, 0, 0], rpy: [0, 0, 0] },
  { xyz: [-0.7287, 0, 0.201], rpy: [0, 0, 0] },
  { xyz: [0, -0.1593, 0], rpy: [1.570796327, 0, 0] },
  { xyz: [0, 0.1543, 0], rpy: [1.5707963265897931, 3.1415926535897931, 3.1415926535897931] },
];

type M4 = number[]; // row-major 4×4

const I4 = (): M4 => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
function mul(A: M4, B: M4): M4 {
  const C = new Array(16).fill(0) as M4;
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += A[r * 4 + k] * B[k * 4 + c];
      C[r * 4 + c] = s;
    }
  return C;
}
const trans = (x: number, y: number, z: number): M4 => [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1];
// URDF rpy = extrinsic X-Y-Z  ⇒  R = Rz(yaw)·Ry(pitch)·Rx(roll)
function rpy(r: number, p: number, y: number): M4 {
  const cr = Math.cos(r), sr = Math.sin(r);
  const cp = Math.cos(p), sp = Math.sin(p);
  const cy = Math.cos(y), sy = Math.sin(y);
  return [
    cy * cp, cy * sp * sr - sy * cr, cy * sp * cr + sy * sr, 0,
    sy * cp, sy * sp * sr + cy * cr, sy * sp * cr - cy * sr, 0,
    -sp, cp * sr, cp * cr, 0,
    0, 0, 0, 1,
  ];
}
function rotZ(t: number): M4 {
  const c = Math.cos(t), s = Math.sin(t);
  return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

// base_link → base_link_inertia is a fixed Rz(π) in the UR description.
const BASE = rotZ(Math.PI);

const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

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

// Max |det J| over the workspace, for normalising the manipulability bar.
export const UR20_WMAX = 0.87;
export const SINGULAR_FRACTION = 0.05;

export interface UR20Pose {
  origins: Vec3[]; // frame origins {1..6}
  ee: Vec3; // wrist_3 origin
  w: number; // Yoshikawa manipulability = |det J|
  wMax: number;
  detJ: number;
}

export function ur20FK(theta: number[]): UR20Pose {
  let T = BASE;
  const origins: Vec3[] = [];
  const zaxes: Vec3[] = [];
  for (let i = 0; i < 6; i++) {
    const j = CHAIN[i];
    T = mul(T, mul(trans(j.xyz[0], j.xyz[1], j.xyz[2]), mul(rpy(j.rpy[0], j.rpy[1], j.rpy[2]), rotZ(theta[i]))));
    origins.push([T[3], T[7], T[11]]);
    zaxes.push([T[2], T[6], T[10]]);
  }
  const ee = origins[5];
  const cols: number[][] = [];
  for (let i = 0; i < 6; i++) {
    const lin = cross(zaxes[i], sub(ee, origins[i]));
    cols.push([lin[0], lin[1], lin[2], zaxes[i][0], zaxes[i][1], zaxes[i][2]]);
  }
  const J: number[][] = Array.from({ length: 6 }, (_, r) => cols.map((c) => c[r]));
  const detJ = detN(J);
  return { origins, ee, w: Math.abs(detJ), wMax: UR20_WMAX, detJ };
}

// A comfortable, non-singular "ready" pose (radians).
export const UR20_HOME = [0, -1.2, 1.6, -1.9, -1.5707963, 0];

// Canonical singular configurations (verified numerically by the probe).
export const UR20_SINGULARITIES: { key: string; label: string; theta: number[] }[] = [
  { key: "wrist", label: "Wrist singularity", theta: [0, -1.2, 1.6, -1.9, 0, 0] }, // θ5 = 0
  { key: "elbow", label: "Elbow singularity", theta: [0, -1.2, 0, -1.9, -1.5707963, 0] }, // θ3 = 0, arm straight
  { key: "shoulder", label: "Shoulder singularity", theta: [0, -2.094, 0.924, 0, -1.2, 0] }, // wrist centre on z0
];

export function ur20Singularity(theta: number[]): string | null {
  const p = ur20FK(theta);
  if (p.w / p.wMax >= SINGULAR_FRACTION) return null;
  if (Math.abs(Math.sin(theta[4])) < 0.08) return "wrist singularity";
  if (Math.abs(Math.sin(theta[2])) < 0.08) return "elbow singularity";
  return "shoulder/boundary singularity";
}
