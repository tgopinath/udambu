// Maps structure ids to their loaded meshes, and applies visibility + highlight imperatively
// (no React re-render of 2,800 meshes when the selection changes).
import { type Material, type Mesh } from 'three'
import { useView } from '@/state/viewStore'
import { useLab } from '@/state/labStore'
import { hoverMaterial, isHighlight, selectedMaterial, wrongMaterial } from './materials'

const meshes = new Map<string, Mesh[]>()

export function registerStructure(id: string, list: Mesh[]) {
  meshes.set(id, list)
}

export function unregisterSystem(system: string) {
  for (const id of [...meshes.keys()]) if (id.startsWith(`${system}:`)) meshes.delete(id)
}

export function meshesOf(id: string): Mesh[] {
  return meshes.get(id) ?? []
}

export function structureIdOf(mesh: { userData: Record<string, unknown> }): string | null {
  return (mesh.userData.sid as string | undefined) ?? null
}

function setMat(list: Mesh[], mat: Material | null) {
  for (const m of list) {
    const base = m.userData.baseMat as Material
    m.material = mat ?? base
    m.renderOrder = mat === selectedMaterial ? 10 : 0
  }
}

/** Re-apply visibility for every registered mesh (isolate / hide / layer toggles). */
export function applyVisibility() {
  const { isolated, hidden, buildMode } = useView.getState()
  const built = useLab.getState().built
  const iso = isolated ? new Set(isolated) : buildMode ? new Set(built) : null
  const hid = new Set(hidden)
  for (const [id, list] of meshes) {
    const v = (!iso || iso.has(id)) && !hid.has(id)
    for (const m of list) m.visible = v
  }
}

let shown: { selected: string | null; hovered: string | null; wrong: string | null } = { selected: null, hovered: null, wrong: null }

export function applyHighlight() {
  const v = useView.getState()
  const wrong = v.question?.result && !v.question.result.correct ? v.question.result.pickedId : null
  // Hide the identity of the quiz target until the learner has answered a "locate" question.
  const hideSelection = v.question?.mode === 'locate' && !v.question.result
  const next = { selected: hideSelection ? null : v.selectedId, hovered: v.hoveredId, wrong }
  for (const id of [shown.selected, shown.hovered, shown.wrong]) if (id) setMat(meshesOf(id), null)
  if (next.hovered) setMat(meshesOf(next.hovered), hoverMaterial)
  if (next.wrong) setMat(meshesOf(next.wrong), wrongMaterial)
  if (next.selected) setMat(meshesOf(next.selected), selectedMaterial)
  shown = next
}

/** After materials are re-created (e.g. on load), make sure highlight state is consistent. */
export function refreshAll() {
  for (const list of meshes.values()) for (const m of list) if (isHighlight(m.material as Material)) m.material = m.userData.baseMat as Material
  shown = { selected: null, hovered: null, wrong: null }
  applyVisibility()
  applyHighlight()
}

useView.subscribe((s, p) => {
  if (s.isolated !== p.isolated || s.hidden !== p.hidden || s.buildMode !== p.buildMode) applyVisibility()
  if (s.selectedId !== p.selectedId || s.hoveredId !== p.hoveredId || s.question !== p.question) applyHighlight()
})
useLab.subscribe((s, p) => {
  if (s.systems !== p.systems) applyHighlight()
  if (s.built !== p.built && useView.getState().buildMode) applyVisibility()
})
