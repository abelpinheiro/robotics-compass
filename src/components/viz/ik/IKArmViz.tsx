"use client";

import { useEffect, useRef, useState } from "react";
import { Viz3D } from "@/components/viz/Viz3D";
import { VizFrame } from "@/components/viz/VizFrame";
import { MatrixDisplay } from "@/components/viz/MatrixDisplay";
import { TransformLabel } from "@/components/viz/TransformLabel";
import FKArmScene, { TCP_COLOR } from "@/components/viz/fk/FKArmScene";
import { fkTCP, linkMatrices, toRad } from "@/components/viz/fk/fkMath";
import type { P3 } from "@/components/viz/fk/fkMath";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { solveIK } from "./ikMath";
import type { Elbow } from "./ikMath";
import { ikStrings } from "./strings";

const fmt = (n: number) => (Math.abs(n) < 5e-3 ? 0 : n).toFixed(2);
const deg = (n: number) => `${Math.round(n)}°`;

// Reachable preset targets and the workspace-sized slider ranges.
const HOME_TARGET: P3 = [2.0, 0, 1.2];
const TARGET_A: P3 = [1.5, 0.6, 1.8];
const TARGET_B: P3 = [-0.8, 1.2, 0.6];
const XY_MIN = -2.3, XY_MAX = 2.3;
const Z_MIN = -1.0, Z_MAX = 3.5;
const TRAIL_CAP = 400;

function AxisSlider({
  label,
  value,
  valueText,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  valueText: string;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span className="w-24">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-accent"
        aria-valuetext={valueText}
      />
      <span className="w-16 tabular-nums text-foreground">{value.toFixed(2)} m</span>
    </label>
  );
}

export default function IKArmViz() {
  const { locale, t } = useLocale();
  const s = ikStrings[locale];
  const [target, setTarget] = useState<P3>(HOME_TARGET);
  const [elbow, setElbow] = useState<Elbow>("down");
  const [trail, setTrail] = useState<P3[]>([]);
  const animRef = useRef<number | null>(null);

  const sol = solveIK(target, elbow);
  const { T0T } = linkMatrices(sol.pose);
  const tcp: P3 = [T0T[0][3], T0T[1][3], T0T[2][3]];

  const stopAnim = () => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  };
  useEffect(() => stopAnim, []);

  // Apply a target and append the arm's actual TCP to the trail. Done here (not
  // in an effect) so the trail records manual, animated, and clamped moves.
  const applyTarget = (next: P3) => {
    setTarget(next);
    const p = fkTCP(solveIK(next, elbow).pose);
    setTrail((prev) => {
      const last = prev[prev.length - 1];
      if (last && Math.hypot(p[0] - last[0], p[1] - last[1], p[2] - last[2]) < 0.03)
        return prev;
      const t = [...prev, p];
      return t.length > TRAIL_CAP ? t.slice(t.length - TRAIL_CAP) : t;
    });
  };

  const setAxis = (idx: 0 | 1 | 2, v: number) => {
    stopAnim();
    const next: P3 = [target[0], target[1], target[2]];
    next[idx] = v;
    applyTarget(next);
  };

  const chooseElbow = (e: Elbow) => {
    stopAnim();
    setElbow(e);
  };

  const animateTo = (dest: P3) => {
    stopAnim();
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      applyTarget(dest);
      return;
    }
    const start = target;
    const dur = 1400;
    const t0 = performance.now();
    const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = ease(k);
      applyTarget([
        start[0] + (dest[0] - start[0]) * e,
        start[1] + (dest[1] - start[1]) * e,
        start[2] + (dest[2] - start[2]) * e,
      ]);
      animRef.current = k < 1 ? requestAnimationFrame(step) : null;
    };
    animRef.current = requestAnimationFrame(step);
  };

  const reset = () => {
    stopAnim();
    setTarget(HOME_TARGET);
    setElbow("down");
    setTrail([]);
  };

  const description = s.description({
    target: `(${fmt(target[0])}, ${fmt(target[1])}, ${fmt(target[2])})`,
    reachable: sol.reachable,
    t1: deg(sol.pose.t1),
    t2: deg(sol.pose.t2),
    t3: deg(sol.pose.t3),
    elbowUp: elbow === "up",
    tcp: `(${fmt(tcp[0])}, ${fmt(tcp[1])}, ${fmt(tcp[2])})`,
  });

  const btn =
    "rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-2";

  return (
    <VizFrame
      title={s.title}
      caption={s.caption}
      textAlternative={description}
      controls={
        <>
          <AxisSlider label={s.targetAxis("x")} value={target[0]} valueText={s.meters(target[0].toFixed(2))} min={XY_MIN} max={XY_MAX} onChange={(v) => setAxis(0, v)} />
          <AxisSlider label={s.targetAxis("y")} value={target[1]} valueText={s.meters(target[1].toFixed(2))} min={XY_MIN} max={XY_MAX} onChange={(v) => setAxis(1, v)} />
          <AxisSlider label={s.targetAxis("z")} value={target[2]} valueText={s.meters(target[2].toFixed(2))} min={Z_MIN} max={Z_MAX} onChange={(v) => setAxis(2, v)} />
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="w-24">{s.elbow}</span>
            <div className="inline-flex overflow-hidden rounded-md border border-border">
              {(["up", "down"] as Elbow[]).map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => chooseElbow(e)}
                  aria-pressed={elbow === e}
                  className="px-3 py-1 text-sm text-foreground hover:bg-surface-2"
                  style={elbow === e ? { backgroundColor: "var(--accent)", color: "var(--background)" } : undefined}
                >
                  {e === "up" ? s.up : s.down}
                </button>
              ))}
            </div>
          </div>
          <span className="mx-1 h-6 w-px bg-border" />
          <button type="button" onClick={() => animateTo(TARGET_A)} className={btn}>
            {s.targetA}
          </button>
          <button type="button" onClick={() => animateTo(TARGET_B)} className={btn}>
            {s.targetB}
          </button>
          <button type="button" onClick={reset} className={btn}>
            {t.viz.reset}
          </button>
        </>
      }
    >
      <Viz3D aspectRatio={16 / 10}>
        <FKArmScene
          t1={toRad(sol.pose.t1)}
          t2={toRad(sol.pose.t2)}
          t3={toRad(sol.pose.t3)}
          trail={trail}
          target={target}
          targetReachable={sol.reachable}
        />
      </Viz3D>

      <div className="mt-3 space-y-3 overflow-x-auto text-sm">
        <div>
          <span className="text-muted">{s.target} </span>
          <span className="font-mono font-semibold tabular-nums" style={{ color: TCP_COLOR }}>
            (x, y, z) = ({fmt(target[0])}, {fmt(target[1])}, {fmt(target[2])})
          </span>
          {sol.reachable ? (
            <span className="ml-2 text-muted"> {s.inReach}</span>
          ) : (
            <span className="ml-2 font-medium" style={{ color: "var(--danger)" }}>
              {s.outOfReach}
            </span>
          )}
        </div>
        <div>
          <span className="text-muted">{s.solvedAngles} </span>
          <span className="font-mono font-semibold tabular-nums text-foreground">
            θ = ({deg(sol.pose.t1)}, {deg(sol.pose.t2)}, {deg(sol.pose.t3)})
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="whitespace-nowrap text-muted">
            <TransformLabel from="0" to="T" /> = FK(θ) =
          </span>
          <MatrixDisplay
            rows={T0T}
            highlightCol={3}
            highlightColor={TCP_COLOR}
            ariaLabel={s.fkCheckAria}
          />
          <span className="text-muted"> {s.lastColumnReturnsTarget}</span>
        </div>
      </div>
    </VizFrame>
  );
}
