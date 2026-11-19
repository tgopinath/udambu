import { expect, test } from '@playwright/test'
import { clickStructure, openLab, settleCamera, view, waitFrames } from './helpers'

test('the Lab is one level of Udambu: the level switch goes back to Explore', async ({ page }) => {
  await openLab(page)
  await expect(page.getByRole('navigation', { name: 'Level' }).getByRole('link', { name: 'Explore' })).toBeVisible()
  await page.getByRole('navigation', { name: 'Level' }).getByRole('link', { name: 'Explore' }).click()
  await expect(page).toHaveURL(/\/#\/$/)
  await expect(page.getByRole('heading', { name: /Explore the human body/ })).toBeVisible()
})

test('click a bone on the model to inspect it, then isolate, hide and show all', async ({ page }) => {
  await openLab(page)
  await settleCamera(page)
  await clickStructure(page, 'skeletal:Femur.l')
  await expect.poll(async () => (await view(page)).selectedId).toBe('skeletal:Femur.l')
  await expect(page.getByTestId('details-name')).toHaveText('Femur (left)')
  await expect(page.getByTestId('details')).toContainText('longest and strongest bone')
  await expect(page.getByTestId('details')).toContainText('Patella')

  await page.getByRole('button', { name: 'Isolate' }).click()
  await expect.poll(async () => (await view(page)).isolated).toEqual(['skeletal:Femur.l', 'skeletal:Femur.r'])
  await page.getByRole('button', { name: 'Show all' }).first().click()
  await page.getByRole('button', { name: 'Hide' }).click()
  await expect.poll(async () => (await view(page)).hidden).toEqual(['skeletal:Femur.l'])
  await page.getByRole('button', { name: 'Show all' }).first().click()
  await expect.poll(async () => (await view(page)).hidden).toEqual([])
})

test('search turns on the right layer, selects the structure, and bookmarks persist', async ({ page }) => {
  await openLab(page)
  await page.getByLabel('Search structures').fill('sciatic')
  await page.getByRole('option', { name: /Sciatic nerve/ }).click()
  await expect.poll(async () => (await view(page)).loading.nervous, { timeout: 90_000 }).toBe('ready')
  await expect(page.getByTestId('details-name')).toContainText('Sciatic nerve')
  await expect(page.getByLabel('Show Nervous')).toBeChecked()
  await page.getByRole('button', { name: 'Bookmark' }).click()

  await page.reload()
  await openLab(page)
  await expect(page.getByLabel('Show Nervous')).toBeChecked() // layer choice persisted
  await page.getByRole('button', { name: /Sciatic nerve/ }).click() // bookmark persisted
  await expect(page.getByTestId('details-name')).toContainText('Sciatic nerve')
})

test('layers and cross-sections', async ({ page }) => {
  await openLab(page)
  await page.getByLabel('Show Organs').check()
  await expect.poll(async () => (await view(page)).loading.visceral, { timeout: 60_000 }).toBe('ready')
  await page.getByLabel('Organs opacity').fill('0.4')
  await page.getByRole('button', { name: 'Axial' }).click()
  await page.getByLabel('Cut position').fill('0.7')
  await waitFrames(page, 5)
  const clip = await page.evaluate(() => (window as unknown as { __al: { view(): { clip: { axis: string; pos: number } } } }).__al.view().clip)
  expect(clip).toMatchObject({ axis: 'axial', pos: 0.7 })
  await page.getByRole('button', { name: 'No cut' }).click()
  await page.getByLabel('Show Organs').uncheck()
})
