// Study mode: question generation + Leitner-box spaced repetition. Pure and unit-tested.
import { diagonal, neighbors, type Structure, type SystemId } from './anatomy'

export type QuizMode = 'locate' | 'identify'

/** A card is one structure name (left/right counted as the same card). */
export interface CardState {
  box: number // 1..5
  due: number // session index when it should come back
  seen: number
  correct: number
}

export const BOX_INTERVALS = [0, 1, 2, 4, 8, 16] // sessions until next review, by box

export type Rng = () => number

export function createRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const cardKey = (s: Pick<Structure, 'system' | 'base'>) => `${s.system}|${s.base}`

/**
 * Structures worth quizzing in a system: big enough to see and click (≥ 3 cm across),
 * without "(…)" helper parts. Returns one representative per name.
 */
export function deck(index: readonly Structure[], system: SystemId, minSize = 0.03): Structure[] {
  const byKey = new Map<string, Structure>()
  for (const s of index) {
    if (s.system !== system || s.base.startsWith('(') || diagonal(s) < minSize) continue
    const k = cardKey(s)
    if (!byKey.has(k)) byKey.set(k, s)
  }
  return [...byKey.values()]
}

/** Pick the next card: due cards from the lowest box first, then unseen ones, then the least-recent. */
export function nextCard(cards: readonly Structure[], states: Readonly<Record<string, CardState>>, session: number, rng: Rng, avoid?: string): Structure | null {
  if (cards.length === 0) return null
  const pool = cards.filter((c) => cardKey(c) !== avoid)
  const list = pool.length ? pool : cards
  const due = list.filter((c) => {
    const st = states[cardKey(c)]
    return st && st.due <= session
  })
  if (due.length) {
    const lowest = Math.min(...due.map((c) => states[cardKey(c)]!.box))
    const tier = due.filter((c) => states[cardKey(c)]!.box === lowest)
    return tier[Math.floor(rng() * tier.length)]!
  }
  const unseen = list.filter((c) => !states[cardKey(c)])
  if (unseen.length) return unseen[Math.floor(rng() * unseen.length)]!
  const sorted = [...list].sort((a, b) => states[cardKey(a)]!.due - states[cardKey(b)]!.due)
  return sorted[0]!
}

export function grade(prev: CardState | undefined, correct: boolean, session: number): CardState {
  const base = prev ?? { box: 1, due: session, seen: 0, correct: 0 }
  const box = correct ? Math.min(5, base.box + 1) : 1
  return { box, due: session + BOX_INTERVALS[box]!, seen: base.seen + 1, correct: base.correct + (correct ? 1 : 0) }
}

/** Four distinct name options: the answer plus nearby structures of the same system (the tricky ones). */
export function identifyOptions(index: readonly Structure[], target: Structure, rng: Rng, count = 4): string[] {
  const near = neighbors(index, target, 12, new Set([target.system])).map((s) => s.base)
  const pool = [...new Set(near.filter((b) => b !== target.base && !b.startsWith('(')))]
  const picks: string[] = []
  while (picks.length < count - 1 && pool.length) picks.push(pool.splice(Math.floor(rng() * Math.min(pool.length, 6)), 1)[0]!)
  const options = [target.base, ...picks]
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[options[i], options[j]] = [options[j]!, options[i]!]
  }
  return options
}

/** Locate: clicking either side of a paired structure counts. */
export function isLocateCorrect(target: Structure, clicked: Pick<Structure, 'system' | 'base'> | null): boolean {
  return !!clicked && clicked.system === target.system && clicked.base === target.base
}

export function mastery(cards: readonly Structure[], states: Readonly<Record<string, CardState>>): { learned: number; seen: number; total: number } {
  let learned = 0
  let seen = 0
  for (const c of cards) {
    const st = states[cardKey(c)]
    if (!st) continue
    seen++
    if (st.box >= 4) learned++
  }
  return { learned, seen, total: cards.length }
}
