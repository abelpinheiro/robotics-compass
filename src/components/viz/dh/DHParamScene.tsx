"use client";

import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { DHLink, dhLabelClass, useDHColors } from "./DHLink";

function Scene({
  theta,
  d,
  a,
  alpha,
}: {
  theta: number;
  d: number;
  a: number;
  alpha: number;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const domElement = useThree((s) => s.gl.domElement);
  const colors = useDHColors(domElement);

  useEffect(() => {
    invalidate();
  }, [theta, d, a, alpha, colors, invalidate]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 3]} intensity={1} />
      <gridHelper args={[9, 18, colors.grid, colors.grid]} position={[0, -0.001, 0]} />

      {/* whole DH rig, rotated so DH z points up on screen */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {/* frame {i-1} — fixed */}
        <axesHelper args={[0.9]} />
        <Html position={[-0.15, -0.15, -0.28]} center>
          <span className={dhLabelClass}>{"{i-1}"}</span>
        </Html>

        <DHLink
          a={a}
          d={d}
          alpha={alpha}
          theta={theta}
          sub="ᵢ"
          colors={colors}
          frameLabel="{i}"
        />
      </group>

      <OrbitControls
        makeDefault
        enableDamping={false}
        target={[0.6, 0.6, 0]}
        minDistance={2.5}
        maxDistance={13}
      />
    </>
  );
}

export default function DHParamScene({
  theta,
  d,
  a,
  alpha,
}: {
  theta: number;
  d: number;
  a: number;
  alpha: number;
}) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [3.6, 3.2, 4.4], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
    >
      <Scene theta={theta} d={d} a={a} alpha={alpha} />
    </Canvas>
  );
}
