"use client";

import { useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// The worked example: {B} is displaced 2 m along +X of {A} with the SAME
// orientation; the part P is at ^B P = [0,1,3], so ^A P = [2,1,3].
const A = new THREE.Vector3(0, 0, 0);
const B = new THREE.Vector3(2, 0, 0);
const P = new THREE.Vector3(2, 1, 3);

const labelClass =
  "pointer-events-none select-none rounded border border-border bg-surface/80 px-1.5 py-0.5 text-xs text-foreground";

function Arrow({
  from,
  to,
  color,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
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
    const dir = new THREE.Vector3().subVectors(to, from);
    const len = Math.max(dir.length(), 1e-3);
    arrow.position.copy(from);
    arrow.setDirection(dir.normalize());
    arrow.setLength(len, Math.min(0.32, len * 0.18), Math.min(0.18, len * 0.12));
    arrow.setColor(new THREE.Color(color));
  }, [arrow, from, to, color]);
  return <primitive object={arrow} />;
}

function mid(a: THREE.Vector3, b: THREE.Vector3): [number, number, number] {
  return [(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2];
}

function Scene() {
  const invalidate = useThree((s) => s.invalidate);
  const domElement = useThree((s) => s.gl.domElement);
  const colors = useMemo(() => {
    const s = getComputedStyle(domElement);
    const v = (n: string, fb: string) => s.getPropertyValue(n).trim() || fb;
    return {
      grid: v("--viz-grid", "#1e2a38"),
      borg: v("--accent", "#38bdf8"),
      bp: v("--success", "#34d399"),
      ap: v("--warning", "#d97706"),
      part: v("--foreground", "#e6edf3"),
    };
  }, [domElement]);

  useEffect(() => {
    invalidate();
  }, [colors, invalidate]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} />
      <gridHelper args={[10, 20, colors.grid, colors.grid]} position={[0, -0.001, 0]} />

      <axesHelper args={[1]} />
      <Html position={[-0.15, 0.15, 0]} center>
        <span className={labelClass}>{"{A}"}</span>
      </Html>

      <group position={[B.x, B.y, B.z]}>
        <axesHelper args={[1]} />
        <Html position={[0, 0.2, 0]} center>
          <span className={labelClass}>{"{B}"}</span>
        </Html>
      </group>

      {/* part P */}
      <mesh position={[P.x, P.y, P.z]}>
        <sphereGeometry args={[0.12, 24, 24]} />
        <meshStandardMaterial color={colors.part} emissive={colors.part} emissiveIntensity={0.3} />
      </mesh>
      <Html position={[P.x, P.y + 0.25, P.z]} center>
        <span className={`${labelClass} font-semibold`}>P</span>
      </Html>

      {/* the head-to-tail addition: A→B, then B→P, equals A→P */}
      <Arrow from={A} to={B} color={colors.borg} />
      <Arrow from={B} to={P} color={colors.bp} />
      <Arrow from={A} to={P} color={colors.ap} />
      <Html position={mid(A, B)} center>
        <span className={labelClass} style={{ color: colors.borg }}>
          ᴬP_BORG
        </span>
      </Html>
      <Html position={mid(B, P)} center>
        <span className={labelClass} style={{ color: colors.bp }}>
          ᴮP
        </span>
      </Html>
      <Html position={mid(A, P)} center>
        <span className={labelClass} style={{ color: colors.ap }}>
          ᴬP
        </span>
      </Html>

      <OrbitControls
        makeDefault
        enableDamping={false}
        target={[1, 0.6, 1.5]}
        minDistance={4}
        maxDistance={16}
      />
    </>
  );
}

export default function VectorAdditionScene() {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [6.5, 5, 6.5], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
    >
      <Scene />
    </Canvas>
  );
}
