"use client";

import { useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";

export interface Quat {
  x: number;
  y: number;
  z: number;
  w: number;
}
export interface Axis {
  x: number;
  y: number;
  z: number;
}

const labelClass =
  "pointer-events-none select-none rounded border border-border bg-surface/80 px-1.5 py-0.5 text-xs text-foreground";

interface Colors {
  grid: string;
  body: string;
  limb: string;
  head: string;
  face: string;
  axisLine: string;
}
const FALLBACK: Colors = {
  grid: "#1e2a38",
  body: "#38bdf8",
  limb: "#8aa0b2",
  head: "#e6edf3",
  face: "#d97706",
  axisLine: "#d97706",
};

function useTokenColors(el: HTMLElement): Colors {
  return useMemo(() => {
    const s = getComputedStyle(el);
    const v = (n: string, fb: string) => s.getPropertyValue(n).trim() || fb;
    return {
      grid: v("--viz-grid", FALLBACK.grid),
      body: v("--accent", FALLBACK.body),
      limb: v("--muted", FALLBACK.limb),
      head: v("--foreground", FALLBACK.head),
      face: v("--warning", FALLBACK.face),
      axisLine: v("--warning", FALLBACK.axisLine),
    };
  }, [el]);
}

/** A small robot facing +x (visor/eyes on the +x face), up = +y. Its whole body
 *  is rotated by the quaternion, and a body-axis triad rides along so the
 *  orientation stays legible. */
function Robot({ colors }: { colors: Colors }) {
  const box = (
    key: string,
    pos: [number, number, number],
    size: [number, number, number],
    color: string,
    emissive = 0,
  ) => (
    <mesh key={key} position={pos}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={emissive}
        metalness={0.15}
        roughness={0.55}
      />
    </mesh>
  );

  return (
    <>
      <axesHelper args={[1.5]} />
      {box("torso", [0, 0, 0], [0.7, 1.0, 0.5], colors.body)}
      {box("head", [0, 0.73, 0], [0.5, 0.46, 0.42], colors.limb)}
      {/* forward visor + eyes on the +x face make "which way is front" obvious */}
      {box("visor", [0.27, 0.75, 0], [0.06, 0.14, 0.32], colors.face, 0.4)}
      {box("eyeL", [0.26, 0.8, 0.12], [0.05, 0.08, 0.08], colors.face, 0.5)}
      {box("eyeR", [0.26, 0.8, -0.12], [0.05, 0.08, 0.08], colors.face, 0.5)}
      {box("armL", [0, 0.08, 0.43], [0.16, 0.7, 0.16], colors.limb)}
      {box("armR", [0, 0.08, -0.43], [0.16, 0.7, 0.16], colors.limb)}
      {box("legL", [0, -0.78, 0.15], [0.18, 0.52, 0.18], colors.limb)}
      {box("legR", [0, -0.78, -0.15], [0.18, 0.52, 0.18], colors.limb)}
    </>
  );
}

function Scene({ q, axis }: { q: Quat; axis: Axis }) {
  const invalidate = useThree((s) => s.invalidate);
  const domElement = useThree((s) => s.gl.domElement);
  const colors = useTokenColors(domElement);

  useEffect(() => {
    invalidate();
  }, [q, axis, colors, invalidate]);

  const L = 2.4;
  const axisPoints: [number, number, number][] = [
    [-axis.x * L, -axis.y * L, -axis.z * L],
    [axis.x * L, axis.y * L, axis.z * L],
  ];

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} />
      <gridHelper args={[9, 18, colors.grid, colors.grid]} position={[0, -1.15, 0]} />

      {/* rotation axis n̂ (dashed, through the origin) */}
      <Line
        points={axisPoints}
        color={colors.axisLine}
        lineWidth={2}
        dashed
        dashSize={0.14}
        gapSize={0.09}
      />
      <Html position={[axis.x * L, axis.y * L, axis.z * L]} center>
        <span className={labelClass}>n̂</span>
      </Html>

      {/* fixed world frame */}
      <axesHelper args={[1]} />
      <Html position={[1.15, 0, 0]} center>
        <span className={labelClass}>world</span>
      </Html>

      {/* robot rotated by the quaternion (three uses [x, y, z, w] order) */}
      <group quaternion={[q.x, q.y, q.z, q.w]}>
        <Robot colors={colors} />
      </group>

      <OrbitControls
        makeDefault
        enableDamping={false}
        target={[0, 0, 0]}
        minDistance={3.5}
        maxDistance={14}
      />
    </>
  );
}

export default function QuaternionScene({ q, axis }: { q: Quat; axis: Axis }) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [3.6, 2.6, 4], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
    >
      <Scene q={q} axis={axis} />
    </Canvas>
  );
}
