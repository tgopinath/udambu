// VR player rig: XR origin placed at the player position, snap/smooth turning around the head,
// thumbstick-gated teleport arcs (landing handled by the Studio floor), optional comfort vignette.
import { useFrame, useThree } from '@react-three/fiber'
import { XROrigin, useXRControllerLocomotion } from '@react-three/xr'
import { useEffect, useRef } from 'react'
import { MathUtils, Vector3, type Group, type Mesh, type MeshBasicMaterial } from 'three'
import { useLab } from '@/state/labStore'
import { usePlayerStore } from '@/state/playerStore'
import { setControllerTeleport, xrStore } from '../xr'

const head = new Vector3()

export function XRRig() {
  const origin = useRef<Group>(null)
  const camera = useThree((s) => s.camera)
  const comfort = useLab((s) => s.comfort)
  const turning = useRef(0)

  const arc = useRef({ left: false, right: false })

  // Push a thumbstick forward to show the teleport arc on that hand; pull the trigger to land; let go to hide it.
  useFrame(() => {
    for (const st of xrStore.getState().inputSourceStates) {
      if (st.type !== 'controller') continue
      const hand = st.inputSource.handedness
      if (hand !== 'left' && hand !== 'right') continue
      const y = st.gamepad['xr-standard-thumbstick']?.yAxis ?? 0
      const want = comfort.teleport && (y < -0.6 || (arc.current[hand] && y < -0.25))
      if (want !== arc.current[hand]) {
        arc.current[hand] = want
        setControllerTeleport(hand, want)
      }
    }
  })
  useEffect(
    () => () => {
      // Leaving VR: reset arcs so the next session starts clean.
      for (const hand of ['left', 'right'] as const) if (arc.current[hand]) setControllerTeleport(hand, false)
      arc.current = { left: false, right: false }
    },
    [],
  )

  useXRControllerLocomotion(
    (_velocity, yChange) => {
      if (!yChange || !origin.current) return
      // Rotate around the head, not the origin, so the world doesn't swing past the player.
      const p = usePlayerStore.getState()
      camera.getWorldPosition(head)
      const ox = p.x - head.x
      const oz = p.z - head.z
      const c = Math.cos(yChange)
      const s = Math.sin(yChange)
      p.setPose({ x: head.x + ox * c + oz * s, z: head.z - ox * s + oz * c, yaw: p.yaw + yChange })
      if (comfort.turn === 'smooth') turning.current = 0.25
    },
    false, // no thumbstick sliding — teleport only (comfort)
    comfort.turn === 'snap' ? { type: 'snap', degrees: comfort.snapDegrees } : { type: 'smooth', speed: 1.5 },
  )

  useFrame(() => {
    const o = origin.current
    if (!o) return
    const p = usePlayerStore.getState()
    o.position.set(p.x, 0, p.z)
    o.rotation.set(0, p.yaw, 0)
  })

  return (
    <>
      <XROrigin ref={origin} />
      {comfort.vignette && <ComfortVignette activity={turning} />}
    </>
  )
}

/** Darkens peripheral vision briefly while smooth-turning. Never flashes; fades over ~200ms. */
function ComfortVignette({ activity }: { activity: React.RefObject<number> }) {
  const group = useRef<Group>(null)
  const mesh = useRef<Mesh>(null)
  const camera = useThree((s) => s.camera)
  useFrame((_, delta) => {
    const m = mesh.current
    const g = group.current
    if (!m || !g) return
    activity.current = Math.max(0, activity.current - delta)
    const mat = m.material as MeshBasicMaterial
    mat.opacity = MathUtils.lerp(mat.opacity, activity.current > 0 ? 0.85 : 0, 1 - Math.exp(-delta * 10))
    m.visible = mat.opacity > 0.01
    camera.getWorldPosition(g.position)
    camera.getWorldQuaternion(g.quaternion)
  })
  return (
    <group ref={group}>
      <mesh ref={mesh} position={[0, 0, -0.15]} renderOrder={999} visible={false}>
        <ringGeometry args={[0.09, 0.6, 48]} />
        <meshBasicMaterial color="#0b1020" transparent opacity={0} depthTest={false} depthWrite={false} />
      </mesh>
    </group>
  )
}
