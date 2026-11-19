/// <reference types="node" />
// The shared layer that joins Explore and the Lab: cross-links, one settings store, one progress store, one search.
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import structures from '@/data/structures.json'
import type { Structure } from '@/engine/anatomy'
import { Shared } from './udambu'
import { resolveFocus } from '@/ui/focus'

const index = structures as Structure[]
const labNames = (() => {
  const ctx: Record<string, unknown> = {}
  runInNewContext(readFileSync(resolve(process.cwd(), 'shared/lab-names.js'), 'utf8'), { globalThis: ctx })
  return ctx.UDAMBU_LAB_NAMES as [string, string][]
})()
const exploreParts = (() => {
  const src = readFileSync(resolve(process.cwd(), 'parts.js'), 'utf8')
  const ctx: Record<string, unknown> = {}
  runInNewContext(src + '\nthis.PARTS = PARTS;', ctx)
  return ctx.PARTS as { key: string; name: string; term?: string }[]
})()

function memoryStorage() {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m }
}

describe('Explore -> Lab links', () => {
  it('every link points at a structure that exists in the Lab model', () => {
    for (const [key, [system, base]] of Object.entries(Shared.CROSSLINKS)) {
      if (base === null) continue
      expect(index.some((s) => s.system === system && s.base === base), `${key} -> ${system}:${base}`).toBe(true)
    }
  })
  it('only links real Explore parts, with the names Explore uses', () => {
    const byKey = Object.fromEntries(exploreParts.map((p) => [p.key, p.name]))
    for (const key of Object.keys(Shared.CROSSLINKS)) expect(byKey[key], key).toBeDefined()
    for (const [key, name] of Object.entries(Shared.EXPLORE_NAMES)) expect(byKey[key], key).toBe(name)
  })
  it('covers most of Explore (parts the male atlas does not model are left out)', () => {
    expect(Object.keys(Shared.CROSSLINKS).length).toBeGreaterThanOrEqual(50)
    expect(Shared.CROSSLINKS.skin).toBeUndefined()
    expect(Shared.CROSSLINKS.womb).toBeUndefined()
  })
  it('the deep link round-trips and the Lab resolves it to the left side of a paired part', () => {
    const href = Shared.labHref('leg-bones')!
    expect(href).toBe('lab/#/?focus=' + encodeURIComponent('skeletal:Femur'))
    const focus = new URLSearchParams(href.split('?')[1]).get('focus')
    expect(Shared.parseFocus(focus)).toEqual({ system: 'skeletal', base: 'Femur' })
    expect(resolveFocus(index, focus)?.target?.id).toBe('skeletal:Femur.l')
    expect(resolveFocus(index, 'visceral:Stomach')?.target?.id).toBe('visceral:Stomach')
  })
  it('a whole-layer link frames the body without a selection', () => {
    expect(resolveFocus(index, Shared.parseFocus('muscular:') && 'muscular:')).toEqual({ system: 'muscular', target: null })
  })
  it('bad links are ignored', () => {
    expect(resolveFocus(index, 'nope:Femur')).toBeNull()
    expect(resolveFocus(index, 'skeletal:Not a bone')).toBeNull()
    expect(resolveFocus(index, null)).toBeNull()
    expect(Shared.labHref('skin')).toBeNull()
  })
  it('every link resolves through resolveFocus', () => {
    for (const key of Object.keys(Shared.CROSSLINKS)) {
      const f = new URLSearchParams(Shared.labHref(key)!.split('?')[1]).get('focus')
      expect(resolveFocus(index, f), key).not.toBeNull()
    }
  })
})

describe('Lab -> Explore links', () => {
  it('each linked structure points back to its Explore part', () => {
    for (const [key, [, base]] of Object.entries(Shared.CROSSLINKS)) if (base) expect(Shared.exploreFor(base), base).toBe(key)
  })
  it('families of structures find the part that explains them', () => {
    expect(Shared.exploreFor('Vertebra T5', 'skeletal')).toBe('spine')
    expect(Shared.exploreFor('Ninth rib', 'skeletal')).toBe('ribs')
    expect(Shared.exploreFor('Right atrium', 'cardiovascular')).toBe('heart')
    expect(Shared.exploreFor('Femoral artery', 'cardiovascular')).toBe('blood-vessels')
    expect(Shared.exploreFor('Middle lobe of right lung', 'visceral')).toBe('lungs')
    expect(Shared.exploreFor('Vagus nerve (X)', 'nervous')).toBe('nerves')
    expect(Shared.exploreFor('Pre-aortic nodes', 'lymphatic')).toBe('lymph')
    expect(Shared.exploreFor('Gluteus maximus muscle', 'muscular')).toBe('muscles')
    expect(Shared.exploreFor('Upper canine', 'skeletal')).toBe('teeth')
  })
  it('every Explore target exists, and a good share of the model links back', () => {
    const names = new Set(Object.keys(Shared.EXPLORE_NAMES))
    let linked = 0
    for (const s of index) {
      const k = Shared.exploreFor(s.base, s.system)
      if (k) {
        expect(names.has(k), k).toBe(true)
        linked++
      }
    }
    expect(linked / index.length).toBeGreaterThan(0.5)
  })
})

describe('one settings store', () => {
  it('has defaults and merges patches', () => {
    const { settings } = Shared.createShared(memoryStorage())
    expect(settings.get()).toMatchObject({ startLevel: null, autoRead: false, vr: { turn: 'snap', snapDegrees: 30 } })
    settings.set({ startLevel: 'lab', vr: { turn: 'smooth' } })
    expect(settings.get()).toMatchObject({ startLevel: 'lab', vr: { turn: 'smooth', snapDegrees: 30, teleport: true } })
  })
  it('survives broken storage', () => {
    const bad = { getItem: () => '{not json', setItem: () => { throw new Error('full') } }
    const { settings } = Shared.createShared(bad)
    expect(settings.get().startLevel).toBeNull()
    expect(() => settings.set({ autoRead: true })).not.toThrow()
  })
})

describe('one progress store', () => {
  it('records parts opened once, keeps the best quiz score and the Lab totals', () => {
    const st = memoryStorage()
    const { progress } = Shared.createShared(st)
    progress.markSeen('heart')
    const first = progress.get().seen.heart
    progress.markSeen('heart')
    expect(progress.get().seen.heart).toBe(first)
    progress.setBest('quiz', 7)
    progress.setBest('quiz', 5)
    expect(progress.get().best.quiz).toBe(7)
    progress.setLab({ answered: 10, correct: 8, learned: 2 })
    expect(progress.summary(63)).toMatchObject({ partsSeen: 1, partsTotal: 63, quizBest: 7, labAnswered: 10, labAccuracy: 80, labLearned: 2 })
  })
  it('resetting the Lab also clears the Lab study cards, and keeps Explore progress', () => {
    const st = memoryStorage()
    st.setItem('anatomylab:v1', JSON.stringify({ version: 1, cards: { 'skeletal|Femur': { box: 4 } }, answered: 3, correct: 2, session: 2, bookmarks: ['x'] }))
    const { progress } = Shared.createShared(st)
    progress.markSeen('liver')
    progress.setLab({ answered: 3, correct: 2 })
    progress.reset('lab')
    expect(progress.get().lab.answered).toBe(0)
    expect(progress.get().seen.liver).toBeDefined()
    const lab = JSON.parse(st.getItem('anatomylab:v1')!)
    expect(lab).toMatchObject({ cards: {}, answered: 0, correct: 0, bookmarks: ['x'] })
    progress.reset()
    expect(progress.get().seen).toEqual({})
  })
})

describe('one search across both levels', () => {
  const sources = { parts: exploreParts, illnesses: [{ key: 'heart-attack', name: 'Heart attack' }], lab: labNames }
  it('ranks the Explore part, the condition and the Lab structures', () => {
    const r = Shared.search('heart', sources)
    expect(r.parts[0]!.key).toBe('heart')
    expect(r.illnesses[0]!.key).toBe('heart-attack')
    expect(r.lab.length).toBeGreaterThan(0)
  })
  it('Lab hits carry the Explore page that explains them', () => {
    const r = Shared.search('femur', sources)
    expect(r.lab[0]).toEqual({ system: 'skeletal', base: 'Femur', explore: 'leg-bones' })
  })
  it('matches anatomical terms and ignores case and accents', () => {
    expect(Shared.search('OESOPHAGUS', sources).parts[0]!.key).toBe('food-pipe')
    expect(Shared.search('', sources)).toEqual({ parts: [], illnesses: [], lab: [] })
  })
  it('the Lab name list matches the model', () => {
    const pairs = new Set(index.map((s) => `${s.system}|${s.base}`))
    expect(labNames.length).toBe(pairs.size)
  })
})

describe('the Lab reads VR comfort from the shared settings', () => {
  it('a choice made on the Settings screen reaches the Lab store', async () => {
    Shared.settings.set({ vr: { turn: 'smooth', vignette: false } })
    const { load } = await import('@/state/labStore')
    expect(load().comfort).toMatchObject({ turn: 'smooth', vignette: false, teleport: true })
    Shared.settings.set({ vr: { turn: 'snap', vignette: true } })
  })
})
