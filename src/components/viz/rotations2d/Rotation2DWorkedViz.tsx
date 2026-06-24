"use client";

import { useState } from "react";
import { Viz3D } from "@/components/viz/Viz3D";
import { VizFrame } from "@/components/viz/VizFrame";
import { MatrixDisplay } from "@/components/viz/MatrixDisplay";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import Rotation2DWorkedScene from "./Rotation2DWorkedScene";

const WALL = 2;
const fmt = (n: number) => (Math.abs(n) < 1e-9 ? 0 : n).toFixed(2);

export default function Rotation2DWorkedViz() {
  const { t } = useLocale();
  const [deg, setDeg] = useState(90);
  const theta = (deg * Math.PI) / 180;
  const c = Math.cos(theta);
  const s = Math.sin(theta);

  // 2D mapping from the lesson: ^A P = R(θ) · [WALL, 0].
  const apx = WALL * c;
  const apy = WALL * s;

  const description =
    `A 3D view of the worked example: frames {A} (room) and {B} (robot) share an origin; ` +
    `{B} is rotated by θ = ${deg}° about the vertical axis. The wall point P is ${WALL} m forward ` +
    `in {B} (^B P = [${WALL}, 0]). Its room coordinates are ^A P = R(θ)·[${WALL}, 0] = ` +
    `[${fmt(apx)}, ${fmt(apy)}]; at θ = 90° this is [0, 2]. Drag to orbit.`;

  return (
    <VizFrame
      title="Worked example: the wall point as the robot turns"
      caption="Turn θ to 90° to get ᴬP = [0, 2]. Drag to orbit."
      textAlternative={description}
      controls={
        <label className="flex items-center gap-2 text-sm text-muted">
          {t.viz.angle}
          <input
            type="range"
            min={0}
            max={180}
            step={1}
            value={deg}
            onChange={(e) => setDeg(Number(e.target.value))}
            className="accent-accent"
            aria-valuetext={`${deg} degrees`}
          />
          <span className="w-12 tabular-nums text-foreground">{deg}°</span>
        </label>
      }
    >
      <Viz3D aspectRatio={16 / 10}>
        <Rotation2DWorkedScene theta={theta} />
      </Viz3D>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="flex items-center gap-2 text-muted">
          R(θ)
          <MatrixDisplay
            rows={[
              [c, -s],
              [s, c],
            ]}
            ariaLabel="rotation matrix"
          />
        </span>
        <span className="text-muted">
          ᴮP:{" "}
          <span className="font-mono tabular-nums text-foreground">
            [{WALL}, 0]ᵀ
          </span>
        </span>
        <span className="text-muted">
          ᴬP = R(θ) ᴮP:{" "}
          <span className="font-mono tabular-nums text-foreground">
            [{fmt(apx)}, {fmt(apy)}]ᵀ
          </span>
        </span>
      </div>
    </VizFrame>
  );
}
