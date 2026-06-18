"use client";

import { Viz3D } from "@/components/viz/Viz3D";
import { VizFrame } from "@/components/viz/VizFrame";
import VectorAdditionScene from "./VectorAdditionScene";

function Row({
  swatch,
  label,
  value,
}: {
  swatch: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${swatch}`} />
      <span className="text-muted">{label}</span>
      <span className="font-mono tabular-nums text-foreground">{value}</span>
    </div>
  );
}

export default function VectorAdditionViz() {
  const description =
    "The worked example in 3D: frame {B} is displaced 2 m along the X-axis of {A} with the " +
    "same orientation. The part P sits at ^B P = [0, 1, 3] in {B}. Because the frames are " +
    "aligned, the head-to-tail sum of ^A P_BORG = [2, 0, 0] and ^B P = [0, 1, 3] gives " +
    "^A P = [2, 1, 3] — the position of the same physical point in {A}.";

  return (
    <VizFrame
      title="Worked example: mapping a point between aligned frames"
      caption="^A P_BORG (to {B}) + ^B P (to the part) = ^A P. Drag to orbit."
      textAlternative={description}
    >
      <Viz3D aspectRatio={16 / 10}>
        <VectorAdditionScene />
      </Viz3D>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <Row swatch="bg-accent" label="ᴬP_BORG =" value="[2, 0, 0]ᵀ" />
        <Row swatch="bg-success" label="ᴮP =" value="[0, 1, 3]ᵀ" />
        <Row swatch="bg-warning" label="ᴬP = ᴬP_BORG + ᴮP =" value="[2, 1, 3]ᵀ" />
      </div>
    </VizFrame>
  );
}
