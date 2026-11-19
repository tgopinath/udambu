// Persistent state (localStorage): which systems are shown and how, study progress, bookmarks, settings.
import { create } from 'zustand'
import type { SystemId } from '@/engine/anatomy'
import type { CardState } from '@/engine/quiz'
import { Shared } from '@/shared/udambu'

export const STORAGE_KEY = 'anatomylab:v1'

export interface SystemView {
  visible: boolean
  opacity: number
}

export interface Comfort {
  turn: 'snap' | 'smooth'
  snapDegrees: 30 | 45
  teleport: boolean
  vignette: boolean
}

export interface Persisted {
  version: 1
  systems: Record<SystemId, SystemView>
  cards: Record<string, CardState>
  /** One "session" = one study sitting; drives spaced repetition. */
  session: number
  answered: number
  correct: number
  bookmarks: string[]
  /** "Build your own body": parts the learner added one by one. */
  built: string[]
  comfort: Comfort
}

export function defaults(): Persisted {
  return {
    version: 1,
    systems: {
      skeletal: { visible: true, opacity: 1 },
      muscular: { visible: false, opacity: 0.85 },
      joints: { visible: false, opacity: 1 },
      cardiovascular: { visible: false, opacity: 1 },
      nervous: { visible: false, opacity: 1 },
      visceral: { visible: false, opacity: 1 },
      lymphatic: { visible: false, opacity: 1 },
    },
    cards: {},
    session: 0,
    answered: 0,
    correct: 0,
    bookmarks: [],
    built: [],
    comfort: { turn: 'snap', snapDegrees: 30, teleport: true, vignette: true },
  }
}

/** VR comfort lives in Udambu's shared settings (one settings screen for Explore and the Lab). */
function sharedComfort(): Partial<Comfort> {
  try {
    return Shared?.settings.get().vr ?? {}
  } catch {
    return {}
  }
}

export function load(storage: Pick<Storage, 'getItem'> | null = safeStorage()): Persisted {
  const base = { ...defaults(), comfort: { ...defaults().comfort, ...(storage === safeStorage() ? sharedComfort() : {}) } }
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return base
    const p = JSON.parse(raw) as Partial<Persisted>
    if (p.version !== 1) return base
    return {
      ...base,
      ...p,
      systems: Object.fromEntries(Object.entries(base.systems).map(([k, v]) => [k, { ...v, ...p.systems?.[k as SystemId] }])) as Persisted['systems'],
      comfort: { ...p.comfort, ...base.comfort },
      cards: p.cards ?? {},
      bookmarks: Array.isArray(p.bookmarks) ? p.bookmarks : [],
      built: Array.isArray(p.built) ? p.built : [],
    }
  } catch {
    return base
  }
}

function safeStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

interface LabState extends Persisted {
  setSystem(id: SystemId, patch: Partial<SystemView>): void
  soloSystem(id: SystemId): void
  recordAnswer(key: string, card: CardState, correct: boolean): void
  startSession(): void
  toggleBookmark(id: string): void
  toggleBuilt(id: string): void
  setBuilt(ids: string[]): void
  setComfort(patch: Partial<Comfort>): void
  resetProgress(): void
}

export const useLab = create<LabState>()((set) => ({
  ...load(),
  setSystem: (id, patch) => set((s) => ({ systems: { ...s.systems, [id]: { ...s.systems[id], ...patch } } })),
  soloSystem: (id) =>
    set((s) => ({
      systems: Object.fromEntries(Object.entries(s.systems).map(([k, v]) => [k, { ...v, visible: k === id }])) as Persisted['systems'],
    })),
  recordAnswer: (key, card, correct) =>
    set((s) => ({ cards: { ...s.cards, [key]: card }, answered: s.answered + 1, correct: s.correct + (correct ? 1 : 0) })),
  startSession: () => set((s) => ({ session: s.session + 1 })),
  toggleBookmark: (id) => set((s) => ({ bookmarks: s.bookmarks.includes(id) ? s.bookmarks.filter((b) => b !== id) : [...s.bookmarks, id] })),
  toggleBuilt: (id) => set((s) => ({ built: s.built.includes(id) ? s.built.filter((b) => b !== id) : [...s.built, id] })),
  setBuilt: (ids) => set({ built: [...new Set(ids)] }),
  setComfort: (patch) =>
    set((s) => {
      const comfort = { ...s.comfort, ...patch }
      Shared?.settings.set({ vr: comfort })
      return { comfort }
    }),
  resetProgress: () => set({ cards: {}, session: 0, answered: 0, correct: 0 }),
}))

let timer: ReturnType<typeof setTimeout> | undefined

function save() {
  clearTimeout(timer)
  const { version, systems, cards, session, answered, correct, bookmarks, built, comfort } = useLab.getState()
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version, systems, cards, session, answered, correct, bookmarks, built, comfort }))
  } catch {
    /* private mode / quota: keep in memory */
  }
  // Udambu's one progress store (shared with Explore's Home and Settings) gets the study totals.
  try {
    const learned = Object.values(cards).filter((c) => c.box >= 4).length
    const p = Shared?.progress.get().lab
    if (p && (p.answered !== answered || p.correct !== correct || p.learned !== learned)) Shared.progress.setLab({ answered, correct, learned })
  } catch {
    /* shared layer missing: the Lab still works on its own */
  }
}

useLab.subscribe(() => {
  clearTimeout(timer)
  timer = setTimeout(save, 200)
})

// Never lose the last change when the tab is closed or reloaded inside the debounce window.
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', save)
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && save())
}
