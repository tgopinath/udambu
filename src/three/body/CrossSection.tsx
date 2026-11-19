// Moves the shared clipping plane for axial / sagittal / coronal cuts and draws a faint guide frame.
import { Edges } from '@react-three/drei'
import { useEffect } from 'react'
import { useView, type ClipAxis } from '@/state/viewStore'
import { clipPlane } from './materials'

/** Body extents in metres (life-size model standing at the origin, facing +Z). */
export const BODY = { minX: -0.36, maxX: 0.36, minY: 0, maxY: 1.76, minZ: -0.16, maxZ: 0.2 }

export function clipPosition(axis: Exclude<ClipAxis, 'none'>, t: number): number {
  if (axis === 'axial') return BODY.minY + t * (BODY.maxY - BODY.minY)
  if (axis === 'sagittal') return BODY.minX + t * (BODY.maxX - BODY.minX)
  return BODY.minZ + t * (BODY.maxZ - BODY.minZ)
}

export function CrossSection() {
  const clip = useView((s) => s.clip)

  useEffect(() => {
    if (clip.axis === 'none') {
      clipPlane.normal.set(0, -1, 0)
      clipPlane.constant = 1e6 // effectively off
      return
    }
    const d = clipPosition(clip.axis, clip.pos)
    const s = clip.flip ? -1 : 1
    // Visible side: distance >= 0. Default keeps below (axial), patient's right (sagittal), back (coronal).
    if (clip.axis === 'axial') clipPlane.normal.set(0, -s, 0)
    else if (clip.axis === 'sagittal') clipPlane.normal.set(-s, 0, 0)
    else clipPlane.normal.set(0, 0, -s)
    clipPlane.constant = s * d
  }, [clip])

  if (clip.axis === 'none') return null
  const d = clipPosition(clip.axis, clip.pos)
  const w = BODY.maxX - BODY.minX + 0.2
  const h = BODY.maxY - BODY.minY + 0.1
  const dz = BODY.maxZ - BODY.minZ + 0.2
  const cy = (BODY.minY + BODY.maxY) / 2
  const props =
    clip.axis === 'axial'
      ? { position: [0, d, 0.02] as const, rotation: [-Math.PI / 2, 0, 0] as const, args: [w, dz] as const }
      : clip.axis === 'sagittal'
        ? { position: [d, cy, 0.02] as const, rotation: [0, Math.PI / 2, 0] as const, args: [dz, h] as const }
        : { position: [0, cy, d] as const, rotation: [0, 0, 0] as const, args: [w, h] as const }
  return (
    <mesh position={props.position} rotation={props.rotation} raycast={() => null}>
      <planeGeometry args={props.args} />
      <meshBasicMaterial color="#7fd8ff" transparent opacity={0.06} depthWrite={false} side={2} />
      <Edges color="#7fd8ff" />
    </mesh>
  )
}
