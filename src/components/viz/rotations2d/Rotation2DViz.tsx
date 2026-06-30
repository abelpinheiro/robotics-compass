"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Viz2D } from "@/components/viz/Viz2D";
import { VizFrame } from "@/components/viz/VizFrame";
import { MatrixDisplay } from "@/components/viz/MatrixDisplay";
import { useLocale } from "@/lib/i18n/LocaleProvider";

// A point fixed in the rotating frame {B}; we watch its world coordinates change.
const P_BODY = { x: 1.6, y: 0.6 };
const fmt = (n: number) => (Math.abs(n) < 1e-9 ? 0 : n).toFixed(2);

interface Point {
  x: number;
  y: number;
}

function RotationCanvas({
  width,
  height,
  theta,
  pBody,
}: {
  width: number;
  height: number;
  theta: number; // radians
  pBody: Point;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
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
    // Fall back to the light-theme token values if the stylesheet has not
    // applied yet on the very first paint (avoids a blank canvas on cold loads).
    const tok = (n: string, fb: string) => s.getPropertyValue(n).trim() || fb;
    const colors = {
      grid: tok("--viz-grid", "#e3e6eb"),
      faint: tok("--faint", "#9aa1ac"),
      muted: tok("--muted", "#5b6472"),
      x: tok("--success", "#16a34a"),
      y: tok("--danger", "#e2675f"),
      p: tok("--accent", "#2563eb"),
      fg: tok("--foreground", "#1a1f2b"),
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
    const r = Math.hypot(pBody.x, pBody.y);
    ctx.strokeStyle = colors.faint;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // P = R·p_body
    const pwx = c * pBody.x - sn * pBody.y;
    const pwy = sn * pBody.x + c * pBody.y;
    arrow(pwx, pwy, colors.p, "P", 2.5);
    ctx.fillStyle = colors.p;
    ctx.beginPath();
    ctx.arc(X(pwx), Y(pwy), 4.5, 0, Math.PI * 2);
    ctx.fill();
  }, [width, height, theta, pBody]);

  // Paint synchronously with the committed layout (before the browser paints),
  // then once more on the next frame as a safety net for cold loads where
  // styles/layout have not fully settled — without needing user interaction.
  useLayoutEffect(() => {
    draw();
    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, [draw]);

  return (
    <canvas
      ref={ref}
      style={{ width, height }}
      className="touch-none"
      aria-hidden="true"
    />
  );
}

export default function Rotation2DViz({
  pBody = P_BODY,
  initialDeg = 35,
  title = "Rotation in 2D",
  caption = "Rotate the frame with the slider; watch the point's world coordinates.",
}: {
  pBody?: Point;
  initialDeg?: number;
  title?: string;
  caption?: string;
} = {}) {
  const { t } = useLocale();
  const [deg, setDeg] = useState(initialDeg);
  const theta = (deg * Math.PI) / 180;
  const c = Math.cos(theta);
  const sn = Math.sin(theta);
  const pwx = c * pBody.x - sn * pBody.y;
  const pwy = sn * pBody.x + c * pBody.y;

  const description =
    `A 2D rotation by θ = ${deg}°. The world axes x, y are fixed; the frame {B} ` +
    `(axes x̂_B, ŷ_B) is rotated by θ. A point fixed in {B} at body coordinates ` +
    `(${fmt(pBody.x)}, ${fmt(pBody.y)}) has world coordinates ` +
    `(${fmt(pwx)}, ${fmt(pwy)}) = R(θ)·p, tracing a circle as θ changes. ` +
    `R(θ) = [[cos θ, −sin θ], [sin θ, cos θ]].`;

  return (
    <VizFrame
      title={title}
      caption={caption}
      textAlternative={description}
      controls={
        <label className="flex items-center gap-2 text-sm text-muted">
          {t.viz.angle}
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
          <RotationCanvas
            width={width}
            height={height}
            theta={theta}
            pBody={pBody}
          />
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
          ᴮP:{" "}
          <span className="font-mono tabular-nums text-foreground">
            [{fmt(pBody.x)}, {fmt(pBody.y)}]ᵀ
          </span>
        </span>
        <span className="text-muted">
          ᴬP = R(θ) ᴮP:{" "}
          <span className="font-mono tabular-nums text-foreground">
            [{fmt(pwx)}, {fmt(pwy)}]ᵀ
          </span>
        </span>
      </div>
    </VizFrame>
  );
}
