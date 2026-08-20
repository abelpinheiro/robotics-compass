// Shared geometry + math for the 3-DOF arm used by both the forward-kinematics
// and inverse-kinematics visualizations. Keeping the chain here (not inside a
// component) means the FK viz and the IK solver invert exactly the same
// transform the 3D scene draws.

// Link lengths of the 3-DOF arm (base column, upper arm, forearm).
export const L1 = 1.2;
export const L2 = 1.3;
export const L3 = 1.0;

export type Mat4 = number[][];
export type P3 = [number, number, number];

/** Joint angles in degrees: base yaw, shoulder pitch, elbow pitch. */
export interface Pose {
  t1: number;
  t2: number;
  t3: number;
}

export const toRad = (d: number) => (d * Math.PI) / 180;
export const toDeg = (r: number) => (r * 180) / Math.PI;

export function mul(a: Mat4, b: Mat4): Mat4 {
  const o: Mat4 = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++)
      for (let k = 0; k < 4; k++) o[i][j] += a[i][k] * b[k][j];
  return o;
}

export const rotZ = (t: number): Mat4 => {
  const c = Math.cos(t), s = Math.sin(t);
  return [[c, -s, 0, 0], [s, c, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
};
export const rotY = (t: number): Mat4 => {
  const c = Math.cos(t), s = Math.sin(t);
  return [[c, 0, s, 0], [0, 1, 0, 0], [-s, 0, c, 0], [0, 0, 0, 1]];
};
export const transZ = (d: number): Mat4 => [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, d], [0, 0, 0, 1]];
export const transX = (a: number): Mat4 => [[1, 0, 0, a], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];

/** The three joint transforms + their product, matching the scene's nested groups. */
export function linkMatrices(p: Pose) {
  const A1 = mul(rotZ(toRad(p.t1)), transZ(L1));
  const A2 = mul(rotY(toRad(p.t2)), transX(L2));
  const A3 = mul(rotY(toRad(p.t3)), transX(L3));
  const T03 = mul(mul(A1, A2), A3);
  return { A1, A2, A3, T03 };
}

/** Forward kinematics: joint angles (deg) → TCP position in the base frame. */
export function fkTCP(p: Pose): P3 {
  const T = linkMatrices(p).T03;
  return [T[0][3], T[1][3], T[2][3]];
}
