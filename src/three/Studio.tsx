// A calm, neutral study room: soft key/fill/rim lights, a local light-former environment
// (no HDR download), a turntable plinth and a floor you can teleport on in VR.
import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { TeleportTarget } from '@react-three/xr'
import { usePlayerStore, clampToBounds } from '@/state/playerStore'
import { useLab } from '@/state/labStore'
import { useView } from '@/state/viewStore'

export function Studio() {
  return (
    <>
      <color attach="background" args={['#06080c']} />
      <fog attach="fog" args={['#06080c', 6, 16]} />
      <hemisphereLight args={['#dfe8f0', '#1a222c', 0.55]} />
      <directionalLight position={[2.5, 4, 3]} intensity={1.6} color="#fff6ea" />
      <directionalLight position={[-3, 2.5, -2]} intensity={0.7} color="#bcd7ff" />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2.2} position={[0, 4, 2]} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={0.8} position={[-4, 2, -1]} rotation-y={Math.PI / 2} scale={[4, 3, 1]} color="#cfe3ff" />
        <Lightformer form="rect" intensity={0.6} position={[4, 1.5, 1]} rotation-y={-Math.PI / 2} scale={[4, 3, 1]} color="#ffe9d6" />
      </Environment>

      {/* plinth */}
      <mesh position={[0, -0.02, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.55, 0.6, 0.04, 64]} />
        <meshStandardMaterial color="#1b2530" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]} raycast={() => null}>
        <ringGeometry args={[0.54, 0.56, 96]} />
        <meshBasicMaterial color="#3ec6ff" transparent opacity={0.5} />
      </mesh>
      <StaticShadow />

      <TeleportTarget
        onTeleport={(p) => {
          let [x, z] = clampToBounds(p.x, p.z, usePlayerStore.getState().bounds)
          // Never land inside the body/plinth: push the landing point out to 0.7 m.
          const r = Math.hypot(x, z)
          if (r < 0.7) {
            const k = r > 1e-3 ? 0.7 / r : 0
            ;[x, z] = r > 1e-3 ? [x * k, z * k] : [0, 0.7]
          }
          usePlayerStore.setState({ x, z })
        }}
      >
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.04, 0]} name="floor">
          <circleGeometry args={[4, 64]} />
          <meshStandardMaterial color="#111a23" roughness={0.9} />
        </mesh>
      </TeleportTarget>
      <gridHelper args={[8, 32, '#1f2b37', '#16202a']} position={[0, -0.039, 0]} />
    </>
  )
}

/**
 * Soft contact shadow under the body, rendered once and refreshed only when the visible layers change
 * (re-rendering it every frame costs a full extra pass of a multi-million-triangle scene).
 */
function StaticShadow() {
  const systems = useLab((s) => s.systems)
  const loading = useView((s) => s.loading)
  const key = JSON.stringify([Object.values(systems).map((v) => v.visible), loading])
  return <ContactShadows key={key} frames={1} position={[0, 0.002, 0]} scale={2.4} blur={2.4} opacity={0.55} far={1.8} resolution={512} color="#000000" />
}
