// Exercises for the "jacobians" lesson. DRAFTS written by Claude for the
// author's review (status "draft": shown only on the dev server). Every
// computed answer is cross-checked against the shared kinematics kernel in
// `verify`/`evaluate`, which the exercise tests run for every variant.

import { defineExercises, exercise } from "@/lib/exercises/types";
import { geometricJacobian, modifiedDHFrames, type ModifiedDHRow } from "@/lib/kinematics/dh";
import { origin } from "@/lib/kinematics/mat4";

const deg = (d: number) => (d * Math.PI) / 180;

// The lesson's planar 2R arm in modified (Craig) DH (see modeling-manipulators).
const planar2R = (L1: number, L2: number, t1: number, t2: number): ModifiedDHRow[] => [
  { alpha: 0, a: 0, d: 0, theta: t1 },
  { alpha: 0, a: L1, d: 0, theta: t2 },
  { alpha: 0, a: L2, d: 0, theta: 0 },
];

/** Kernel Jacobian of the 2R arm (6×2) and its frames. */
function kernel2R(L1: number, L2: number, t1: number, t2: number) {
  const [f1, f2, fT] = modifiedDHFrames(planar2R(L1, L2, t1, t2));
  return { J: geometricJacobian([f1, f2], fT), f1, f2, fT };
}

const det2 = (J: number[][]) => J[0][0] * J[1][1] - J[0][1] * J[1][0];

function expectClose(actual: number, expected: number, what: string, tol = 1e-9) {
  if (!(Math.abs(actual - expected) <= tol)) throw new Error(`${what}: ${actual} ≠ ${expected}`);
}

const lengths = (rng: { int(lo: number, hi: number): number }) => ({
  L1: rng.int(4, 12) / 10,
  L2: rng.int(3, 10) / 10,
});

export default defineExercises("jacobians", [
  exercise({
    id: "jacobians-2r-det",
    status: "draft",
    level: 2,
    kind: "numeric",
    params: (rng) => ({
      ...lengths(rng),
      t1: rng.int(-9, 9) * 10,
      t2: rng.pick([15, 30, 45, 60, 75, 105, 120, 135, 150, 165]),
    }),
    statement: {
      en: "A planar 2R arm has link lengths $L_1 = {{L1}}\\,\\mathrm{m}$ and $L_2 = {{L2}}\\,\\mathrm{m}$ and is at $\\theta_1 = {{t1}}^\\circ$, $\\theta_2 = {{t2}}^\\circ$. Compute the determinant of its $2\\times2$ Jacobian (tip position $x, y$ with respect to $\\theta_1, \\theta_2$).",
      pt: "Um braço planar 2R tem elos de comprimento $L_1 = {{L1}}\\,\\mathrm{m}$ e $L_2 = {{L2}}\\,\\mathrm{m}$ e está em $\\theta_1 = {{t1}}^\\circ$, $\\theta_2 = {{t2}}^\\circ$. Calcule o determinante da sua Jacobiana (Jacobian) $2\\times2$ (posição $x, y$ da ponta em relação a $\\theta_1, \\theta_2$).",
    },
    hints: [
      {
        en: "Differentiate $x = L_1 c_1 + L_2 c_{12}$ and $y = L_1 s_1 + L_2 s_{12}$ with respect to $\\theta_1$ and $\\theta_2$ to get $J$.",
        pt: "Derive $x = L_1 c_1 + L_2 c_{12}$ e $y = L_1 s_1 + L_2 s_{12}$ em relação a $\\theta_1$ e $\\theta_2$ para obter $J$.",
      },
      {
        en: "After simplifying, the determinant depends only on $\\theta_2$: $\\det J = L_1 L_2 \\sin\\theta_2$.",
        pt: "Depois de simplificar, o determinante depende só de $\\theta_2$: $\\det J = L_1 L_2 \\sin\\theta_2$.",
      },
    ],
    solution: {
      en: "$$\\det J = L_1 L_2 \\sin\\theta_2 = {{L1}} \\cdot {{L2}} \\cdot \\sin {{t2}}^\\circ \\approx {{answer:4}}\\ \\mathrm{m}^2$$\n\nThe result does not depend on $\\theta_1$: rotating the whole arm does not change its shape.",
      pt: "$$\\det J = L_1 L_2 \\sin\\theta_2 = {{L1}} \\cdot {{L2}} \\cdot \\sin {{t2}}^\\circ \\approx {{answer:4}}\\ \\mathrm{m}^2$$\n\nO resultado não depende de $\\theta_1$: girar o braço inteiro não muda a sua forma.",
    },
    unit: "\\mathrm{m}^2",
    tolerance: { rel: 0.01, abs: 0.001 },
    solve: ({ L1, L2, t2 }) => L1 * L2 * Math.sin(deg(t2)),
    verify: ({ L1, L2, t1, t2 }) => {
      const { J } = kernel2R(L1, L2, deg(t1), deg(t2));
      expectClose(det2(J), L1 * L2 * Math.sin(deg(t2)), "det of the kernel Jacobian");
    },
  }),

  exercise({
    id: "jacobians-2r-singular",
    status: "draft",
    level: 1,
    kind: "mcq",
    statement: {
      en: "When is a planar 2R arm (both links of nonzero length) at a singular configuration?",
      pt: "Quando um braço planar 2R (com os dois elos de comprimento não nulo) está numa configuração singular (singularity)?",
    },
    options: [
      {
        id: "t2-zero",
        correct: true,
        text: {
          en: "$\\theta_2 = 0^\\circ$ or $\\theta_2 = 180^\\circ$ (arm stretched or folded)",
          pt: "$\\theta_2 = 0^\\circ$ ou $\\theta_2 = 180^\\circ$ (braço esticado ou dobrado)",
        },
        feedback: {
          en: "Correct: $\\det J = L_1 L_2 \\sin\\theta_2$ vanishes exactly when $\\sin\\theta_2 = 0$.",
          pt: "Correto: $\\det J = L_1 L_2 \\sin\\theta_2$ se anula exatamente quando $\\sin\\theta_2 = 0$.",
        },
      },
      {
        id: "t1-zero",
        text: { en: "$\\theta_1 = 0^\\circ$", pt: "$\\theta_1 = 0^\\circ$" },
        feedback: {
          en: "$\\theta_1$ rotates the whole arm without changing its shape, and $\\det J$ does not depend on it.",
          pt: "$\\theta_1$ gira o braço inteiro sem mudar a sua forma, e $\\det J$ não depende dele.",
        },
      },
      {
        id: "t2-ninety",
        text: { en: "$\\theta_2 = 90^\\circ$", pt: "$\\theta_2 = 90^\\circ$" },
        feedback: {
          en: "At $\\theta_2 = \\pm 90^\\circ$, $|\\det J| = L_1 L_2$ is as large as it gets: the farthest from a singularity.",
          pt: "Em $\\theta_2 = \\pm 90^\\circ$, $|\\det J| = L_1 L_2$ é o maior possível: o mais longe de uma singularidade.",
        },
      },
      {
        id: "equal-links",
        text: { en: "Whenever $L_1 = L_2$", pt: "Sempre que $L_1 = L_2$" },
        feedback: {
          en: "Equal lengths let the folded arm ($\\theta_2 = 180^\\circ$) put the tip on the base, but $\\det J$ still vanishes only when $\\sin\\theta_2 = 0$.",
          pt: "Elos iguais fazem o braço dobrado ($\\theta_2 = 180^\\circ$) levar a ponta até a base, mas $\\det J$ continua se anulando só quando $\\sin\\theta_2 = 0$.",
        },
      },
    ],
    solution: {
      en: "$\\det J = L_1 L_2 \\sin\\theta_2$, which is zero only for $\\theta_2 = 0^\\circ$ (stretched) or $\\theta_2 = 180^\\circ$ (folded), whatever $\\theta_1$, $L_1$ and $L_2$ are.",
      pt: "$\\det J = L_1 L_2 \\sin\\theta_2$, que só é zero para $\\theta_2 = 0^\\circ$ (esticado) ou $\\theta_2 = 180^\\circ$ (dobrado), quaisquer que sejam $\\theta_1$, $L_1$ e $L_2$.",
    },
    verify: () => {
      for (const [L1, L2] of [[1, 1], [0.8, 0.5]]) {
        for (const t1 of [0, 0.7, -2]) {
          expectClose(det2(kernel2R(L1, L2, t1, 0).J), 0, "stretched arm is singular");
          expectClose(det2(kernel2R(L1, L2, t1, Math.PI).J), 0, "folded arm is singular");
          expectClose(Math.abs(det2(kernel2R(L1, L2, t1, Math.PI / 2).J)), L1 * L2, "θ2 = 90° gives |det J| = L1·L2");
        }
        if (Math.abs(det2(kernel2R(L1, L2, 0, deg(60)).J)) < 0.1) throw new Error("θ1 = 0 should not be singular");
      }
    },
  }),

  exercise({
    id: "jacobians-2r-tip-x",
    status: "draft",
    level: 2,
    kind: "symbolic",
    params: (rng) => lengths(rng),
    statement: {
      en: "For a planar 2R arm with $L_1 = {{L1}}$ and $L_2 = {{L2}}$, write the $x$ coordinate of the tip as a function of the joint angles. Type `t1` for $\\theta_1$ and `t2` for $\\theta_2$ (in radians); `cos`, `sin`, `+`, `*` and parentheses are available.",
      pt: "Para um braço planar 2R com $L_1 = {{L1}}$ e $L_2 = {{L2}}$, escreva a coordenada $x$ da ponta em função dos ângulos das juntas (cinemática direta, forward kinematics). Digite `t1` para $\\theta_1$ e `t2` para $\\theta_2$ (em radianos); `cos`, `sin`, `+`, `*` e parênteses estão disponíveis.",
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
    evaluate: ({ L1, L2 }, { t1, t2 }) => origin(kernel2R(L1, L2, t1, t2).fT)[0],
  }),

  exercise({
    id: "jacobians-2r-det-order",
    status: "draft",
    level: 3,
    kind: "order",
    statement: {
      en: "Put the steps that compute $\\det J$ for the planar 2R arm in order ($s_{12} = \\sin(\\theta_1+\\theta_2)$, $c_{12} = \\cos(\\theta_1+\\theta_2)$).",
      pt: "Ponha em ordem os passos que calculam $\\det J$ do braço planar 2R ($s_{12} = \\sin(\\theta_1+\\theta_2)$, $c_{12} = \\cos(\\theta_1+\\theta_2)$).",
    },
    steps: [
      {
        id: "matrix",
        text: {
          en: "$J = \\begin{bmatrix} -L_1 s_1 - L_2 s_{12} & -L_2 s_{12} \\\\ L_1 c_1 + L_2 c_{12} & L_2 c_{12} \\end{bmatrix}$",
          pt: "$J = \\begin{bmatrix} -L_1 s_1 - L_2 s_{12} & -L_2 s_{12} \\\\ L_1 c_1 + L_2 c_{12} & L_2 c_{12} \\end{bmatrix}$",
        },
      },
      {
        id: "expand",
        text: {
          en: "$\\det J = (-L_1 s_1 - L_2 s_{12})\\,L_2 c_{12} + L_2 s_{12}\\,(L_1 c_1 + L_2 c_{12})$",
          pt: "$\\det J = (-L_1 s_1 - L_2 s_{12})\\,L_2 c_{12} + L_2 s_{12}\\,(L_1 c_1 + L_2 c_{12})$",
        },
      },
      {
        id: "cancel",
        text: {
          en: "$\\det J = L_1 L_2\\,(s_{12} c_1 - s_1 c_{12})$, since the $L_2^2$ terms cancel",
          pt: "$\\det J = L_1 L_2\\,(s_{12} c_1 - s_1 c_{12})$, pois os termos em $L_2^2$ se cancelam",
        },
      },
      {
        id: "identity",
        text: {
          en: "$\\det J = L_1 L_2 \\sin\\theta_2$, since $s_{12} c_1 - c_{12} s_1 = \\sin(\\theta_1 + \\theta_2 - \\theta_1)$",
          pt: "$\\det J = L_1 L_2 \\sin\\theta_2$, pois $s_{12} c_1 - c_{12} s_1 = \\sin(\\theta_1 + \\theta_2 - \\theta_1)$",
        },
      },
    ],
    hints: [
      { en: "Start from the matrix itself.", pt: "Comece pela própria matriz." },
      {
        en: "Expanding the products, two terms with $L_2^2$ cancel before the trigonometric identity is used.",
        pt: "Ao expandir os produtos, dois termos em $L_2^2$ se cancelam antes de usar a identidade trigonométrica.",
      },
    ],
    solution: {
      en: "Matrix → $ad - bc$ expansion → the $L_2^2$ terms cancel → $\\sin(a - b)$ identity.",
      pt: "Matriz → expansão $ad - bc$ → os termos em $L_2^2$ se cancelam → identidade de $\\sin(a - b)$.",
    },
    verify: () => {
      // Every step is the same number at random poses, and equals the kernel's det J.
      for (const [L1, L2, t1, t2] of [[0.8, 0.5, 0.3, 1.1], [1.2, 0.7, -2.1, -0.4], [0.5, 1, 2.5, 2.9]]) {
        const s1 = Math.sin(t1), c1 = Math.cos(t1), s12 = Math.sin(t1 + t2), c12 = Math.cos(t1 + t2);
        const kernel = det2(kernel2R(L1, L2, t1, t2).J);
        const matrix = (-L1 * s1 - L2 * s12) * (L2 * c12) - (-L2 * s12) * (L1 * c1 + L2 * c12);
        const expand = (-L1 * s1 - L2 * s12) * L2 * c12 + L2 * s12 * (L1 * c1 + L2 * c12);
        const cancel = L1 * L2 * (s12 * c1 - s1 * c12);
        const identity = L1 * L2 * Math.sin(t2);
        for (const [name, v] of Object.entries({ matrix, expand, cancel, identity })) expectClose(v, kernel, name);
      }
    },
  }),

  exercise({
    id: "jacobians-2r-wrong-step",
    status: "draft",
    level: 3,
    kind: "wrong-step",
    statement: {
      en: "One step of this derivation of the first row of the 2R Jacobian is wrong. Which one?",
      pt: "Um passo desta dedução da primeira linha da Jacobiana do 2R está errado. Qual?",
    },
    steps: [
      {
        id: "x",
        text: { en: "$x = L_1 c_1 + L_2 c_{12}$", pt: "$x = L_1 c_1 + L_2 c_{12}$" },
        feedback: {
          en: "This step is correct: it is the tip's $x$ from forward kinematics.",
          pt: "Este passo está correto: é o $x$ da ponta pela cinemática direta.",
        },
      },
      {
        id: "xdot",
        text: {
          en: "$\\dot x = -L_1 s_1\\,\\dot\\theta_1 - L_2 s_{12}\\,(\\dot\\theta_1 + \\dot\\theta_2)$",
          pt: "$\\dot x = -L_1 s_1\\,\\dot\\theta_1 - L_2 s_{12}\\,(\\dot\\theta_1 + \\dot\\theta_2)$",
        },
        feedback: {
          en: "This step is correct: by the chain rule, $\\tfrac{d}{dt}\\cos(\\theta_1 + \\theta_2) = -s_{12}\\,(\\dot\\theta_1 + \\dot\\theta_2)$.",
          pt: "Este passo está correto: pela regra da cadeia, $\\tfrac{d}{dt}\\cos(\\theta_1 + \\theta_2) = -s_{12}\\,(\\dot\\theta_1 + \\dot\\theta_2)$.",
        },
      },
      {
        id: "group",
        text: {
          en: "$\\dot x = -(L_1 s_1 + L_2 s_{12})\\,\\dot\\theta_1 - L_2 s_{12}\\,\\dot\\theta_2$",
          pt: "$\\dot x = -(L_1 s_1 + L_2 s_{12})\\,\\dot\\theta_1 - L_2 s_{12}\\,\\dot\\theta_2$",
        },
        feedback: {
          en: "This step is correct: it groups the terms by joint rate.",
          pt: "Este passo está correto: ele agrupa os termos por velocidade de junta.",
        },
      },
      {
        id: "row",
        wrong: true,
        text: { en: "$J_{11} = -L_1 s_1, \\quad J_{12} = -L_2 s_{12}$", pt: "$J_{11} = -L_1 s_1, \\quad J_{12} = -L_2 s_{12}$" },
        feedback: {
          en: "This is the wrong step: the coefficient of $\\dot\\theta_1$ in the previous step is $-(L_1 s_1 + L_2 s_{12})$, so $J_{11} = -L_1 s_1 - L_2 s_{12}$.",
          pt: "Este é o passo errado: o coeficiente de $\\dot\\theta_1$ no passo anterior é $-(L_1 s_1 + L_2 s_{12})$, então $J_{11} = -L_1 s_1 - L_2 s_{12}$.",
        },
      },
    ],
    solution: {
      en: "The last step drops the $-L_2 s_{12}$ term: $J_{11} = -L_1 s_1 - L_2 s_{12}$ and $J_{12} = -L_2 s_{12}$.",
      pt: "O último passo perde o termo $-L_2 s_{12}$: $J_{11} = -L_1 s_1 - L_2 s_{12}$ e $J_{12} = -L_2 s_{12}$.",
    },
    verify: () => {
      const [L1, L2, t1, t2, w1, w2] = [0.9, 0.6, 0.4, 1.3, 0.7, -1.1];
      const s1 = Math.sin(t1), s12 = Math.sin(t1 + t2);
      const { J } = kernel2R(L1, L2, t1, t2);
      // Steps x → ẋ → grouped agree with a finite difference of the kernel FK…
      const h = 1e-6;
      const x = (a: number, b: number) => origin(kernel2R(L1, L2, a, b).fT)[0];
      const fd = (x(t1 + w1 * h, t2 + w2 * h) - x(t1 - w1 * h, t2 - w2 * h)) / (2 * h);
      expectClose(-L1 * s1 * w1 - L2 * s12 * (w1 + w2), fd, "ẋ", 1e-6);
      expectClose(-(L1 * s1 + L2 * s12) * w1 - L2 * s12 * w2, fd, "grouped ẋ", 1e-6);
      // …and the last step is the wrong one.
      expectClose(J[0][0], -L1 * s1 - L2 * s12, "kernel J11");
      expectClose(J[0][1], -L2 * s12, "kernel J12");
      if (Math.abs(J[0][0] - -L1 * s1) < 1e-6) throw new Error("the 'wrong' step should differ from the kernel J11");
    },
  }),

  exercise({
    id: "jacobians-2r-column-gaps",
    status: "draft",
    level: 2,
    kind: "gaps",
    params: (rng) => ({ ...lengths(rng), t1: rng.int(-6, 6) * 10, t2: rng.pick([20, 35, 50, 70, 110, 140]) }),
    statement: {
      en: "In modified (Craig) DH, column $i$ of the geometric Jacobian of a revolute joint is $J_i = \\begin{bmatrix} Z_i \\times (P_T - P_i) \\\\ Z_i \\end{bmatrix}$. Take the planar 2R arm with $L_1 = {{L1}}$, $L_2 = {{L2}}$, $\\theta_1 = {{t1}}^\\circ$ and $\\theta_2 = {{t2}}^\\circ$.",
      pt: "Na DH modificada (Craig), a coluna $i$ da Jacobiana geométrica (geometric Jacobian) de uma junta rotacional é $J_i = \\begin{bmatrix} Z_i \\times (P_T - P_i) \\\\ Z_i \\end{bmatrix}$. Considere o braço planar 2R com $L_1 = {{L1}}$, $L_2 = {{L2}}$, $\\theta_1 = {{t1}}^\\circ$ e $\\theta_2 = {{t2}}^\\circ$.",
    },
    template: {
      en: "Column 2 uses the origin [[origin]], and the $x$ component of its linear part is [[jx]].",
      pt: "A coluna 2 usa a origem [[origin]], e a componente $x$ da sua parte linear vale [[jx]].",
    },
    gaps: {
      origin: {
        kind: "choice",
        options: { en: ["P₁ (joint 1)", "P₂ (joint 2)", "Pₜ (tool)"], pt: ["P₁ (junta 1)", "P₂ (junta 2)", "Pₜ (ferramenta)"] },
        correct: 1,
      },
      jx: {
        kind: "numeric",
        solve: ({ L2, t1, t2 }) => -L2 * Math.sin(deg(t1 + t2)),
        tolerance: { abs: 0.005, rel: 0.01 },
        unit: "\\mathrm{m}",
      },
    },
    hints: [
      {
        en: "In modified DH, joint $i$ acts about $Z_i$ through $P_i$, and joint 2 sits at the elbow.",
        pt: "Na DH modificada, a junta $i$ atua em torno de $Z_i$, passando por $P_i$, e a junta 2 fica no cotovelo.",
      },
      {
        en: "$Z_2 = [0, 0, 1]^T$ and $P_T - P_2 = [L_2 c_{12},\\ L_2 s_{12},\\ 0]^T$.",
        pt: "$Z_2 = [0, 0, 1]^T$ e $P_T - P_2 = [L_2 c_{12},\\ L_2 s_{12},\\ 0]^T$.",
      },
    ],
    solution: {
      en: "Column 2 uses $P_2$ (the elbow). $Z_2 \\times (P_T - P_2) = [-L_2 s_{12},\\ L_2 c_{12},\\ 0]^T$, so the $x$ component is $-L_2 \\sin(\\theta_1 + \\theta_2) = -{{L2}} \\sin({{t1}}^\\circ + {{t2}}^\\circ) \\approx {{jx:4}}\\ \\mathrm{m}$.",
      pt: "A coluna 2 usa $P_2$ (o cotovelo). $Z_2 \\times (P_T - P_2) = [-L_2 s_{12},\\ L_2 c_{12},\\ 0]^T$, então a componente $x$ é $-L_2 \\sin(\\theta_1 + \\theta_2) = -{{L2}} \\sin({{t1}}^\\circ + {{t2}}^\\circ) \\approx {{jx:4}}\\ \\mathrm{m}$.",
    },
    verify: ({ L1, L2, t1, t2 }) => {
      const { J, f2 } = kernel2R(L1, L2, deg(t1), deg(t2));
      expectClose(J[0][1], -L2 * Math.sin(deg(t1 + t2)), "kernel column 2, x");
      const elbow = origin(f2);
      expectClose(elbow[0], L1 * Math.cos(deg(t1)), "P2 is the elbow (x)");
      expectClose(elbow[1], L1 * Math.sin(deg(t1)), "P2 is the elbow (y)");
    },
  }),
]);
