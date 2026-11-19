// The 3D lab: studio, body systems, cross-section, orbit camera on desktop, XR rig + panel in VR.
import { CameraControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { XR, useXR } from '@react-three/xr'
import { useEffect, useRef } from 'react'
import { Box3, Vector3 } from 'three'
import { useView } from '@/state/viewStore'
import { getStructure } from '@/state/indexData'
import { xrStore } from './xr'
import { XRRig } from './rig/XRRig'
import { Studio } from './Studio'
import { Body } from './body/Body'
import { CrossSection, BODY } from './body/CrossSection'
import { VrPanel } from './VrPanel'
import { Animator } from './body/Animator'
import { debugEnabled, registerDebugView, tickDebugFrame } from './debug'

export default function LabCanvas() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ fov: 40, near: 0.02, far: 40, position: [0.9, 1.35, 3.1] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerMissed={(e) => {
        const v = useView.getState()
        if (v.mode === 'explore' && (e as MouseEvent).detail > 0) v.select(null)
      }}
      aria-label="3D human anatomy model"
    >
      <XR store={xrStore}>
        <XRBridge />
        <Studio />
        <Body />
        <CrossSection />
        <Animator />
        <Rig />
        <VrPanel />
        <DebugView />
      </XR>
    </Canvas>
  )
}

function Rig() {
  const inXR = useXR((s) => s.session != null)
  return inXR ? <XRRig /> : <OrbitRig />
}

const box = new Box3()
const pad = new Vector3()

/** Desktop/touch camera: orbit, pan, zoom; smoothly frames the selection or the whole body on request. */
function OrbitRig() {
  const ref = useRef<CameraControls>(null)
  const focus = useView((s) => s.focus)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    c.minDistance = 0.15
    c.maxDistance = 6
    c.dollyToCursor = true
    c.setTarget(0, 0.95, 0, false)
  }, [])
  useEffect(() => {
    const c = ref.current
    if (!c || focus.n === 0) return
    const s = getStructure(focus.id)
    if (s) {
      box.min.set(...s.min)
      box.max.set(...s.max)
      box.getSize(pad).multiplyScalar(0.6).max(new Vector3(0.06, 0.06, 0.06))
      box.expandByVector(pad)
    } else {
      box.min.set(BODY.minX, BODY.minY, BODY.minZ)
      box.max.set(BODY.maxX, BODY.maxY, BODY.maxZ)
    }
    void c.fitToBox(box, true, { paddingTop: 0.05, paddingBottom: 0.05, paddingLeft: 0.05, paddingRight: 0.05 })
  }, [focus])
  // When a cut is switched on, swing round to face the cut surface.
  const axis = useView((s) => s.clip.axis)
  const flip = useView((s) => s.clip.flip)
  useEffect(() => {
    const c = ref.current
    if (!c || axis === 'none') return
    const f = flip ? -1 : 1
    if (axis === 'axial') void c.setLookAt(0, f > 0 ? 2.9 : -0.9, 0.9 * f, 0, 0.95, 0, true)
    else if (axis === 'sagittal') void c.setLookAt(2.8 * f, 1.1, 0.4, 0, 0.95, 0, true)
    else void c.setLookAt(0.4, 1.1, 2.8 * f, 0, 0.95, 0, true)
  }, [axis, flip])
  // Standard anatomical views around the current subject (the selection, or the whole body).
  const preset = useView((s) => s.preset)
  useEffect(() => {
    const c = ref.current
    if (!c || preset.n === 0) return
    const s = getStructure(useView.getState().selectedId)
    const t = s ? new Vector3((s.min[0] + s.max[0]) / 2, (s.min[1] + s.max[1]) / 2, (s.min[2] + s.max[2]) / 2) : new Vector3(0, 0.95, 0)
    const d = Math.max(c.distance, s ? 0.4 : 2.6)
    const dir = DIRS[preset.name]
    void c.setLookAt(t.x + dir[0] * d, t.y + dir[1] * d, t.z + dir[2] * d, t.x, t.y, t.z, true)
  }, [preset])
  return <CameraControls ref={ref} makeDefault smoothTime={0.35} />
}

/** Camera directions; "left"/"right" are the patient's sides (patient's left is +X). */
const DIRS: Record<import('@/state/viewStore').ViewPreset, [number, number, number]> = {
  front: [0, 0, 1],
  back: [0, 0, -1],
  left: [1, 0, 0],
  right: [-1, 0, 0],
  top: [0, 1, 0.001],
  bottom: [0, -1, 0.001],
}

function XRBridge() {
  const inXR = useXR((s) => s.session != null)
  useEffect(() => useView.getState().setInXR(inXR), [inXR])
  return null
}

function DebugView() {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => registerDebugView(camera, gl.domElement, scene), [camera, gl, scene])
  useFrame(() => {
    if (debugEnabled) tickDebugFrame()
  })
  return null
}
