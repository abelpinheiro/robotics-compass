"use client";

import { useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import URDFLoader, { type URDFRobot } from "urdf-loader";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import type { Ellipsoid } from "./manipEllipsoid";

export interface UrdfArmConfig {
  urdfUrl: string;
  packages: Record<string, string>;
  jointNames: string[];
  cameraPosition: [number, number, number];
  target: [number, number, number];
  groundSize?: number;
  /** material colour for STL meshes (which carry no colour of their own) */
  stlColor?: number;
}

function Robot({ config, theta }: { config: UrdfArmConfig; theta: number[] }) {
  const invalidate = useThree((s) => s.invalidate);
  const [robot, setRobot] = useState<URDFRobot | null>(null);

  useEffect(() => {
    let disposed = false;
    const manager = new THREE.LoadingManager();
    manager.onLoad = () => {
      if (!disposed) invalidate();
    };
    const loader = new URDFLoader(manager);
    loader.packages = config.packages;
    const stlColor = config.stlColor ?? 0xc9ccd2;
    loader.loadMeshCb = (path, mgr, _material, onLoad) => {
      const fail = (err: unknown) => onLoad(new THREE.Object3D(), err instanceof Error ? err : new Error(String(err)));
      if (path.split("?")[0].toLowerCase().endsWith(".stl")) {
        new STLLoader(mgr).load(
          path,
          (geometry) => {
            geometry.computeVertexNormals();
            const mesh = new THREE.Mesh(
              geometry,
              new THREE.MeshStandardMaterial({ color: stlColor, metalness: 0.35, roughness: 0.55 }),
            );
            onLoad(mesh);
          },
          undefined,
          fail,
        );
      } else {
        new ColladaLoader(mgr).load(
          path,
          (collada) => onLoad(collada ? collada.scene : new THREE.Object3D()),
          undefined,
          fail,
        );
      }
    };
    loader.load(config.urdfUrl, (result) => {
      if (!disposed) setRobot(result);
    });
    return () => {
      disposed = true;
    };
  }, [config, invalidate]);

  useEffect(() => {
    if (!robot) return;
    config.jointNames.forEach((name, i) => robot.setJointValue(name, theta[i]));
    invalidate();
  }, [robot, theta, config.jointNames, invalidate]);

  if (!robot) return null;
  // URDF frames are z-up; rotate the whole robot to three's y-up.
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <primitive object={robot} />
    </group>
  );
}

function EllipsoidMesh({ e }: { e: Ellipsoid }) {
  const invalidate = useThree((s) => s.invalidate);
  const { pos, quat, scale } = useMemo(() => {
    const v0 = new THREE.Vector3(...e.axes[0]).normalize();
    const v1 = new THREE.Vector3(...e.axes[1]).normalize();
    const v2 = new THREE.Vector3().crossVectors(v0, v1).normalize();
    const m = new THREE.Matrix4().makeBasis(v0, v1, v2);
    return {
      pos: new THREE.Vector3(...e.center),
      quat: new THREE.Quaternion().setFromRotationMatrix(m),
      scale: new THREE.Vector3(e.radii[0], e.radii[1], e.radii[2]),
    };
  }, [e]);
  useEffect(() => invalidate(), [pos, quat, scale, invalidate]);
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh position={pos} quaternion={quat} scale={scale}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial color="#34d399" transparent opacity={0.28} depthWrite={false} emissive="#34d399" emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}

function Scene({ config, theta, ellipsoid }: { config: UrdfArmConfig; theta: number[]; ellipsoid?: Ellipsoid | null }) {
  const dom = useThree((s) => s.gl.domElement);
  const grid = useMemo(
    () => getComputedStyle(dom).getPropertyValue("--viz-grid").trim() || "#1e2a38",
    [dom],
  );
  const size = config.groundSize ?? 6;
  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[5, 8, 5]} intensity={1.3} />
      <directionalLight position={[-4, 3, -4]} intensity={0.4} />
      <gridHelper args={[size, size * 2, grid, grid]} position={[0, 0, 0]} />
      <Robot config={config} theta={theta} />
      {ellipsoid && <EllipsoidMesh e={ellipsoid} />}
      <OrbitControls makeDefault enableDamping={false} target={config.target} minDistance={0.8} maxDistance={12} />
    </>
  );
}

export default function UrdfArmScene({ config, theta, ellipsoid }: { config: UrdfArmConfig; theta: number[]; ellipsoid?: Ellipsoid | null }) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: config.cameraPosition, fov: 45 }}
      gl={{ alpha: true, antialias: true }}
    >
      <Scene config={config} theta={theta} ellipsoid={ellipsoid} />
    </Canvas>
  );
}
