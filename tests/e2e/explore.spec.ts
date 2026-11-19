// Explore (the plain-JS level at the site root) and its links into the Lab.
import { expect, test } from '@playwright/test'
import { openLab, view } from './helpers'

test('Explore home: 3D hero, level chooser, the Lab section and the five tabs', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Explore the human body/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Who is learning today?' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Go deeper in the Lab' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link')).toHaveText(['Body', 'Parts', 'Health', 'Quiz', 'Lab'])
  await page.getByRole('button', { name: /^Explore/ }).click()
  await expect(page.getByRole('heading', { name: 'Who is learning today?' })).toHaveCount(0)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('udambu:settings')!).startLevel)).toBe('explore')
  expect(errors).toEqual([])
})

test('a part page has 3D, AR, voice and a link to the same structure in the Lab, and back', async ({ page }) => {
  await page.goto('/#/part/heart')
  await expect(page.getByRole('heading', { name: 'Heart', level: 1 })).toBeVisible()
  await expect(page.locator('iframe.sf')).toHaveCount(1) // live Sketchfab model
  await expect(page.getByRole('button', { name: 'View in your room' })).toBeVisible() // AR
  // Voice: Listen plays the recorded clip
  const clip = page.waitForRequest(/audio\/heart-say\.m4a$/)
  await page.locator('.hero-actions [data-say="heart-say"]').click()
  await clip
  // Explore -> Lab
  await page.getByTestId('see-in-lab').click()
  await expect(page).toHaveURL(/\/lab\/#\/\?focus=cardiovascular%3ALeft%20ventricle/)
  await expect.poll(async () => (await view(page).catch(() => null))?.selectedId ?? null, { timeout: 60_000 }).toBe('cardiovascular:Left ventricle')
  await expect(page.getByTestId('details-name')).toHaveText('Left ventricle')
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('udambu:progress')!).seen.heart)).toBeGreaterThan(0)
  // Lab -> Explore
  await page.getByTestId('explore-link').click()
  await expect(page).toHaveURL(/\/#\/part\/heart$/)
  await expect(page.getByRole('heading', { name: 'Heart', level: 1 })).toBeVisible()
})

test('a whole-layer link (Muscles) turns the layer on without selecting one muscle', async ({ page }) => {
  await page.goto('/#/part/muscles')
  await page.getByTestId('see-in-lab').click()
  await expect.poll(async () => (await view(page).catch(() => null))?.loading.muscular ?? null, { timeout: 90_000 }).toBe('ready')
  expect((await view(page)).selectedId).toBeNull()
})

test('parts the Lab model does not have offer no Lab link', async ({ page }) => {
  await page.goto('/#/part/skin')
  await expect(page.getByRole('heading', { name: 'Skin', level: 1 })).toBeVisible()
  await expect(page.getByTestId('see-in-lab')).toHaveCount(0)
})

test('the body quiz teaches after an answer, and its best score reaches the shared progress', async ({ page }) => {
  await page.goto('/#/play/quiz')
  for (let i = 0; i < 10; i++) {
    await page.locator('.opt').first().click()
    await expect(page.locator('.lesson')).toBeVisible()
    await page.locator('#next').click()
  }
  await expect(page.getByText('Your score')).toBeVisible()
  const p = await page.evaluate(() => JSON.parse(localStorage.getItem('udambu:progress')!))
  expect(typeof p.best.quiz).toBe('number')
})

test('one search across both levels: an Explore part, a condition and Lab structures', async ({ page }) => {
  await page.goto('/#/search')
  await page.getByLabel('Search Udambu').fill('femur')
  const lab = page.locator('.labhits a').first()
  await expect(lab).toContainText('Femur')
  await expect(lab).toContainText('explained in Explore as Leg bones')
  await lab.click()
  await expect.poll(async () => (await view(page).catch(() => null))?.selectedId ?? null, { timeout: 60_000 }).toBe('skeletal:Femur.l')
})

test('one settings screen: VR comfort chosen in Explore reaches the Lab', async ({ page }) => {
  await page.goto('/#/settings')
  await page.getByRole('radio', { name: 'Smooth turn' }).click()
  await openLab(page)
  const comfort = await page.evaluate(() => JSON.parse(localStorage.getItem('udambu:settings')!).vr)
  expect(comfort.turn).toBe('smooth')
  // The Lab's settings button leads back to the same screen
  await page.getByRole('link', { name: 'Settings' }).click()
  await expect(page).toHaveURL(/\/#\/settings$/)
})

test('Start in the Lab opens the Lab on a fresh launch', async ({ page }) => {
  await page.goto('/#/settings')
  await page.getByRole('radio', { name: 'Lab' }).click()
  await page.evaluate(() => sessionStorage.clear())
  await page.goto('/')
  await expect(page).toHaveURL(/\/lab\/$/)
})
