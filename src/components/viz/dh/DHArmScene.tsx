"use client";

import { useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";

export const L1 = 1.5;
export const L2 = 1.2;

interface SceneColors {
  link: string;
  motor: string;
  grid: string;
}
const FALLBACK: SceneColors = {
  link: "#8aa0b2",
  motor: "#38bdf8",
  grid: "#1e2a38",
};

function useTokenColors(el: HTMLElement): SceneColors {
  return useMemo(() => {
    const s = getComputedStyle(el);
    const v = (n: string, fb: string) => s.getPropertyValue(n).trim() || fb;
    return {
      link: v("--muted", FALLBACK.link),
      motor: v("--accent", FALLBACK.motor),
      grid: v("--viz-grid", FALLBACK.grid),
    };
  }, [el]);
}

const labelClass =
  "pointer-events-none select-none whitespace-nowrap rounded border border-border bg-surface/80 px-1.5 py-0.5 text-xs text-foreground";

/** A vertical motor (cylinder along +y, the joint's rotation axis). */
function Motor({ color }: { color: string }) {
  return (
    <mesh>
      <cylinderGeometry args={[0.14, 0.14, 0.5, 24]} />
      <meshStandardMaterial color={color} metalness={0.2} roughness={0.5} />
    </mesh>
  );
}

function Link({ length, color }: { length: number; color: string }) {
  return (
    <mesh position={[length / 2, 0, 0]}>
      <boxGeometry args={[length, 0.1, 0.1]} />
      <meshStandardMaterial color={color} metalness={0.15} roughness={0.55} />
    </mesh>
  );
}

/** A DH coordinate frame. The axesHelper is wrapped in a -90 deg x-rotation so
 *  its local z (blue) points along world +y — i.e. straight up, along the
 *  vertical motor axis. Under any joint yaw (about +y) the z-axis stays up, so
 *  every frame's z aligns with its motor. */
function DHFrame({ size, label }: { size: number; label: string }) {
  return (
    <>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <axesHelper args={[size]} />
      </group>
      <Html position={[0, size * 0.7, 0]} center>
        <span className={labelClass}>{label}</span>
      </Html>
    </>
  );
}

function Arm({
  theta1,
  theta2,
  showBase,
  showJoint1,
  showEE,
}: {
  theta1: number;
  theta2: number;
  showBase: boolean;
  showJoint1: boolean;
  showEE: boolean;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const domElement = useThree((s) => s.gl.domElement);
  const colors = useTokenColors(domElement);

  useEffect(() => {
    invalidate();
  }, [theta1, theta2, showBase, showJoint1, showEE, colors, invalidate]);

  return (
    <group>
      {/* base motor + fixed base frame {0} at the origin */}
      <Motor color={colors.motor} />
      {showBase && <DHFrame size={0.8} label="{0} base" />}

      <group rotation={[0, theta1, 0]}>
        <Link length={L1} color={colors.link} />

        <group position={[L1, 0, 0]}>
          {/* motor 2 + joint-1 frame {1} at the elbow */}
          <Motor color={colors.motor} />
          {showJoint1 && <DHFrame size={0.8} label="{1} joint 1" />}

          <group rotation={[0, theta2, 0]}>
            <Link length={L2} color={colors.link} />

            <group position={[L2, 0, 0]}>
              {showEE && <DHFrame size={0.8} label="{2} end-effector" />}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

function Ground({ color }: { color: string }) {
  return <gridHelper args={[8, 16, color, color]} position={[0, -0.4, 0]} />;
}

export default function DHArmScene({
  theta1,
  theta2,
  showBase,
  showJoint1,
  showEE,
}: {
  theta1: number;
  theta2: number;
  showBase: boolean;
  showJoint1: boolean;
  showEE: boolean;
}) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [3, 3, 4], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 6, 3]} intensity={1.15} />
      <GroundColored />
      <Arm
        theta1={theta1}
        theta2={theta2}
        showBase={showBase}
        showJoint1={showJoint1}
        showEE={showEE}
      />
      <OrbitControls
        makeDefault
        enableDamping={false}
        target={[1.2, 0, 0]}
        minDistance={2.5}
        maxDistance={12}
      />
    </Canvas>
  );
}

/** Grid needs the resolved token color, which requires being inside the Canvas. */
function GroundColored() {
  const domElement = useThree((s) => s.gl.domElement);
  const colors = useTokenColors(domElement);
  return <Ground color={colors.grid} />;
}
