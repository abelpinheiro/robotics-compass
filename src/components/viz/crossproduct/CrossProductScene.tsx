"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// Fixed, semantic colours for the three vectors — reused in the readout so the
// algebra (ω, r, v) matches the 3D arrows. ω runs along the blue rotation axis,
// r is the amber link, v is the green resulting velocity.
export const OMEGA_COLOR = "#38bdf8";
export const R_COLOR = "#f59e0b";
export const V_COLOR = "#34d399";

// Display scales: the true magnitudes live in the labels; the arrows are scaled
// (and capped) so the scene stays framed as the sliders sweep their full range.
const LINK_SCALE = 0.45; // display link length = radius * LINK_SCALE
const OMEGA_SCALE = 1.0, OMEGA_CAP = 3.5;
const V_SCALE = 0.24, V_CAP = 4.5;
const TIME_SCALE = 0.6; // rad/s -> on-screen spin speed (illustrative)

const UP = new THREE.Vector3(0, 1, 0);

function token(el: HTMLElement, name: string, fb: string) {
  return getComputedStyle(el).getPropertyValue(name).trim() || fb;
}

function Arrow({
  origin = [0, 0, 0],
  dir,
  length,
  color,
  shaft = 0.035,
}: {
  origin?: [number, number, number];
  dir: THREE.Vector3;
  length: number;
  color: string;
  shaft?: number;
}) {
  const quat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize()),
    [dir],
  );
  if (length < 0.02) return null;
  const head = Math.min(0.28, length * 0.4);
  const body = Math.max(0.001, length - head);
  return (
    <group position={origin} quaternion={quat}>
      <mesh position={[0, body / 2, 0]}>
        <cylinderGeometry args={[shaft, shaft, body, 14]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.4} />
      </mesh>
      <mesh position={[0, body + head / 2, 0]}>
        <coneGeometry args={[shaft * 2.6, head, 18]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Label({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        color,
        background: "rgba(11,15,23,0.74)",
        border: `1px solid ${color}`,
        borderRadius: 6,
        padding: "1px 6px",
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      }}
    >
      {children}
    </span>
  );
}

function Scene({ omega, radius, animate }: { omega: number; radius: number; animate: boolean }) {
  const dom = useThree((s) => s.gl.domElement);
  const grid = useMemo(() => token(dom, "--viz-grid", "#1e2a38"), [dom]);
  const linkColor = useMemo(() => token(dom, "--muted", "#8aa0b2"), [dom]);

  const groupRef = useRef<THREE.Group>(null);
  const theta = useRef(0.6);

  const L = radius * LINK_SCALE;
  const s = omega < 0 ? -1 : 1; // sign of ω (right-hand rule); default +1 at 0
  const omegaLen = Math.min(Math.abs(omega) * OMEGA_SCALE, OMEGA_CAP);
  const vLen = Math.min(Math.abs(omega * radius) * V_SCALE, V_CAP);

  const omegaDir = useMemo(() => new THREE.Vector3(0, s, 0), [s]);
  const rDir = useMemo(() => new THREE.Vector3(1, 0, 0), []);
  const vDir = useMemo(() => new THREE.Vector3(0, 0, -s), [s]); // tangent: perpendicular to ω and r

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (animate) theta.current += omega * delta * TIME_SCALE;
    groupRef.current.rotation.y = theta.current;
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 3]} intensity={1.0} />
      <gridHelper args={[8, 16, grid, grid]} position={[0, -0.001, 0]} />

      {/* ω — fixed rotation axis (does not rotate with the link) */}
      <Arrow dir={omegaDir} length={omegaLen} color={OMEGA_COLOR} shaft={0.04} />
      {omegaLen > 0.02 && (
        <Html position={[-0.34, s * (omegaLen + 0.3), 0]} center style={{ pointerEvents: "none" }}>
          <Label color={OMEGA_COLOR}>ω = {omega.toFixed(1)} rad/s</Label>
        </Html>
      )}

      {/* central fixed joint */}
      <mesh>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshStandardMaterial color={linkColor} metalness={0.3} roughness={0.5} />
      </mesh>

      {/* faint circular path swept by the tip (radius L, in the plane of motion) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[L, 0.012, 8, 72]} />
        <meshBasicMaterial color={grid} />
      </mesh>

      {/* rotating link: everything inside spins rigidly, so r and v stay attached */}
      <group ref={groupRef}>
        <mesh position={[L / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, L, 16]} />
          <meshStandardMaterial color={linkColor} metalness={0.2} roughness={0.5} />
        </mesh>

        {/* r — along the link */}
        <Arrow origin={[0, 0.22, 0]} dir={rDir} length={L} color={R_COLOR} shaft={0.032} />
        <Html position={[L * 0.5, 0.6, 0.28]} center style={{ pointerEvents: "none" }}>
          <Label color={R_COLOR}>r = {radius.toFixed(1)} m</Label>
        </Html>

        {/* tip */}
        <mesh position={[L, 0, 0]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color={V_COLOR} emissive={V_COLOR} emissiveIntensity={0.35} />
        </mesh>

        {/* v = ω × r — velocity of the tip, tangent to the circle */}
        <Arrow origin={[L, 0, 0]} dir={vDir} length={vLen} color={V_COLOR} shaft={0.046} />
        {vLen > 0.02 && (
          <Html position={[L + 0.2, 0.24, -s * (vLen + 0.45)]} center style={{ pointerEvents: "none" }}>
            <Label color={V_COLOR}>|v| = {Math.abs(omega * radius).toFixed(1)} m/s</Label>
          </Html>
        )}
      </group>

      <OrbitControls
        makeDefault
        enableDamping={false}
        target={[1.2, 0.4, 0]}
        minDistance={2.5}
        maxDistance={22}
      />
    </>
  );
}

export default function CrossProductScene({
  omega,
  radius,
  reduce,
}: {
  omega: number;
  radius: number;
  reduce: boolean;
}) {
  const animate = omega !== 0 && !reduce;
  return (
    <Canvas
      frameloop={animate ? "always" : "demand"}
      dpr={[1, 2]}
      camera={{ position: [3.7, 2.15, 4.3], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
    >
      <Scene omega={omega} radius={radius} animate={animate} />
    </Canvas>
  );
}
