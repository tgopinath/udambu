import { expect, test } from '@playwright/test'
import { al, clickStructure, openLab, settleCamera, view } from './helpers'

test('locate: clicking the asked structure on the model is marked correct and graded', async ({ page }) => {
  await openLab(page, '/lab/#/?mode=study')
  await page.getByRole('button', { name: 'Locate on model' }).click()
  await page.getByTestId('study-start').click()
  const q = (await view(page)).question!
  expect(q.mode).toBe('locate')
  await settleCamera(page)
  await clickStructure(page, q.target.id)
  await expect(page.getByTestId('question-result')).toContainText('Correct')
  const lab = await al<{ answered: number; correct: number; cards: number }>(page, 'lab')
  expect(lab).toMatchObject({ answered: 1, correct: 1, cards: 1 })
})

test('identify: a wrong option is explained, then the next question comes', async ({ page }) => {
  await openLab(page, '/lab/#/?mode=study')
  await page.getByRole('button', { name: 'Name the part' }).click()
  await page.getByTestId('study-start').click()
  const q = (await view(page)).question!
  expect(q.options).toContain(q.target.base)
  const wrong = q.options.find((o) => o !== q.target.base)!
  await page.getByTestId('question').getByRole('button', { name: wrong, exact: true }).click()
  await expect(page.getByTestId('question-result')).toContainText(`it’s the ${q.target.base}`)
  await page.getByRole('button', { name: 'Next question' }).click()
  await expect.poll(async () => (await view(page)).question?.result ?? null).toBeNull()
  const lab = await al<{ answered: number; correct: number }>(page, 'lab')
  expect(lab).toMatchObject({ answered: 1, correct: 0 })

  // Progress survives a reload.
  await page.reload()
  await openLab(page, '/lab/#/?mode=study')
  expect(await al<{ answered: number }>(page, 'lab')).toMatchObject({ answered: 1 })
})
