// Transient view state: selection, hover, isolation, hidden parts, cross-section, study question.
import { create } from 'zustand'
import type { Structure, SystemId } from '@/engine/anatomy'
import { createRng, grade, identifyOptions, isLocateCorrect, nextCard, cardKey, deck, type QuizMode } from '@/engine/quiz'
import { useLab } from './labStore'
import { getIndex } from './indexData'

export type ClipAxis = 'none' | 'axial' | 'sagittal' | 'coronal'

export interface Question {
  mode: QuizMode
  system: SystemId
  target: Structure
  options: string[]
  /** Set once answered. */
  result: null | { correct: boolean; picked: string | null; pickedId: string | null }
}

interface ViewState {
  selectedId: string | null
  hoveredId: string | null
  /** When set, only these ids render. */
  isolated: string[] | null
  hidden: string[]
  clip: { axis: ClipAxis; pos: number; flip: boolean }
  loading: Partial<Record<SystemId, 'loading' | 'ready' | 'error'>>
  /** Bumped to ask the camera to frame `focusId` (or the whole body when null). */
  focus: { id: string | null; n: number }
  mode: 'explore' | 'study'
  question: Question | null
  inXR: boolean
  /** Show only the parts the learner added (lab.built). */
  buildMode: boolean
  anim: { heart: boolean; breath: boolean; bpm: number; rpm: number }
  /** Camera view request: direction around the current subject. */
  preset: { name: ViewPreset; n: number }

  select(id: string | null, opts?: { focus?: boolean }): void
  hover(id: string | null): void
  isolate(ids: string[] | null): void
  hide(id: string): void
  showAll(): void
  setClip(patch: Partial<ViewState['clip']>): void
  setLoading(id: SystemId, v: 'loading' | 'ready' | 'error'): void
  frame(id: string | null): void
  setMode(m: 'explore' | 'study'): void
  ask(mode: QuizMode, system: SystemId): void
  answerLocate(clicked: Structure | null): void
  answerIdentify(option: string): void
  setInXR(v: boolean): void
  setBuildMode(v: boolean): void
  setAnim(patch: Partial<ViewState['anim']>): void
  view(name: ViewPreset): void
}

export type ViewPreset = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'

let rngSeed = (Date.now() ^ 0x9e3779b9) >>> 0
const rng = () => createRng((rngSeed = (rngSeed * 1664525 + 1013904223) >>> 0))()

export const useView = create<ViewState>()((set, get) => ({
  selectedId: null,
  hoveredId: null,
  isolated: null,
  hidden: [],
  clip: { axis: 'none', pos: 0.5, flip: false },
  loading: {},
  focus: { id: null, n: 0 },
  mode: 'explore',
  question: null,
  inXR: false,
  buildMode: false,
  anim: { heart: false, breath: false, bpm: 72, rpm: 14 },
  preset: { name: 'front', n: 0 },

  select(id, opts) {
    set({ selectedId: id })
    if (opts?.focus && id) get().frame(id)
  },
  hover(id) {
    if (get().hoveredId !== id) set({ hoveredId: id })
  },
  isolate(ids) {
    set({ isolated: ids && ids.length ? ids : null })
  },
  hide(id) {
    set((s) => ({ hidden: s.hidden.includes(id) ? s.hidden : [...s.hidden, id], selectedId: s.selectedId === id ? null : s.selectedId }))
  },
  showAll() {
    set({ isolated: null, hidden: [] })
  },
  setClip(patch) {
    set((s) => ({ clip: { ...s.clip, ...patch } }))
  },
  setLoading(id, v) {
    set((s) => ({ loading: { ...s.loading, [id]: v } }))
  },
  frame(id) {
    set((s) => ({ focus: { id, n: s.focus.n + 1 } }))
  },
  setMode(m) {
    if (m === 'study' && get().mode !== 'study') useLab.getState().startSession()
    set({ mode: m, question: null, isolated: null, hidden: [], selectedId: null, buildMode: false })
  },

  ask(mode, system) {
    const index = getIndex()
    if (!index) return
    const lab = useLab.getState()
    const cards = deck(index, system)
    const prev = get().question
    const target = nextCard(cards, lab.cards, lab.session, rng, prev ? cardKey(prev.target) : undefined)
    if (!target) return
    // Only the quizzed system is shown, so answers are clicked on the right layer.
    if (!lab.systems[system].visible || Object.entries(lab.systems).some(([k, v]) => k !== system && v.visible)) lab.soloSystem(system)
    const options = mode === 'identify' ? identifyOptions(index, target, rng) : []
    set({ question: { mode, system, target, options, result: null }, selectedId: mode === 'identify' ? target.id : null, isolated: null, hidden: [] })
    if (mode === 'identify') get().frame(target.id)
    else get().frame(null)
  },

  answerLocate(clicked) {
    const q = get().question
    if (!q || q.mode !== 'locate' || q.result) return
    const correct = isLocateCorrect(q.target, clicked)
    finish(q, correct, clicked?.base ?? null, clicked?.id ?? null)
    set({ selectedId: q.target.id })
    get().frame(q.target.id)
  },

  answerIdentify(option) {
    const q = get().question
    if (!q || q.mode !== 'identify' || q.result) return
    finish(q, option === q.target.base, option, null)
  },

  setInXR(v) {
    set({ inXR: v })
  },
  setBuildMode(v) {
    set({ buildMode: v, isolated: null })
  },
  setAnim(patch) {
    set((s) => ({ anim: { ...s.anim, ...patch } }))
  },
  view(name) {
    set((s) => ({ preset: { name, n: s.preset.n + 1 } }))
  },
}))

function finish(q: Question, correct: boolean, picked: string | null, pickedId: string | null) {
  const lab = useLab.getState()
  const key = cardKey(q.target)
  lab.recordAnswer(key, grade(lab.cards[key], correct, lab.session), correct)
  useView.setState({ question: { ...q, result: { correct, picked, pickedId } } })
}
