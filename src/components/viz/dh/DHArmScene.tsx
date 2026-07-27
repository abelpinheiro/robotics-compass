"use client";

import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { DHLink, dhLabelClass, useDHColors } from "./DHLink";

export interface DHRow {
  a: number;
  d: number;
  alpha: number; // radians
  theta: number; // radians
}

function Scene({
  link1,
  link2,
  show0,
  show1,
  show2,
}: {
  link1: DHRow;
  link2: DHRow;
  show0: boolean;
  show1: boolean;
  show2: boolean;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const domElement = useThree((s) => s.gl.domElement);
  const colors = useDHColors(domElement);

  useEffect(() => {
    invalidate();
  }, [link1, link2, show0, show1, show2, colors, invalidate]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 3]} intensity={1} />
      <gridHelper args={[10, 20, colors.grid, colors.grid]} position={[0, -0.001, 0]} />

      {/* whole DH rig, rotated so DH z points up on screen */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {/* base frame {0} */}
        {show0 && (
          <>
            <axesHelper args={[0.9]} />
            <Html position={[-0.15, -0.15, -0.28]} center>
              <span className={dhLabelClass}>{"{0}"}</span>
            </Html>
          </>
        )}

        <DHLink
          a={link1.a}
          d={link1.d}
          alpha={link1.alpha}
          theta={link1.theta}
          sub="₁"
          colors={colors}
          showFrame={show1}
          frameLabel="{1}"
        >
          <DHLink
            a={link2.a}
            d={link2.d}
            alpha={link2.alpha}
            theta={link2.theta}
            sub="₂"
            colors={colors}
            showFrame={show2}
            frameLabel="{2}"
          />
        </DHLink>
      </group>

      <OrbitControls
        makeDefault
        enableDamping={false}
        target={[1, 0.9, 0]}
        minDistance={3}
        maxDistance={16}
      />
    </>
  );
}

export default function DHArmScene({
  link1,
  link2,
  show0,
  show1,
  show2,
}: {
  link1: DHRow;
  link2: DHRow;
  show0: boolean;
  show1: boolean;
  show2: boolean;
}) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [4.4, 3.6, 5], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
    >
      <Scene
        link1={link1}
        link2={link2}
        show0={show0}
        show1={show1}
        show2={show2}
      />
    </Canvas>
  );
}
