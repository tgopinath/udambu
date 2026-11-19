// "Function" animations on the real meshes: a beating heart (atria, then ventricles) and breathing
// (lungs expand from the apex, diaphragm descends). Illustrative motion; timing from engine/physiology.
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Box3, Vector3, type Mesh } from 'three'
import { center, type Structure } from '@/engine/anatomy'
import { breathing, cardiac } from '@/engine/physiology'
import { getIndex } from '@/state/indexData'
import { useView } from '@/state/viewStore'
import { meshesOf } from './registry'

interface Part {
  mesh: Mesh
  origPos: Vector3
  origScale: Vector3
  pivotLocal: Vector3
}

interface Group {
  ids: string[]
  pivot: Vector3
  parts: Part[] | null
}

const HEART_CHAMBERS = ['Left atrium', 'Right atrium', 'Left ventricle', 'Right ventricle']
const ATRIAL = /atri|auricle|pulmonary vein|sinus|venae cavae/i

function boxOf(list: Structure[]): Box3 {
  const b = new Box3()
  for (const s of list) b.union(new Box3(new Vector3(...s.min), new Vector3(...s.max)))
  return b
}

/** Heart = cardiovascular structures centred inside the box of the four chambers. */
export function heartGroups(index: readonly Structure[]): { atria: string[]; ventricles: string[]; pivot: Vector3 } {
  const chambers = index.filter((s) => s.system === 'cardiovascular' && HEART_CHAMBERS.includes(s.base))
  const box = boxOf(chambers).expandByScalar(0.004)
  const inHeart = index.filter((s) => s.system === 'cardiovascular' && box.containsPoint(new Vector3(...center(s))))
  return {
    atria: inHeart.filter((s) => ATRIAL.test(s.base)).map((s) => s.id),
    ventricles: inHeart.filter((s) => !ATRIAL.test(s.base)).map((s) => s.id),
    pivot: box.getCenter(new Vector3()),
  }
}

/** Lungs by side, pivoting at each lung's apex so they expand downward and outward. */
export function lungGroups(index: readonly Structure[]): { side: 'left' | 'right'; ids: string[]; pivot: Vector3 }[] {
  const lung = index.filter((s) => s.system === 'visceral' && /lung|bronch/i.test(s.base))
  return (['left', 'right'] as const).map((side) => {
    const list = lung.filter((s) => (/left lung/i.test(s.base) ? 'left' : /right lung/i.test(s.base) ? 'right' : center(s)[0] > 0 ? 'left' : 'right') === side)
    const b = boxOf(list)
    const c = b.getCenter(new Vector3())
    return { side, ids: list.map((s) => s.id), pivot: new Vector3(c.x, b.max.y, c.z) }
  })
}

function bind(g: Group): Part[] | null {
  const parts: Part[] = []
  for (const id of g.ids)
    for (const mesh of meshesOf(id)) {
      const parent = mesh.parent
      if (!parent) continue
      parent.updateWorldMatrix(true, false)
      parts.push({ mesh, origPos: mesh.position.clone(), origScale: mesh.scale.clone(), pivotLocal: parent.worldToLocal(g.pivot.clone()) })
    }
  return parts.length ? parts : null
}

const tmp = new Vector3()
function scaleAbout(parts: Part[], s: number, dy = 0) {
  for (const p of parts) {
    tmp.copy(p.origPos).sub(p.pivotLocal).multiplyScalar(s).add(p.pivotLocal)
    p.mesh.position.set(tmp.x, tmp.y + dy, tmp.z)
    p.mesh.scale.copy(p.origScale).multiplyScalar(s)
  }
}
function restore(parts: Part[] | null) {
  if (!parts) return
  for (const p of parts) {
    p.mesh.position.copy(p.origPos)
    p.mesh.scale.copy(p.origScale)
  }
}

export function Animator() {
  const anim = useView((s) => s.anim)
  const loading = useView((s) => s.loading)
  const groups = useRef<{ atria: Group; ventricles: Group; lungs: Group[]; diaphragm: Group } | null>(null)

  // (Re)bind meshes whenever a layer finishes loading.
  useEffect(() => {
    const index = getIndex()
    if (!index) return
    const h = heartGroups(index)
    const dia = index.filter((s) => s.system === 'muscular' && s.base === 'Diaphragm')
    const g = {
      atria: { ids: h.atria, pivot: h.pivot, parts: null },
      ventricles: { ids: h.ventricles, pivot: h.pivot, parts: null },
      lungs: lungGroups(index).map((l) => ({ ids: l.ids, pivot: l.pivot, parts: null })),
      diaphragm: { ids: dia.map((s) => s.id), pivot: new Vector3(), parts: null },
    } as { atria: Group; ventricles: Group; lungs: Group[]; diaphragm: Group }
    for (const grp of [g.atria, g.ventricles, ...g.lungs, g.diaphragm]) grp.parts = bind(grp)
    const prev = groups.current
    groups.current = g
    return () => {
      if (prev) for (const grp of [prev.atria, prev.ventricles, ...prev.lungs, prev.diaphragm]) restore(grp.parts)
    }
  }, [loading])

  useEffect(() => {
    const g = groups.current
    if (!g) return
    if (!anim.heart) [g.atria, g.ventricles].forEach((x) => restore(x.parts))
    if (!anim.breath) [...g.lungs, g.diaphragm].forEach((x) => restore(x.parts))
  }, [anim.heart, anim.breath])

  useFrame(() => {
    const g = groups.current
    if (!g || (!anim.heart && !anim.breath)) return
    const t = performance.now() / 1000
    if (anim.heart) {
      const c = cardiac(t, anim.bpm)
      if (g.atria.parts) scaleAbout(g.atria.parts, 1 - 0.07 * c.atria)
      if (g.ventricles.parts) scaleAbout(g.ventricles.parts, 1 - 0.1 * c.ventricles)
    }
    if (anim.breath) {
      const b = breathing(t, anim.rpm)
      for (const l of g.lungs) if (l.parts) scaleAbout(l.parts, 1 + 0.05 * b.depth)
      if (g.diaphragm.parts) scaleAbout(g.diaphragm.parts, 1, -0.018 * b.depth)
    }
  })
  return null
}
