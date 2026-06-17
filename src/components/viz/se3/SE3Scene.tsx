"use client";

import { useEffect, useMemo, useRef, type ComponentRef } from "react";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface BasePose {
  yaw: number; // radians, about vertical (y)
  tx: number;
  tz: number;
}

const clamp = (v: number, lo = -3.5, hi = 3.5) => Math.max(lo, Math.min(hi, v));

const labelClass =
  "pointer-events-none select-none rounded border border-border bg-surface/80 px-1.5 py-0.5 text-xs text-foreground";

interface Colors {
  worldVec: string;
  baseVec: string;
  point: string;
  grid: string;
}
const FALLBACK: Colors = {
  worldVec: "#38bdf8",
  baseVec: "#f472b6",
  point: "#d97706",
  grid: "#1e2a38",
};

function useTokenColors(el: HTMLElement | undefined): Colors {
  return useMemo(() => {
    if (!el) return FALLBACK;
    const s = getComputedStyle(el);
    const v = (n: string, fb: string) => s.getPropertyValue(n).trim() || fb;
    return {
      worldVec: v("--accent", FALLBACK.worldVec),
      baseVec: v("--danger", FALLBACK.baseVec),
      point: v("--warning", FALLBACK.point),
      grid: v("--viz-grid", FALLBACK.grid),
    };
  }, [el]);
}

function Arrow({ from, to, color }: { from: Vec3; to: Vec3; color: string }) {
  const arrow = useMemo(
    () =>
      new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(),
        1,
        0xffffff,
        0.3,
        0.16,
      ),
    [],
  );
  useEffect(() => () => arrow.dispose?.(), [arrow]);
  useEffect(() => {
    const origin = new THREE.Vector3(from.x, from.y, from.z);
    const dir = new THREE.Vector3(to.x - from.x, to.y - from.y, to.z - from.z);
    const len = Math.max(dir.length(), 1e-3);
    arrow.position.copy(origin);
    arrow.setDirection(dir.normalize());
    arrow.setLength(len, Math.min(0.3, len * 0.25), Math.min(0.16, len * 0.16));
    arrow.setColor(new THREE.Color(color));
  }, [arrow, from, to, color]);
  return <primitive object={arrow} />;
}

function SceneContents({
  P,
  onChange,
  base,
}: {
  P: Vec3;
  onChange: (p: Vec3) => void;
  base: BasePose;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const domElement = useThree((s) => s.gl.domElement);
  const colors = useTokenColors(domElement);
  const draggingRef = useRef(false);
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const ground = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

  useEffect(() => {
    invalidate();
  }, [P, base, colors, invalidate]);

  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    if (!draggingRef.current) return;
    e.stopPropagation();
    const hit = new THREE.Vector3();
    if (e.ray.intersectPlane(ground, hit)) {
      onChange({ x: clamp(hit.x), y: 0, z: clamp(hit.z) });
      invalidate();
    }
  };

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} />
      <gridHelper args={[8, 16, colors.grid, colors.grid]} position={[0, -0.001, 0]} />

      {/* {A} world frame */}
      <axesHelper args={[1]} />
      <Html position={[0, 0.2, 0]} center>
        <span className={labelClass}>{"{A}"}</span>
      </Html>

      {/* {B} frame: displaced + rotated about vertical */}
      <group position={[base.tx, 0, base.tz]} rotation={[0, base.yaw, 0]}>
        <axesHelper args={[1]} />
        <Html position={[0, 0.2, 0]} center>
          <span className={labelClass}>{"{B}"}</span>
        </Html>
      </group>

      <Arrow from={{ x: 0, y: 0, z: 0 }} to={P} color={colors.worldVec} />
      <Arrow from={{ x: base.tx, y: 0, z: base.tz }} to={P} color={colors.baseVec} />

      {/* Draggable point P */}
      <group position={[P.x, P.y, P.z]}>
        <mesh>
          <sphereGeometry args={[0.13, 28, 28]} />
          <meshStandardMaterial color={colors.point} emissive={colors.point} emissiveIntensity={0.35} />
        </mesh>
        <mesh
          onPointerDown={(e) => {
            e.stopPropagation();
            draggingRef.current = true;
            if (controlsRef.current) controlsRef.current.enabled = false;
            (e.target as unknown as Element).setPointerCapture?.(e.pointerId);
          }}
          onPointerUp={(e) => {
            draggingRef.current = false;
            if (controlsRef.current) controlsRef.current.enabled = true;
            (e.target as unknown as Element).releasePointerCapture?.(e.pointerId);
          }}
          onPointerMove={handleMove}
        >
          <sphereGeometry args={[0.34, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
      <Html position={[P.x, P.y + 0.24, P.z]} center>
        <span className={`${labelClass} font-semibold`}>P</span>
      </Html>

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping={false}
        target={[base.tx / 2, 0, base.tz / 2]}
        minDistance={3}
        maxDistance={14}
      />
    </>
  );
}

export default function SE3Scene({
  P,
  onChange,
  base,
}: {
  P: Vec3;
  onChange: (p: Vec3) => void;
  base: BasePose;
}) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [4.5, 4, 5.5], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
    >
      <SceneContents P={P} onChange={onChange} base={base} />
    </Canvas>
  );
}
