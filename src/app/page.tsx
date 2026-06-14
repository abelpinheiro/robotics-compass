import { Callout } from "@/components/lesson/Callout";
import { VizFrame } from "@/components/viz/VizFrame";

export default function Home() {
  return (
    <div className="lesson-prose">
      <p className="mb-2 text-sm font-medium tracking-wide text-accent uppercase">
        Robotics, visualized
      </p>
      <h1 className="text-[2rem] leading-tight font-semibold">
        Robotics Compass
      </h1>
      <p className="mt-3 text-lg text-muted">
        An interactive, visualization-first guide to robotics — broad across the
        field and deepest on path planning. Every topic carries a live,
        manipulable visualization.
      </p>

      <Callout variant="info" title="Early skeleton">
        This is the platform shell. The curriculum is being scaffolded as empty
        draft lessons; browse the areas in the sidebar. Interactive lessons and
        visualizations arrive next.
      </Callout>

      <h2>The shell, at a glance</h2>
      <p>
        The frame below is the container every visualization will live in —
        consistent border and spacing, a controls region, and a required text
        description for accessibility.
      </p>

      <VizFrame
        title="Visualization frame"
        caption="A placeholder frame; real 2D and 3D visualizations are wired in soon."
        textAlternative="A placeholder panel demonstrating the visualization frame: a bordered card with a titled header, a content area, an optional controls row, and this collapsible text description."
      >
        <div className="grid aspect-video place-items-center rounded-lg bg-surface-2 text-sm text-faint">
          Visualization goes here
        </div>
      </VizFrame>
    </div>
  );
}
