// The structure index (~2,800 entries) is loaded lazily with the lab, not on the landing page.
import type { Structure } from '@/engine/anatomy'

let index: Structure[] | null = null
const byId = new Map<string, Structure>()
let pending: Promise<Structure[]> | null = null

export function loadIndex(): Promise<Structure[]> {
  if (index) return Promise.resolve(index)
  pending ??= import('@/data/structures.json').then((m) => {
    index = m.default as Structure[]
    for (const s of index) byId.set(s.id, s)
    return index
  })
  return pending
}

export const getIndex = () => index
export const getStructure = (id: string | null | undefined) => (id ? (byId.get(id) ?? null) : null)
