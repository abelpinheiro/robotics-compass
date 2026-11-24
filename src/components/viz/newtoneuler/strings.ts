import type { Locale } from "@/lib/i18n/config";

// UI strings of the Newton–Euler widget, in every supported locale
// (Record<Locale, …> makes a missing translation a type error).

export interface NewtonEulerStrings {
  title: string;
  caption: string;
  /** reveal stages, in order: configuration, outward 1 and 2, inward 2 and 1 */
  steps: readonly [string, string, string, string, string];
  previous: string;
  next: string;
  gravityOn: string;
  gravityOff: string;
  reset: string;
  equalsTau: string;
  description: (s: {
    theta: string;
    qd: string;
    qdd: string;
    gravity: boolean;
    tau1: string;
    tau2: string;
    Mqdd: string;
    Cqd: string;
    g: string;
    step: string;
  }) => string;
}

export const newtonEulerStrings: Record<Locale, NewtonEulerStrings> = {
  en: {
    title: "Recursive Newton–Euler: two sweeps",
    caption:
      "A planar 2R arm. Set the joint positions, velocities and accelerations, then walk the recursion: the outward sweep propagates ω, α and the COM acceleration a_c (orange) from base to tip; the inward sweep propagates the joint force f (red) and moment from tip to base, ending in the actuator torques τ (blue arcs). The torques equal M q̈ + C q̇ + g.",
    steps: [
      "Configuration",
      "Outward · link 1 (ω, a_c)",
      "Outward · link 2 (ω, a_c)",
      "Inward · link 2 (f, τ₂)",
      "Inward · link 1 (f, τ₁)",
    ],
    previous: "prev sweep",
    next: "next sweep",
    gravityOn: "gravity on",
    gravityOff: "gravity off",
    reset: "Reset",
    equalsTau: "equals τ above",
    description: (s) =>
      `A planar 2-link (RR) arm at θ = (${s.theta}), ` +
      `q̇ = (${s.qd}) rad/s, q̈ = (${s.qdd}) rad/s², ` +
      `gravity ${s.gravity ? "on" : "off"}. The recursive Newton–Euler algorithm runs in two sweeps. ` +
      `Outward (base→tip) it propagates each link's angular velocity ω, angular acceleration α, and ` +
      `centre-of-mass linear acceleration a_c (orange). Inward (tip→base) it propagates the joint ` +
      `force f (red) and moment, giving the actuator torques τ₁ = ${s.tau1} N·m and ` +
      `τ₂ = ${s.tau2} N·m (blue arcs). These equal M(q)q̈ + C(q,q̇)q̇ + g(q): ` +
      `M q̈ = (${s.Mqdd}), C q̇ = (${s.Cqd}), ` +
      `g = (${s.g}) N·m. Current reveal stage: ${s.step}.`,
  },
  pt: {
    title: "Newton–Euler recursivo (recursive Newton–Euler): duas passagens",
    caption:
      "Um braço 2R planar. Ajuste as posições, velocidades e acelerações das juntas e percorra a recursão: a passagem para fora (outward) propaga ω, α e a aceleração do centro de massa a_c (laranja) da base à ponta; a passagem para dentro (inward) propaga a força f (vermelho) e o momento nas juntas da ponta à base, até os torques dos atuadores τ (arcos azuis). Os torques são iguais a M q̈ + C q̇ + g.",
    steps: [
      "Configuração",
      "Para fora · elo 1 (ω, a_c)",
      "Para fora · elo 2 (ω, a_c)",
      "Para dentro · elo 2 (f, τ₂)",
      "Para dentro · elo 1 (f, τ₁)",
    ],
    previous: "anterior",
    next: "próxima",
    gravityOn: "gravidade ligada",
    gravityOff: "gravidade desligada",
    reset: "Reiniciar",
    equalsTau: "igual ao τ acima",
    description: (s) =>
      `Um braço planar de dois elos (RR) em θ = (${s.theta}), ` +
      `q̇ = (${s.qd}) rad/s, q̈ = (${s.qdd}) rad/s², ` +
      `com a gravidade ${s.gravity ? "ligada" : "desligada"}. O algoritmo recursivo de Newton–Euler (recursive Newton–Euler) faz duas passagens. ` +
      `Para fora (outward), da base à ponta, propaga a velocidade angular ω, a aceleração angular α e a ` +
      `aceleração linear do centro de massa a_c (laranja) de cada elo. Para dentro (inward), da ponta à base, propaga a ` +
      `força f (vermelho) e o momento nas juntas, até os torques dos atuadores τ₁ = ${s.tau1} N·m e ` +
      `τ₂ = ${s.tau2} N·m (arcos azuis). Eles são iguais a M(q)q̈ + C(q,q̇)q̇ + g(q): ` +
      `M q̈ = (${s.Mqdd}), C q̇ = (${s.Cqd}), ` +
      `g = (${s.g}) N·m. Etapa mostrada: ${s.step}.`,
  },
};
