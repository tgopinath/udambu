// Test/debug bridge: lets Playwright find where structures are on screen so it can perform REAL
// pointer input. Exposed only in dev builds or when ?e2e is in the URL. Read-only (plus exitVR).
import { Raycaster, Vector2, Vector3, type Camera, type Mesh, type Object3D, type Scene } from 'three'
import { center } from '@/engine/anatomy'
import { getStructure } from '@/state/indexData'
import { useView } from '@/state/viewStore'
import { useLab } from '@/state/labStore'
import { usePlayerStore } from '@/state/playerStore'
import { meshesOf } from './body/registry'
import { exitVR, xrStore } from './xr'

let camera: Camera | null = null
let scene: Scene | null = null
let canvas: HTMLCanvasElement | null = null
let frames = 0
const vrButtons = new Map<string, Object3D>()

/** VR panel buttons register here so emulator tests can aim at them. */
export function registerVrButton(label: string, obj: Object3D) {
  if (!debugEnabled) return () => {}
  vrButtons.set(label, obj)
  return () => {
    if (vrButtons.get(label) === obj) vrButtons.delete(label)
  }
}

export const debugEnabled = typeof window !== 'undefined' && (import.meta.env.DEV || new URLSearchParams(window.location.search).has('e2e'))

export function registerDebugView(c: Camera, el: HTMLCanvasElement, sc?: Scene) {
  camera = c
  canvas = el
  if (sc) scene = sc
}

const ray = new Raycaster()
const ndc = new Vector2()
const w = new Vector3()

/** Id of the first visible structure under a screen point (normalised device coordinates). */
function firstSid(x: number, y: number): string | null {
  if (!camera || !scene) return null
  ndc.set(x, y)
  ray.setFromCamera(ndc, camera)
  const hit = ray.intersectObjects(scene.children, true).find((h) => {
    for (let n: typeof h.object | null = h.object; n; n = n.parent) if (!n.visible) return false
    return !!h.object.userData.sid
  })
  return (hit?.object.userData.sid as string | undefined) ?? null
}

/**
 * A screen point where the structure is the first visible thing under the pointer: samples vertices
 * of its meshes and ray-tests each from the camera. Prefers points well inside the silhouette
 * (four neighbours ~4 px away also hit it); falls back to any hit for tiny parts. Null if fully hidden.
 */
function visiblePoint(id: string) {
  return pointOn(id, true) ?? pointOn(id, false)
}

function pointOn(id: string, strict: boolean) {
  if (!camera || !canvas || !scene) return null
  const list = meshesOf(id)
  const r = canvas.getBoundingClientRect()
  for (const m of list as Mesh[]) {
    const pos = m.geometry.getAttribute('position')
    const step = Math.max(1, Math.floor(pos.count / 300))
    for (let i = 0; i < pos.count; i += step) {
      w.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld)
      v.copy(w).project(camera)
      if (Math.abs(v.x) > 0.95 || Math.abs(v.y) > 0.95 || v.z > 1) continue
      const px = 8 / r.width
      const py = 8 / r.height
      const probes = strict ? [[0, 0], [px, 0], [-px, 0], [0, py], [0, -py]] : [[0, 0]]
      const ok = probes.every(([dx, dy]) => firstSid(v.x + dx!, v.y + dy!) === id)
      if (ok) return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height }
    }
  }
  return null
}

export function tickDebugFrame() {
  frames++
}

const v = new Vector3()
function project(world: Vector3) {
  if (!camera || !canvas) return null
  v.copy(world).project(camera)
  const r = canvas.getBoundingClientRect()
  return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height, z: v.z }
}

if (debugEnabled) {
  ;(window as unknown as { __al: unknown }).__al = {
    frames: () => frames,
    view: () => {
      const s = useView.getState()
      return { anim: s.anim, selectedId: s.selectedId, hoveredId: s.hoveredId, mode: s.mode, isolated: s.isolated, hidden: s.hidden, clip: s.clip, loading: s.loading, question: s.question, inXR: s.inXR }
    },
    lab: () => {
      const s = useLab.getState()
      return { systems: s.systems, answered: s.answered, correct: s.correct, session: s.session, cards: Object.keys(s.cards).length }
    },
    loaded: (id: string) => meshesOf(id).length > 0,
    /** Screen point of a structure's bounding-box centre. */
    screen: (id: string) => {
      const s = getStructure(id)
      return s ? project(new Vector3(...center(s))) : null
    },
    visiblePoint,
    /** Ids of structures currently rendered (visible meshes in visible layers). */
    visibleIds: () => {
      const out = new Set<string>()
      scene?.traverse((o) => {
        if (!o.userData.sid) return
        for (let n: Object3D | null = o; n; n = n.parent) if (!n.visible) return
        out.add(o.userData.sid as string)
      })
      return [...out].sort()
    },
    meshScale: (id: string) => meshesOf(id)[0]?.scale.x ?? null,
    vrButton: (label: string) => vrButtons.get(label)?.getWorldPosition(new Vector3()).toArray() ?? null,
    world: (id: string) => {
      const s = getStructure(id)
      return s ? center(s) : null
    },
    camera: () => (camera ? camera.position.toArray() : null),
    player: () => {
      const p = usePlayerStore.getState()
      return { x: p.x, z: p.z, yaw: p.yaw }
    },
    xrVisibility: () => xrStore.getState().visibilityState,
    xr: () => xrStore.getState().inputSourceStates.filter((st) => st.type === 'controller').map((st) => st.inputSource.handedness),
    exitVR,
  }
}
