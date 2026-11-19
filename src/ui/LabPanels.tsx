import { useEffect, useMemo, useRef, useState } from 'react'
import { AREAS, NOT_IN_MODEL, SYSTEMS, SYSTEM_BY_ID, areaOf, displayName, type AreaId, type Structure, type SystemId } from '@/engine/anatomy'
import { breathing, cardiac } from '@/engine/physiology'
import { useLab } from '@/state/labStore'
import { useView, type ViewPreset } from '@/state/viewStore'
import { getIndex } from '@/state/indexData'
import { heartGroups, lungGroups } from '@/three/body/Animator'
import { Button } from './ui'

const LIST_LIMIT = 250

/** Major organs for the one-click starter body (exact model names). */
export const STARTER = [
  'visceral:Liver',
  'visceral:Stomach',
  'visceral:Pancreas',
  'lymphatic:Spleen',
  'visceral:Gallbladder',
  'visceral:Kidney.l',
  'visceral:Kidney.r',
  'visceral:Urinary bladder',
  'visceral:Oesophagus',
  'visceral:Trachea',
  'visceral:Superior lobe of left lung',
  'visceral:Inferior lobe of left lung',
  'visceral:Superior lobe of right lung',
  'visceral:Middle lobe of right lung',
  'visceral:Inferior lobe of right lung',
  'cardiovascular:Left atrium',
  'cardiovascular:Right atrium',
  'cardiovascular:Left ventricle',
  'cardiovascular:Right ventricle',
]

function addPart(s: Structure) {
  const lab = useLab.getState()
  if (!lab.systems[s.system].visible) lab.setSystem(s.system, { visible: true }) // loads the layer
  if (!lab.built.includes(s.id)) lab.toggleBuilt(s.id)
  const v = useView.getState()
  if (!v.buildMode) v.setBuildMode(true)
}

/** Every structure in the model, filterable by system, body area and name — add them one by one. */
export function PartsPanel() {
  const built = useLab((s) => s.built)
  const buildMode = useView((s) => s.buildMode)
  const [system, setSystem] = useState<SystemId | 'all'>('visceral')
  const [area, setArea] = useState<AreaId | 'all'>('all')
  const [q, setQ] = useState('')
  const index = useMemo(() => getIndex() ?? [], [])
  const all = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    return index
      .filter((s) => (system === 'all' || s.system === system) && (area === 'all' || areaOf(s) === area) && words.every((w) => s.name.toLowerCase().includes(w)))
      .sort((a, b) => a.base.localeCompare(b.base) || (a.side ?? '').localeCompare(b.side ?? ''))
  }, [index, system, area, q])
  const builtSet = new Set(built)

  return (
    <div className="flex h-full flex-col" data-testid="parts">
      <div className="space-y-2 border-b border-line p-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" className="h-4 w-4 accent-[#3ec6ff]" checked={buildMode} onChange={(e) => useView.getState().setBuildMode(e.target.checked)} aria-label="Show only my parts" />
            Show only my parts
          </label>
          <span className="text-[11px] text-faint" data-testid="built-count">
            {built.length} added
          </span>
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              for (const id of STARTER) {
                const s = index.find((x) => x.id === id)
                if (s) addPart(s)
              }
            }}
          >
            Add major organs
          </Button>
          <Button variant="outline" size="sm" disabled={!built.length} onClick={() => useLab.getState().setBuilt([])}>
            Clear
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <select aria-label="Parts system" value={system} onChange={(e) => setSystem(e.target.value as SystemId | 'all')} className="h-8 rounded-md border border-line bg-[#06080c] px-2 text-[12px]">
            <option value="all">All systems</option>
            {SYSTEMS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <select aria-label="Body area" value={area} onChange={(e) => setArea(e.target.value as AreaId | 'all')} className="h-8 rounded-md border border-line bg-[#06080c] px-2 text-[12px]">
            <option value="all">Whole body</option>
            {AREAS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter parts…" aria-label="Filter parts" className="h-8 w-full rounded-md border border-line bg-[#06080c] px-2.5 text-[12px] placeholder:text-faint focus:border-accent focus:outline-none" />
        <div className="flex items-center justify-between text-[11px] text-faint">
          <span>
            {all.length} part{all.length === 1 ? '' : 's'}
            {all.length > LIST_LIMIT ? ` · showing ${LIST_LIMIT}` : ''}
          </span>
          {all.length > 0 && all.length <= 200 && (
            <button className="text-accent hover:underline" onClick={() => all.forEach(addPart)}>
              Add all {all.length}
            </button>
          )}
        </div>
      </div>
      <ul className="scroll-thin min-h-0 flex-1 overflow-y-auto py-1">
        {all.slice(0, LIST_LIMIT).map((s) => {
          const added = builtSet.has(s.id)
          return (
            <li key={s.id} className="group flex items-center gap-2 px-3 hover:bg-panel-2">
              <button aria-label={`${added ? 'Remove' : 'Add'} ${displayName(s)}`} aria-pressed={added} onClick={() => (added ? useLab.getState().toggleBuilt(s.id) : addPart(s))} className={`grid h-5 w-5 shrink-0 place-items-center rounded border text-[13px] leading-none ${added ? 'border-accent bg-accent text-[#03202e]' : 'border-line text-mute group-hover:border-accent'}`}>
                {added ? '✓' : '+'}
              </button>
              <button
                className="min-w-0 flex-1 truncate py-1.5 text-left text-[12.5px] text-mute hover:text-ink"
                onClick={() => {
                  const lab = useLab.getState()
                  if (!lab.systems[s.system].visible) lab.setSystem(s.system, { visible: true })
                  useView.getState().select(s.id, { focus: true })
                }}
              >
                {displayName(s)}
              </button>
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: SYSTEM_BY_ID[s.system].color }} title={SYSTEM_BY_ID[s.system].label} />
            </li>
          )
        })}
        {all.length === 0 && <li className="px-4 py-6 text-center text-xs text-faint">No parts match.</li>}
      </ul>
      <p className="border-t border-line px-4 py-2.5 text-[10.5px] leading-relaxed text-faint">
        Areas are assigned from each part’s position on the model. Not in this atlas: {NOT_IN_MODEL.join(', ')}.
      </p>
    </div>
  )
}

/** Heartbeat and breathing animations with live phase readouts. */
export function FunctionsPanel() {
  const anim = useView((s) => s.anim)
  const setAnim = useView((s) => s.setAnim)
  const start = (kind: 'heart' | 'breath') => {
    const lab = useLab.getState()
    const index = getIndex() ?? []
    if (kind === 'heart') {
      lab.setSystem('cardiovascular', { visible: true })
      const h = heartGroups(index)
      useView.getState().frame(h.ventricles.includes('cardiovascular:Left ventricle') ? 'cardiovascular:Left ventricle' : null)
    } else {
      lab.setSystem('visceral', { visible: true })
      lab.setSystem('muscular', { visible: true, opacity: Math.min(lab.systems.muscular.opacity, 0.25) })
      const left = lungGroups(index)[0]?.ids[0]
      useView.getState().frame(left ?? null)
    }
    setAnim({ [kind]: true })
  }
  return (
    <section className="border-t border-line p-5" data-testid="functions">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Body in action</h3>
      <div className="mt-3 space-y-3">
        <div className="rounded-md border border-line bg-panel-2/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Heartbeat</span>
            <Button size="sm" variant={anim.heart ? 'primary' : 'outline'} aria-pressed={anim.heart} onClick={() => (anim.heart ? setAnim({ heart: false }) : start('heart'))}>
              {anim.heart ? 'Stop' : 'Play'}
            </Button>
          </div>
          <label className="mt-2 flex items-center gap-2 text-[11px] text-faint">
            {anim.bpm} bpm
            <input type="range" min={40} max={160} value={anim.bpm} onChange={(e) => setAnim({ bpm: Number(e.target.value) })} className="flex-1" aria-label="Heart rate" />
          </label>
          {anim.heart && <HeartReadout bpm={anim.bpm} />}
        </div>
        <div className="rounded-md border border-line bg-panel-2/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Breathing</span>
            <Button size="sm" variant={anim.breath ? 'primary' : 'outline'} aria-pressed={anim.breath} onClick={() => (anim.breath ? setAnim({ breath: false }) : start('breath'))}>
              {anim.breath ? 'Stop' : 'Play'}
            </Button>
          </div>
          <label className="mt-2 flex items-center gap-2 text-[11px] text-faint">
            {anim.rpm} breaths/min
            <input type="range" min={6} max={30} value={anim.rpm} onChange={(e) => setAnim({ rpm: Number(e.target.value) })} className="flex-1" aria-label="Breathing rate" />
          </label>
          {anim.breath && <BreathReadout rpm={anim.rpm} />}
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-faint">Simplified motion of the real model parts with textbook timing — the atria contract, then the ventricles; the lungs expand as the diaphragm descends.</p>
    </section>
  )
}

function useTicker() {
  const [, set] = useState(0)
  useEffect(() => {
    let id = 0
    const loop = () => {
      set((n) => n + 1)
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])
}

function HeartReadout({ bpm }: { bpm: number }) {
  useTicker()
  const canvas = useRef<HTMLCanvasElement>(null)
  const c = cardiac(performance.now() / 1000, bpm)
  useEffect(() => {
    const el = canvas.current
    const g = el?.getContext('2d')
    if (!el || !g) return
    const w = el.width
    const h = el.height
    g.clearRect(0, 0, w, h)
    g.strokeStyle = '#3ec6ff'
    g.lineWidth = 1.5
    g.beginPath()
    const now = performance.now() / 1000
    const span = 3 // seconds shown
    for (let i = 0; i <= w; i++) {
      const t = now - span + (i / w) * span
      const y = h * 0.72 - cardiac(t, bpm).ecg * h * 0.6
      if (i === 0) g.moveTo(i, y)
      else g.lineTo(i, y)
    }
    g.stroke()
  })
  return (
    <div className="mt-2">
      <canvas ref={canvas} width={240} height={48} className="h-12 w-full" aria-hidden />
      <p className="mt-1 text-[12px]" aria-live="polite" data-testid="heart-phase">
        <span className="text-ink">{c.phase}</span>
        <span className="text-faint"> · {c.phase === 'Atrial systole' ? 'atria push blood into the ventricles' : c.phase === 'Ventricular systole' ? 'ventricles eject blood into the aorta and pulmonary trunk' : 'chambers relax and refill'}</span>
      </p>
    </div>
  )
}

function BreathReadout({ rpm }: { rpm: number }) {
  useTicker()
  const b = breathing(performance.now() / 1000, rpm)
  return (
    <div className="mt-2">
      <div className="h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full bg-accent" style={{ width: `${Math.round(b.depth * 100)}%` }} />
      </div>
      <p className="mt-1 text-[12px]" data-testid="breath-phase">
        <span className="text-ink">{b.phase}</span>
        <span className="text-faint"> · {b.phase === 'Inhale' ? 'diaphragm contracts and descends, lungs fill' : 'diaphragm relaxes, lungs recoil'}</span>
      </p>
    </div>
  )
}

const PRESETS: { id: ViewPreset; label: string; title: string }[] = [
  { id: 'front', label: 'Front', title: 'Anterior view' },
  { id: 'back', label: 'Back', title: 'Posterior view' },
  { id: 'left', label: 'Left', title: 'Patient’s left lateral view' },
  { id: 'right', label: 'Right', title: 'Patient’s right lateral view' },
  { id: 'top', label: 'Top', title: 'Superior view' },
  { id: 'bottom', label: 'Bottom', title: 'Inferior view' },
]

export function ViewButtons() {
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Viewpoint">
      {PRESETS.map((p) => (
        <button key={p.id} title={p.title} onClick={() => useView.getState().view(p.id)} className="rounded px-2 py-1 text-[12px] text-mute hover:bg-white/5 hover:text-ink">
          {p.label}
        </button>
      ))}
    </div>
  )
}
