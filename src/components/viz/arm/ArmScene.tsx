"use client";

import { useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export const L1 = 1.4;
export const L2 = 1.1;

interface SceneColors {
  link1: string;
  link2: string;
  joint: string;
  grid: string;
}

const FALLBACK: SceneColors = {
  link1: "#38bdf8",
  link2: "#8aa0b2",
  joint: "#e6edf3",
  grid: "#1e2a38",
};

/** Read scene colors from the --token CSS variables resolved inside the
 *  .theme-dark canvas wrapper (Golden rule 3). Axis triads keep the
 *  conventional x=red / y=green / z=blue (three's axesHelper). */
function useTokenColors(el: HTMLElement | undefined): SceneColors {
  return useMemo(() => {
    if (!el) return FALLBACK;
    const s = getComputedStyle(el);
    const v = (name: string, fb: string) => s.getPropertyValue(name).trim() || fb;
    return {
      link1: v("--accent", FALLBACK.link1),
      link2: v("--muted", FALLBACK.link2),
      joint: v("--foreground", FALLBACK.joint),
      grid: v("--viz-grid", FALLBACK.grid),
    };
  }, [el]);
}

function Link({ length, color }: { length: number; color: string }) {
  return (
    <mesh position={[length / 2, 0, 0]} castShadow>
      <boxGeometry args={[length, 0.12, 0.12]} />
      <meshStandardMaterial color={color} metalness={0.15} roughness={0.55} />
    </mesh>
  );
}

function Joint({ color }: { color: string }) {
  return (
    <mesh>
      <sphereGeometry args={[0.1, 24, 24]} />
      <meshStandardMaterial color={color} metalness={0.1} roughness={0.5} />
    </mesh>
  );
}

/** The articulated chain: nested joint groups so each joint's rotation carries
 *  its children (see the viz-3d skill). The arm lies in the xz ground plane and
 *  rotates about the world y-axis. */
function Arm({ theta1, theta2 }: { theta1: number; theta2: number }) {
  const invalidate = useThree((s) => s.invalidate);
  const domElement = useThree((s) => s.gl.domElement);
  const colors = useTokenColors(domElement);

  // Demand-driven rendering: request a frame whenever a joint angle changes.
  useEffect(() => {
    invalidate();
  }, [theta1, theta2, colors, invalidate]);

  return (
    <group rotation={[0, theta1, 0]}>
      <axesHelper args={[0.45]} />
      <Joint color={colors.joint} />
      <Link length={L1} color={colors.link1} />

      <group position={[L1, 0, 0]} rotation={[0, theta2, 0]}>
        <axesHelper args={[0.45]} />
        <Joint color={colors.joint} />
        <Link length={L2} color={colors.link2} />

        <group position={[L2, 0, 0]}>
          <axesHelper args={[0.6]} />
          <mesh>
            <sphereGeometry args={[0.08, 24, 24]} />
            <meshStandardMaterial
              color={colors.link1}
              emissive={colors.link1}
              emissiveIntensity={0.4}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/** World-fixed ground grid (must sit outside the arm groups so it does not
 *  rotate with joint 1). */
function Ground() {
  const domElement = useThree((s) => s.gl.domElement);
  const colors = useTokenColors(domElement);
  return (
    <gridHelper args={[6, 12, colors.grid, colors.grid]} position={[0, -0.02, 0]} />
  );
}

export default function ArmScene({
  theta1,
  theta2,
}: {
  theta1: number;
  theta2: number;
}) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [2.4, 2.6, 3], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 3]} intensity={1.2} />
      <Ground />
      <Arm theta1={theta1} theta2={theta2} />
      <OrbitControls
        makeDefault
        enableDamping={false}
        target={[1.1, 0, 0]}
        minDistance={2}
        maxDistance={9}
      />
    </Canvas>
  );
}
