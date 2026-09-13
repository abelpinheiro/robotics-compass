// Velocity manipulability ellipsoid from a geometric Jacobian's linear rows.
// The ellipsoid axes are the eigenvectors of Jᵥ·Jᵥᵀ (3×3), semi-axes the square
// roots of its eigenvalues (the singular values of Jᵥ). Displayed axes are
// normalised so the longest maps to `target`, which keeps a fixed on-screen size
// while the *shape* still flattens toward a disc/line near a singularity.

export type Vec3 = [number, number, number];

export interface Ellipsoid {
  center: Vec3;
  axes: [Vec3, Vec3, Vec3]; // orthonormal eigenvector directions
  radii: [number, number, number]; // display semi-axes (metres)
}

// Jacobi eigen-decomposition of a symmetric 3×3 matrix.
function eig3(a: number[][]): { values: number[]; vectors: Vec3[] } {
  const A = a.map((r) => r.slice());
  const V = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  const pairs: [number, number][] = [
    [0, 1],
    [0, 2],
    [1, 2],
  ];
  for (let sweep = 0; sweep < 16; sweep++) {
    let p = 0, q = 1, max = 0;
    for (const [i, j] of pairs) {
      if (Math.abs(A[i][j]) > max) {
        max = Math.abs(A[i][j]);
        p = i;
        q = j;
      }
    }
    if (max < 1e-14) break;
    const theta = (A[q][q] - A[p][p]) / (2 * A[p][q]);
    const t = (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
    const c = 1 / Math.sqrt(t * t + 1);
    const s = t * c;
    for (let k = 0; k < 3; k++) {
      const akp = A[k][p], akq = A[k][q];
      A[k][p] = c * akp - s * akq;
      A[k][q] = s * akp + c * akq;
    }
    for (let k = 0; k < 3; k++) {
      const apk = A[p][k], aqk = A[q][k];
      A[p][k] = c * apk - s * aqk;
      A[q][k] = s * apk + c * aqk;
    }
    for (let k = 0; k < 3; k++) {
      const vkp = V[k][p], vkq = V[k][q];
      V[k][p] = c * vkp - s * vkq;
      V[k][q] = s * vkp + c * vkq;
    }
  }
  return {
    values: [A[0][0], A[1][1], A[2][2]],
    vectors: [
      [V[0][0], V[1][0], V[2][0]],
      [V[0][1], V[1][1], V[2][1]],
      [V[0][2], V[1][2], V[2][2]],
    ],
  };
}

/** Build the display ellipsoid from Jacobian columns (each length 6; first 3 = linear). */
export function ellipsoidFromCols(cols: number[][], center: Vec3, target = 0.28): Ellipsoid {
  const A = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (const col of cols) {
    const l0 = col[0], l1 = col[1], l2 = col[2];
    A[0][0] += l0 * l0; A[0][1] += l0 * l1; A[0][2] += l0 * l2;
    A[1][0] += l1 * l0; A[1][1] += l1 * l1; A[1][2] += l1 * l2;
    A[2][0] += l2 * l0; A[2][1] += l2 * l1; A[2][2] += l2 * l2;
  }
  const { values, vectors } = eig3(A);
  const sigma = values.map((v) => Math.sqrt(Math.max(0, v)));
  const maxS = Math.max(sigma[0], sigma[1], sigma[2], 1e-9);
  const radii = sigma.map((s) => Math.max((s / maxS) * target, 1e-3)) as [number, number, number];
  return { center, axes: vectors as [Vec3, Vec3, Vec3], radii };
}
