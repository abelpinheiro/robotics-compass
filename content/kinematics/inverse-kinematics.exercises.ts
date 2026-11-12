// Exercises for the "inverse-kinematics" lesson. DRAFTS written by Claude for
// the author's review (status "draft": shown only on the dev server). The
// reference configuration is checked against the shared kinematics kernel in
// `verify`, which the exercise tests run for every variant.

import { defineExercises, exercise } from "@/lib/exercises/types";
import { modifiedDHFrames, type ModifiedDHRow } from "@/lib/kinematics/dh";
import { origin } from "@/lib/kinematics/mat4";

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

// The lesson's planar 2R arm in modified (Craig) DH (see modeling-manipulators).
const planar2R = (L1: number, L2: number, t1: number, t2: number): ModifiedDHRow[] => [
  { alpha: 0, a: 0, d: 0, theta: t1 },
  { alpha: 0, a: L1, d: 0, theta: t2 },
  { alpha: 0, a: L2, d: 0, theta: 0 },
];

function expectClose(actual: number, expected: number, what: string, tol = 1e-9) {
  if (!(Math.abs(actual - expected) <= tol)) throw new Error(`${what}: ${actual} ≠ ${expected}`);
}

/** Closed-form 2R inverse kinematics (radians); `sign` picks the branch θ2 = sign·arccos D. */
function ik2R(L1: number, L2: number, x: number, y: number, sign: 1 | -1) {
  const D = (x * x + y * y - L1 * L1 - L2 * L2) / (2 * L1 * L2);
  const t2 = sign * Math.acos(D);
  const t1 = Math.atan2(y, x) - Math.atan2(L2 * Math.sin(t2), L1 + L2 * Math.cos(t2));
  return [t1, t2];
}

export default defineExercises("inverse-kinematics", [
  exercise({
    id: "inverse-kinematics-2r-elbow-up",
    status: "draft",
    level: 3,
    kind: "interactive",
    widget: "planar-arm",
    params: (rng) => {
      const L1 = rng.int(5, 9) / 10;
      const L2 = rng.int(3, 7) / 10;
      // a target well inside the reachable annulus, up and to the right of the base
      const rMin = Math.abs(L1 - L2);
      const r = rMin + (L1 + L2 - rMin) * rng.uniform(0.3, 0.8);
      const a = rad(rng.int(15, 65));
      return { L1, L2, tx: Number((r * Math.cos(a)).toFixed(2)), ty: Number((r * Math.sin(a)).toFixed(2)) };
    },
    statement: {
      en: "The planar 2R arm below has $L_1 = {{L1}}\\,\\mathrm{m}$ and $L_2 = {{L2}}\\,\\mathrm{m}$. Move it so that its tip reaches the target $T = ({{tx}},\\ {{ty}})\\,\\mathrm{m}$ with the **elbow up**: the elbow above the line from the base to $T$.",
      pt: "O braço planar 2R abaixo tem $L_1 = {{L1}}\\,\\mathrm{m}$ e $L_2 = {{L2}}\\,\\mathrm{m}$. Mova-o para que a ponta alcance o alvo $T = ({{tx}};\\ {{ty}})\\,\\mathrm{m}$ com o **cotovelo para cima (elbow-up)**: o cotovelo acima da linha que vai da base até $T$.",
    },
    hints: [
      {
        en: "Two configurations put the tip on $T$, elbow up and elbow down: mirror images across the line from the base to $T$.",
        pt: "Duas configurações levam a ponta até $T$, cotovelo para cima e cotovelo para baixo: imagens espelhadas em relação à linha que vai da base até $T$.",
      },
      {
        en: "$\\cos\\theta_2 = \\dfrac{X^2 + Y^2 - L_1^2 - L_2^2}{2 L_1 L_2}$. The sign of $\\theta_2$ decides on which side of that line the elbow is.",
        pt: "$\\cos\\theta_2 = \\dfrac{X^2 + Y^2 - L_1^2 - L_2^2}{2 L_1 L_2}$. O sinal de $\\theta_2$ decide de que lado dessa linha fica o cotovelo.",
      },
    ],
    solution: {
      en: "With $D = \\dfrac{X^2 + Y^2 - L_1^2 - L_2^2}{2 L_1 L_2}$, the elbow-up configuration is\n\n$$\\theta_2 = -\\arccos D \\approx {{ref2:1}}^\\circ$$\n\n$$\\theta_1 = \\operatorname{atan2}(Y, X) - \\operatorname{atan2}(L_2 \\sin\\theta_2,\\ L_1 + L_2 \\cos\\theta_2) \\approx {{ref1:1}}^\\circ$$\n\nA negative $\\theta_2$ turns link 2 clockwise relative to link 1, which puts the elbow to the left of the line from the base to $T$: above it, since $T$ is up and to the right of the base. $\\theta_2 = +\\arccos D$ gives the mirror image, elbow down.",
      pt: "Com $D = \\dfrac{X^2 + Y^2 - L_1^2 - L_2^2}{2 L_1 L_2}$, a configuração de cotovelo para cima é\n\n$$\\theta_2 = -\\arccos D \\approx {{ref2:1}}^\\circ$$\n\n$$\\theta_1 = \\operatorname{atan2}(Y, X) - \\operatorname{atan2}(L_2 \\sin\\theta_2,\\ L_1 + L_2 \\cos\\theta_2) \\approx {{ref1:1}}^\\circ$$\n\nUm $\\theta_2$ negativo gira o elo 2 no sentido horário em relação ao elo 1, o que põe o cotovelo à esquerda da linha que vai da base até $T$: acima dela, já que $T$ está acima e à direita da base. $\\theta_2 = +\\arccos D$ dá a imagem espelhada, cotovelo para baixo.",
    },
    setup: ({ L1, L2, tx, ty }) => ({ links: [L1, L2], initial: [0, 45], target: [tx, ty], showTip: true }),
    conditions: ({ L1, L2 }) => [
      {
        quantity: "targetDistance",
        // 2% of the reach: always attainable with the controls' 1° steps
        max: 0.02 * (L1 + L2),
        feedback: { en: "The tip is not on the target yet.", pt: "A ponta ainda não está no alvo." },
      },
      {
        quantity: "elbowHeight",
        min: 0.01,
        feedback: {
          en: "The tip is on the target, but with the elbow down: the elbow is below the line from the base to the target.",
          pt: "A ponta está no alvo, mas com o cotovelo para baixo: o cotovelo está abaixo da linha que vai da base até o alvo.",
        },
      },
    ],
    solve: ({ L1, L2, tx, ty }) => ik2R(L1, L2, tx, ty, -1).map(deg),
    verify: ({ L1, L2, tx, ty }) => {
      for (const sign of [-1, 1] as const) {
        const [t1, t2] = ik2R(L1, L2, tx, ty, sign);
        const [, elbowFrame, tool] = modifiedDHFrames(planar2R(L1, L2, t1, t2));
        const [x, y] = origin(tool);
        expectClose(x, tx, `kernel FK reaches the target (x, θ2 = ${sign}·arccos D)`);
        expectClose(y, ty, `kernel FK reaches the target (y, θ2 = ${sign}·arccos D)`);
        // which side of the line base → T the elbow is on: cross(T, E) > 0 means to its left (above)
        const [ex, ey] = origin(elbowFrame);
        const side = tx * ey - ty * ex;
        if (sign === -1 ? !(side > 0) : !(side < 0)) throw new Error(`θ2 = ${sign}·arccos D: elbow on the wrong side (${side})`);
      }
    },
  }),
]);
