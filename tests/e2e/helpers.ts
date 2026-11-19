// Helpers that drive the REAL 3D scene. The page exposes a read-only `window.__al` bridge
// (dev builds / ?e2e) that reports where structures are on screen and the current view state.
import { expect, type Page } from '@playwright/test'

type Bridge = Record<string, (...a: unknown[]) => unknown>

export const al = <T,>(page: Page, fn: string, ...args: unknown[]) =>
  page.evaluate(([f, a]) => (window as unknown as { __al: Bridge }).__al[f as string]!(...(a as unknown[])), [fn, args] as const) as Promise<T>

export interface ViewInfo {
  selectedId: string | null
  mode: string
  isolated: string[] | null
  hidden: string[]
  loading: Record<string, string>
  question: null | { mode: string; target: { id: string; base: string }; options: string[]; result: null | { correct: boolean } }
  inXR: boolean
}

export const view = (page: Page) => al<ViewInfo>(page, 'view')

/** Open the lab and wait until the skeleton is loaded and frames are rendering. */
export async function openLab(page: Page, path = '/lab/#/') {
  await page.goto(path)
  await page.waitForFunction(() => 'view' in ((window as unknown as { __al?: object }).__al ?? {}), null, { timeout: 60_000 })
  await expect.poll(async () => (await view(page)).loading.skeletal, { timeout: 60_000 }).toBe('ready')
  await waitFrames(page, 10)
}

export async function waitFrames(page: Page, n: number) {
  const start = await al<number>(page, 'frames')
  await expect.poll(() => al<number>(page, "frames"), { timeout: 90_000 }).toBeGreaterThanOrEqual(start + n)
}

/** Wait for the orbit camera to stop moving (fit/focus animations). */
export async function settleCamera(page: Page) {
  let last = ''
  for (let i = 0; i < 60; i++) {
    await waitFrames(page, 3)
    const cam = JSON.stringify(await al(page, 'camera'))
    if (cam === last) return
    last = cam
  }
}

export async function clickStructure(page: Page, id: string) {
  const p = await al<{ x: number; y: number } | null>(page, 'visiblePoint', id)
  if (!p) throw new Error(`${id} not on screen`)
  await page.mouse.click(p.x, p.y)
}
