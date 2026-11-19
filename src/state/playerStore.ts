// Where the VR player stands (XR origin). Desktop uses orbit camera controls instead.
import { create } from 'zustand'

export interface Bounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

interface PlayerState {
  x: number
  z: number
  yaw: number
  bounds: Bounds
  setPose(p: Partial<Pick<PlayerState, 'x' | 'z' | 'yaw'>>): void
}

/** Start 1.4 m in front of the body, facing it. */
export const VR_SPAWN = { x: 0, z: 1.4, yaw: 0 }

export function clampToBounds(x: number, z: number, b: Bounds): [number, number] {
  return [Math.min(Math.max(x, b.minX), b.maxX), Math.min(Math.max(z, b.minZ), b.maxZ)]
}

export const usePlayerStore = create<PlayerState>()((set) => ({
  ...VR_SPAWN,
  bounds: { minX: -3.5, maxX: 3.5, minZ: -3.5, maxZ: 3.5 },
  setPose: (p) => set(p),
}))
