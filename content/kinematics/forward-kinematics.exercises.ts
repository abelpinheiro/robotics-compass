// Exercises for the "forward-kinematics" lesson. DRAFTS written by Claude for
// the author's review (status "draft": shown only on the dev server). Expected
// values come from the shared kinematics kernel and are cross-checked by
// `verifyCase`/`evaluate`, which the exercise tests run for every case; the
// tests also run the Python reference in Pyodide.

import { defineExercises, exercise } from "@/lib/exercises/types";
import { modifiedDH, type ModifiedDHRow } from "@/lib/kinematics/dh";
import { chain, origin, rotX, rotZ, transX, transZ } from "@/lib/kinematics/mat4";

// The lesson's planar 2R arm in modified (Craig) DH (see modeling-manipulators).
const planar2R = (L1: number, L2: number, t1: number, t2: number): ModifiedDHRow[] => [
  { alpha: 0, a: 0, d: 0, theta: t1 },
  { alpha: 0, a: L1, d: 0, theta: t2 },
  { alpha: 0, a: L2, d: 0, theta: 0 },
];

export default defineExercises("forward-kinematics", [
  exercise({
    id: "forward-kinematics-2r-tip-x",
    status: "draft",
    level: 1,
    kind: "symbolic",
    params: (rng) => ({ L1: rng.int(4, 12) / 10, L2: rng.int(3, 10) / 10 }),
    statement: {
      en: "For a planar 2R arm with $L_1 = {{L1}}$ and $L_2 = {{L2}}$, write the $x$ coordinate of the tip as a function of the joint angles. Type `t1` for $\\theta_1$ and `t2` for $\\theta_2$ (in radians); `cos`, `sin`, `+`, `*` and parentheses are available, with a decimal point (`0.5`).",
      pt: "Para um braço planar 2R com $L_1 = {{L1}}$ e $L_2 = {{L2}}$, escreva a coordenada $x$ da ponta em função dos ângulos das juntas (cinemática direta, forward kinematics). Digite `t1` para $\\theta_1$ e `t2` para $\\theta_2$ (em radianos); `cos`, `sin`, `+`, `*` e parênteses estão disponíveis, com ponto decimal (`0.5`, não `0,5`).",
    },
    hints: [
      { en: "The first link contributes $L_1 \\cos\\theta_1$.", pt: "O primeiro elo contribui com $L_1 \\cos\\theta_1$." },
      {
        en: "The second link points at the absolute angle $\\theta_1 + \\theta_2$.",
        pt: "O segundo elo aponta no ângulo absoluto $\\theta_1 + \\theta_2$.",
      },
    ],
    solution: {
      en: "$$x = L_1 \\cos\\theta_1 + L_2 \\cos(\\theta_1 + \\theta_2) = {{L1}} \\cos\\theta_1 + {{L2}} \\cos(\\theta_1 + \\theta_2)$$",
      pt: "$$x = L_1 \\cos\\theta_1 + L_2 \\cos(\\theta_1 + \\theta_2) = {{L1}} \\cos\\theta_1 + {{L2}} \\cos(\\theta_1 + \\theta_2)$$",
    },
    variables: ["t1", "t2"],
    domain: { t1: [-Math.PI, Math.PI], t2: [-Math.PI, Math.PI] },
    tolerance: { abs: 1e-6 },
    solve: ({ L1, L2 }) => `${L1}*cos(t1) + ${L2}*cos(t1 + t2)`,
    evaluate: ({ L1, L2 }, { t1, t2 }) => origin(chain(...planar2R(L1, L2, t1, t2).map(modifiedDH)))[0],
  }),

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
