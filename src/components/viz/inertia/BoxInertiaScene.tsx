"use client";

import { useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Edges, Html, Line, OrbitControls } from "@react-three/drei";
import type { Vec3 } from "./inertiaMath";

export interface BoxSceneProps {
  /** sides a, b, c along X, Y, Z of {C} */
  sides: Vec3;
  /** centre of mass, in {A} */
  position: Vec3;
  /** rotations about the fixed X, Y, Z axes of {A}, in this order (radians) */
  angles: Vec3;
  /** principal axes at the origin of {A}; null hides them */
  principal: [Vec3, Vec3, Vec3] | null;
  /** unit direction of the chosen axis through the origin of {A} */
  n: Vec3;
}

// Scene colors come from the scoped dark tokens of the surrounding Viz3D.
function useColors(el: HTMLElement) {
  return useMemo(() => {
    const cs = getComputedStyle(el);
    const v = (name: string) => cs.getPropertyValue(name).trim();
    return {
      box: v("--accent"),
      offset: v("--warning"),
      principal: v("--danger"),
      axis: v("--success"),
      grid: v("--viz-grid"),
    };
  }, [el]);
}

const labelClass =
  "pointer-events-none select-none rounded border border-border bg-surface/80 px-1 py-0.5 font-mono text-xs text-foreground";

function Label({ position, children }: { position: Vec3; children: string }) {
  return (
    <Html position={position} center zIndexRange={[10, 0]}>
      <span className={labelClass}>{children}</span>
    </Html>
  );
}

const scaled = (v: Vec3, k: number): Vec3 => [v[0] * k, v[1] * k, v[2] * k];

function Scene({ sides, position, angles, principal, n }: BoxSceneProps) {
  const domElement = useThree((s) => s.gl.domElement);
  const invalidate = useThree((s) => s.invalidate);
  const colors = useColors(domElement);
  useEffect(() => {
    invalidate();
  }, [sides, position, angles, principal, n, colors, invalidate]);

  const offset = Math.hypot(...position) > 1e-6;
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 3]} intensity={1.15} />
      {/* Z up on screen */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <gridHelper args={[4, 16, colors.grid, colors.grid]} rotation={[Math.PI / 2, 0, 0]} />

        {/* fixed frame {A} */}
        <axesHelper args={[1.1]} />
        <Label position={[-0.14, -0.14, -0.12]}>{"{A}"}</Label>
        <Label position={[1.2, 0, 0]}>X</Label>
        <Label position={[0, 1.2, 0]}>Y</Label>
        <Label position={[0, 0, 1.2]}>Z</Label>

        {/* the axis n̂ and the principal axes pass through the origin of {A} */}
        <Line points={[scaled(n, -1.35), scaled(n, 1.35)]} color={colors.axis} lineWidth={2.5} />
        <Label position={scaled(n, 1.45)}>n̂</Label>
        {principal?.map((v, i) => (
          <group key={i}>
            <Line points={[scaled(v, -1), scaled(v, 1)]} color={colors.principal} lineWidth={2} dashed dashSize={0.07} gapSize={0.04} />
            <Label position={scaled(v, -1.08)}>{["I₁", "I₂", "I₃"][i]}</Label>
          </group>
        ))}

        {offset && (
          <>
            <Line points={[[0, 0, 0], position]} color={colors.offset} lineWidth={3} />
            <Label position={[position[0] * 0.5, position[1] * 0.5, position[2] * 0.5 + 0.08]}>P_C</Label>
          </>
        )}

        {/* box in {C}: R = R_Z(γ)·R_Y(β)·R_X(α) */}
        <group position={position}>
          <group rotation={[0, 0, angles[2]]}>
            <group rotation={[0, angles[1], 0]}>
              <group rotation={[angles[0], 0, 0]}>
                <mesh scale={sides}>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color={colors.box} transparent opacity={0.35} depthWrite={false} metalness={0.1} roughness={0.6} />
                  <Edges color={colors.box} />
                </mesh>
                <axesHelper args={[0.45]} />
                <Label position={[0.12, 0.12, 0.16]}>{"{C}"}</Label>
              </group>
            </group>
          </group>
        </group>
      </group>
      <OrbitControls makeDefault enableDamping={false} enablePan={false} minDistance={2} maxDistance={9} />
    </>
  );
}

export default function BoxInertiaScene(props: BoxSceneProps) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [2.6, 1.9, 2.4], fov: 42 }}
      gl={{ alpha: true, antialias: true }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
