"use client";

import { useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";

// Link lengths of the 3-DOF chain. Exposed so the viz can build the matching
// 4x4 transform with the exact same geometry the scene graph renders.
export const L1 = 1.2;
export const L2 = 1.0;
export const L3 = 0.8;

interface SceneColors {
  link: string;
  joint: string;
  tip: string;
  grid: string;
}

const FALLBACK: SceneColors = {
  link: "#8aa0b2",
  joint: "#38bdf8",
  tip: "#d97706",
  grid: "#1e2a38",
};

/** Read scene colors from the --token CSS variables resolved inside the
 *  .theme-dark canvas wrapper (Golden rule 3). Axis triads keep three's
 *  conventional x=red / y=green / z=blue. */
function useTokenColors(el: HTMLElement | undefined): SceneColors {
  return useMemo(() => {
    if (!el) return FALLBACK;
    const s = getComputedStyle(el);
    const v = (name: string, fb: string) => s.getPropertyValue(name).trim() || fb;
    return {
      link: v("--muted", FALLBACK.link),
      joint: v("--accent", FALLBACK.joint),
      tip: v("--warning", FALLBACK.tip),
      grid: v("--viz-grid", FALLBACK.grid),
    };
  }, [el]);
}

const labelClass =
  "pointer-events-none select-none whitespace-nowrap rounded border border-border bg-surface/80 px-1.5 py-0.5 text-xs text-foreground";

function Link({ length, color }: { length: number; color: string }) {
  return (
    <mesh position={[length / 2, 0, 0]} castShadow>
      <boxGeometry args={[length, 0.1, 0.1]} />
      <meshStandardMaterial color={color} metalness={0.15} roughness={0.55} />
    </mesh>
  );
}

function Joint({ color }: { color: string }) {
  return (
    <mesh>
      <sphereGeometry args={[0.11, 24, 24]} />
      <meshStandardMaterial color={color} metalness={0.1} roughness={0.5} />
    </mesh>
  );
}

/** The articulated chain as nested joint groups (viz-3d skill): joint 1 yaws
 *  the whole arm about the vertical (Base y) axis; joints 2 and 3 pitch it up
 *  about their local z. The {Base} triad is world-fixed at the origin, so the
 *  {End-effector} group's world matrix IS the 4x4 transform we display. */
function Arm({
  theta1,
  theta2,
  theta3,
  baseLabel,
  eeLabel,
}: {
  theta1: number;
  theta2: number;
  theta3: number;
  baseLabel: string;
  eeLabel: string;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const domElement = useThree((s) => s.gl.domElement);
  const colors = useTokenColors(domElement);

  // Demand-driven rendering: request a frame whenever a joint angle changes.
  useEffect(() => {
    invalidate();
  }, [theta1, theta2, theta3, colors, invalidate]);

  return (
    <group>
      {/* {Base}: fixed world frame at the origin */}
      <axesHelper args={[1]} />
      <Html position={[0, 0.28, 0]} center>
        <span className={labelClass}>{baseLabel}</span>
      </Html>

      <group rotation={[0, theta1, 0]}>
        <Joint color={colors.joint} />
        <Link length={L1} color={colors.link} />

        <group position={[L1, 0, 0]} rotation={[0, 0, theta2]}>
          <Joint color={colors.joint} />
          <Link length={L2} color={colors.link} />

          <group position={[L2, 0, 0]} rotation={[0, 0, theta3]}>
            <Joint color={colors.joint} />
            <Link length={L3} color={colors.link} />

            {/* {End-effector}: pose here relative to {Base} is the 4x4 T */}
            <group position={[L3, 0, 0]}>
              <axesHelper args={[0.8]} />
              <mesh>
                <sphereGeometry args={[0.09, 24, 24]} />
                <meshStandardMaterial
                  color={colors.tip}
                  emissive={colors.tip}
                  emissiveIntensity={0.4}
                />
              </mesh>
              <Html position={[0, 0.28, 0]} center>
                <span className={labelClass}>{eeLabel}</span>
              </Html>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/** World-fixed ground grid (outside the arm groups so it does not move). */
function Ground() {
  const domElement = useThree((s) => s.gl.domElement);
  const colors = useTokenColors(domElement);
  return (
    <gridHelper args={[8, 16, colors.grid, colors.grid]} position={[0, -0.001, 0]} />
  );
}

export default function SE3ArmScene({
  theta1,
  theta2,
  theta3,
  baseLabel,
  eeLabel,
}: {
  theta1: number;
  theta2: number;
  theta3: number;
  baseLabel: string;
  eeLabel: string;
}) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [3.2, 2.8, 3.6], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 3]} intensity={1.2} />
      <Ground />
      <Arm
        theta1={theta1}
        theta2={theta2}
        theta3={theta3}
        baseLabel={baseLabel}
        eeLabel={eeLabel}
      />
      <OrbitControls
        makeDefault
        enableDamping={false}
        target={[1, 0.7, 0]}
        minDistance={2.5}
        maxDistance={12}
      />
    </Canvas>
  );
}
