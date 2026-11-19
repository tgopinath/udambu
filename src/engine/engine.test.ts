import { describe, expect, it } from 'vitest'
import raw from '@/data/structures.json'
import { SYSTEMS, displayName, neighbors, pairOf, search, sizeCm, type Structure } from './anatomy'
import { NOTES } from './notes'
import { createRng, deck, grade, identifyOptions, isLocateCorrect, mastery, nextCard, cardKey } from './quiz'

const index = raw as Structure[]

describe('structure index', () => {
  it('covers every system with uniquely identified structures', () => {
    expect(index.length).toBeGreaterThan(2500)
    expect(new Set(index.map((s) => s.id)).size).toBe(index.length)
    for (const sys of SYSTEMS) expect(index.some((s) => s.system === sys.id)).toBe(true)
  })

  it('is life-size, standing on the floor, facing +Z (patient left on +X)', () => {
    const femurL = index.find((s) => s.name === 'Femur.l')!
    const femurR = index.find((s) => s.name === 'Femur.r')!
    expect(femurL.min[0]).toBeGreaterThan(0)
    expect(femurR.max[0]).toBeLessThan(0)
    const top = Math.max(...index.filter((s) => s.system === 'skeletal').map((s) => s.max[1]))
    expect(top).toBeGreaterThan(1.6)
    expect(top).toBeLessThan(1.85)
    expect(sizeCm(femurL)[1]).toBeGreaterThan(40) // femur ~45 cm long
  })

  it('every study note matches a real structure name', () => {
    const bases = new Set(index.map((s) => s.base))
    for (const key of Object.keys(NOTES)) expect(bases, key).toContain(key)
  })
})

describe('names, pairs, search, neighbours', () => {
  const femur = index.find((s) => s.name === 'Femur.l')!
  it('formats sides and finds mirror twins', () => {
    expect(displayName(femur)).toBe('Femur (left)')
    expect(pairOf(index, femur)?.name).toBe('Femur.r')
  })

  it('ranks exact and prefix matches first and collapses left/right', () => {
    const hits = search(index, 'femur')
    expect(hits[0]!.structure.base).toBe('Femur')
    expect(hits.filter((h) => h.structure.base === 'Femur')).toHaveLength(1)
    expect(search(index, 'vagus')[0]!.structure.base).toMatch(/Vagus nerve/)
    expect(search(index, '')).toEqual([])
    expect(search(index, 'zzzznotabodypart')).toEqual([])
  })

  it('filters search by system', () => {
    const hits = search(index, 'femoral', 50, new Set(['cardiovascular']))
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.every((h) => h.structure.system === 'cardiovascular')).toBe(true)
  })

  it('neighbours are close and exclude the structure itself', () => {
    const n = neighbors(index, femur, 5, new Set(['skeletal']))
    expect(n).toHaveLength(5)
    expect(n.some((s) => s.base === 'Femur')).toBe(false)
    expect(n.map((s) => s.base)).toEqual(expect.arrayContaining(['Patella']))
  })
})

describe('study mode', () => {
  const cards = deck(index, 'skeletal')
  it('builds a deck of visible, named structures, one card per name', () => {
    expect(cards.length).toBeGreaterThan(40)
    expect(new Set(cards.map(cardKey)).size).toBe(cards.length)
    expect(cards.every((c) => !c.base.startsWith('('))).toBe(true)
  })

  it('identify options include the answer, are distinct, and come from the same system', () => {
    const femur = cards.find((c) => c.base === 'Femur')!
    for (let seed = 0; seed < 20; seed++) {
      const opts = identifyOptions(index, femur, createRng(seed))
      expect(opts).toContain('Femur')
      expect(new Set(opts).size).toBe(opts.length)
      expect(opts.length).toBe(4)
    }
  })

  it('locate accepts either side of a pair but not a different structure', () => {
    const femur = cards.find((c) => c.base === 'Femur')!
    expect(isLocateCorrect(femur, { system: 'skeletal', base: 'Femur' })).toBe(true)
    expect(isLocateCorrect(femur, { system: 'skeletal', base: 'Tibia' })).toBe(false)
    expect(isLocateCorrect(femur, null)).toBe(false)
  })

  it('Leitner boxes: right answers space a card out, a wrong one resets it', () => {
    let st = grade(undefined, true, 0)
    expect(st).toMatchObject({ box: 2, due: 2, seen: 1, correct: 1 })
    st = grade(st, true, 2)
    expect(st).toMatchObject({ box: 3, due: 6 })
    st = grade(st, false, 6)
    expect(st).toMatchObject({ box: 1, due: 7, seen: 3, correct: 2 })
  })

  it('serves due cards first, then unseen ones, and never repeats the last card when avoidable', () => {
    const rng = createRng(1)
    const [a, b, c] = cards
    const states = { [cardKey(a!)]: { box: 1, due: 0, seen: 1, correct: 0 }, [cardKey(b!)]: { box: 3, due: 9, seen: 2, correct: 2 } }
    expect(nextCard([a!, b!, c!], states, 0, rng)).toBe(a)
    expect(nextCard([a!, b!, c!], states, 0, rng, cardKey(a!))).toBe(c)
    expect(mastery([a!, b!, c!], { ...states, [cardKey(c!)]: { box: 4, due: 20, seen: 3, correct: 3 } })).toEqual({ learned: 1, seen: 3, total: 3 })
  })
})

describe('body areas', () => {
  it('files landmark structures in the expected area', async () => {
    const { areaOf } = await import('./anatomy')
    const by = (n: string) => areaOf(index.find((s) => s.name === n)!)
    expect(by('Mandible')).toBe('head')
    expect(by('Thyroid gland')).toBe('neck')
    expect(by('Left atrium')).toBe('thorax')
    expect(by('Stomach')).toBe('abdomen')
    expect(by('Urinary bladder')).toBe('pelvis')
    expect(by('Humerus.l')).toBe('upperLimb')
    expect(by('Radius.r')).toBe('upperLimb')
    expect(by('Femur.l')).toBe('lowerLimb')
  })
})

describe('physiology timing', () => {
  it('cardiac cycle: atria contract first, then ventricles, then diastole; QRS peak at ventricular onset', async () => {
    const { cardiac } = await import('./physiology')
    const T = 60 / 75
    expect(cardiac(0.05, 75)).toMatchObject({ phase: 'Atrial systole' })
    expect(cardiac(0.05, 75).atria).toBeGreaterThan(0.9)
    expect(cardiac(0.25, 75)).toMatchObject({ phase: 'Ventricular systole' })
    expect(cardiac(0.25, 75).ventricles).toBeGreaterThan(0.9)
    expect(cardiac(0.6, 75)).toMatchObject({ phase: 'Diastole', atria: 0, ventricles: 0 })
    const samples = Array.from({ length: 400 }, (_, i) => cardiac((i / 400) * T, 75))
    const peak = samples.reduce((a, b) => (b.ecg > a.ecg ? b : a))
    expect(peak.u).toBeCloseTo(0.125, 2)
    expect(cardiac(T + 0.05, 75).phase).toBe('Atrial systole') // periodic
  })

  it('breathing: inhale is shorter than exhale and depth spans 0..1', async () => {
    const { breathing } = await import('./physiology')
    const T = 60 / 12
    expect(breathing(0, 12)).toMatchObject({ phase: 'Inhale', depth: 0 })
    expect(breathing(0.4 * T, 12).depth).toBeCloseTo(1, 5)
    expect(breathing(0.7 * T, 12).phase).toBe('Exhale')
    expect(breathing(0.999 * T, 12).depth).toBeLessThan(0.01)
  })
})

describe('animation groups', () => {
  it('finds the heart (chambers + vessels inside it) and both lungs', async () => {
    const { heartGroups, lungGroups } = await import('@/three/body/Animator')
    const h = heartGroups(index)
    expect(h.atria).toEqual(expect.arrayContaining(['cardiovascular:Left atrium', 'cardiovascular:Right atrium']))
    expect(h.ventricles).toEqual(expect.arrayContaining(['cardiovascular:Left ventricle', 'cardiovascular:Right ventricle']))
    expect(h.pivot.y).toBeGreaterThan(1.2)
    expect(h.pivot.y).toBeLessThan(1.4)
    const lungs = lungGroups(index)
    expect(lungs.map((l) => l.ids.length).every((n) => n > 5)).toBe(true)
    expect(lungs.find((l) => l.side === 'left')!.pivot.x).toBeGreaterThan(0) // patient's left is +X
  })
})
