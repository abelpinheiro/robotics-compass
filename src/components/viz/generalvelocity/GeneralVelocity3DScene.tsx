"use client";

import { forwardRef, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// Fixed, semantic colours (bright, for the dark canvas), matching the 2D viz:
// blue translation, green motion-within, orange Ω×r, pink resultant, purple Ω axis.
export const C = {
  vBorg: "#38bdf8",
  motion: "#34d399",
  omegaR: "#f59e0b",
  res: "#f472b6",
  omega: "#c084fc",
};

const R_Q = 1.2; // Q's fixed distance from B's origin, along B's x-axis
const B_Y = 0.9; // height of {B} above the grid
const BOUND = 1.5; // translation bounce bound
const VEL_SCALE = 0.7; // world velocity -> arrow length
const SPIN_SCALE = 0.6; // rad/s -> on-screen spin
const TRANS_SCALE = 0.5; // m/s -> on-screen translation
const UP = new THREE.Vector3(0, 1, 0);

interface Props {
  omega: number;
  vBorg: number;
  vQb: number;
  paused: boolean;
  reduce: boolean;
}

const Arrow = forwardRef<THREE.Group, { color: string; shaft?: number }>(function Arrow(
  { color, shaft = 0.028 },
  ref,
) {
  return (
    <group ref={ref}>
      <mesh position={[0, 0.41, 0]}>
        <cylinderGeometry args={[shaft, shaft, 0.82, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.91, 0]}>
        <coneGeometry args={[shaft * 2.6, 0.18, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} roughness={0.4} />
      </mesh>
    </group>
  );
});

function place(g: THREE.Group | null, origin: THREE.Vector3, dir: THREE.Vector3) {
  if (!g) return;
  const len = dir.length();
  if (len < 0.02) {
    g.visible = false;
    return;
  }
  g.visible = true;
  g.position.copy(origin);
  g.quaternion.setFromUnitVectors(UP, dir.clone().normalize());
  g.scale.set(1, len, 1);
}

function animating(p: Props) {
  return !p.reduce && !p.paused && (p.omega !== 0 || p.vBorg !== 0);
}

function Scene(props: Props) {
  const { omega, vBorg, vQb } = props;
  const invalidate = useThree((s) => s.invalidate);
  const dom = useThree((s) => s.gl.domElement);
  const grid = useMemo(
    () => getComputedStyle(dom).getPropertyValue("--viz-grid").trim() || "#1e2a38",
    [dom],
  );

  const bGroup = useRef<THREE.Group>(null);
  const vBorgRef = useRef<THREE.Group>(null);
  const motionRef = useRef<THREE.Group>(null);
  const omegaRRef = useRef<THREE.Group>(null);
  const resRef = useRef<THREE.Group>(null);

  const theta = useRef(0.5);
  const bx = useRef(0);
  const bdir = useRef(1);

  // Redraw once (under frameloop="demand") whenever a control changes.
  useEffect(() => invalidate(), [omega, vBorg, vQb, props.paused, props.reduce, invalidate]);

  useFrame((_, dt) => {
    const d = Math.min(0.05, dt);
    if (animating(props)) {
      theta.current += omega * d * SPIN_SCALE;
      bx.current += bdir.current * vBorg * d * TRANS_SCALE;
      if (bx.current > BOUND) {
        bx.current = BOUND;
        bdir.current = -1;
      } else if (bx.current < -BOUND) {
        bx.current = -BOUND;
        bdir.current = 1;
      }
    }
    const th = theta.current;
    const c = Math.cos(th), s = Math.sin(th);
    const bOrg = new THREE.Vector3(bx.current, B_Y, 0);
    if (bGroup.current) {
      bGroup.current.position.copy(bOrg);
      bGroup.current.rotation.y = th;
    }

    // Q in world = B_ORG + Ry(θ)·(R_Q, 0, 0)
    const rWorld = new THREE.Vector3(R_Q * c, 0, -R_Q * s);
    const qWorld = bOrg.clone().add(rWorld);

    // velocity contributions in world axes (display-scaled)
    const vBorgVec = new THREE.Vector3(bdir.current * vBorg, 0, 0).multiplyScalar(VEL_SCALE);
    const motionVec = new THREE.Vector3(c, 0, -s).multiplyScalar(vQb * VEL_SCALE); // along B's x-axis
    const omegaRVec = new THREE.Vector3(rWorld.z, 0, -rWorld.x).multiplyScalar(omega * VEL_SCALE); // Ω(ŷ)×r
    const resVec = vBorgVec.clone().add(motionVec).add(omegaRVec);

    // tip-to-tail at Q, plus the resultant from Q
    place(vBorgRef.current, qWorld, vBorgVec);
    const p1 = qWorld.clone().add(vBorgVec);
    place(motionRef.current, p1, motionVec);
    const p2 = p1.clone().add(motionVec);
    place(omegaRRef.current, p2, omegaRVec);
    place(resRef.current, qWorld, resVec);

    if (animating(props)) invalidate();
  });

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[5, 7, 4]} intensity={1.05} />
      <gridHelper args={[8, 16, grid, grid]} />

      {/* world frame {A} (fixed) */}
      <axesHelper args={[1.1]} />

      {/* moving frame {B}: translates + spins; r, Q and the Ω axis ride along */}
      <group ref={bGroup}>
        <axesHelper args={[0.9]} />
        {/* Ω axis (angular-velocity vector, vertical) */}
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.1, 10]} />
          <meshStandardMaterial color={C.omega} emissive={C.omega} emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 1.17, 0]}>
          <coneGeometry args={[0.05, 0.14, 14]} />
          <meshStandardMaterial color={C.omega} emissive={C.omega} emissiveIntensity={0.4} />
        </mesh>
        {/* r vector (B origin -> Q) */}
        <mesh position={[R_Q / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <cylinderGeometry args={[0.014, 0.014, R_Q, 8]} />
          <meshStandardMaterial color="#8aa0b2" />
        </mesh>
        {/* point Q */}
        <mesh position={[R_Q, 0, 0]}>
          <sphereGeometry args={[0.075, 18, 18]} />
          <meshStandardMaterial color={C.res} emissive={C.res} emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* velocity contributions + resultant (updated imperatively in world space) */}
      <Arrow ref={vBorgRef} color={C.vBorg} />
      <Arrow ref={motionRef} color={C.motion} />
      <Arrow ref={omegaRRef} color={C.omegaR} />
      <Arrow ref={resRef} color={C.res} shaft={0.038} />

      <OrbitControls
        makeDefault
        enableDamping={false}
        target={[0, 0.9, 0]}
        minDistance={2.5}
        maxDistance={22}
      />
    </>
  );
}

export default function GeneralVelocity3DScene(props: Props) {
  return (
    <Canvas
      frameloop={animating(props) ? "always" : "demand"}
      dpr={[1, 2]}
      camera={{ position: [3.3, 2.5, 4.0], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
