// Timing models for the "function" animations. Illustrative, textbook-level timing: the mesh motion is a
// simple scale/translation of real anatomical parts, not a simulation of tissue mechanics.

export type CardiacPhase = 'Atrial systole' | 'Ventricular systole' | 'Diastole'

export interface CardiacState {
  phase: CardiacPhase
  /** 0 = relaxed, 1 = fully contracted. */
  atria: number
  ventricles: number
  /** Normalised position in the cycle, 0..1. */
  u: number
  /** Schematic ECG value (P wave, QRS complex, T wave), roughly −0.2..1. */
  ecg: number
}

// At 75 bpm (0.8 s cycle): atrial systole ≈ 0.1 s, ventricular systole ≈ 0.3 s, diastole ≈ 0.4 s.
const ATRIAL_END = 0.125
const VENT_END = 0.5

const bump = (x: number, a: number, b: number) => (x <= a || x >= b ? 0 : Math.sin(((x - a) / (b - a)) * Math.PI))
const gauss = (x: number, mu: number, sigma: number) => Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma))

export function cardiac(tSeconds: number, bpm: number): CardiacState {
  const period = 60 / Math.min(Math.max(bpm, 30), 200)
  const u = ((tSeconds % period) + period) % period / period
  const atria = bump(u, 0, ATRIAL_END)
  const ventricles = bump(u, ATRIAL_END, VENT_END)
  const phase: CardiacPhase = u < ATRIAL_END ? 'Atrial systole' : u < VENT_END ? 'Ventricular systole' : 'Diastole'
  // P wave just before atrial contraction, QRS at the start of ventricular systole, T wave as it ends.
  const ecg =
    0.12 * gauss(u, 0.95, 0.025) + 0.12 * gauss(u, -0.05, 0.025) - 0.12 * gauss(u, ATRIAL_END - 0.012, 0.006) + 1.0 * gauss(u, ATRIAL_END, 0.008) - 0.2 * gauss(u, ATRIAL_END + 0.014, 0.006) + 0.25 * gauss(u, 0.42, 0.04)
  return { phase, atria, ventricles, u, ecg }
}

export interface BreathState {
  phase: 'Inhale' | 'Exhale'
  /** 0 = end of exhalation, 1 = end of inhalation. */
  depth: number
  u: number
}

/** Inhalation takes ~40% of a quiet breath, exhalation ~60% (I:E ≈ 1:1.5). */
export function breathing(tSeconds: number, perMinute: number): BreathState {
  const period = 60 / Math.min(Math.max(perMinute, 4), 40)
  const u = ((tSeconds % period) + period) % period / period
  const ease = (x: number) => x * x * (3 - 2 * x)
  if (u < 0.4) return { phase: 'Inhale', depth: ease(u / 0.4), u }
  return { phase: 'Exhale', depth: 1 - ease((u - 0.4) / 0.6), u }
}
