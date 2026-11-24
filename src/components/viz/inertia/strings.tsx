import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";

// UI strings of the two inertia widgets, in every supported locale
// (Record<Locale, …> makes a missing translation a type error).

export interface RodStrings {
  title: string;
  caption: ReactNode;
  offset: string;
  mass: string;
  length: string;
  torque: string;
  time: string;
  centre: string;
  end: string;
  chosenAxis: string;
  centralAxis: string;
  axisDistance: string;
  ratio: string;
  angularAcceleration: string;
  inertiaAxisLabel: string;
  description: (s: {
    m: string;
    L: string;
    d: string;
    tau: string;
    time: string;
    centreI: string;
    chosenI: string;
    ratio: string;
    centreAngle: string;
    chosenAngle: string;
  }) => string;
}

export const rodStrings: Record<Locale, RodStrings> = {
  en: {
    title: "Moment of inertia: the same rod about two axes",
    caption: (
      <>
        Two identical rods, seen from above, start at rest under the same torque τ. The gray rod turns about its
        centre; the blue one about an axis at distance d from the centre. Move d toward the end and run: the
        moment of inertia I(d) = mL²/12 + md² grows and the blue rod falls behind. There is no gravity or friction.
      </>
    ),
    offset: "Distance d",
    mass: "Mass",
    length: "Length",
    torque: "Torque",
    time: "Time",
    centre: "centre",
    end: "end",
    chosenAxis: "axis at d",
    centralAxis: "axis at the centre",
    axisDistance: "distance d from the centre of mass to the axis (m)",
    ratio: "compared with the centre",
    angularAcceleration: "angular acceleration",
    inertiaAxisLabel: "I (kg·m²)",
    description: (s) =>
      `Two identical uniform rods of mass ${s.m} kg and length ${s.L} m, seen from above, start at rest under the ` +
      `same torque of ${s.tau} N·m, without gravity or friction. The gray rod turns about its centre, where its ` +
      `moment of inertia is ${s.centreI} kg·m². The blue rod turns about a parallel axis at d = ${s.d} m from its ` +
      `centre, where its moment of inertia is ${s.chosenI} kg·m², ${s.ratio} times as much. After ${s.time} s the ` +
      `gray rod has turned ${s.centreAngle}° and the blue rod ${s.chosenAngle}°. A graph shows the moment of ` +
      `inertia against d: a constant part, mL²/12, plus a part that grows with the square of d, up to mL²/3 at ` +
      `the end of the rod. Sliders set d, the mass, the length, the torque and the time.`,
  },
  pt: {
    title: "Momento de inércia (moment of inertia): a mesma barra em dois eixos",
    caption: (
      <>
        Duas barras iguais, vistas de cima, partem do repouso sob o mesmo torque τ. A cinza gira em torno do
        centro; a azul, em torno de um eixo à distância d do centro. Leve d até a ponta e execute: o momento de
        inércia I(d) = mL²/12 + md² cresce e a barra azul fica para trás. Não há gravidade nem atrito.
      </>
    ),
    offset: "Distância d",
    mass: "Massa",
    length: "Comprimento",
    torque: "Torque",
    time: "Tempo",
    centre: "centro",
    end: "ponta",
    chosenAxis: "eixo em d",
    centralAxis: "eixo no centro",
    axisDistance: "distância d do centro de massa ao eixo (m)",
    ratio: "em relação ao centro",
    angularAcceleration: "aceleração angular (angular acceleration)",
    inertiaAxisLabel: "I (kg·m²)",
    description: (s) =>
      `Duas barras uniformes iguais, de massa ${s.m} kg e comprimento ${s.L} m, vistas de cima, partem do repouso ` +
      `sob o mesmo torque de ${s.tau} N·m, sem gravidade nem atrito. A barra cinza gira em torno do seu centro, ` +
      `onde o momento de inércia (moment of inertia) é ${s.centreI} kg·m². A barra azul gira em torno de um eixo ` +
      `paralelo a d = ${s.d} m do seu centro, onde o momento de inércia é ${s.chosenI} kg·m², ${s.ratio} vezes o ` +
      `do centro. Depois de ${s.time} s, a barra cinza girou ${s.centreAngle}° e a azul ${s.chosenAngle}°. Um ` +
      `gráfico mostra o momento de inércia em função de d: uma parte constante, mL²/12, mais uma parte que ` +
      `cresce com o quadrado de d, até mL²/3 na ponta da barra. Os controles definem d, a massa, o ` +
      `comprimento, o torque e o tempo.`,
  },
};

export type BoxGroup = "box" | "position" | "orientation" | "axis";

export interface BoxStrings {
  title: string;
  caption: ReactNode;
  groups: Record<BoxGroup, string>;
  groupLabel: string;
  side: (axis: string) => string;
  mass: string;
  positionOf: (axis: string) => string;
  rotationAbout: (axis: string) => string;
  rotationShort: (axis: string) => string;
  azimuth: string;
  elevation: string;
  showPrincipal: string;
  centroidal: string;
  translation: string;
  tensorName: string;
  products: string;
  principalMoments: string;
  repeated: string;
  axisMoment: string;
  description: (s: {
    m: string;
    sides: string;
    position: string;
    angles: string;
    diagonal: string;
    products: string;
    moments: string;
    n: string;
    axisMoment: string;
    repeated: boolean;
  }) => string;
}

export const boxStrings: Record<Locale, BoxStrings> = {
  en: {
    title: "Inertia tensor of a box in a fixed frame {A}",
    caption: (
      <>
        The frame {"{A}"} stays fixed while the box and its centre-of-mass frame {"{C}"} move. Move the box to see
        the parallel-axis term appear, and turn it to see the products of inertia appear. The pink lines are the
        principal axes at the origin of {"{A}"}; the green one is the axis n̂. The box has uniform density.
      </>
    ),
    groups: {
      box: "Box",
      position: "Position of {C}",
      orientation: "Orientation of {C}",
      axis: "Axis n̂",
    },
    groupLabel: "Parameters to change",
    side: (axis) => `side along ${axis} of {C}`,
    mass: "mass",
    positionOf: (axis) => `${axis} coordinate of the centre of mass in {A}`,
    rotationAbout: (axis) => `rotation about the fixed ${axis} axis of {A}`,
    rotationShort: (axis) => `about ${axis}`,
    azimuth: "azimuth",
    elevation: "elevation",
    showPrincipal: "principal axes",
    centroidal: "tensor at the centre of mass, in the orientation of {A}",
    translation: "parallel-axis term",
    tensorName: "inertia tensor in {A}",
    products: "products of inertia",
    principalMoments: "principal moments at the origin of {A}",
    repeated: "Two principal moments are equal, so their axes are not unique: the ones drawn are one valid choice.",
    axisMoment: "moment about n̂",
    description: (s) =>
      `A uniform box of mass ${s.m} kg and sides a, b, c = ${s.sides} m in 3D on a dark canvas, with its ` +
      `centre-of-mass frame {C} and a fixed frame {A} (x red, y green, z blue). In {A}, the centre of mass is at ` +
      `${s.position} m and the box is rotated by ${s.angles} about the fixed X, Y and Z axes, in this order. The ` +
      `inertia tensor in {A} is the sum of the tensor at the centre of mass, turned to the orientation of {A}, and ` +
      `the parallel-axis term. Its moments Ixx, Iyy, Izz are ${s.diagonal} kg·m² and its products of inertia Ixy, ` +
      `Ixz, Iyz are ${s.products} kg·m², which enter the matrix with a minus sign. The principal moments at the ` +
      `origin of {A} are ${s.moments} kg·m², with their principal axes drawn in pink. ` +
      (s.repeated ? `Two principal moments are equal, so their axes are not unique. ` : "") +
      `The moment about the green axis through the origin of {A}, along n̂ = ${s.n}, is ${s.axisMoment} kg·m². ` +
      `Sliders, in four groups, set the box, its position, its orientation and the axis n̂.`,
  },
  pt: {
    title: "Tensor de inércia (inertia tensor) de uma caixa em um referencial fixo {A}",
    caption: (
      <>
        O referencial {"{A}"} fica fixo enquanto a caixa e o referencial {"{C}"}, no seu centro de massa, se movem.
        Desloque a caixa para ver surgir o termo dos eixos paralelos (parallel axes) e gire-a para ver surgirem os
        produtos de inércia (products of inertia). As linhas rosa são os eixos principais (principal axes) na
        origem de {"{A}"}; a verde é o eixo n̂. A caixa tem densidade uniforme.
      </>
    ),
    groups: {
      box: "Caixa",
      position: "Posição de {C}",
      orientation: "Orientação de {C}",
      axis: "Eixo n̂",
    },
    groupLabel: "Parâmetros a alterar",
    side: (axis) => `lado ao longo de ${axis} de {C}`,
    mass: "massa",
    positionOf: (axis) => `coordenada ${axis} do centro de massa em {A}`,
    rotationAbout: (axis) => `rotação em torno do eixo fixo ${axis} de {A}`,
    rotationShort: (axis) => `em torno de ${axis}`,
    azimuth: "azimute",
    elevation: "elevação",
    showPrincipal: "eixos principais (principal axes)",
    centroidal: "tensor no centro de massa, na orientação de {A}",
    translation: "termo dos eixos paralelos (parallel axes)",
    tensorName: "tensor de inércia (inertia tensor) em {A}",
    products: "produtos de inércia (products of inertia)",
    principalMoments: "momentos principais (principal moments) na origem de {A}",
    repeated:
      "Dois momentos principais são iguais, então seus eixos não são únicos: os desenhados são uma escolha válida.",
    axisMoment: "momento em torno de n̂",
    description: (s) =>
      `Uma caixa uniforme de massa ${s.m} kg e lados a, b, c = ${s.sides} m em 3D sobre um fundo escuro, com o ` +
      `referencial {C} no seu centro de massa e um referencial fixo {A} (x vermelho, y verde, z azul). Em {A}, o ` +
      `centro de massa está em ${s.position} m e a caixa está girada de ${s.angles} em torno dos eixos fixos X, Y ` +
      `e Z, nesta ordem. O tensor de inércia (inertia tensor) em {A} é a soma do tensor no centro de massa, levado ` +
      `à orientação de {A}, com o termo dos eixos paralelos (parallel axes). Seus momentos Ixx, Iyy, Izz são ` +
      `${s.diagonal} kg·m² e seus produtos de inércia (products of inertia) Ixy, Ixz, Iyz são ${s.products} kg·m², ` +
      `que entram na matriz com sinal negativo. Os momentos principais na origem de {A} são ${s.moments} kg·m², ` +
      `com os eixos principais (principal axes) desenhados em rosa. ` +
      (s.repeated ? `Dois momentos principais são iguais, então seus eixos não são únicos. ` : "") +
      `O momento em torno do eixo verde que passa pela origem de {A}, na direção n̂ = ${s.n}, é ${s.axisMoment} ` +
      `kg·m². Controles, em quatro grupos, definem a caixa, sua posição, sua orientação e o eixo n̂.`,
  },
};
