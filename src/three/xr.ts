// XR session management: one store for the app, plus haptics + capability helpers.
import { createXRStore } from '@react-three/xr'
import { Vector3 } from 'three'

/** Young children squeeze the trigger slowly: accept a press-and-release up to 700ms as a click (default 300ms). */
const KID_POINTER = { clickThresholdMs: 700 }

function controllerOptions(teleport: boolean) {
  return { teleportPointer: teleport, rayPointer: KID_POINTER, grabPointer: KID_POINTER }
}

function handOptions(teleport: boolean) {
  return { teleportPointer: teleport, rayPointer: KID_POINTER, grabPointer: KID_POINTER, touchPointer: true }
}

// DEV only: /play?xr=emulate forces the Quest 3 emulator even where the browser has its own WebXR.
const forceEmulator = import.meta.env.DEV && new URLSearchParams(globalThis.location?.search ?? '').get('xr') === 'emulate'
if (import.meta.env.DEV && forceEmulator) void import('./devEmulator').then((m) => m.installForcedEmulator())

export const xrStore = createXRStore({
  // IWER emulator is injected only on localhost dev builds when the browser has no WebXR.
  // No synthetic room: it would fetch environment files from a CDN.
  emulate: import.meta.env.DEV && !forceEmulator ? { type: 'metaQuest3', syntheticEnvironment: false } : false,
  offerSession: false,
  frameRate: 'high', // 72/90 Hz on Quest where available
  foveation: 1, // max fixed foveation: cheapest fill-rate on standalone headsets
  handTracking: true,
  // Teleport arcs start hidden: XRRig shows one only while that controller's thumbstick is pushed forward.
  // (The pointer library makes the closest hit win, and an always-on arc reaches the floor first,
  // which would steal the trigger from UI the child is pointing at.)
  controller: controllerOptions(false),
  hand: handOptions(false),
})

/** Show/hide the teleport arc on one controller. */
export function setControllerTeleport(hand: 'left' | 'right', on: boolean) {
  xrStore.setController(controllerOptions(on), hand)
}

export { detectXRSupport, type XRSupport } from './xrSupport'

export async function enterVR() {
  try {
    await xrStore.enterVR()
  } catch (err) {
    console.warn('Could not start VR', err)
    throw err
  }
}

export function exitVR() {
  void xrStore.getState().session?.end()
}

const tmp = new Vector3()

/** Vibrate the controller closest to `near` (the pointer that caused the event). Silently no-ops without haptics. */
export function pulse(near: Vector3 | undefined, intensity = 0.4, ms = 30) {
  const states = xrStore.getState().inputSourceStates
  let best: { d: number; gp: Gamepad | undefined } | null = null
  for (const s of states) {
    if (s.type !== 'controller') continue
    const gp = s.inputSource.gamepad
    const d = near && s.object ? s.object.getWorldPosition(tmp).distanceToSquared(near) : 0
    if (!best || d < best.d) best = { d, gp }
  }
  const actuator = (best?.gp as (Gamepad & { hapticActuators?: { pulse?: (v: number, ms: number) => void }[] }) | undefined)
  try {
    if (actuator?.vibrationActuator && 'playEffect' in actuator.vibrationActuator) {
      void actuator.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: intensity, weakMagnitude: intensity })
    } else {
      actuator?.hapticActuators?.[0]?.pulse?.(intensity, ms)
    }
  } catch {
    /* haptics optional */
  }
}
