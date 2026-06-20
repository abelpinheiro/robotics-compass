"use client";

import { useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// The wall is WALL m straight ahead in the robot frame {B}: ^B P = [WALL, 0].
const WALL = 2;

const labelClass =
  "pointer-events-none select-none rounded border border-border bg-surface/80 px-1.5 py-0.5 text-xs text-foreground";

function Arrow({
  to,
  color,
}: {
  to: [number, number, number];
  color: string;
}) {
  const arrow = useMemo(
    () =>
      new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(),
        1,
        0xffffff,
        0.32,
        0.18,
      ),
    [],
  );
  useEffect(() => () => arrow.dispose?.(), [arrow]);
  useEffect(() => {
    const dir = new THREE.Vector3(to[0], to[1], to[2]);
    const len = Math.max(dir.length(), 1e-3);
    arrow.setDirection(dir.normalize());
    arrow.setLength(len, Math.min(0.32, len * 0.2), Math.min(0.18, len * 0.12));
    arrow.setColor(new THREE.Color(color));
  }, [arrow, to, color]);
  return <primitive object={arrow} />;
}

function Scene({ theta }: { theta: number }) {
  const invalidate = useThree((s) => s.invalidate);
  const domElement = useThree((s) => s.gl.domElement);
  const colors = useMemo(() => {
    const s = getComputedStyle(domElement);
    const v = (n: string, fb: string) => s.getPropertyValue(n).trim() || fb;
    return {
      grid: v("--viz-grid", "#1e2a38"),
      axis: v("--accent", "#38bdf8"),
      ap: v("--warning", "#d97706"),
      point: v("--foreground", "#e6edf3"),
      muted: v("--muted", "#8aa0b2"),
    };
  }, [domElement]);

  useEffect(() => {
    invalidate();
  }, [theta, colors, invalidate]);

  // ^A P world position = R_y(theta) · [WALL,0,0].
  const ap: [number, number, number] = [
    WALL * Math.cos(theta),
    0,
    -WALL * Math.sin(theta),
  ];

  // angle arc on the floor (xz-plane), from +x toward the rotated forward axis
  const arc: [number, number, number][] = [];
  for (let i = 0; i <= 24; i++) {
    const a = (theta * i) / 24;
    arc.push([0.8 * Math.cos(a), 0, -0.8 * Math.sin(a)]);
  }

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} />
      <gridHelper args={[10, 20, colors.grid, colors.grid]} position={[0, -0.001, 0]} />

      {/* world frame {A} (shared origin) */}
      <axesHelper args={[1.2]} />
      <Html position={[1.35, 0, 0]} center>
        <span className={labelClass}>{"{A}"}</span>
      </Html>

      {/* vertical rotation axis */}
      <Line
        points={[
          [0, 0, 0],
          [0, 1.7, 0],
        ]}
        color={colors.axis}
        lineWidth={1.5}
        dashed
        dashSize={0.12}
        gapSize={0.08}
      />
      <Html position={[0, 1.85, 0]} center>
        <span className={labelClass}>rotation axis</span>
      </Html>

      {/* angle arc */}
      <Line points={arc} color={colors.muted} lineWidth={1.5} />

      {/* robot frame {B}, rotated about the vertical axis */}
      <group rotation={[0, theta, 0]}>
        <axesHelper args={[1.5]} />
        <Html position={[1.6, 0, 0.001]} center>
          <span className={labelClass}>x̂_B (forward)</span>
        </Html>
        {/* wall point P, fixed in {B} at [WALL, 0] */}
        <mesh position={[WALL, 0, 0]}>
          <sphereGeometry args={[0.12, 24, 24]} />
          <meshStandardMaterial
            color={colors.point}
            emissive={colors.point}
            emissiveIntensity={0.3}
          />
        </mesh>
        <Html position={[WALL, 0.28, 0]} center>
          <span className={`${labelClass} font-semibold`}>P</span>
        </Html>
      </group>

      {/* ^A P vector from the shared origin to the wall point */}
      <Arrow to={ap} color={colors.ap} />

      <OrbitControls
        makeDefault
        enableDamping={false}
        target={[0.4, 0, -0.4]}
        minDistance={3}
        maxDistance={14}
      />
    </>
  );
}

export default function Rotation2DWorkedScene({ theta }: { theta: number }) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [4, 3.4, 4.6], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
    >
      <Scene theta={theta} />
    </Canvas>
  );
}
