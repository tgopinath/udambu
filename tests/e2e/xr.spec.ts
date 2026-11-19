// WebXR emulator test (IWER, Meta Quest 3 profile). Drives emulated controllers to:
// enter VR → teleport → ray + trigger on a bone to select it → ray + trigger on the VR panel's
// "Isolate" button → exit VR.
// This verifies the shared interaction code path for XR input. It does NOT replace on-device Quest testing.
import { expect, test, type Page } from '@playwright/test'
import { openLab, view } from './helpers'

type V3 = [number, number, number]

const ww = <T,>(page: Page, fn: string, ...args: unknown[]) =>
  page.evaluate(([f, a]) => (window as unknown as { __al: Record<string, (...x: unknown[]) => unknown> }).__al[f as string]!(...(a as unknown[])), [fn, args] as const) as Promise<T>

/** Controller poses are relative to the XR origin (player position, yaw 0 in these tests). */
async function toLocal(page: Page, world: V3): Promise<V3> {
  const p = await ww<{ x: number; z: number }>(page, 'player')
  return [world[0] - p.x, world[1], world[2] - p.z]
}

async function aim(page: Page, hand: 'left' | 'right', fromLocal: V3, targetWorld: V3) {
  const to = await toLocal(page, targetWorld)
  await page.evaluate(
    ([h, from, t]) => {
      const c = (window as unknown as { __iwer: { controllers: Record<string, { position: { set(...v: number[]): void }; quaternion: { set(...v: number[]): void } }> } }).__iwer.controllers[h as string]!
      const f = from as number[]
      const g = t as number[]
      c.position.set(f[0]!, f[1]!, f[2]!)
      let b = [g[0]! - f[0]!, g[1]! - f[1]!, g[2]! - f[2]!]
      const L = Math.hypot(...b)
      b = b.map((v) => v / L)
      // Rotation taking −Z onto b.
      const cx = 0 * b[2]! - -1 * b[1]!
      const cy = -1 * b[0]! - 0 * b[2]!
      const cz = 0
      const w = 1 - b[2]!
      const n = Math.hypot(cx, cy, cz, w)
      c.quaternion.set(cx / n, cy / n, cz / n, w / n)
    },
    [hand, fromLocal, to] as const,
  )
  await wiggle(page, hand)
}

/**
 * Real hands never hold perfectly still, and the pointer library re-intersects when a controller moves.
 * Emulated poses are static, so nudge the controller by a millimetre for a few frames after each pose change.
 */
async function wiggle(page: Page, hand: 'left' | 'right') {
  for (let i = 0; i < 4; i++) {
    await page.evaluate(
      ([h, d]) => {
        const c = (window as unknown as { __iwer: { controllers: Record<string, { position: { x: number } }> } }).__iwer.controllers[h as string]!
        c.position.x += d as number
      },
      [hand, i % 2 ? -0.001 : 0.001] as const,
    )
    await waitFrames(page, 2)
  }
}

async function waitFrames(page: Page, n: number) {
  const start = await ww<number>(page, 'frames')
  await expect.poll(() => ww<number>(page, 'frames'), { timeout: 30_000 }).toBeGreaterThanOrEqual(start + n)
}

/** A trigger pull held for two rendered frames, so it is sampled at any frame rate (and stays under the 700 ms click window). */
async function click(page: Page, hand: 'left' | 'right') {
  await page.evaluate(async (h) => {
    const w = window as unknown as { __iwer: { controllers: Record<string, { updateButtonValue(id: string, v: number): void }> }; __al: { frames(): number } }
    const c = w.__iwer.controllers[h]!
    const until = async (n: number) => {
      const start = w.__al.frames()
      while (w.__al.frames() < start + n) await new Promise((r) => setTimeout(r, 10))
    }
    c.updateButtonValue('trigger', 1)
    await until(2)
    c.updateButtonValue('trigger', 0)
    await until(2)
  }, hand)
}

test('VR (emulated Quest 3): teleport, ray-select a bone, use the VR panel, exit', async ({ page }) => {
  test.setTimeout(240_000) // software-rendered WebXR runs at a few fps
  await openLab(page, '/lab/?xr=emulate&xrui=off#/')
  await page.getByTestId('enter-vr').click()
  await expect.poll(() => ww<string | undefined>(page, 'xrVisibility'), { timeout: 30_000 }).toBe('visible')
  await expect.poll(async () => (await ww<unknown[]>(page, 'xr')).length, { timeout: 30_000 }).toBe(2) // both controllers tracked

  // Teleport: push the left stick forward (arc appears), aim at the floor beside the body, pull the trigger.
  const before = await ww<{ x: number; z: number }>(page, 'player')
  const stick = (y: number) => page.evaluate((v) => (window as unknown as { __iwer: { controllers: Record<string, { updateAxes(id: string, x: number, y: number): void }> } }).__iwer.controllers.left!.updateAxes('thumbstick', 0, v), y)
  const moved = async () => {
    const p = await ww<{ x: number; z: number }>(page, 'player')
    return Math.hypot(p.x - before.x, p.z - before.z)
  }
  for (let attempt = 0; attempt < 3 && (await moved()) < 0.5; attempt++) {
    await stick(-1)
    await waitFrames(page, 4)
    await aim(page, 'left', [-0.2, 1.2, -0.2], [before.x - 1.0, 0, before.z - 1.0])
    await click(page, 'left')
    await stick(0)
    await waitFrames(page, 4)
  }
  expect(await moved()).toBeGreaterThan(0.5)
  await waitFrames(page, 4)

  // Ray + trigger on the skull (any skull bone the ray meets first counts as a selection).
  const skull = await ww<V3>(page, 'world', 'skeletal:Frontal bone')
  await aim(page, 'right', [0.2, 1.3, -0.2], skull)
  await click(page, 'right')

  await expect.poll(async () => (await view(page)).selectedId ?? '', { timeout: 30_000 }).toMatch(/^skeletal:(Frontal|Parietal|Temporal|Occipital|Sphenoid|Zygomatic)/)
  const picked = (await view(page)).selectedId!

  // The in-VR panel shows the selection; its Isolate button works with the ray too.
  const panelIsolate = await ww<V3 | null>(page, 'vrButton', 'Isolate')
  expect(panelIsolate).not.toBeNull()
  await aim(page, 'right', [0.2, 1.3, -0.2], panelIsolate!)
  await click(page, 'right')
  await expect.poll(async () => (await view(page)).isolated, { timeout: 30_000 }).toEqual([picked])

  // Last (it loads the dense vessel layer, which slows software rendering): the panel's Heartbeat button.
  const hb = await ww<V3>(page, 'vrButton', 'Heartbeat')
  await aim(page, 'right', [0.2, 1.3, -0.2], hb)
  await click(page, 'right')
  await expect.poll(async () => ((await view(page)) as unknown as { anim: { heart: boolean } }).anim.heart, { timeout: 30_000 }).toBe(true)



  // Exit VR safely via the session end path used by the panel's "Exit VR" button.
  await ww(page, 'exitVR')
  await expect.poll(() => ww<string | undefined>(page, 'xrVisibility')).toBeUndefined()
})
