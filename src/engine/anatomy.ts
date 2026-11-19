// Anatomy data model + pure helpers (no React / three). Structure data is generated from the
// GLB files by tools/build-index.mjs, so names and positions always match the meshes.

export type SystemId = 'skeletal' | 'muscular' | 'joints' | 'cardiovascular' | 'nervous' | 'visceral' | 'lymphatic'

export interface Structure {
  id: string
  /** Name as stored in the model, e.g. "Femur.l". */
  name: string
  /** Name without side suffix, e.g. "Femur". */
  base: string
  side: 'left' | 'right' | null
  system: SystemId
  /** Source material/tissue group from the model. */
  material: string | null
  /** World-space bounding box in metres (body stands at origin, faces +Z, Y up). */
  min: [number, number, number]
  max: [number, number, number]
}

export interface SystemInfo {
  id: SystemId
  label: string
  color: string
  blurb: string
  /** Rough triangle count, to warn on standalone headsets. */
  triangles: number
}

export const SYSTEMS: SystemInfo[] = [
  { id: 'skeletal', label: 'Skeletal', color: '#e8dfcc', blurb: 'Bones, cartilage and teeth', triangles: 430_000 },
  { id: 'muscular', label: 'Muscular', color: '#c0544b', blurb: 'Skeletal muscles, tendons and fasciae', triangles: 1_190_000 },
  { id: 'joints', label: 'Joints & ligaments', color: '#b8c4cc', blurb: 'Ligaments, capsules, discs and membranes', triangles: 190_000 },
  { id: 'cardiovascular', label: 'Cardiovascular', color: '#c23b3b', blurb: 'Heart, arteries and veins', triangles: 2_520_000 },
  { id: 'nervous', label: 'Nervous', color: '#e3c25a', blurb: 'Brain, spinal cord, nerves and nuclei', triangles: 1_420_000 },
  { id: 'visceral', label: 'Organs', color: '#d58b7a', blurb: 'Digestive, respiratory and urinary organs', triangles: 690_000 },
  { id: 'lymphatic', label: 'Lymphatic', color: '#6fb38a', blurb: 'Lymph nodes, vessels and thymus', triangles: 93_000 },
]

export const SYSTEM_BY_ID = Object.fromEntries(SYSTEMS.map((s) => [s.id, s])) as Record<SystemId, SystemInfo>

export function displayName(s: Pick<Structure, 'base' | 'side'>): string {
  const base = s.base.replace(/^\((.*)\)$/, '$1')
  return s.side ? `${base} (${s.side})` : base
}

export function center(s: Pick<Structure, 'min' | 'max'>): [number, number, number] {
  return [(s.min[0] + s.max[0]) / 2, (s.min[1] + s.max[1]) / 2, (s.min[2] + s.max[2]) / 2]
}

/** Bounding box size in centimetres, rounded. */
export function sizeCm(s: Pick<Structure, 'min' | 'max'>): [number, number, number] {
  return [0, 1, 2].map((i) => Math.round((s.max[i]! - s.min[i]!) * 1000) / 10) as [number, number, number]
}

export function diagonal(s: Pick<Structure, 'min' | 'max'>): number {
  return Math.hypot(s.max[0] - s.min[0], s.max[1] - s.min[1], s.max[2] - s.min[2])
}

export function pairOf(index: readonly Structure[], s: Structure): Structure | null {
  if (!s.side) return null
  return index.find((o) => o.system === s.system && o.base === s.base && o.side !== null && o.side !== s.side) ?? null
}

function norm(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export interface SearchHit {
  structure: Structure
  score: number
}

/**
 * Ranked name search. All query words must appear; exact name > name starts with query >
 * a word starts with the query > anywhere. Shorter names win ties. Left/right pairs collapse to one hit.
 */
export function search(index: readonly Structure[], query: string, limit = 20, systems?: ReadonlySet<SystemId>): SearchHit[] {
  const q = norm(query)
  if (!q) return []
  const words = q.split(' ')
  const seen = new Set<string>()
  const hits: SearchHit[] = []
  for (const s of index) {
    if (systems && !systems.has(s.system)) continue
    const key = `${s.system}|${s.base}`
    if (seen.has(key)) continue
    const n = norm(s.base)
    if (!words.every((w) => n.includes(w))) continue
    const rank = n === q ? 100 : n.startsWith(q) ? 80 : n.split(' ').some((w) => w.startsWith(words[0]!)) ? 60 : 40
    const score = rank - Math.min(n.length, 80) / 10
    seen.add(key)
    hits.push({ structure: s, score })
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}

/** Gap between two bounding boxes in metres (0 when they touch or overlap). */
export function boxGap(a: Pick<Structure, 'min' | 'max'>, b: Pick<Structure, 'min' | 'max'>): number {
  let d = 0
  for (let i = 0; i < 3; i++) {
    const g = Math.max(0, a.min[i]! - b.max[i]!, b.min[i]! - a.max[i]!)
    d += g * g
  }
  return Math.sqrt(d)
}

/**
 * Structures next to this one: smallest bounding-box gap first (touching = 0), ties broken by
 * centre distance. Excludes the structure itself and its mirror twin; one entry per name.
 */
export function neighbors(index: readonly Structure[], s: Structure, k = 6, systems?: ReadonlySet<SystemId>): Structure[] {
  const c = center(s)
  const out: { o: Structure; gap: number; d: number }[] = []
  for (const o of index) {
    if (o.id === s.id || (o.base === s.base && o.system === s.system)) continue
    if (systems && !systems.has(o.system)) continue
    const oc = center(o)
    out.push({ o, gap: boxGap(s, o), d: (oc[0] - c[0]) ** 2 + (oc[1] - c[1]) ** 2 + (oc[2] - c[2]) ** 2 })
  }
  out.sort((a, b) => a.gap - b.gap || a.d - b.d)
  const names = new Set<string>()
  const res: Structure[] = []
  for (const { o } of out) {
    if (names.has(o.base)) continue
    names.add(o.base)
    res.push(o)
    if (res.length >= k) break
  }
  return res
}

/** Readable tissue label from the model's material group names. */
export function tissueLabel(material: string | null): string | null {
  if (!material) return null
  return material.replace(/[-_]\d+$/, '').replace(/[-_]/g, ' ')
}

export type AreaId = 'head' | 'neck' | 'thorax' | 'abdomen' | 'pelvis' | 'upperLimb' | 'lowerLimb'

export const AREAS: { id: AreaId; label: string }[] = [
  { id: 'head', label: 'Head' },
  { id: 'neck', label: 'Neck' },
  { id: 'thorax', label: 'Thorax' },
  { id: 'abdomen', label: 'Abdomen' },
  { id: 'pelvis', label: 'Pelvis' },
  { id: 'upperLimb', label: 'Upper limb' },
  { id: 'lowerLimb', label: 'Lower limb' },
]

/**
 * Body area from the structure's centre on this life-size model (approximate: long structures that
 * cross areas are filed under the area that holds their centre).
 */
export function areaOf(s: Pick<Structure, 'min' | 'max'>): AreaId {
  const [x, y] = center(s)
  if (y >= 1.49) return 'head'
  if (Math.abs(x) >= 0.155 && y >= 0.72) return 'upperLimb'
  if (y >= 1.42) return 'neck'
  if (y >= 1.17) return 'thorax'
  if (y >= 0.95) return 'abdomen'
  if (y >= 0.72) return 'pelvis'
  return 'lowerLimb'
}

/** Major organs/parts that this male atlas does not model, so the app can say so instead of inventing them. */
export const NOT_IN_MODEL = ['Skin', 'Larynx (as one organ)', 'Ileum', 'Caecum', 'Rectum and anus', 'Female reproductive organs', 'Breasts']
