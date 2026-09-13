import type { Metadata } from "next";
import PlaygroundEmbed from "@/components/playground/PlaygroundEmbed";

export const metadata: Metadata = {
  title: "Playground",
  description: "A free-roam robot-arm simulator: pose a 6-DOF or SCARA manipulator and watch its forward kinematics, Jacobian manipulability, and singularities in real time.",
};

// A dedicated dark-themed simulator page (Golden rule 2 reserves the dark theme
// for playground pages). Rendered as a full-screen overlay by the client
// component, so it sits above the light reading shell.
export default function PlaygroundPage() {
  return <PlaygroundEmbed />;
}
