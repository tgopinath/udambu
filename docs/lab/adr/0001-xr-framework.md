# ADR 0001 — XR framework: React Three XR v6 (pmndrs), not Meta IWSDK

Status: **Accepted** · Date: 2026-11-17

## Context
The spec mandates React + React Three Fiber (R3F) + Drei and asks us to evaluate Meta's
Immersive Web SDK (IWSDK, `@iwsdk/core` 1.1.0) against React Three XR before building the XR layer.

### Option A — Meta IWSDK
- Three.js-based, but built around its own **ECS runtime** (entities, systems, components) and its own
  render loop, input stack, locomotion and spatial UI (UIKitML).
- Excellent Quest defaults (grab, locomotion, IWER emulator).
- Not React-first: using it with R3F means two scene graphs / two loops, or giving up R3F entirely.

### Option B — React Three XR v6 (`@react-three/xr` 6.6.32 + `@react-three/handle`)
- Native to R3F: `<XR>` wraps the same `<Canvas>`; XR controllers, hands, gaze and screen input
  all dispatch the **same pointer events** (`onPointerDown`, `onClick`, …) that mouse and touch use.
- Built-in teleport pointer + `TeleportTarget`, controller locomotion (snap/smooth turn),
  hand tracking with pinch/grab pointers, haptics via `inputSource.gamepad.hapticActuators`.
- Ships the same IWER-based emulator (`emulate` option) for testing on localhost without a headset.
- `@react-three/handle` offers grab/translate/rotate for mouse, rays and grip (evaluated; see Consequences).

## Decision
Use **Option B**. One rendering stack (three 0.187 + R3F 9.8 + Drei 10.7), one event model for every
device, so the object interaction framework is written once.

We do **not** add IWSDK. Mixing two XR frameworks would double the input code and the bundle.

## Consequences
- Interaction components (`Grabbable`, `DropZone`) use R3F pointer events directly. We tried `@react-three/handle`
  but chose a ~150-line `Grabbable` instead: desktop drags must slide on the table plane while VR grip carries
  objects freely, and the engine (not the handle) must own resting positions. The dependency was removed.
- Teleport arcs are shown only while a thumbstick is pushed forward. The pointer library activates whichever
  pointer hits something closest, and an always-on arc reaches the floor first, stealing the trigger from UI.
- Desktop/mobile navigation is our own small rig; XR navigation uses the library's teleport + locomotion.
- Spatial UI is built from Drei `<Text>` + meshes (works in XR, no DOM overlay dependency).
- If we later need Quest-only features IWSDK exposes first (e.g. scene understanding), revisit.

## Version pins (see package.json — installed with `-E`)
| Package | Version | Note |
|---|---|---|
| react / react-dom | 19.3.1 | R3F 9.8 requires `>=19 <19.4` |
| three / @types/three | 0.187.0 | |
| @react-three/fiber | 9.8.2 | |
| @react-three/drei | 10.7.9 | peer: fiber ^9 |
| @react-three/xr | 6.6.32 | IWER emulator (dev only) via @pmndrs/xr; `iwer` 2.8.0 + `@iwer/devui` 1.1.2 pinned as dev deps |
| typescript | 6.0.3 | typescript-eslint 8.73 supports `<6.1`; TS 7 not yet supported |
| vite | 8.3.8 | |
