// KUKA LBR iiwa 14 R820 (7-DOF) forward kinematics + geometric Jacobian, from
// the SAME joint chain as public/models/kuka_iiwa/iiwa.urdf (kroshu, Apache-2.0).
// Redundant arm: J is 6×7, so the Yoshikawa manipulability is w = √det(J·Jᵀ).

export type Vec3 = [number, number, number];
export const IIWA_JOINT_NAMES = ["joint_1", "joint_2", "joint_3", "joint_4", "joint_5", "joint_6", "joint_7"];

const CHAIN: { xyz: Vec3; axis: Vec3 }[] = [
  { xyz: [0, 0, 0.1575], axis: [0, 0, 1] },
  { xyz: [0, 0, 0.2025], axis: [0, 1, 0] },
  { xyz: [0, 0, 0.2045], axis: [0, 0, 1] },
  { xyz: [0, 0, 0.2155], axis: [0, -1, 0] },
  { xyz: [0, 0, 0.1845], axis: [0, 0, 1] },
  { xyz: [0, 0, 0.2155], axis: [0, 1, 0] },
  { xyz: [0, 0, 0.081], axis: [0, 0, 1] },
];

type M4 = number[];
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

export const IIWA_WMAX = 0.158;
export const SINGULAR_FRACTION = 0.05;

export interface IiwaPose {
  origins: Vec3[];
  ee: Vec3;
  w: number;
  wMax: number;
  detJ: number; // reported as w for the redundant arm (det of the 6×6 J·Jᵀ is w²)
  cols: number[][];
}

export function iiwaFK(theta: number[]): IiwaPose {
  let T = I4();
  const origins: Vec3[] = [];
  const zaxes: Vec3[] = [];
  for (let i = 0; i < 7; i++) {
    const j = CHAIN[i];
    const Tpre = mul(T, trans(j.xyz[0], j.xyz[1], j.xyz[2]));
    zaxes.push(rotApply(Tpre, j.axis[0], j.axis[1], j.axis[2]));
    origins.push([Tpre[3], Tpre[7], Tpre[11]]);
    T = mul(Tpre, rotAxis(j.axis, theta[i]));
  }
  const ee: Vec3 = [T[3], T[7], T[11]];
  // 6×7 Jacobian columns
  const cols: number[][] = [];
  for (let i = 0; i < 7; i++) {
    const lin = cross(zaxes[i], sub(ee, origins[i]));
    cols.push([lin[0], lin[1], lin[2], zaxes[i][0], zaxes[i][1], zaxes[i][2]]);
  }
  // J·Jᵀ (6×6): [r][c] = Σ_i cols[i][r]·cols[i][c]
  const JJt: number[][] = Array.from({ length: 6 }, () => new Array(6).fill(0));
  for (let i = 0; i < 7; i++)
    for (let r = 0; r < 6; r++)
      for (let c = 0; c < 6; c++) JJt[r][c] += cols[i][r] * cols[i][c];
  const w = Math.sqrt(Math.max(0, detN(JJt)));
  return { origins, ee, w, wMax: IIWA_WMAX, detJ: w, cols };
}

// Non-singular "ready" pose (radians).
export const IIWA_HOME = [0, 0.5, 0, -1.2, 0, 1.0, 0];

// A redundant (7-DOF) arm keeps task rank 6 through many wrist alignments, so its
// true task-space singularities (w = 0) are the boundary (stretched) and elbow.
export const IIWA_SINGULARITIES: { key: string; label: string; theta: number[] }[] = [
  { key: "stretched", label: "Stretched (boundary)", theta: [0, 0, 0, 0, 0, 0, 0] }, // arm straight up
  { key: "elbow", label: "Elbow singularity", theta: [0, 0.6, 0, 0, 0, 1.0, 0] }, // joint_4 = 0
];

export function iiwaSingularity(theta: number[]): string | null {
  const p = iiwaFK(theta);
  if (p.w / p.wMax >= SINGULAR_FRACTION) return null;
  if (Math.abs(Math.sin(theta[3])) < 0.08) return "elbow singularity";
  return "boundary singularity";
}
