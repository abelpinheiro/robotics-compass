// 4×4 homogeneous-transform helpers shared by the kinematics kernels. Matrices
// are row-major nested arrays (T[row][col]), the same shape MatrixDisplay
// renders, so a kernel result can be shown without conversion.

export type Mat4 = number[][];
export type Vec3 = [number, number, number];

export const identity = (): Mat4 => [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1],
];

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

/** Left-to-right product T₁·T₂·…·Tₙ (identity when empty). */
export const chain = (...ms: Mat4[]): Mat4 => ms.reduce(mul, identity());

export const rotX = (t: number): Mat4 => {
  const c = Math.cos(t), s = Math.sin(t);
  return [[1, 0, 0, 0], [0, c, -s, 0], [0, s, c, 0], [0, 0, 0, 1]];
};
export const rotY = (t: number): Mat4 => {
  const c = Math.cos(t), s = Math.sin(t);
  return [[c, 0, s, 0], [0, 1, 0, 0], [-s, 0, c, 0], [0, 0, 0, 1]];
};
export const rotZ = (t: number): Mat4 => {
  const c = Math.cos(t), s = Math.sin(t);
  return [[c, -s, 0, 0], [s, c, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
};
export const transX = (a: number): Mat4 => [[1, 0, 0, a], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
export const transZ = (d: number): Mat4 => [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, d], [0, 0, 0, 1]];

/** Origin of the frame described by T (its last column). */
export const origin = (T: Mat4): Vec3 => [T[0][3], T[1][3], T[2][3]];
/** Z axis of the frame described by T (its third column). */
export const zAxis = (T: Mat4): Vec3 => [T[0][2], T[1][2], T[2][2]];

export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
