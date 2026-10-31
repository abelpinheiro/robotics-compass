// Exercises for the "forward-kinematics" lesson. DRAFTS written by Claude for
// the author's review (status "draft": shown only on the dev server). Expected
// values come from the shared kinematics kernel and are cross-checked by
// `verifyCase`, which the exercise tests run for every case; the tests also
// run the Python reference in Pyodide.

import { defineExercises, exercise } from "@/lib/exercises/types";
import { modifiedDH } from "@/lib/kinematics/dh";
import { chain, rotX, rotZ, transX, transZ } from "@/lib/kinematics/mat4";

export default defineExercises("forward-kinematics", [
  exercise({
    id: "forward-kinematics-link-transform",
    status: "draft",
    level: 2,
    kind: "python",
    entry: "link_transform",
    statement: {
      en: "Write `link_transform(alpha, a, d, theta)`, which returns, as a $4\\times4$ NumPy array, the link transform of one row of a **modified (Craig) DH** table:\n\n$$^{i-1}_iT = Rot_{X}(\\alpha_{i-1}) \\cdot Trans_{X}(a_{i-1}) \\cdot Rot_{Z}(\\theta_i) \\cdot Trans_{Z}(d_i)$$\n\nThe arguments follow the columns of the table, $\\alpha_{i-1}$, $a_{i-1}$, $d_i$, $\\theta_i$, with angles in radians.",
      pt: "Escreva `link_transform(alpha, a, d, theta)`, que devolve, como um array NumPy $4\\times4$, a transformação de elo (link transform) de uma linha de uma tabela de **DH modificada (Craig)**:\n\n$$^{i-1}_iT = Rot_{X}(\\alpha_{i-1}) \\cdot Trans_{X}(a_{i-1}) \\cdot Rot_{Z}(\\theta_i) \\cdot Trans_{Z}(d_i)$$\n\nOs argumentos seguem as colunas da tabela, $\\alpha_{i-1}$, $a_{i-1}$, $d_i$, $\\theta_i$, com ângulos em radianos.",
    },
    hints: [
      {
        en: "Write each elementary transform as a $4\\times4$ array and multiply them in order with `@`.",
        pt: "Escreva cada transformação elementar como um array $4\\times4$ e multiplique-as na ordem com `@`.",
      },
      {
        en: "Check your function: with every argument zero it returns the identity, and with only $a \\neq 0$ it is a translation along $X$.",
        pt: "Confira a sua função: com todos os argumentos zero ela devolve a identidade, e com só $a \\neq 0$ é uma translação ao longo de $X$.",
      },
    ],
    solution: {
      en: "Multiplying out the four transforms:\n\n$$^{i-1}_iT = \\begin{bmatrix} c\\theta_i & -s\\theta_i & 0 & a_{i-1} \\\\ s\\theta_i\\, c\\alpha_{i-1} & c\\theta_i\\, c\\alpha_{i-1} & -s\\alpha_{i-1} & -s\\alpha_{i-1}\\, d_i \\\\ s\\theta_i\\, s\\alpha_{i-1} & c\\theta_i\\, s\\alpha_{i-1} & c\\alpha_{i-1} & c\\alpha_{i-1}\\, d_i \\\\ 0 & 0 & 0 & 1 \\end{bmatrix}$$\n\nThe reference code below writes this matrix directly.",
      pt: "Multiplicando as quatro transformações:\n\n$$^{i-1}_iT = \\begin{bmatrix} c\\theta_i & -s\\theta_i & 0 & a_{i-1} \\\\ s\\theta_i\\, c\\alpha_{i-1} & c\\theta_i\\, c\\alpha_{i-1} & -s\\alpha_{i-1} & -s\\alpha_{i-1}\\, d_i \\\\ s\\theta_i\\, s\\alpha_{i-1} & c\\theta_i\\, s\\alpha_{i-1} & c\\alpha_{i-1} & c\\alpha_{i-1}\\, d_i \\\\ 0 & 0 & 0 & 1 \\end{bmatrix}$$\n\nO código de referência abaixo escreve essa matriz diretamente.",
    },
    starter: `import numpy as np


def link_transform(alpha, a, d, theta):
    ...
`,
    reference: `import numpy as np


def link_transform(alpha, a, d, theta):
    ca, sa = np.cos(alpha), np.sin(alpha)
    ct, st = np.cos(theta), np.sin(theta)
    return np.array([
        [ct, -st, 0.0, a],
        [st * ca, ct * ca, -sa, -sa * d],
        [st * sa, ct * sa, ca, ca * d],
        [0.0, 0.0, 0.0, 1.0],
    ])
`,
    cases: (_, rng) => [
      [0, 0.5, 0, 0],
      [Math.PI / 2, 0, rng.uniform(0.05, 0.4, 2), rng.uniform(-3, 3, 3)],
      [rng.uniform(-3, 3, 3), rng.uniform(0.1, 0.8, 2), rng.uniform(-0.3, 0.3, 2), rng.uniform(-3, 3, 3)],
      [-Math.PI / 2, rng.uniform(0.1, 0.8, 2), 0, rng.uniform(-3, 3, 3)],
    ],
    solve: (args) => {
      const [alpha, a, d, theta] = args as number[];
      return modifiedDH({ alpha, a, d, theta });
    },
    verifyCase: (args, expected) => {
      // the elementary-matrix product, in Craig's order
      const [alpha, a, d, theta] = args as number[];
      const T = chain(rotX(alpha), transX(a), rotZ(theta), transZ(d));
      (expected as number[][]).forEach((row, r) =>
        row.forEach((v, c) => {
          if (!(Math.abs(v - T[r][c]) <= 1e-12)) throw new Error(`entry [${r}][${c}]: ${v} ≠ ${T[r][c]}`);
        }),
      );
    },
    tolerance: { abs: 1e-6 },
  }),
]);
