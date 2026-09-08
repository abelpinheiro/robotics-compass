"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  SCARA,
  scaraFK,
  scaraWorkspace,
  sixDofFK,
  type RobotKind,
  type ScaraState,
  type Vec3,
} from "./singularitiesMath";

// Bright, semantic colours for the dark canvas (Golden rule 2/3: grid + link
// come from tokens; the rest are fixed bright accents like the other 3D viz).
const C = {
  link: "#8aa0b2", // arm links (overridden by --muted token when available)
  joint: "#38bdf8", // motors / joints (accent)
  tool: "#34d399", // tool point (success)
  boundary: "#f59e0b", // boundary-type singular locus (amber)
  interior: "#c084fc", // interior-type singularity marker (purple)
  alert: "#fb7185", // the arm turns this colour when the pose is singular
  wc: "#f472b6", // wrist centre
};

// singular when the manipulability drops below this fraction of its max.
export const SINGULAR_FRACTION = 0.05;

const UP = new THREE.Vector3(0, 1, 0);
// map math coords (z up) to three.js coords (y up), right-handed.
const to3 = (v: Vec3): [number, number, number] => [v[0], v[2], -v[1]];

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

function Bone({
  a,
  b,
  radius = 0.055,
  color,
}: {
  a: [number, number, number];
  b: [number, number, number];
  radius?: number;
  color: string;
}) {
  const { pos, quat, len } = useMemo(() => {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const dir = vb.clone().sub(va);
    const l = dir.length();
    return {
      pos: va.clone().add(vb).multiplyScalar(0.5),
      quat: new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize()),
      len: l,
    };
  }, [a, b]);
  if (len < 1e-3) return null;
  return (
    <mesh position={pos} quaternion={quat}>
      <cylinderGeometry args={[radius, radius, len, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.22} roughness={0.5} metalness={0.15} />
    </mesh>
  );
}

/** A short motor cylinder centred at `origin`, aligned with joint axis `axis`. */
function Motor({ origin, axis, color }: { origin: Vec3; axis: Vec3; color: string }) {
  const { pos, quat } = useMemo(() => {
    const dir = new THREE.Vector3(...to3(axis)).normalize();
    return {
      pos: new THREE.Vector3(...to3(origin)),
      quat: new THREE.Quaternion().setFromUnitVectors(UP, dir),
    };
  }, [origin, axis]);
  return (
    <mesh position={pos} quaternion={quat}>
      <cylinderGeometry args={[0.11, 0.11, 0.34, 24]} />
      <meshStandardMaterial color={color} metalness={0.3} roughness={0.45} />
    </mesh>
  );
}

function Ball({ at, r = 0.09, color }: { at: Vec3; r?: number; color: string }) {
  return (
    <mesh position={to3(at)}>
      <sphereGeometry args={[r, 20, 20]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.4} />
    </mesh>
  );
}

/** A horizontal circle of radius `r` at height `z` (math frame), for loci. */
function Circle({ r, z, color, dashed = false }: { r: number; z: number; color: string; dashed?: boolean }) {
  const pts = useMemo(() => {
    const n = 96;
    const out: [number, number, number][] = [];
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      out.push(to3([r * Math.cos(a), r * Math.sin(a), z]));
    }
    return out;
  }, [r, z]);
  return <Line points={pts} color={color} lineWidth={2} dashed={dashed} dashSize={0.12} gapSize={0.09} />;
}

function ScaraRig({ st, singular }: { st: ScaraState; singular: boolean }) {
  const pose = scaraFK(st);
  const ws = scaraWorkspace();
  const armColor = singular ? C.alert : C.link;
  const toolFloor: Vec3 = [pose.tool[0], pose.tool[1], SCARA.baseH];

  return (
    <>
      {/* base column from ground up to the arm plane */}
      <Bone a={to3([0, 0, 0])} b={to3(pose.shoulder)} radius={0.11} color={C.joint} />
      {/* 2R planar arm (shoulder → elbow → tool, in the arm plane) */}
      <Bone a={to3(pose.shoulder)} b={to3(pose.elbow)} color={armColor} />
      <Bone a={to3(pose.elbow)} b={to3(toolFloor)} color={armColor} />
      <Motor origin={pose.shoulder} axis={[0, 0, 1]} color={C.joint} />
      <Motor origin={pose.elbow} axis={[0, 0, 1]} color={C.joint} />
      {/* prismatic shaft dropping to the actual tool height, then the tool */}
      <Bone a={to3(toolFloor)} b={to3(pose.tool)} radius={0.045} color={C.joint} />
      <Ball at={pose.tool} r={0.1} color={C.tool} />

      {/* singular loci: outer circle (θ2=0) and inner circle (θ2=π) at arm height */}
      <Circle r={ws.outer} z={SCARA.baseH} color={C.boundary} />
      <Circle r={ws.inner} z={SCARA.baseH} color={C.boundary} dashed />
      <Html position={to3([ws.outer, 0, SCARA.baseH])} center style={{ pointerEvents: "none" }}>
        <Label color={C.boundary}>outer boundary · θ₂=0</Label>
      </Html>
      <Html position={to3([0, ws.inner, SCARA.baseH])} center style={{ pointerEvents: "none" }}>
        <Label color={C.boundary}>inner boundary · θ₂=π</Label>
      </Html>
    </>
  );
}

function SixDofRig({ theta, singular }: { theta: number[]; singular: boolean }) {
  const pose = sixDofFK(theta);
  const armColor = singular ? C.alert : C.link;
  const p = pose.points;
  return (
    <>
      {/* links between consecutive frame origins (zero-length ones self-skip) */}
      <Bone a={to3(p[0])} b={to3(p[1])} radius={0.11} color={C.joint} />
      <Bone a={to3(p[1])} b={to3(p[2])} color={armColor} />
      <Bone a={to3(p[2])} b={to3(p[3])} color={armColor} />
      <Bone a={to3(p[3])} b={to3(p[4])} color={armColor} />
      <Bone a={to3(p[4])} b={to3(p[5])} radius={0.05} color={armColor} />
      <Bone a={to3(p[5])} b={to3(p[6])} radius={0.045} color={C.joint} />
      {/* motors along each joint axis z_{i-1} */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Motor key={i} origin={pose.points[i]} axis={pose.zAxes[i]} color={C.joint} />
      ))}
      <Ball at={pose.wristCenter} r={0.08} color={C.wc} />
      <Ball at={pose.ee} r={0.1} color={C.tool} />
      <Html position={to3(pose.wristCenter)} center style={{ pointerEvents: "none" }}>
        <Label color={C.wc}>wrist centre</Label>
      </Html>
    </>
  );
}

function Scene({
  robot,
  scara,
  sixdof,
}: {
  robot: RobotKind;
  scara: ScaraState;
  sixdof: number[];
}) {
  const invalidate = useThree((s) => s.invalidate);
  const dom = useThree((s) => s.gl.domElement);
  const grid = useMemo(
    () => getComputedStyle(dom).getPropertyValue("--viz-grid").trim() || "#1e2a38",
    [dom],
  );

  const singular = useMemo(() => {
    if (robot === "scara") {
      const p = scaraFK(scara);
      return p.w / p.wMax < SINGULAR_FRACTION;
    }
    const p = sixDofFK(sixdof);
    return p.w / p.wMax < SINGULAR_FRACTION;
  }, [robot, scara, sixdof]);

  useEffect(() => invalidate(), [robot, scara, sixdof, grid, invalidate]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 4]} intensity={1.05} />
      <gridHelper args={[12, 24, grid, grid]} position={[0, 0, 0]} />
      <axesHelper args={[1.1]} />

      {robot === "scara" ? (
        <ScaraRig st={scara} singular={singular} />
      ) : (
        <SixDofRig theta={sixdof} singular={singular} />
      )}

      <OrbitControls
        makeDefault
        enableDamping={false}
        target={[0, 0.9, 0]}
        minDistance={3}
        maxDistance={22}
      />
    </>
  );
}

export default function SingularitiesScene({
  robot,
  scara,
  sixdof,
}: {
  robot: RobotKind;
  scara: ScaraState;
  sixdof: number[];
}) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [4.6, 3.8, 5.2], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
    >
      <Scene robot={robot} scara={scara} sixdof={sixdof} />
    </Canvas>
  );
}
