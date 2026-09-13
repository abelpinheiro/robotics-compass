"use client";

import { useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import URDFLoader, { type URDFRobot } from "urdf-loader";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js";
import { UR20_JOINT_NAMES } from "./ur20Math";

function Robot({ theta }: { theta: number[] }) {
  const invalidate = useThree((s) => s.invalidate);
  const [robot, setRobot] = useState<URDFRobot | null>(null);

  // Load the URDF once (meshes via ColladaLoader, sharing the LoadingManager so
  // we know when textures finish and can request a redraw under frameloop=demand).
  useEffect(() => {
    let disposed = false;
    const manager = new THREE.LoadingManager();
    manager.onLoad = () => {
      if (!disposed) invalidate();
    };
    const loader = new URDFLoader(manager);
    loader.packages = { ur20: "/models/ur20" };
    loader.loadMeshCb = (path, mgr, _material, onLoad) => {
      new ColladaLoader(mgr).load(
        path,
        (collada) => onLoad(collada ? collada.scene : new THREE.Object3D()),
        undefined,
        (err) => onLoad(new THREE.Object3D(), err instanceof Error ? err : new Error(String(err))),
      );
    };
    loader.load("/models/ur20/ur20.urdf", (result) => {
      if (!disposed) setRobot(result);
    });
    return () => {
      disposed = true;
    };
  }, [invalidate]);

  // Drive the joints from the sliders.
  useEffect(() => {
    if (!robot) return;
    UR20_JOINT_NAMES.forEach((name, i) => robot.setJointValue(name, theta[i]));
    invalidate();
  }, [robot, theta, invalidate]);

  if (!robot) return null;
  // URDF frames are z-up; rotate the whole robot to three's y-up.
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <primitive object={robot} />
    </group>
  );
}

function Scene({ theta }: { theta: number[] }) {
  const dom = useThree((s) => s.gl.domElement);
  const grid = useMemo(
    () => getComputedStyle(dom).getPropertyValue("--viz-grid").trim() || "#1e2a38",
    [dom],
  );
  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[5, 8, 5]} intensity={1.3} />
      <directionalLight position={[-4, 3, -4]} intensity={0.4} />
      <gridHelper args={[6, 12, grid, grid]} position={[0, 0, 0]} />
      <Robot theta={theta} />
      <OrbitControls makeDefault enableDamping={false} target={[0, 0.55, 0]} minDistance={1.4} maxDistance={12} />
    </>
  );
}

export default function UR20Scene({ theta }: { theta: number[] }) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [2.4, 1.8, 2.6], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
    >
      <Scene theta={theta} />
    </Canvas>
  );
}
