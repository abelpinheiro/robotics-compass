"use client";

import { useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";

// Link lengths of the 3-DOF arm (base column, upper arm, forearm). Exported so
// the viz builds the matching 4x4 chain with the same geometry the scene draws.
export const L1 = 1.2;
export const L2 = 1.3;
export const L3 = 1.0;

// A strong, fixed highlight color for the Tool Center Point — used identically
// in the 3D marker/trail and in the highlighted matrix column so the learner
// sees the algebra meet the world (matched across the dark canvas + light math).
export const TCP_COLOR = "#ec4899";

type P3 = [number, number, number];

interface Colors {
  link: string;
  base: string;
  grid: string;
}
const FALLBACK: Colors = { link: "#8aa0b2", base: "#38bdf8", grid: "#1e2a38" };

function useColors(el: HTMLElement): Colors {
  return useMemo(() => {
    const s = getComputedStyle(el);
    const v = (n: string, fb: string) => s.getPropertyValue(n).trim() || fb;
    return {
      link: v("--muted", FALLBACK.link),
      base: v("--accent", FALLBACK.base),
      grid: v("--viz-grid", FALLBACK.grid),
    };
  }, [el]);
}

function Link({ length, color }: { length: number; color: string }) {
  return (
    <mesh position={[length / 2, 0, 0]} castShadow>
      <boxGeometry args={[length, 0.1, 0.1]} />
      <meshStandardMaterial color={color} metalness={0.15} roughness={0.55} />
    </mesh>
  );
}

/**
 * A 3-DOF arm (base yaw, shoulder pitch, elbow pitch) built as nested groups
 * matching A1·A2·A3 = Rotz(t1)·Transz(L1) · Roty(t2)·Transx(L2) · Roty(t3)·
 * Transx(L3). RGB coordinate frames sit at the base and every joint (x red,
 * y green, z blue via axesHelper), and the TCP trail is drawn in the robot's
 * base frame. Everything is wrapped in a -90deg x-rotation so the robot's z
 * points up on screen.
 */
function Arm({
  t1,
  t2,
  t3,
  trail,
  colors,
}: {
  t1: number;
  t2: number;
  t3: number;
  trail: P3[];
  colors: Colors;
}) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
  }, [t1, t2, t3, trail, colors, invalidate]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {/* frame {0} — base */}
      <axesHelper args={[0.7]} />

      {/* TCP trail (robot base frame) */}
      {trail.length > 1 && (
        <Line points={trail} color={TCP_COLOR} lineWidth={2.5} />
      )}

      <group rotation={[0, 0, t1]}>
        {/* base column up to the shoulder */}
        <mesh position={[0, 0, L1 / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.14, L1, 20]} />
          <meshStandardMaterial color={colors.base} metalness={0.2} roughness={0.5} />
        </mesh>

        <group position={[0, 0, L1]}>
          {/* frame {1} — shoulder */}
          <axesHelper args={[0.55]} />
          <group rotation={[0, t2, 0]}>
            <Link length={L2} color={colors.link} />
            <group position={[L2, 0, 0]}>
              {/* frame {2} — elbow */}
              <axesHelper args={[0.5]} />
              <group rotation={[0, t3, 0]}>
                <Link length={L3} color={colors.link} />
                <group position={[L3, 0, 0]}>
                  {/* frame {3} / TCP */}
                  <axesHelper args={[0.55]} />
                  <mesh>
                    <sphereGeometry args={[0.09, 20, 20]} />
                    <meshStandardMaterial
                      color={TCP_COLOR}
                      emissive={TCP_COLOR}
                      emissiveIntensity={0.5}
                    />
                  </mesh>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

function Scene({ t1, t2, t3, trail }: { t1: number; t2: number; t3: number; trail: P3[] }) {
  const domElement = useThree((s) => s.gl.domElement);
  const colors = useColors(domElement);
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 3]} intensity={1.15} />
      <gridHelper args={[8, 16, colors.grid, colors.grid]} position={[0, -0.001, 0]} />
      <Arm t1={t1} t2={t2} t3={t3} trail={trail} colors={colors} />
      <OrbitControls
        makeDefault
        enableDamping={false}
        target={[0, 1.2, 0]}
        minDistance={2.5}
        maxDistance={14}
      />
    </>
  );
}

export default function FKArmScene({
  t1,
  t2,
  t3,
  trail,
}: {
  t1: number;
  t2: number;
  t3: number;
  trail: P3[];
}) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [3.4, 2.8, 3.8], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
    >
      <Scene t1={t1} t2={t2} t3={t3} trail={trail} />
    </Canvas>
  );
}
