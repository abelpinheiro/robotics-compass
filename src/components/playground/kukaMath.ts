// KUKA KR6 R900 sixx forward kinematics + geometric Jacobian, computed from the
// SAME joint chain as public/models/kuka_kr6/kr6.urdf (kroshu KUKA description,
// Apache-2.0), so the readouts match the displayed mesh exactly. Each joint is a
// pure translation Trans(xyz) followed by a rotation about its own axis. Metres.

export type Vec3 = [number, number, number];
export const KUKA_JOINT_NAMES = ["joint_1", "joint_2", "joint_3", "joint_4", "joint_5", "joint_6"];

const CHAIN: { xyz: Vec3; axis: Vec3 }[] = [
  { xyz: [0, 0, 0.4], axis: [0, 0, -1] },
  { xyz: [0.025, 0, 0], axis: [0, 1, 0] },
  { xyz: [0.455, 0, 0], axis: [0, 1, 0] },
  { xyz: [0, 0, 0.035], axis: [-1, 0, 0] },
  { xyz: [0.42, 0, 0], axis: [0, 1, 0] },
  { xyz: [0.08, 0, 0], axis: [-1, 0, 0] },
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
// Rodrigues rotation about a unit axis.
function rotAxis(ax: Vec3, t: number): M4 {
  const [x, y, z] = ax;
  const c = Math.cos(t), s = Math.sin(t), v = 1 - c;
  return [
    c + x * x * v, x * y * v - z * s, x * z * v + y * s, 0,
    y * x * v + z * s, c + y * y * v, y * z * v - x * s, 0,
    z * x * v - y * s, z * y * v + x * s, c + z * z * v, 0,
    0, 0, 0, 1,
  ];
}
// rotation part of a 4×4 applied to a vector
const rotApply = (T: M4, vx: number, vy: number, vz: number): Vec3 => [
  T[0] * vx + T[1] * vy + T[2] * vz,
  T[4] * vx + T[5] * vy + T[6] * vz,
  T[8] * vx + T[9] * vy + T[10] * vz,
];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
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

export const KUKA_WMAX = 0.134;
export const SINGULAR_FRACTION = 0.05;

export interface KukaPose {
  origins: Vec3[];
  ee: Vec3;
  w: number;
  wMax: number;
  detJ: number;
  cols: number[][];
}

export function kukaFK(theta: number[]): KukaPose {
  let T = I4();
  const origins: Vec3[] = [];
  const zaxes: Vec3[] = [];
  for (let i = 0; i < 6; i++) {
    const j = CHAIN[i];
    const Tpre = mul(T, trans(j.xyz[0], j.xyz[1], j.xyz[2]));
    zaxes.push(rotApply(Tpre, j.axis[0], j.axis[1], j.axis[2]));
    origins.push([Tpre[3], Tpre[7], Tpre[11]]);
    T = mul(Tpre, rotAxis(j.axis, theta[i]));
  }
  const ee: Vec3 = [T[3], T[7], T[11]];
  const cols: number[][] = [];
  for (let i = 0; i < 6; i++) {
    const lin = cross(zaxes[i], sub(ee, origins[i]));
    cols.push([lin[0], lin[1], lin[2], zaxes[i][0], zaxes[i][1], zaxes[i][2]]);
  }
  const J: number[][] = Array.from({ length: 6 }, (_, r) => cols.map((c) => c[r]));
  const detJ = detN(J);
  return { origins, ee, w: Math.abs(detJ), wMax: KUKA_WMAX, detJ, cols };
}

// Non-singular "ready" pose (radians).
export const KUKA_HOME = [0, -1.4, 1.4, 0, 1.0, 0];

export const KUKA_SINGULARITIES: { key: string; label: string; theta: number[] }[] = [
  { key: "wrist", label: "Wrist singularity", theta: [0, -1.4, 1.4, 0, 0, 0] }, // A5 = 0
  { key: "elbow", label: "Elbow singularity", theta: [0, -1.5707963, 0, 0, 1.0, 0] }, // A3 = 0, arm straight
  { key: "shoulder", label: "Shoulder singularity", theta: [0, -2.906, 2.845, 0, 1.0, 0] }, // wrist centre on z0
];

export function kukaSingularity(theta: number[]): string | null {
  const p = kukaFK(theta);
  if (p.w / p.wMax >= SINGULAR_FRACTION) return null;
  if (Math.abs(Math.sin(theta[4])) < 0.08) return "wrist singularity";
  if (Math.abs(Math.sin(theta[2])) < 0.08) return "elbow singularity";
  return "shoulder/boundary singularity";
}
