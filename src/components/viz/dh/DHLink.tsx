"use client";

import { useMemo, type ReactNode } from "react";
import { Html, Line } from "@react-three/drei";

export interface DHColors {
  link: string;
  offset: string;
  motor: string;
  grid: string;
}

const FALLBACK: DHColors = {
  link: "#8aa0b2",
  offset: "#d97706",
  motor: "#38bdf8",
  grid: "#1e2a38",
};

/** Read scene colors from the --token CSS variables resolved inside the
 *  .theme-dark canvas wrapper (Golden rule 3). */
export function useDHColors(el: HTMLElement): DHColors {
  return useMemo(() => {
    const s = getComputedStyle(el);
    const v = (n: string, fb: string) => s.getPropertyValue(n).trim() || fb;
    return {
      link: v("--muted", FALLBACK.link),
      offset: v("--warning", FALLBACK.offset),
      motor: v("--accent", FALLBACK.motor),
      grid: v("--viz-grid", FALLBACK.grid),
    };
  }, [el]);
}

export const dhLabelClass =
  "pointer-events-none select-none whitespace-nowrap rounded border border-border bg-surface/80 px-1.5 py-0.5 text-xs text-foreground";
const paramClass =
  "pointer-events-none select-none rounded px-1 text-xs font-semibold italic";

type P3 = [number, number, number];
const ARC_R = 0.55;

/** Points of an angle arc of `angle` rad, radius r, swept from the `from` unit
 *  axis toward the `to` unit axis (both perpendicular). */
function arc(from: P3, to: P3, angle: number, r: number): P3[] {
  const n = 24;
  const pts: P3[] = [];
  for (let k = 0; k <= n; k++) {
    const t = (angle * k) / n;
    const c = Math.cos(t) * r;
    const s = Math.sin(t) * r;
    pts.push([
      from[0] * c + to[0] * s,
      from[1] * c + to[1] * s,
      from[2] * c + to[2] * s,
    ]);
  }
  return pts;
}
function arcMid(from: P3, to: P3, angle: number, r: number): P3 {
  const c = Math.cos(angle / 2) * r;
  const s = Math.sin(angle / 2) * r;
  return [
    from[0] * c + to[0] * s,
    from[1] * c + to[1] * s,
    from[2] * c + to[2] * s,
  ];
}

/**
 * One Modified (Craig) DH transformation from the current frame {i-1} to frame
 * {i}, built as ^{i-1}_iT = Rotx(alpha_{i-1})·Transx(a_{i-1})·Rotz(theta_i)·
 * Transz(d_i) via nested groups — so children mounted at frame {i} inherit the
 * exact pose. All four DH parameters are drawn on the geometry: the two lengths
 * as segments (a_{i-1} common normal along X_{i-1}, d_i offset along Z_i) and
 * the two angles as arcs (alpha_{i-1} twist about X_{i-1}, theta_i rotation
 * about Z_i).
 */
export function DHLink({
  a,
  d,
  alpha,
  theta,
  aSub,
  dSub,
  colors,
  showFrame = true,
  showParams = true,
  showMotor = true,
  frameLabel,
  frameSize = 0.9,
  children,
}: {
  a: number;
  d: number;
  alpha: number;
  theta: number;
  aSub: string;
  dSub: string;
  colors: DHColors;
  showFrame?: boolean;
  showParams?: boolean;
  showMotor?: boolean;
  frameLabel?: string;
  frameSize?: number;
  children?: ReactNode;
}) {
  // alpha twist: about +x, from Z_{i-1} (+z) toward the twisted z, in the yz-plane.
  const alphaArc = useMemo<{ pts: P3[]; mid: P3 } | null>(() => {
    if (Math.abs(alpha) < 1e-3) return null;
    const from: P3 = [0, 0, 1];
    const to: P3 = [0, -1, 0];
    return { pts: arc(from, to, alpha, ARC_R), mid: arcMid(from, to, alpha, ARC_R * 1.25) };
  }, [alpha]);

  // theta rotation: about +z, from X_{i-1} (+x) toward X_i, in the xy-plane.
  const thetaArc = useMemo<{ pts: P3[]; mid: P3 } | null>(() => {
    if (Math.abs(theta) < 1e-3) return null;
    const from: P3 = [1, 0, 0];
    const to: P3 = [0, 1, 0];
    return { pts: arc(from, to, theta, ARC_R), mid: arcMid(from, to, theta, ARC_R * 1.25) };
  }, [theta]);

  return (
    <group>
      {/* alpha_{i-1} : twist about X_{i-1} */}
      {showParams && alphaArc && (
        <>
          <Line points={alphaArc.pts} color={colors.offset} lineWidth={2.5} />
          <Html position={alphaArc.mid} center>
            <span className={paramClass} style={{ color: colors.offset }}>
              α{aSub}
            </span>
          </Html>
        </>
      )}

      <group rotation={[alpha, 0, 0]}>
        {/* a_{i-1} : the common normal (link) along X_{i-1} */}
        {showParams && Math.abs(a) > 1e-3 && (
          <>
            <Line
              points={[
                [0, 0, 0],
                [a, 0, 0],
              ]}
              color={colors.link}
              lineWidth={5}
            />
            <Html position={[a / 2, 0, 0.14]} center>
              <span className={paramClass} style={{ color: colors.offset }}>
                a{aSub}
              </span>
            </Html>
          </>
        )}

        <group position={[a, 0, 0]}>
          {/* joint motor: a cylinder along the joint axis Z_i (local z) */}
          {showMotor && (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.13, 0.13, 0.5, 24]} />
              <meshStandardMaterial color={colors.motor} metalness={0.2} roughness={0.5} />
            </mesh>
          )}

          {/* theta_i : rotation about Z_i */}
          {showParams && thetaArc && (
            <>
              <Line points={thetaArc.pts} color={colors.offset} lineWidth={2.5} />
              <Html position={thetaArc.mid} center>
                <span className={paramClass} style={{ color: colors.offset }}>
                  θ{dSub}
                </span>
              </Html>
            </>
          )}

          <group rotation={[0, 0, theta]}>
            {/* d_i : offset along Z_i */}
            {showParams && Math.abs(d) > 1e-3 && (
              <>
                <Line
                  points={[
                    [0, 0, 0],
                    [0, 0, d],
                  ]}
                  color={colors.offset}
                  lineWidth={2.5}
                  dashed
                  dashSize={0.1}
                  gapSize={0.07}
                />
                <Html position={[0, 0, d / 2]} center>
                  <span className={paramClass} style={{ color: colors.offset }}>
                    d{dSub}
                  </span>
                </Html>
              </>
            )}

            <group position={[0, 0, d]}>
              {showFrame && (
                <>
                  <axesHelper args={[frameSize]} />
                  <mesh>
                    <sphereGeometry args={[0.05, 16, 16]} />
                    <meshBasicMaterial color={colors.link} />
                  </mesh>
                </>
              )}
              {frameLabel && (
                <Html position={[0.18, 0.18, 0.12]} center>
                  <span className={dhLabelClass}>{frameLabel}</span>
                </Html>
              )}
              {children}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
