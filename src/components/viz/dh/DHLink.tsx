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

/**
 * One Modified (Craig) DH transformation from the current frame {i-1} to frame
 * {i}, built as ^{i-1}_iT = Rotx(alpha_{i-1})·Transx(a_{i-1})·Rotz(theta_i)·
 * Transz(d_i) via nested groups — so children mounted at frame {i} inherit the
 * exact pose. It draws the joint motor (a cylinder along Z_i, the joint axis)
 * and labels the two translational DH parameters on the geometry: a_{i-1} (the
 * common normal along X_{i-1}) and d_i (offset along Z_i). alpha and theta are
 * read off the frame orientation.
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
  return (
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
  );
}
