"use client";

import { useEffect, useRef, useState } from "react";
import { Viz2D } from "@/components/viz/Viz2D";
import { VizFrame } from "@/components/viz/VizFrame";
import { MatrixDisplay } from "@/components/viz/MatrixDisplay";

// A point fixed in the rotating frame {B}; we watch its world coordinates change.
const P_BODY = { x: 1.6, y: 0.6 };
const fmt = (n: number) => (Math.abs(n) < 1e-9 ? 0 : n).toFixed(2);

function RotationCanvas({
  width,
  height,
  theta,
}: {
  width: number;
  height: number;
  theta: number; // radians
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || width <= 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const s = getComputedStyle(canvas);
    const tok = (n: string) => s.getPropertyValue(n).trim();
    const colors = {
      grid: tok("--viz-grid"),
      faint: tok("--faint"),
      muted: tok("--muted"),
      x: tok("--success"),
      y: tok("--danger"),
      p: tok("--accent"),
      fg: tok("--foreground"),
    };

    const cx = width / 2;
    const cy = height / 2;
    const scale = Math.min(width, height) * 0.16; // px per world unit
    const X = (x: number) => cx + x * scale;
    const Y = (y: number) => cy - y * scale;

    // unit grid
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    const ux = Math.ceil(cx / scale);
    const uy = Math.ceil(cy / scale);
    ctx.beginPath();
    for (let i = -ux; i <= ux; i++) {
      ctx.moveTo(X(i), 0);
      ctx.lineTo(X(i), height);
    }
    for (let j = -uy; j <= uy; j++) {
      ctx.moveTo(0, Y(j));
      ctx.lineTo(width, Y(j));
    }
    ctx.stroke();

    const arrow = (
      tx: number,
      ty: number,
      color: string,
      label?: string,
      width_ = 2,
    ) => {
      const x1 = X(tx);
      const y1 = Y(ty);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = width_;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      const ang = Math.atan2(y1 - cy, x1 - cx);
      const h = 9;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - h * Math.cos(ang - 0.4), y1 - h * Math.sin(ang - 0.4));
      ctx.lineTo(x1 - h * Math.cos(ang + 0.4), y1 - h * Math.sin(ang + 0.4));
      ctx.closePath();
      ctx.fill();
      if (label) {
        ctx.fillStyle = color;
        ctx.font = "600 12px ui-sans-serif, system-ui, sans-serif";
        ctx.fillText(label, x1 + 6, y1 - 6);
      }
    };

    const c = Math.cos(theta);
    const sn = Math.sin(theta);

    // world axes (faint)
    arrow(2.4, 0, colors.faint, "x", 1.5);
    arrow(0, 2.4, colors.faint, "y", 1.5);

    // angle arc from +x to x̂_B
    ctx.strokeStyle = colors.muted;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const a = (theta * i) / steps;
      const px = cx + Math.cos(a) * scale * 0.9;
      const py = cy - Math.sin(a) * scale * 0.9;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // rotated frame axes
    arrow(c * 1.8, sn * 1.8, colors.x, "x̂_B");
    arrow(-sn * 1.4, c * 1.4, colors.y, "ŷ_B");

    // circle traced by P
    const r = Math.hypot(P_BODY.x, P_BODY.y);
    ctx.strokeStyle = colors.faint;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // P = R·p_body
    const pwx = c * P_BODY.x - sn * P_BODY.y;
    const pwy = sn * P_BODY.x + c * P_BODY.y;
    arrow(pwx, pwy, colors.p, "P", 2.5);
    ctx.fillStyle = colors.p;
    ctx.beginPath();
    ctx.arc(X(pwx), Y(pwy), 4.5, 0, Math.PI * 2);
    ctx.fill();
  }, [width, height, theta]);

  return (
    <canvas
      ref={ref}
      style={{ width, height }}
      className="touch-none"
      aria-hidden="true"
    />
  );
}

export default function Rotation2DViz() {
  const [deg, setDeg] = useState(35);
  const theta = (deg * Math.PI) / 180;
  const c = Math.cos(theta);
  const sn = Math.sin(theta);
  const pwx = c * P_BODY.x - sn * P_BODY.y;
  const pwy = sn * P_BODY.x + c * P_BODY.y;

  const description =
    `A 2D rotation by θ = ${deg}°. The world axes x, y are fixed; the frame {B} ` +
    `(axes x̂_B, ŷ_B) is rotated by θ. A point fixed in {B} at body coordinates ` +
    `(${fmt(P_BODY.x)}, ${fmt(P_BODY.y)}) has world coordinates ` +
    `(${fmt(pwx)}, ${fmt(pwy)}) = R(θ)·p, tracing a circle as θ changes. ` +
    `R(θ) = [[cos θ, −sin θ], [sin θ, cos θ]].`;

  return (
    <VizFrame
      title="Rotation in 2D"
      caption="Rotate the frame with the slider; watch the point's world coordinates."
      textAlternative={description}
      controls={
        <label className="flex items-center gap-2 text-sm text-muted">
          Angle θ
          <input
            type="range"
            min={-180}
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
      <Viz2D aspectRatio={1.4}>
        {({ width, height }) => (
          <RotationCanvas width={width} height={height} theta={theta} />
        )}
      </Viz2D>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="flex items-center gap-2 text-muted">
          R(θ)
          <MatrixDisplay
            rows={[
              [c, -sn],
              [sn, c],
            ]}
            ariaLabel="rotation matrix"
          />
        </span>
        <span className="text-muted">
          P world:{" "}
          <span className="font-mono tabular-nums text-foreground">
            [{fmt(pwx)}, {fmt(pwy)}]ᵀ
          </span>
        </span>
      </div>
    </VizFrame>
  );
}
