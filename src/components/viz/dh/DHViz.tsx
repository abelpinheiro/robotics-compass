"use client";

import { useState } from "react";
import { Viz3D } from "@/components/viz/Viz3D";
import { VizFrame } from "@/components/viz/VizFrame";
import { MatrixDisplay } from "@/components/viz/MatrixDisplay";
import DHParamScene from "./DHParamScene";
import DHArmScene from "./DHArmScene";

type Mode = "arm" | "transform";
type Mat4 = number[][];
interface Params {
  theta: number; // degrees
  d: number;
  a: number;
  alpha: number; // degrees
}

const fmt = (n: number) => (Math.abs(n) < 5e-3 ? 0 : n).toFixed(2);
const toRad = (deg: number) => (deg * Math.PI) / 180;

// Modified (Craig) DH matrix ^{i-1}_iT = Rotx(alpha_{i-1})·Transx(a_{i-1})·
// Rotz(theta_i)·Transz(d_i).
function dhMatrix(p: Params): Mat4 {
  const ct = Math.cos(toRad(p.theta));
  const st = Math.sin(toRad(p.theta));
  const ca = Math.cos(toRad(p.alpha));
  const sa = Math.sin(toRad(p.alpha));
  return [
    [ct, -st, 0, p.a],
    [st * ca, ct * ca, -sa, -p.d * sa],
    [st * sa, ct * sa, ca, p.d * ca],
    [0, 0, 0, 1],
  ];
}

function mul(A: Mat4, B: Mat4): Mat4 {
  const out: Mat4 = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++)
      for (let k = 0; k < 4; k++) out[i][j] += A[i][k] * B[k][j];
  return out;
}

const toRow = (p: Params) => ({
  a: p.a,
  d: p.d,
  alpha: toRad(p.alpha),
  theta: toRad(p.theta),
});

const TRANSFORM_INIT: Params = { theta: 35, d: 0.8, a: 1.6, alpha: 40 };
const LINK1_INIT: Params = { theta: 30, d: 0.6, a: 1.4, alpha: 25 };
const LINK2_INIT: Params = { theta: -45, d: 0.4, a: 1.1, alpha: -20 };

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span className="w-24">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-accent"
        aria-valuetext={display}
      />
      <span className="w-12 tabular-nums text-foreground">{display}</span>
    </label>
  );
}

function FrameToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-accent"
      />
      {label}
    </label>
  );
}

function ParamSliders({
  p,
  set,
}: {
  p: Params;
  set: (patch: Partial<Params>) => void;
}) {
  return (
    <>
      <Slider label="α (twist)" value={p.alpha} min={-180} max={180} step={1} onChange={(v) => set({ alpha: v })} display={`${p.alpha}°`} />
      <Slider label="a (length)" value={p.a} min={0} max={2.5} step={0.05} onChange={(v) => set({ a: v })} display={fmt(p.a)} />
      <Slider label="θ (joint angle)" value={p.theta} min={-180} max={180} step={1} onChange={(v) => set({ theta: v })} display={`${p.theta}°`} />
      <Slider label="d (offset)" value={p.d} min={0} max={2.5} step={0.05} onChange={(v) => set({ d: v })} display={fmt(p.d)} />
    </>
  );
}

export default function DHViz() {
  const [mode, setMode] = useState<Mode>("arm");

  // single-transform mode
  const [tp, setTp] = useState<Params>(TRANSFORM_INIT);
  const setTpPatch = (patch: Partial<Params>) => setTp((s) => ({ ...s, ...patch }));

  // arm mode
  const [link1, setLink1] = useState<Params>(LINK1_INIT);
  const [link2, setLink2] = useState<Params>(LINK2_INIT);
  const [selected, setSelected] = useState<1 | 2>(1);
  const [show0, setShow0] = useState(true);
  const [show1, setShow1] = useState(true);
  const [show2, setShow2] = useState(true);

  const selLink = selected === 1 ? link1 : link2;
  const setSel = (patch: Partial<Params>) =>
    (selected === 1 ? setLink1 : setLink2)((s) => ({ ...s, ...patch }));

  const A = dhMatrix(tp);
  const A1 = dhMatrix(link1);
  const A2 = dhMatrix(link2);
  const T02 = mul(A1, A2);

  const description =
    mode === "transform"
      ? `A single Modified (Craig) Denavit–Hartenberg transformation from frame {i-1} ` +
        `(fixed, at the origin) to frame {i}. Four sliders set the DH parameters: twist ` +
        `α = ${tp.alpha}° about X(i-1), length a = ${fmt(tp.a)} along X(i-1) (the common ` +
        `normal), joint angle θ = ${tp.theta}° about Z(i), offset d = ${fmt(tp.d)} along ` +
        `Z(i). The {i} frame and the 4×4 matrix ^{i-1}_iT = Rx(α)·Tx(a)·Rz(θ)·Tz(d) ` +
        `update live.`
      : `A two-link robot arm built from a Modified DH table. Each joint is a cylindrical ` +
        `motor about its Z axis; coordinate frames {0}, {1}, {2} can be toggled. For each ` +
        `link the common normal a_(i-1) and the offset d_i are drawn and labelled on the ` +
        `geometry. Link 1: α₀=${link1.alpha}°, a₀=${fmt(link1.a)}, θ₁=${link1.theta}°, ` +
        `d₁=${fmt(link1.d)}. Link 2: α₁=${link2.alpha}°, a₁=${fmt(link2.a)}, ` +
        `θ₂=${link2.theta}°, d₂=${fmt(link2.d)}. The base-to-end-effector transform is ` +
        `⁰T₂ = ⁰T₁·¹T₂. Drag to orbit.`;

  return (
    <VizFrame
      title="Modified DH parameters: transform and robot arm"
      caption="Switch views with the buttons. Both draw each link's common normal (aᵢ₋₁) and offset (dᵢ); α and a act on Xᵢ₋₁, θ and d on Zᵢ. The single transform shows ⁱ⁻¹ᵢT; the arm shows the DH table and ⁰T₂."
      textAlternative={description}
      controls={
        mode === "transform" ? (
          <>
            <ParamSliders p={tp} set={setTpPatch} />
            <button
              type="button"
              onClick={() => setTp(TRANSFORM_INIT)}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-2"
            >
              Reset
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
              {([1, 2] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSelected(n)}
                  aria-pressed={selected === n}
                  className={`rounded px-2.5 py-1 text-sm font-medium ${
                    selected === n
                      ? "bg-accent text-white"
                      : "text-muted hover:bg-surface-2"
                  }`}
                >
                  Link {n}
                </button>
              ))}
            </div>
            <ParamSliders p={selLink} set={setSel} />
            <span className="mx-1 h-5 w-px bg-border" />
            <FrameToggle label="{0}" checked={show0} onChange={setShow0} />
            <FrameToggle label="{1}" checked={show1} onChange={setShow1} />
            <FrameToggle label="{2}" checked={show2} onChange={setShow2} />
          </>
        )
      }
    >
      {/* mode toggle */}
      <div className="mb-3 flex items-center gap-1 rounded-md border border-border p-0.5 w-fit">
        {(["arm", "transform"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              mode === m ? "bg-accent text-white" : "text-muted hover:bg-surface-2"
            }`}
          >
            {m === "arm" ? "Robot arm" : "Single DH transform"}
          </button>
        ))}
      </div>

      <Viz3D aspectRatio={16 / 10}>
        {mode === "transform" ? (
          <DHParamScene theta={toRad(tp.theta)} d={tp.d} a={tp.a} alpha={toRad(tp.alpha)} />
        ) : (
          <DHArmScene
            link1={toRow(link1)}
            link2={toRow(link2)}
            show0={show0}
            show1={show1}
            show2={show2}
          />
        )}
      </Viz3D>

      {mode === "transform" ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="flex items-center gap-2 text-muted">
            <span className="whitespace-nowrap">
              <sup>i-1</sup>
              <sub>i</sub>T =
            </span>
            <MatrixDisplay rows={A} ariaLabel="4 by 4 modified DH transformation matrix" />
          </span>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-start gap-x-6 gap-y-3 text-sm">
          <div className="text-muted">
            <div className="mb-1 font-medium text-foreground">DH table</div>
            <table className="tabular-nums">
              <thead>
                <tr className="text-xs text-muted">
                  <th className="pr-3 text-left font-medium">link</th>
                  <th className="px-2 text-right font-medium">αᵢ₋₁</th>
                  <th className="px-2 text-right font-medium">aᵢ₋₁</th>
                  <th className="px-2 text-right font-medium">θᵢ</th>
                  <th className="px-2 text-right font-medium">dᵢ</th>
                </tr>
              </thead>
              <tbody className="font-mono text-foreground">
                {[link1, link2].map((l, i) => (
                  <tr key={i}>
                    <td className="pr-3 text-left text-muted">{i + 1}</td>
                    <td className="px-2 text-right">{l.alpha}°</td>
                    <td className="px-2 text-right">{fmt(l.a)}</td>
                    <td className="px-2 text-right">{l.theta}°</td>
                    <td className="px-2 text-right">{fmt(l.d)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <span className="flex items-center gap-2 text-muted">
            <span className="whitespace-nowrap">
              <sup>0</sup>T<sub>2</sub> =
            </span>
            <MatrixDisplay rows={T02} ariaLabel="4 by 4 base to end-effector transform" />
          </span>
        </div>
      )}
    </VizFrame>
  );
}
