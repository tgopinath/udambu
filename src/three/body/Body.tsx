// Loads each body system on demand, prepares meshes (ids, tissue materials, BVH for fast picking)
// and turns pointer hits into structure selections — the same path for mouse, touch and XR rays.
import { useGLTF } from '@react-three/drei'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { Component, Suspense, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { type Group, type Intersection, type Material, type Mesh, type MeshStandardMaterial, type Object3D } from 'three'
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh'
import { BufferGeometry, Mesh as ThreeMesh } from 'three'
import { SYSTEMS, type SystemId } from '@/engine/anatomy'
import { useLab } from '@/state/labStore'
import { useView } from '@/state/viewStore'
import { getStructure } from '@/state/indexData'
import { clipPlane, setSystemOpacity, tissueMaterial } from './materials'
import { refreshAll, registerStructure, unregisterSystem } from './registry'

// three-mesh-bvh: ~100x faster raycasts on the 2.5M-triangle layers.
BufferGeometry.prototype.computeBoundsTree = computeBoundsTree
BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree
ThreeMesh.prototype.raycast = acceleratedRaycast

// Resolved against the Lab page (lab/index.html) so they work on the website and inside the phone apps.
const here = (path: string) => new URL(path, typeof document !== 'undefined' ? document.baseURI : 'http://localhost/lab/').href
export const DRACO_PATH = here('draco/')
export const modelUrl = (id: SystemId) => here(`models/${id}.glb`)

function buildBvhInIdleTime(list: Mesh[]) {
  let i = 0
  const step = (deadline?: { timeRemaining(): number }) => {
    const start = performance.now()
    while (i < list.length && (deadline ? deadline.timeRemaining() > 2 : performance.now() - start < 8)) {
      const g = list[i++]!.geometry
      if (!g.boundsTree) g.computeBoundsTree()
    }
    if (i < list.length) schedule()
  }
  const schedule = () => ('requestIdleCallback' in window ? requestIdleCallback(step) : setTimeout(step, 16))
  schedule()
}

function SystemModel({ id }: { id: SystemId }) {
  const gltf = useGLTF(modelUrl(id), DRACO_PATH)
  const visible = useLab((s) => s.systems[id].visible)
  const opacity = useLab((s) => s.systems[id].opacity)

  useLayoutEffect(() => {
    const all: Mesh[] = []
    const byId = new Map<string, Mesh[]>()
    gltf.scene.traverse((o: Object3D) => {
      if (!(o as Mesh).isMesh) return
      const mesh = o as Mesh
      // Multi-primitive nodes become a group of meshes; the structure name lives on the nearest named ancestor.
      let named: Object3D | null = mesh
      while (named && !named.userData.za_name) named = named.parent
      const name = (named?.userData.za_name as string | undefined) ?? mesh.name
      const sid = `${id}:${name}`
      const src = mesh.material as MeshStandardMaterial
      const mat = mesh.userData.baseMat ?? tissueMaterial(id, src.name, src.color)
      mesh.userData.sid = sid
      mesh.userData.baseMat = mat
      mesh.material = mat as Material
      mesh.castShadow = false
      mesh.receiveShadow = false
      all.push(mesh)
      byId.set(sid, [...(byId.get(sid) ?? []), mesh])
    })
    for (const [sid, list] of byId) registerStructure(sid, list)
    refreshAll()
    useView.getState().setLoading(id, 'ready')
    buildBvhInIdleTime(all)
    return () => unregisterSystem(id)
  }, [gltf, id])

  useEffect(() => setSystemOpacity(id, opacity), [id, opacity, gltf])

  return <primitive object={gltf.scene} visible={visible} />
}

function LoadingMark({ id }: { id: SystemId }) {
  useEffect(() => useView.getState().setLoading(id, 'loading'), [id])
  return null
}

/** Per-system error boundary: one failed download shows an error for that layer, not a broken lab. */
class SystemBoundary extends Component<{ id: SystemId; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err: unknown) {
    console.error(`Could not load ${this.props.id} layer`, err)
    useView.getState().setLoading(this.props.id, 'error')
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/** Only systems the learner has switched on are downloaded; once loaded they stay cached. */
export function Body() {
  const systems = useLab((s) => s.systems)
  const loadedOnce = useRef(new Set<SystemId>())
  for (const s of SYSTEMS) if (systems[s.id].visible) loadedOnce.current.add(s.id)
  const group = useRef<Group>(null)
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    gl.localClippingEnabled = true
  }, [gl])

  const pick = (e: ThreeEvent<PointerEvent | MouseEvent>): string | null => {
    // Mouse/touch (R3F) events carry every hit in `intersections`; XR pointer events carry their hit in
    // `intersection` (their `intersections` list is empty).
    const ev = e as unknown as { intersections?: Intersection[]; intersection?: Intersection }
    const hits: Intersection[] = ev.intersections?.length ? ev.intersections : ev.intersection ? [ev.intersection] : [e as unknown as Intersection]
    const clipping = useView.getState().clip.axis !== 'none'
    for (const it of hits) {
      const o = it.object
      if (!isShown(o)) continue
      const m = (o as Mesh).material as MeshStandardMaterial | undefined
      if (m && m.opacity < 0.35) continue // see-through layers don't block picking
      if (clipping && clipPlane.distanceToPoint(it.point) < 0) continue // cut away by the cross-section
      const sid = o.userData.sid as string | undefined
      if (sid) return sid
    }
    return null
  }

  return (
    <group
      ref={group}
      onPointerMove={(e) => {
        e.stopPropagation()
        if (e.pointerType === 'mouse' || e.pointerType === 'ray') useView.getState().hover(pick(e))
      }}
      onPointerOut={() => useView.getState().hover(null)}
      onClick={(e) => {
        e.stopPropagation()
        if (dragDistance(e) > 6) return // a drag to orbit, not a click
        const id = pick(e)
        const v = useView.getState()
        if (v.mode === 'study' && v.question?.mode === 'locate' && !v.question.result) v.answerLocate(getStructure(id))
        else if (v.mode === 'explore') v.select(id)
      }}
    >
      {[...loadedOnce.current].map((id) => (
        <SystemBoundary key={id} id={id}>
          <Suspense fallback={<LoadingMark id={id} />}>
            <SystemModel id={id} />
          </Suspense>
        </SystemBoundary>
      ))}
    </group>
  )
}

function isShown(o: Object3D | null): boolean {
  for (let n = o; n; n = n.parent) if (!n.visible) return false
  return true
}


/** Pixels moved between press and release. XR pointer events have no screen delta (reading it throws). */
function dragDistance(e: { delta?: number }): number {
  try {
    return e.delta ?? 0
  } catch {
    return 0
  }
}
