"use client";

import { useEffect, useRef, useState } from "react";
import { Viz3D } from "@/components/viz/Viz3D";
import { VizFrame } from "@/components/viz/VizFrame";
import { MatrixDisplay } from "@/components/viz/MatrixDisplay";
import { TransformLabel } from "@/components/viz/TransformLabel";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import FKArmScene, { TCP_COLOR } from "./FKArmScene";
import { dhTable, linkMatrices, toDeg, toRad } from "./fkMath";
import type { Mat4, P3, Pose } from "./fkMath";
import { fkStrings } from "./strings";

const fmt = (n: number) => (Math.abs(n) < 5e-3 ? 0 : n).toFixed(2);
const fmtDeg = (rad: number) => `${Math.round(toDeg(rad)) || 0}°`;

const HOME: Pose = { t1: 0, t2: 0, t3: 0 };
const POSE_A: Pose = { t1: 40, t2: -50, t3: 80 };
const POSE_B: Pose = { t1: -65, t2: -20, t3: 110 };
const TRAIL_CAP = 400;

// Frame names of the chain {0} → {1} → {2} → {3} → {T}.
const FRAMES = ["0", "1", "2", "3", "T"];

function Slider({
  label,
  value,
  valueText,
  onChange,
}: {
  label: string;
  value: number;
  valueText: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span className="w-28">{label}</span>
      <input
        type="range"
        min={-180}
        max={180}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-accent"
        aria-valuetext={valueText}
      />
      <span className="w-12 tabular-nums text-foreground">{value}°</span>
    </label>
  );
}

function LabeledMatrix({
  from,
  to,
  rows,
  ariaLabel,
}: {
  from: string;
  to: string;
  rows: Mat4;
  ariaLabel: string;
}) {
  return (
    <span className="flex items-center gap-1.5 text-muted">
      <span className="whitespace-nowrap">
        <TransformLabel from={from} to={to} /> =
      </span>
      <MatrixDisplay rows={rows} ariaLabel={ariaLabel} />
    </span>
  );
}

export default function FKArmViz() {
  const { locale, t } = useLocale();
  const s = fkStrings[locale];
  const [pose, setPose] = useState<Pose>(HOME);
  const [trail, setTrail] = useState<P3[]>([]);
  const animRef = useRef<number | null>(null);

  const { T01, T12, T23, T3T, T0T } = linkMatrices(pose);
  const links = [T01, T12, T23, T3T];
  const tcp: P3 = [T0T[0][3], T0T[1][3], T0T[2][3]];

  const stopAnim = () => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  };
  useEffect(() => stopAnim, []);

  // Apply a pose and append the resulting TCP to the trail. Done here (not in an
  // effect) so the trail records both manual and animated moves.
  const applyPose = (next: Pose) => {
    setPose(next);
    const T = linkMatrices(next).T0T;
    const p: P3 = [T[0][3], T[1][3], T[2][3]];
    setTrail((prev) => {
      const last = prev[prev.length - 1];
      if (last && Math.hypot(p[0] - last[0], p[1] - last[1], p[2] - last[2]) < 0.03)
        return prev;
      const t = [...prev, p];
      return t.length > TRAIL_CAP ? t.slice(t.length - TRAIL_CAP) : t;
    });
  };

  const setManual = (patch: Partial<Pose>) => {
    stopAnim();
    applyPose({ ...pose, ...patch });
  };

  const animateTo = (target: Pose) => {
    stopAnim();
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      applyPose(target);
      return;
    }
    const start = pose;
    const dur = 1400;
    const t0 = performance.now();
    const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = ease(k);
      applyPose({
        t1: Math.round(start.t1 + (target.t1 - start.t1) * e),
        t2: Math.round(start.t2 + (target.t2 - start.t2) * e),
        t3: Math.round(start.t3 + (target.t3 - start.t3) * e),
      });
      animRef.current = k < 1 ? requestAnimationFrame(step) : null;
    };
    animRef.current = requestAnimationFrame(step);
  };

  const reset = () => {
    stopAnim();
    setPose(HOME);
    setTrail([]);
  };

  const description = s.description({
    t1: pose.t1,
    t2: pose.t2,
    t3: pose.t3,
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
          <Slider label={`θ₁ (${s.base})`} value={pose.t1} valueText={s.degrees(pose.t1)} onChange={(v) => setManual({ t1: v })} />
          <Slider label={`θ₂ (${s.shoulder})`} value={pose.t2} valueText={s.degrees(pose.t2)} onChange={(v) => setManual({ t2: v })} />
          <Slider label={`θ₃ (${s.elbow})`} value={pose.t3} valueText={s.degrees(pose.t3)} onChange={(v) => setManual({ t3: v })} />
          <span className="mx-1 h-6 w-px bg-border" />
          <button type="button" onClick={() => animateTo(POSE_A)} className={btn}>
            {s.poseA}
          </button>
          <button type="button" onClick={() => animateTo(POSE_B)} className={btn}>
            {s.poseB}
          </button>
          <button type="button" onClick={reset} className={btn}>
            {t.viz.reset}
          </button>
        </>
      }
    >
      <Viz3D aspectRatio={16 / 10}>
        <FKArmScene t1={toRad(pose.t1)} t2={toRad(pose.t2)} t3={toRad(pose.t3)} trail={trail} />
      </Viz3D>

      <div className="mt-3 space-y-3 overflow-x-auto text-sm">
        <table className="font-mono text-xs tabular-nums">
          <caption className="mb-1 text-left font-sans text-sm text-muted">{s.dhTable}</caption>
          <thead className="text-muted">
            <tr className="border-b border-border">
              <th scope="col" className="px-2 py-1 text-left font-sans font-medium">{s.frame}</th>
              <th scope="col" className="px-2 py-1 font-medium">α<sub>i−1</sub></th>
              <th scope="col" className="px-2 py-1 font-medium">a<sub>i−1</sub></th>
              <th scope="col" className="px-2 py-1 font-medium">d<sub>i</sub></th>
              <th scope="col" className="px-2 py-1 font-medium">θ<sub>i</sub></th>
            </tr>
          </thead>
          <tbody className="text-foreground">
            {dhTable(pose).map((row, i) => (
              <tr key={FRAMES[i + 1]}>
                <th scope="row" className="px-2 py-0.5 text-left font-medium">{`{${FRAMES[i + 1]}}`}</th>
                <td className="px-2 py-0.5 text-right">{fmtDeg(row.alpha)}</td>
                <td className="px-2 py-0.5 text-right">{fmt(row.a)}</td>
                <td className="px-2 py-0.5 text-right">{fmt(row.d)}</td>
                <td className="px-2 py-0.5 text-right">{fmtDeg(row.theta)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {links.map((rows, i) => (
            <LabeledMatrix
              key={FRAMES[i + 1]}
              from={FRAMES[i]}
              to={FRAMES[i + 1]}
              rows={rows}
              ariaLabel={s.transformName(FRAMES[i], FRAMES[i + 1])}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="whitespace-nowrap text-muted">
            <TransformLabel from="0" to="T" /> = <TransformLabel from="0" to="1" />·
            <TransformLabel from="1" to="2" />·<TransformLabel from="2" to="3" />·
            <TransformLabel from="3" to="T" /> =
          </span>
          <MatrixDisplay
            rows={T0T}
            highlightCol={3}
            highlightColor={TCP_COLOR}
            ariaLabel={s.transformName("0", "T")}
          />
        </div>
        <div>
          <span className="text-muted">{s.tcpPosition} </span>
          <span className="font-mono font-semibold tabular-nums" style={{ color: TCP_COLOR }}>
            (x, y, z) = ({fmt(tcp[0])}, {fmt(tcp[1])}, {fmt(tcp[2])})
          </span>
        </div>
      </div>
    </VizFrame>
  );
}
