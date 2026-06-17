import { Callout } from "@/components/lesson/Callout";
import { StudyRoadmap } from "@/components/StudyRoadmap";

export default function Home() {
  return (
    <div>
      <div className="lesson-prose">
        <p className="mb-2 text-sm font-medium tracking-wide text-accent uppercase">
          Robotics, visualized
        </p>
        <h1 className="text-[2rem] leading-tight font-semibold">
          Robotics Compass
        </h1>
        <p className="mt-3 text-lg text-muted">
          An interactive, visualization-first guide to robotics — broad across
          the field and deepest on path planning. Every topic carries a live,
          manipulable visualization.
        </p>

        <Callout variant="info" title="Early skeleton">
          The curriculum is being authored as draft lessons. Browse the areas in
          the sidebar, or follow the suggested learning path below — it is
          ordered by each topic&rsquo;s prerequisites.
        </Callout>
      </div>

      <div className="mt-10">
        <StudyRoadmap />
      </div>
    </div>
  );
}
