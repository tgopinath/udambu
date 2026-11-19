// Deep links into the Lab: #/?focus=<system>:<base> (from Explore's "See it in the Lab").
// Turns the layer on, then selects and frames the structure (left side first for paired parts).
import { SYSTEM_BY_ID, type Structure, type SystemId } from '@/engine/anatomy'
import { getIndex } from '@/state/indexData'
import { useLab } from '@/state/labStore'
import { useView } from '@/state/viewStore'
import { Shared } from '@/shared/udambu'

export function resolveFocus(index: readonly Structure[], value: string | null): { system: SystemId; target: Structure | null } | null {
  const f = Shared.parseFocus(value)
  if (!f || !(f.system in SYSTEM_BY_ID)) return null
  const system = f.system as SystemId
  if (!f.base) return { system, target: null }
  const same = index.filter((s) => s.system === system && s.base === f.base)
  const target = same.find((s) => s.side === 'left') ?? same[0] ?? null
  return target ? { system, target } : null
}

export function applyFocus(value: string) {
  const r = resolveFocus(getIndex() ?? [], value)
  if (!r) return false
  const lab = useLab.getState()
  const view = useView.getState()
  if (view.mode !== 'explore') view.setMode('explore')
  if (!lab.systems[r.system].visible) lab.setSystem(r.system, { visible: true })
  if (r.target) view.select(r.target.id, { focus: true })
  else view.frame(null)
  try {
    Shared.progress.setLab({ opened: { [value]: Date.now() } })
  } catch {
    /* progress is optional */
  }
  return true
}
