import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import { TransformLabel } from "@/components/viz/TransformLabel";

// UI strings for the forward-kinematics widget, in every supported locale
// (Record<Locale, …> makes a missing translation a type error).

export interface FKStrings {
  title: string;
  caption: ReactNode;
  base: string;
  shoulder: string;
  elbow: string;
  degrees: (v: number) => string;
  poseA: string;
  poseB: string;
  dhTable: string;
  frame: string;
  /** spoken name of ^{from}_{to}T for screen readers */
  transformName: (from: string, to: string) => string;
  tcpPosition: string;
  description: (s: {
    t1: number;
    t2: number;
    t3: number;
    tcp: string;
  }) => string;
}

const T0T = <TransformLabel from="0" to="T" />;

export const fkStrings: Record<Locale, FKStrings> = {
  en: {
    title: "Forward kinematics: Obtaining the TCP pose from joint angles",
    caption: (
      <>
        Move the joint sliders (or animate to a preset) and watch the modified (Craig) DH link
        transforms chain into {T0T}. The pink last column of {T0T} is the tool center point,
        the same pink dot and trail you see in 3D.
      </>
    ),
    base: "base",
    shoulder: "shoulder",
    elbow: "elbow",
    degrees: (v) => `${v} degrees`,
    poseA: "Pose A",
    poseB: "Pose B",
    dhTable: "Modified (Craig) DH table",
    frame: "Frame",
    transformName: (from, to) => `transform of frame {${to}} relative to frame {${from}}`,
    tcpPosition: "TCP position",
    description: ({ t1, t2, t3, tcp }) =>
      `A 3-DOF robot arm (base yaw θ₁, shoulder pitch θ₂, elbow pitch θ₃) in 3D on a ` +
      `dark canvas, modelled with the modified (Craig) Denavit–Hartenberg convention. ` +
      `Coordinate frames {0}, {1}, {2}, {3} and the tool frame {T} are drawn at the base, ` +
      `the joints and the tool (x red, y green, z blue); each joint rotates about the z axis ` +
      `of its own frame. A trail marks where the tool center point (TCP) has travelled. ` +
      `The joint angles are θ₁=${t1}°, θ₂=${t2}°, θ₃=${t3}°. A DH table lists the parameters, ` +
      `and the live 4×4 link transforms from {0} to {1}, {1} to {2}, {2} to {3} and {3} to {T} ` +
      `update as the sliders move, together with their product, the base-to-tool transform. ` +
      `The TCP position is its highlighted last column, currently (x, y, z) = ${tcp}. Buttons ` +
      `animate the arm to preset poses; reset returns it home and clears the trail.`,
  },
  pt: {
    title: "Cinemática direta (forward kinematics): obtendo a pose do TCP a partir dos ângulos das juntas",
    caption: (
      <>
        Mova os controles das juntas (ou anime até uma pose pronta) e veja as transformações dos
        elos pela DH modificada (Craig) se encadearem em {T0T}. A última coluna rosa de {T0T} é o
        ponto central da ferramenta (TCP, tool center point): o mesmo ponto rosa e o mesmo rastro
        que você vê em 3D.
      </>
    ),
    base: "base",
    shoulder: "ombro",
    elbow: "cotovelo",
    degrees: (v) => `${v} graus`,
    poseA: "Pose A",
    poseB: "Pose B",
    dhTable: "Tabela DH modificada (Craig)",
    frame: "Referencial",
    transformName: (from, to) => `transformação do referencial {${to}} em relação ao referencial {${from}}`,
    tcpPosition: "Posição do TCP",
    description: ({ t1, t2, t3, tcp }) =>
      `Um braço robótico de 3 graus de liberdade (guinada da base θ₁, arfagem do ombro θ₂, ` +
      `arfagem do cotovelo θ₃) em 3D sobre um fundo escuro, modelado pela convenção de ` +
      `Denavit–Hartenberg modificada (Craig). Os referenciais {0}, {1}, {2}, {3} e o referencial ` +
      `da ferramenta {T} aparecem na base, nas juntas e na ferramenta (x vermelho, y verde, ` +
      `z azul); cada junta gira em torno do eixo z do seu próprio referencial. Um rastro marca ` +
      `por onde o ponto central da ferramenta (TCP, tool center point) passou. Os ângulos das ` +
      `juntas são θ₁=${t1}°, θ₂=${t2}°, θ₃=${t3}°. Uma tabela DH lista os parâmetros, e as ` +
      `transformações 4×4 dos elos de {0} para {1}, de {1} para {2}, de {2} para {3} e de {3} ` +
      `para {T} se atualizam com os controles, junto com o produto delas, a transformação da ` +
      `base para a ferramenta. A posição do TCP é a última coluna destacada, agora ` +
      `(x, y, z) = ${tcp}. Os botões animam o braço até poses prontas; reiniciar volta à pose ` +
      `inicial e apaga o rastro.`,
  },
};
