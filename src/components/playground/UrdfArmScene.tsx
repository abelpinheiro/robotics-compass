"use client";

import { useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import URDFLoader, { type URDFRobot } from "urdf-loader";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js";

export interface UrdfArmConfig {
  urdfUrl: string;
  packages: Record<string, string>;
  jointNames: string[];
  cameraPosition: [number, number, number];
  target: [number, number, number];
  groundSize?: number;
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
    loader.loadMeshCb = (path, mgr, _material, onLoad) => {
      new ColladaLoader(mgr).load(
        path,
        (collada) => onLoad(collada ? collada.scene : new THREE.Object3D()),
        undefined,
        (err) => onLoad(new THREE.Object3D(), err instanceof Error ? err : new Error(String(err))),
      );
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

function Scene({ config, theta }: { config: UrdfArmConfig; theta: number[] }) {
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
      <OrbitControls makeDefault enableDamping={false} target={config.target} minDistance={0.8} maxDistance={12} />
    </>
  );
}

export default function UrdfArmScene({ config, theta }: { config: UrdfArmConfig; theta: number[] }) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: config.cameraPosition, fov: 45 }}
      gl={{ alpha: true, antialias: true }}
    >
      <Scene config={config} theta={theta} />
    </Canvas>
  );
}
