import { expect, test } from '@playwright/test'
import { al, openLab, settleCamera, view, waitFrames } from './helpers'

test('build your own body: add organs one by one, show only them, and it persists', async ({ page }) => {
  await openLab(page)
  await page.getByRole('tab', { name: 'Parts' }).click()
  await page.getByLabel('Filter parts').fill('stomach')
  await page.getByRole('button', { name: 'Add Stomach' }).click()
  await expect.poll(async () => (await view(page)).loading.visceral, { timeout: 60_000 }).toBe('ready')
  await page.getByLabel('Filter parts').fill('femur')
  await page.getByLabel('Parts system').selectOption('skeletal')
  await page.getByRole('button', { name: 'Add Femur (left)' }).click()
  await expect(page.getByTestId('built-count')).toHaveText('2 added')
  await expect(page.getByLabel('Show only my parts')).toBeChecked()
  // Only the added parts render.
  expect(await page.evaluate(() => (window as unknown as { __al: { visibleIds(): string[] } }).__al.visibleIds())).toEqual(['skeletal:Femur.l', 'visceral:Stomach'])
  await page.getByRole('button', { name: 'Remove Femur (left)' }).click()
  await expect(page.getByTestId('built-count')).toHaveText('1 added')

  await page.reload()
  await openLab(page)
  await page.getByRole('tab', { name: 'Parts' }).click()
  await expect(page.getByTestId('built-count')).toHaveText('1 added')
})

test('animations: heartbeat cycles through its phases and breathing moves the lungs', async ({ page }) => {
  await openLab(page)
  await page.getByTestId('functions').getByRole('button', { name: 'Play' }).first().click()
  await expect.poll(async () => (await view(page)).loading.cardiovascular, { timeout: 90_000 }).toBe('ready')
  const phases = new Set<string>()
  for (let i = 0; i < 300 && phases.size < 3; i++) {
    phases.add((await page.getByTestId('heart-phase').innerText()).split(' · ')[0]!)
    await page.waitForTimeout(40)
  }
  expect([...phases].sort()).toEqual(['Atrial systole', 'Diastole', 'Ventricular systole'])
  // The real ventricle mesh changes size during the cycle.
  const scales = new Set<number>()
  for (let i = 0; i < 20; i++) {
    scales.add(Math.round((await al<number>(page, 'meshScale', 'cardiovascular:Left ventricle')) * 1000))
    await waitFrames(page, 1)
  }
  expect(scales.size).toBeGreaterThan(2)

  await page.getByTestId('functions').getByRole('button', { name: 'Play' }).click() // breathing
  await expect.poll(async () => (await view(page)).loading.visceral, { timeout: 60_000 }).toBe('ready')
  await expect(page.getByTestId('breath-phase')).toContainText(/Inhale|Exhale/)
})

test('standard views around the body or the selected part', async ({ page }) => {
  await openLab(page)
  await settleCamera(page)
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await settleCamera(page)
  expect((await al<number[]>(page, 'camera'))[2]!).toBeLessThan(-1) // behind the body (-Z)
  await page.getByRole('button', { name: 'Left', exact: true }).click()
  await settleCamera(page)
  expect((await al<number[]>(page, 'camera'))[0]!).toBeGreaterThan(1) // patient's left is +X
  await page.getByRole('button', { name: 'Top', exact: true }).click()
  await settleCamera(page)
  expect((await al<number[]>(page, 'camera'))[1]!).toBeGreaterThan(2.5)
})
