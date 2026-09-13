import type { UrdfArmConfig } from "@/components/playground/UrdfArmScene";
import { UR20_JOINT_NAMES } from "@/components/playground/ur20Math";

// Shared scene config for the UR20 lesson visualizations (same official mesh as
// the playground, loaded via urdf-loader).
export const UR20_CONFIG: UrdfArmConfig = {
  urdfUrl: "/models/ur20/ur20.urdf",
  packages: { ur20: "/models/ur20" },
  jointNames: UR20_JOINT_NAMES,
  cameraPosition: [2.4, 1.8, 2.6],
  target: [0, 0.55, 0],
  groundSize: 6,
};
