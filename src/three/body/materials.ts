// Realistic tissue palette, keyed by the model's material group names. One shared material per
// (system, tissue) so opacity and clipping change for a whole layer in one place.
import { Color, DoubleSide, FrontSide, MeshStandardMaterial, Plane, Vector3, type Material } from 'three'
import type { SystemId } from '@/engine/anatomy'

const TISSUE: [RegExp, string, number][] = [
  [/^bone/i, '#e9dfc9', 0.62],
  [/suture/i, '#cfc4ad', 0.7],
  [/teeth|dentine/i, '#f3efe6', 0.35],
  [/cartilage/i, '#cfe1e3', 0.45],
  [/ligament|capsule/i, '#dfe6e8', 0.5],
  [/tendon/i, '#efe7dc', 0.45],
  [/fascia/i, '#c9d3d8', 0.6],
  [/bursa/i, '#9fc6d1', 0.4],
  [/fat/i, '#e7cf8f', 0.6],
  [/pulmonary artery/i, '#3f63b8', 0.4],
  [/pulmonary vein/i, '#c0413f', 0.4],
  [/artery/i, '#b8312f', 0.38],
  [/vein/i, '#33489a', 0.4],
  [/nerve/i, '#f0d27a', 0.5],
  [/white matter/i, '#ece7df', 0.6],
  [/nucleus|brain|lobe|cerebellum|lcr/i, '#d9a79a', 0.55],
  [/eye|cornea|iris/i, '#e9edf0', 0.2],
  [/lung|bronchi/i, '#d9908a', 0.6],
  [/intestine|mucosa|peritoneum/i, '#cc7f72', 0.55],
  [/gallbladder/i, '#5f7d3a', 0.45],
  [/gland|organ/i, '#a8524a', 0.5],
  [/lymph/i, '#7dbb8c', 0.5],
  [/ductus/i, '#d8d4c4', 0.5],
]
const MUSCLE = ['#b4463e', 0.55] as const

/** Shared clipping plane for the cross-section tool. Disabled by pushing it far away. */
export const clipPlane = new Plane(new Vector3(0, -1, 0), 1e6)

const cache = new Map<string, MeshStandardMaterial>()

export function tissueMaterial(system: SystemId, sourceName: string | undefined, sourceColor?: Color): MeshStandardMaterial {
  const name = sourceName ?? ''
  const key = `${system}|${name}`
  const hit = cache.get(key)
  if (hit) return hit
  const rule = TISSUE.find(([re]) => re.test(name))
  const isMuscle = !rule && (system === 'muscular' || /trapezius|rotator|diaphragm|orbicularis/i.test(name))
  const color = rule ? rule[1] : isMuscle ? MUSCLE[0] : sourceColor ? '#' + sourceColor.getHexString() : '#c9b8a8'
  const roughness = rule ? rule[2] : MUSCLE[1]
  const m = new MeshStandardMaterial({ color, roughness, metalness: 0, clippingPlanes: [clipPlane], clipShadows: true, side: DoubleSide })
  m.userData.system = system
  cache.set(key, m)
  return m
}

export function systemMaterials(system: SystemId): MeshStandardMaterial[] {
  return [...cache.values()].filter((m) => m.userData.system === system)
}

export function setSystemOpacity(system: SystemId, opacity: number) {
  for (const m of systemMaterials(system)) {
    const transparent = opacity < 0.999
    if (m.transparent !== transparent) m.needsUpdate = true
    m.transparent = transparent
    m.opacity = opacity
    m.depthWrite = !transparent
  }
}

// The selection draws on top of other layers (x-ray style), so it stays visible inside see-through muscle.
export const selectedMaterial = new MeshStandardMaterial({ color: '#7fd8ff', emissive: '#0a8fc7', emissiveIntensity: 0.55, roughness: 0.4, clippingPlanes: [clipPlane], side: FrontSide, depthTest: false, transparent: true, opacity: 0.92 })
export const hoverMaterial = new MeshStandardMaterial({ color: '#99f6e4', emissive: '#0f766e', emissiveIntensity: 0.25, roughness: 0.45, clippingPlanes: [clipPlane], side: DoubleSide })
export const wrongMaterial = new MeshStandardMaterial({ color: '#fdba74', emissive: '#c2410c', emissiveIntensity: 0.35, roughness: 0.45, clippingPlanes: [clipPlane], side: DoubleSide })

export function isHighlight(m: Material) {
  return m === selectedMaterial || m === hoverMaterial || m === wrongMaterial
}
