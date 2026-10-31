import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import { TransformLabel } from "@/components/viz/TransformLabel";

// UI strings for the inverse-kinematics widget, in every supported locale
// (Record<Locale, …> makes a missing translation a type error).

export interface IKStrings {
  title: string;
  caption: ReactNode;
  targetAxis: (axis: "x" | "y" | "z") => string;
  meters: (v: string) => string;
  elbow: string;
  up: string;
  down: string;
  targetA: string;
  targetB: string;
  target: string;
  inReach: string;
  outOfReach: string;
  solvedAngles: string;
  lastColumnReturnsTarget: string;
  fkCheckAria: string;
  description: (s: {
    target: string;
    reachable: boolean;
    t1: string;
    t2: string;
    t3: string;
    elbowUp: boolean;
    tcp: string;
  }) => string;
}

const T0T = <TransformLabel from="0" to="T" />;

export const ikStrings: Record<Locale, IKStrings> = {
  en: {
    title: "Inverse kinematics: Obtaining the joint angles from TCP target",
    caption: (
      <>
        Move the target position (or animate to a preset) and the arm solves for the joint angles
        that reach it. Toggle elbow-up / elbow-down to see the two solutions. Feed the solved
        angles back through forward kinematics and the pink last column of {T0T} returns your
        target.
      </>
    ),
    targetAxis: (axis) => `target ${axis}`,
    meters: (v) => `${v} meters`,
    elbow: "elbow",
    up: "Up",
    down: "Down",
    targetA: "Target A",
    targetB: "Target B",
    target: "Target",
    inReach: "in reach (two solutions: elbow-up / elbow-down)",
    outOfReach: "out of reach; showing the closest pose",
    solvedAngles: "Solved joint angles (output)",
    lastColumnReturnsTarget: "last column returns the target",
    fkCheckAria: "forward-kinematics check of the solved joint angles: transform of the tool frame {T} relative to the base frame {0}",
    description: ({ target, reachable, t1, t2, t3, elbowUp, tcp }) =>
      `A 3-DOF robot arm on a dark canvas whose tool center point (TCP) is driven to a ` +
      `target position you set. The target is (x, y, z) = ${target} and is ` +
      `${reachable ? "reachable" : "outside the workspace, so the arm shows the closest pose"}. ` +
      `The inverse-kinematics solver returns the joint angles θ₁=${t1}, θ₂=${t2}, θ₃=${t3} ` +
      `(${elbowUp ? "elbow-up" : "elbow-down"} branch). Feeding those angles back through ` +
      `forward kinematics gives the base-to-tool transform (frame {0} to tool frame {T}), whose ` +
      `highlighted last column returns the TCP ${tcp}. Coordinate frames (x red, y green, ` +
      `z blue) sit at the base, each joint and the tool, and a trail marks where the TCP has ` +
      `travelled.`,
  },
  pt: {
    title: "Cinemática inversa (inverse kinematics): obtendo os ângulos das juntas a partir do alvo do TCP",
    caption: (
      <>
        Mova a posição do alvo (ou anime até um alvo pronto) e o braço calcula os ângulos das
        juntas que o alcançam. Alterne entre cotovelo para cima e para baixo (elbow-up /
        elbow-down) para ver as duas soluções. Passe os ângulos obtidos de volta pela cinemática
        direta (forward kinematics) e a última coluna rosa de {T0T} devolve o seu alvo.
      </>
    ),
    targetAxis: (axis) => `alvo ${axis}`,
    meters: (v) => `${v} metros`,
    elbow: "cotovelo",
    up: "Cima",
    down: "Baixo",
    targetA: "Alvo A",
    targetB: "Alvo B",
    target: "Alvo",
    inReach: "alcançável (duas soluções: cotovelo para cima / para baixo)",
    outOfReach: "fora de alcance; mostrando a pose mais próxima",
    solvedAngles: "Ângulos das juntas obtidos (saída)",
    lastColumnReturnsTarget: "a última coluna devolve o alvo",
    fkCheckAria: "verificação por cinemática direta dos ângulos obtidos: transformação do referencial da ferramenta {T} em relação ao referencial da base {0}",
    description: ({ target, reachable, t1, t2, t3, elbowUp, tcp }) =>
      `Um braço robótico de 3 graus de liberdade sobre um fundo escuro, cujo ponto central da ` +
      `ferramenta (TCP, tool center point) é levado até uma posição-alvo que você define. O alvo ` +
      `é (x, y, z) = ${target} e está ` +
      `${reachable ? "ao alcance" : "fora do espaço de trabalho (workspace), então o braço mostra a pose mais próxima"}. ` +
      `O solucionador de cinemática inversa (inverse kinematics) devolve os ângulos θ₁=${t1}, ` +
      `θ₂=${t2}, θ₃=${t3} (ramo ${elbowUp ? "cotovelo para cima" : "cotovelo para baixo"}). ` +
      `Passando esses ângulos pela cinemática direta (forward kinematics), obtém-se a ` +
      `transformação da base para a ferramenta (do referencial {0} ao referencial {T}), cuja ` +
      `última coluna destacada devolve o TCP ${tcp}. Referenciais (x vermelho, y verde, z azul) ` +
      `aparecem na base, em cada junta e na ferramenta, e um rastro marca por onde o TCP passou.`,
  },
};
