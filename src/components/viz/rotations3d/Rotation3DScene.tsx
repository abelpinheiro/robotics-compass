"use client";

import { useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";

export interface EulerRad {
  x: number;
  y: number;
  z: number;
}

const labelClass =
  "pointer-events-none select-none rounded border border-border bg-surface/80 px-1.5 py-0.5 text-xs text-foreground";

function Scene({ euler }: { euler: EulerRad }) {
  const invalidate = useThree((s) => s.invalidate);
  const domElement = useThree((s) => s.gl.domElement);
  const colors = useMemo(() => {
    const s = getComputedStyle(domElement);
    const v = (n: string, fb: string) => s.getPropertyValue(n).trim() || fb;
    return { grid: v("--viz-grid", "#1e2a38"), panel: v("--accent", "#38bdf8") };
  }, [domElement]);

  useEffect(() => {
    invalidate();
  }, [euler, colors, invalidate]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 3]} intensity={1} />
      <gridHelper
        args={[8, 16, colors.grid, colors.grid]}
        position={[0, -0.001, 0]}
      />

      {/* Fixed world frame */}
      <axesHelper args={[1]} />
      <Html position={[1.1, 0, 0]} center>
        <span className={labelClass}>world</span>
      </Html>

      {/* Rotated body frame {B} */}
      <group rotation={[euler.x, euler.y, euler.z]}>
        <axesHelper args={[1.6]} />
        <mesh position={[0.55, 0.42, 0]}>
          <boxGeometry args={[1.25, 0.85, 0.04]} />
          <meshStandardMaterial color={colors.panel} transparent opacity={0.45} side={2} />
        </mesh>
        <Html position={[0, 1.8, 0]} center>
          <span className={labelClass}>{"{B}"}</span>
        </Html>
      </group>

      <OrbitControls
        makeDefault
        enableDamping={false}
        target={[0.3, 0.3, 0]}
        minDistance={3}
        maxDistance={12}
      />
    </>
  );
}

export default function Rotation3DScene({ euler }: { euler: EulerRad }) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [3.2, 2.6, 3.4], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
    >
      <Scene euler={euler} />
    </Canvas>
  );
}
