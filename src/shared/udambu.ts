// Typed access to the shared layer (shared/udambu-shared.js), which Explore loads as a plain script.
// The Lab bundles the same file (this side-effect import); it only sets globalThis.UdambuShared.
import '../../shared/udambu-shared.js'
import type { SystemId } from '@/engine/anatomy'

export type Level = 'explore' | 'lab'
export interface VrComfort {
  turn: 'snap' | 'smooth'
  snapDegrees: 30 | 45
  teleport: boolean
  vignette: boolean
}
export interface Settings {
  version: 1
  startLevel: Level | null
  autoRead: boolean
  vr: VrComfort
}
export interface LabProgress {
  answered: number
  correct: number
  learned: number
  opened: Record<string, number>
}
export interface Progress {
  version: 1
  seen: Record<string, number>
  best: Record<string, number>
  lab: LabProgress
}
interface Store<T> {
  key: string
  get(): T
  set(patch: Partial<{ [K in keyof T]: Partial<T[K]> | T[K] }>): T
  replace(v: T): T
  subscribe(f: (v: T) => void): () => void
}
export interface ProgressStore extends Store<Progress> {
  markSeen(key: string): Progress
  setBest(game: string, n: number): Progress
  setLab(stats: Partial<LabProgress>): Progress
  reset(level?: Level): Progress
  summary(totalParts?: number): {
    partsSeen: number
    partsTotal: number
    quizBest: number | null
    whichBest: number | null
    labAnswered: number
    labCorrect: number
    labLearned: number
    labAccuracy: number | null
  }
}
export interface SearchResult {
  parts: { key: string; name: string; term?: string }[]
  illnesses: { key: string; name: string }[]
  lab: { system: SystemId; base: string; explore: string | null }[]
}
export interface UdambuSharedApi {
  version: 1
  LAB_URL: string
  EXPLORE_URL: string
  CROSSLINKS: Record<string, [SystemId, string | null]>
  EXPLORE_NAMES: Record<string, string>
  exploreFor(base: string, system?: string): string | null
  labHref(key: string, prefix?: string): string | null
  exploreHref(key: string, prefix?: string): string
  parseFocus(value: string | null): { system: string; base: string | null } | null
  search(q: string, sources: { parts?: { key: string; name: string; term?: string }[]; illnesses?: { key: string; name: string }[]; lab?: [string, string][] }, limit?: number): SearchResult
  createShared(storage?: Pick<Storage, 'getItem' | 'setItem'> | null): { settings: Store<Settings>; progress: ProgressStore }
  norm(t: string): string
  settings: Store<Settings>
  progress: ProgressStore
}

export const Shared = (globalThis as unknown as { UdambuShared: UdambuSharedApi }).UdambuShared

/** The Explore page, seen from the Lab page: '../' on the web, '../index.html' from the iPhone app's files. */
export const EXPLORE_ROOT = Shared.EXPLORE_URL
/** The site folder (for shared files such as the icon). */
export const SITE_ROOT = '../'
