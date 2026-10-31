---
name: viz-3d
description: >-
  Conventions for 3D visualizations in Robotics Compass using
  @react-three/fiber + drei — the dark Canvas wrapper, lighting rig,
  OrbitControls, the performance budget (frameloop="demand", dispose), SSR-safe
  dynamic import (ssr:false), and how to structure a robot-arm scene with nested
  joint groups and coordinate-frame helpers. Use when building or reviewing any
  3D viz.
---

# 3D visualizations (react-three-fiber)

3D viz live under `src/components/viz/` and wire into a lesson's **Visualization** slot. They
render on a **dark canvas** (Golden rule 2 — dark is allowed for embedded 3D surfaces), are
**lazy-loaded**, and must have a **text alternative**.

## SSR-safe dynamic import (required)

`three` needs `window`, so a 3D scene must never render during SSR:

```tsx
// In the lesson / Viz3D consumer:
import dynamic from 'next/dynamic';
const ArmScene = dynamic(() => import('@/components/viz/ArmScene'), { ssr: false });
```

Wrap the dynamic import in `Viz3D` (inside `VizFrame`) so the text alternative, caption, and
controls stay server-rendered and accessible while only the canvas is client-only.

## Viz3D wrapper / dark canvas

- `Viz3D` applies the **`.theme-dark`** wrapper around the canvas so the surrounding controls
  and the canvas background use the dark token palette — scoped, not global.
- Canvas background uses `--color-bg` (dark). Read token colors via CSS variables / a small
  theme hook so materials and helpers match.

## Performance budget (Golden rule 6)

- Set **`frameloop="demand"`** so the scene only renders on demand when idle. Call
  `invalidate()` (from `useThree`) after state changes (slider moves, control changes) to
  request a frame. While the user is actively orbiting, OrbitControls requests frames itself.
- **Dispose** geometries, materials, and textures on unmount. Prefer reusing geometry/material
  instances over recreating them every render.
- Keep the lighting rig and helper count modest. Avoid heavy shadows unless needed.
- Honor `prefers-reduced-motion`: no auto-spin / idle animation when it is set.

## Lighting rig (default)

A simple, neutral rig that reads well on the dark background:
- one `ambientLight` (low intensity) for fill,
- one `directionalLight` as a key light from an upper-front angle,
- optional soft fill/hemisphere light.
Keep intensities calm and academic — not glossy/showy.

## Controls

- `OrbitControls` from drei for orbit/zoom/pan, with sensible damping and distance limits.
- Controls must be operable and the canvas focusable; provide on-screen sliders (with labels)
  for the actual parameters (e.g. joint angles) so the scene is usable without a mouse-drag.

## Robot-arm scene structure (nested joint groups)

Model articulated robots as **nested `<group>`s**, one per joint, so a parent joint's rotation
carries its children — exactly how kinematic chains compose:

```tsx
// 2-link arm (forward kinematics reference):
<group rotation={[0, 0, theta1]}>        {/* joint 1 at base */}
  <Link length={L1} />                    {/* link 1 mesh along +x */}
  <FrameHelper />                          {/* coordinate frame at joint 1 */}
  <group position={[L1, 0, 0]} rotation={[0, 0, theta2]}>  {/* joint 2 at end of link 1 */}
    <Link length={L2} />                  {/* link 2 mesh */}
    <FrameHelper />                        {/* coordinate frame at the end-effector */}
  </group>
</group>
```

- Each joint group's local transform = its joint angle; children inherit it automatically.
- Place a child group at the **end of the parent link** (`position={[L, 0, 0]}`) so the chain
  is geometrically correct.
- **Coordinate-frame helpers:** small RGB axis triads (x=red, y=green, z=blue) at each joint
  and the end-effector make the transforms legible. A ground grid/plane gives spatial context.
- Drive joint angles from React state bound to labeled sliders; call `invalidate()` on change.

### DH-modelled arms (modified / Craig — Golden rule 8)

When an arm is described by a DH table, nest **one group per factor** of
^{i-1}_iT = Rot_X(α_{i-1})·Trans_X(a_{i-1})·Rot_Z(θ_i)·Trans_Z(d_i), so every triad is
exactly DH frame {i} (Z on the joint axis) and the scene matches the matrices shown:

```tsx
<group rotation={[alpha, 0, 0]}>          {/* Rot_X(α_{i-1}) */}
  <group position={[a, 0, 0]}>            {/* Trans_X(a_{i-1}) */}
    <group rotation={[0, 0, theta]}>      {/* Rot_Z(θ_i) */}
      <group position={[0, 0, d]}>        {/* Trans_Z(d_i) — frame {i} */}
        {/* frame {i} triad, link mesh, then the next joint's groups */}
```

Name the tool frame **{T}** (Craig's tool frame): the last link transform is ^{n}_T T and the
base-to-tool product is ^0_T T. Label every frame in the scene ({0}, {1}, …, {T}).

Compute the matrices with the shared kernel (`src/lib/kinematics/dh.ts`), never a local copy,
and test the arm's math module (Golden rule 10).

## Required text alternative

Describe what the scene shows and what the controls do (e.g. "a 2-link planar arm; sliders set
joint 1 and joint 2 angles; coordinate frames are drawn at each joint and the end-effector").
Provide it through `VizFrame` so it is available without the canvas.

All UI strings (title, caption, labels, text alternative) exist in EN and PT, typically in a
colocated `strings.tsx` typed `Record<Locale, …>` (Golden rule 9).

The 3-DOF modified-DH arm in the `forward-kinematics` lesson (`viz/fk/`) is the canonical 3D
example: DH kernel, nested DH groups with frame labels, live DH table and matrices, EN/PT
strings, and tests.
