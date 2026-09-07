"use client";

import { forwardRef, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// Fixed, semantic colours (bright, for the dark canvas), matching the 2D viz:
// blue translation, green motion-within, orange Ω×r, pink resultant, purple Ω.
export const C = {
  vBorg: "#38bdf8",
  motion: "#34d399",
  omegaR: "#f59e0b",
  res: "#f472b6",
  omega: "#c084fc",
};
// axesHelper colours (x red, y green, z blue) — softened for the dark ground.
const AX = { x: "#f87171", y: "#4ade80", z: "#60a5fa", frame: "#94a3b8" };

const R_Q = 1.2; // Q's fixed distance from B's origin, along B's x-axis
const B_Y = 0.9; // height of {B} above the grid
const BOUND = 1.5; // translation bounce bound
const VEL_SCALE = 0.7; // world velocity -> arrow length
const OMEGA_SCALE = 0.6; // |Ω| -> Ω-arrow length
const SPIN_SCALE = 0.6; // rad/s -> on-screen spin
const TRANS_SCALE = 0.5; // m/s -> on-screen translation
const UP = new THREE.Vector3(0, 1, 0);

interface Props {
  omega: number;
  vBorg: number;
  vQb: number;
  showBorg: boolean;
  showMotion: boolean;
  showRot: boolean;
  paused: boolean;
  reduce: boolean;
}

function Label({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      style={{
        color,
        background: "rgba(11,15,23,0.74)",
        border: `1px solid ${color}`,
        borderRadius: 5,
        padding: "0px 5px",
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      }}
    >
      {children}
    </span>
  );
}

const Arrow = forwardRef<
  THREE.Group,
  { color: string; shaft?: number; label?: string; show?: boolean; labelAt?: number }
>(function Arrow({ color, shaft = 0.028, label, show = true, labelAt = 1.08 }, ref) {
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
      {label && show && (
        <Html position={[0, labelAt, 0]} center style={{ pointerEvents: "none" }}>
          <Label color={color}>{label}</Label>
        </Html>
      )}
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
  const omegaRef = useRef<THREE.Group>(null);

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

    // Ω vector at B's origin: along the spin axis (world +y), length ∝ |Ω|,
    // pointing down when Ω is negative.
    place(omegaRef.current, bOrg, new THREE.Vector3(0, omega * OMEGA_SCALE, 0));

    // Q in world = B_ORG + Ry(θ)·(R_Q, 0, 0)
    const rWorld = new THREE.Vector3(R_Q * c, 0, -R_Q * s);
    const qWorld = bOrg.clone().add(rWorld);

    // velocity contributions in world axes (display-scaled)
    const vBorgVec = props.showBorg
      ? new THREE.Vector3(bdir.current * vBorg, 0, 0).multiplyScalar(VEL_SCALE)
      : new THREE.Vector3();
    const motionVec = props.showMotion
      ? new THREE.Vector3(c, 0, -s).multiplyScalar(vQb * VEL_SCALE) // along B's x-axis
      : new THREE.Vector3();
    const omegaRVec = props.showRot
      ? new THREE.Vector3(rWorld.z, 0, -rWorld.x).multiplyScalar(omega * VEL_SCALE) // Ω(ŷ)×r
      : new THREE.Vector3();
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

  const showRot = props.showRot && Math.abs(omega) > 0.02;
  const showBorg = props.showBorg && vBorg > 0.02;
  const showMotion = props.showMotion && vQb > 0.02;
  const showRes = showBorg || showMotion || showRot;
  const showOmega = Math.abs(omega) > 0.02; // Ω vector shown whenever the frame spins

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[5, 7, 4]} intensity={1.05} />
      <gridHelper args={[8, 16, grid, grid]} />

      {/* world frame {A} (fixed) + labels */}
      <axesHelper args={[1.1]} />
      <Html position={[1.25, 0, 0]} center style={{ pointerEvents: "none" }}><Label color={AX.x}>x</Label></Html>
      <Html position={[0, 1.25, 0]} center style={{ pointerEvents: "none" }}><Label color={AX.y}>y</Label></Html>
      <Html position={[0, 0, 1.25]} center style={{ pointerEvents: "none" }}><Label color={AX.z}>z</Label></Html>
      <Html position={[-0.18, -0.12, 0]} center style={{ pointerEvents: "none" }}><Label color={AX.frame}>{"{A}"}</Label></Html>

      {/* moving frame {B}: translates + spins; r, Q and labels ride along */}
      <group ref={bGroup}>
        <axesHelper args={[0.9]} />
        <Html position={[0.15, -0.28, 0.12]} center style={{ pointerEvents: "none" }}><Label color={AX.frame}>{"{B}"}</Label></Html>
        {/* r vector (B origin -> Q) */}
        <mesh position={[R_Q / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <cylinderGeometry args={[0.014, 0.014, R_Q, 8]} />
          <meshStandardMaterial color="#8aa0b2" />
        </mesh>
        <Html position={[R_Q / 2, 0.16, 0]} center style={{ pointerEvents: "none" }}><Label color="#c3ccd6">r</Label></Html>
        {/* point Q */}
        <mesh position={[R_Q, 0, 0]}>
          <sphereGeometry args={[0.075, 18, 18]} />
          <meshStandardMaterial color={C.res} emissive={C.res} emissiveIntensity={0.5} />
        </mesh>
        <Html position={[R_Q + 0.02, -0.2, 0]} center style={{ pointerEvents: "none" }}><Label color={C.res}>Q</Label></Html>
      </group>

      {/* Ω vector (scales with |Ω|) + contributions + resultant, updated in world space */}
      <Arrow ref={omegaRef} color={C.omega} shaft={0.024} label="Ω" show={showOmega} />
      <Arrow ref={vBorgRef} color={C.vBorg} label="V_Borg" show={showBorg} />
      <Arrow ref={motionRef} color={C.motion} label="R·ᴮV_Q" show={showMotion} />
      <Arrow ref={omegaRRef} color={C.omegaR} label="Ω×r" show={showRot} />
      <Arrow ref={resRef} color={C.res} shaft={0.038} label="ᴬV_Q" show={showRes} labelAt={0.55} />

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
