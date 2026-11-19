import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SYSTEMS, SYSTEM_BY_ID, displayName, neighbors, pairOf, search, sizeCm, tissueLabel, type Structure, type SystemId } from '@/engine/anatomy'
import { NOTES } from '@/engine/notes'
import { deck, mastery } from '@/engine/quiz'
import { useLab } from '@/state/labStore'
import { useView, type ClipAxis } from '@/state/viewStore'
import { getIndex, getStructure, loadIndex } from '@/state/indexData'
import { detectXRSupport, type XRSupport } from '@/three/xrSupport'
import { Button, ErrorBoundary, LevelSwitch, Logo, Spinner, fmtInt, webglAvailable } from './ui'
import { EXPLORE_ROOT, Shared } from '@/shared/udambu'
import { applyFocus } from './focus'
import { FunctionsPanel, PartsPanel, ViewButtons } from './LabPanels'

const LabCanvas = lazy(() => import('@/three/LabCanvas'))

export function LabPage() {
  const [ready, setReady] = useState(!!getIndex())
  const [params] = useSearchParams()
  const mode = useView((s) => s.mode)

  useEffect(() => {
    void loadIndex().then(() => setReady(true))
  }, [])
  useEffect(() => {
    if (params.get('mode') === 'study') useView.getState().setMode('study')
  }, [params])
  // "See it in the Lab" from an Explore part page: #/?focus=<system>:<base>
  const focus = params.get('focus')
  useEffect(() => {
    if (ready && focus) applyFocus(focus)
  }, [ready, focus])

  if (!webglAvailable()) {
    return <p className="p-8 text-mute">This browser can’t display 3D graphics (WebGL is turned off or unsupported).</p>
  }

  return (
    <div className="lab-shell fixed inset-0 flex flex-col">
      <TopBar />
      <div className="relative flex min-h-0 flex-1 max-md:flex-col">
        <aside className="z-10 hidden w-72 shrink-0 flex-col border-r border-line bg-panel/95 md:flex">{ready && <LeftTabs />}</aside>
        <main className="relative min-h-0 min-w-0 flex-1">
          <ErrorBoundary>
            <Suspense fallback={<CenterNote><Spinner label="Loading the 3D viewer…" /></CenterNote>}>{ready && <LabCanvas />}</Suspense>
          </ErrorBoundary>
          <LayerLoading />
          <Toolbar />
          <div className="absolute right-3 top-3 rounded-lg border border-line bg-panel/95 p-0.5 shadow-xl max-md:top-11">
            <ViewButtons />
          </div>
          <MobileSystems />
        </main>
        <aside className="scroll-thin z-10 w-80 shrink-0 overflow-y-auto border-l border-line bg-panel/95 max-md:h-[40%] max-md:w-auto max-md:border-l-0 max-md:border-t">
          {ready &&
            (mode === 'study' ? (
              <StudyPanel />
            ) : (
              <>
                <DetailsPanel />
                <FunctionsPanel />
              </>
            ))}
        </aside>
      </div>
    </div>
  )
}

function CenterNote({ children }: { children: React.ReactNode }) {
  return <div className="pointer-events-none absolute inset-0 grid place-items-center">{children}</div>
}

function TopBar() {
  const mode = useView((s) => s.mode)
  const setMode = useView((s) => s.setMode)
  const [xr, setXr] = useState<XRSupport>('checking')
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => void detectXRSupport().then(setXr), [])
  return (
    <header className="lab-topbar z-20 flex shrink-0 flex-wrap items-center gap-2 border-b border-line bg-panel px-3 py-2 sm:h-14 sm:flex-nowrap sm:gap-3 sm:py-0">
      <span className="lab-web-only flex items-center gap-2 sm:gap-3">
        <Logo compact />
        <LevelSwitch />
      </span>
      <div className="lab-modes flex shrink-0 rounded-md border border-line p-0.5 sm:ml-2" role="tablist" aria-label="Mode">
        {(['explore', 'study'] as const).map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`rounded px-3 py-1 text-[13px] font-medium ${mode === m ? 'bg-panel-2 text-ink' : 'text-mute hover:text-ink'}`}>
            {m === 'explore' ? 'Browse' : 'Study'}
          </button>
        ))}
      </div>
      {mode === 'explore' && <SearchBox />}
      <div className="ml-auto flex shrink-0 items-center gap-1">
        {err && <span className="mr-2 text-xs text-warn">{err}</span>}
        {(xr === 'immersive-vr' || xr === 'emulated') && (
          <Button
            variant="outline"
            size="sm"
            data-testid="enter-vr"
            onClick={async () => {
              setErr(null)
              try {
                const { enterVR } = await import('@/three/xr')
                await enterVR()
              } catch {
                setErr('Could not start VR')
              }
            }}
          >
            Enter VR{xr === 'emulated' ? ' (emulator)' : ''}
          </Button>
        )}
        <Link to="/about" className="lab-web-only px-2 text-[13px] text-mute hover:text-ink max-md:hidden">
          Sources
        </Link>
        <a href={EXPLORE_ROOT + '#/settings'} className="lab-web-only grid h-9 w-9 place-items-center rounded-md text-mute hover:bg-white/5 hover:text-ink" aria-label="Settings" title="Settings">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
          </svg>
        </a>
      </div>
    </header>
  )
}

type Hit = { kind: 'lab'; structure: Structure } | { kind: 'explore'; key: string; name: string }

/** One search over both levels: Lab structures, plus the Explore page that explains a match in plain words. */
function SearchBox() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const index = getIndex()
  const hits = useMemo<Hit[]>(() => {
    if (!index || !q.trim()) return []
    const lab: Hit[] = search(index, q, 12).map((h) => ({ kind: 'lab', structure: h.structure }))
    const parts = Object.entries(Shared.EXPLORE_NAMES).map(([key, name]) => ({ key, name }))
    const explore: Hit[] = Shared.search(q, { parts }, 2).parts.map((p) => ({ kind: 'explore', key: p.key, name: p.name }))
    return [...explore, ...lab]
  }, [index, q])
  const choose = (h: Hit) => {
    if (h.kind === 'explore') {
      location.href = Shared.exploreHref(h.key, EXPLORE_ROOT)
      return
    }
    const s = h.structure
    const lab = useLab.getState()
    if (!lab.systems[s.system].visible) lab.setSystem(s.system, { visible: true })
    useView.getState().select(s.id, { focus: true })
    setQ('')
    setOpen(false)
  }
  return (
    <div className="relative min-w-0 flex-1 max-sm:order-last max-sm:basis-full sm:max-w-sm">
      <input
        type="search"
        value={q}
        placeholder="Search 2,827 structures…"
        aria-label="Search structures"
        role="combobox"
        aria-expanded={open && hits.length > 0}
        aria-controls="search-results"
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
          setActive(0)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') setActive((a) => Math.min(a + 1, hits.length - 1))
          else if (e.key === 'ArrowUp') setActive((a) => Math.max(a - 1, 0))
          else if (e.key === 'Enter' && hits[active]) choose(hits[active])
          else if (e.key === 'Escape') setOpen(false)
        }}
        className="lab-search h-9 w-full rounded-md border border-line bg-[#06080c] px-3 text-[14px] text-ink placeholder:text-faint focus:border-accent focus:outline-none"
      />
      {open && hits.length > 0 && (
        <ul id="search-results" role="listbox" className="absolute left-0 right-0 top-10 z-30 max-h-80 overflow-y-auto rounded-md border border-line bg-panel py-1 shadow-xl">
          {hits.map((h, i) => (
            <li key={h.kind === 'lab' ? h.structure.id : 'x:' + h.key} role="option" aria-selected={i === active}>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => choose(h)} className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-[13px] ${i === active ? 'bg-panel-2' : 'hover:bg-panel-2'}`}>
                {h.kind === 'lab' ? (
                  <>
                    <span className="truncate">{h.structure.base}</span>
                    <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-faint">
                      <span className="h-2 w-2 rounded-full" style={{ background: SYSTEM_BY_ID[h.structure.system].color }} />
                      {SYSTEM_BY_ID[h.structure.system].label}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="truncate">{h.name}</span>
                    <span className="shrink-0 text-[11px] font-bold text-accent">Explore page</span>
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SystemRow({ id }: { id: SystemId }) {
  const sys = SYSTEM_BY_ID[id]
  const view = useLab((s) => s.systems[id])
  const set = useLab((s) => s.setSystem)
  const solo = useLab((s) => s.soloSystem)
  const status = useView((s) => s.loading[id])
  const count = useMemo(() => getIndex()?.filter((s) => s.system === id).length ?? 0, [id])
  return (
    <li className="border-b border-line/60 px-4 py-3">
      <div className="flex items-center gap-2">
        <label className="flex flex-1 cursor-pointer items-center gap-2.5">
          <input type="checkbox" checked={view.visible} onChange={(e) => set(id, { visible: e.target.checked })} className="h-4 w-4 accent-[#3ec6ff]" aria-label={`Show ${sys.label}`} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: sys.color }} aria-hidden />
          <span className="text-sm font-medium">{sys.label}</span>
        </label>
        {status === 'loading' && <span className="text-[11px] text-accent">loading…</span>}
        {status === 'error' && <span className="text-[11px] text-warn">failed</span>}
        <button onClick={() => solo(id)} className="text-[11px] text-faint hover:text-ink" title={`Show only ${sys.label}`}>
          only
        </button>
      </div>
      <p className="mt-1 pl-[26px] text-xs text-faint">
        {sys.blurb} · {fmtInt(count)}
        {sys.triangles > 1_000_000 ? ' · dense' : ''}
      </p>
      {view.visible && (
        <label className="mt-2 flex items-center gap-2 pl-[26px] text-[11px] text-faint">
          Opacity
          <input type="range" min={0.1} max={1} step={0.05} value={view.opacity} onChange={(e) => set(id, { opacity: Number(e.target.value) })} className="flex-1" aria-label={`${sys.label} opacity`} />
        </label>
      )}
    </li>
  )
}

function LeftTabs() {
  const [tab, setTab] = useState<'systems' | 'parts'>('systems')
  return (
    <>
      <div className="flex shrink-0 border-b border-line" role="tablist" aria-label="Browse">
        {(
          [
            ['systems', 'Systems'],
            ['parts', 'Parts'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`flex-1 py-2.5 text-[13px] font-medium ${tab === id ? 'border-b-2 border-accent text-ink' : 'text-mute hover:text-ink'}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">{tab === 'systems' ? <LeftPanel /> : <PartsPanel />}</div>
    </>
  )
}

function LeftPanel() {
  const bookmarks = useLab((s) => s.bookmarks)
  return (
    <div>
      <h2 className="px-4 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Body systems</h2>
      <p className="px-4 pb-2 text-[11px] text-faint">Or open “Parts” to add organs and structures one by one.</p>
      <ul>
        {SYSTEMS.map((s) => (
          <SystemRow key={s.id} id={s.id} />
        ))}
      </ul>
      <h2 className="px-4 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Bookmarks</h2>
      {bookmarks.length === 0 ? (
        <p className="px-4 pb-4 text-xs text-faint">Bookmark structures from the details panel to come back to them.</p>
      ) : (
        <ul className="pb-4">
          {bookmarks.map((id) => {
            const s = getStructure(id)
            if (!s) return null
            return (
              <li key={id}>
                <button
                  className="w-full truncate px-4 py-1.5 text-left text-[13px] text-mute hover:bg-panel-2 hover:text-ink"
                  onClick={() => {
                    useLab.getState().setSystem(s.system, { visible: true })
                    useView.getState().setMode('explore')
                    useView.getState().select(id, { focus: true })
                  }}
                >
                  {displayName(s)}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <p className="border-t border-line px-4 py-3 text-[11px] leading-relaxed text-faint">Drag to rotate · scroll to zoom · right-drag to pan · click a part to inspect it.</p>
    </div>
  )
}

/** On small screens the left panel is hidden; offer quick layer chips over the canvas instead. */
function MobileSystems() {
  const systems = useLab((s) => s.systems)
  const set = useLab((s) => s.setSystem)
  return (
    <div className="absolute left-2 right-2 top-2 flex gap-1.5 overflow-x-auto md:hidden">
      {SYSTEMS.map((s) => (
        <button key={s.id} onClick={() => set(s.id, { visible: !systems[s.id].visible })} className={`shrink-0 rounded-full border px-2.5 py-1 text-xs ${systems[s.id].visible ? 'border-accent bg-accent/15 text-ink' : 'border-line bg-panel/90 text-mute'}`}>
          {s.label}
        </button>
      ))}
    </div>
  )
}

function DetailsPanel() {
  const id = useView((s) => s.selectedId)
  const isolated = useView((s) => s.isolated)
  const hidden = useView((s) => s.hidden)
  const bookmarked = useLab((s) => (id ? s.bookmarks.includes(id) : false))
  const visibleSystems = useLab((s) => s.systems)
  const s = getStructure(id)
  const index = getIndex() ?? []

  if (!s) {
    return (
      <div className="p-5">
        <h2 className="text-sm font-semibold">Nothing selected</h2>
        <p className="mt-1 text-sm text-mute">Click any structure on the model, or search for one by name.</p>
        {(isolated || hidden.length > 0) && (
          <Button variant="outline" size="sm" className="mt-4" onClick={() => useView.getState().showAll()}>
            Show all hidden parts
          </Button>
        )}
        <div className="mt-6 rounded-md border border-line bg-panel-2/60 p-3 text-xs leading-relaxed text-mute">
          Tip: lower the opacity of the muscular layer to see bones through it, or use a cross-section to look inside.
        </div>
      </div>
    )
  }
  const sys = SYSTEM_BY_ID[s.system]
  const twin = pairOf(index, s)
  const shownSystems = new Set(SYSTEMS.filter((x) => visibleSystems[x.id].visible).map((x) => x.id))
  const near = neighbors(index, s, 6, shownSystems.size ? shownSystems : undefined)
  const [w, h, d] = sizeCm(s)
  const note = NOTES[s.base]

  return (
    <div className="p-5" data-testid="details">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: sys.color }}>
        <span className="h-2 w-2 rounded-full" style={{ background: sys.color }} />
        {sys.label}
      </div>
      <h2 className="mt-1.5 text-xl font-semibold leading-snug" data-testid="details-name">
        {displayName(s)}
      </h2>
      {note ? <p className="mt-3 text-sm leading-relaxed text-ink/90">{note}</p> : <p className="mt-3 text-sm text-faint">No study note for this structure yet.</p>}
      <ExploreLink base={s.base} system={s.system} />

      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
        <dt className="text-faint">Side</dt>
        <dd>{s.side ? (s.side === 'left' ? 'Left' : 'Right') : 'Midline / unpaired'}</dd>
        {tissueLabel(s.material) && (
          <>
            <dt className="text-faint">Tissue group</dt>
            <dd>{tissueLabel(s.material)}</dd>
          </>
        )}
        <dt className="text-faint">Extent</dt>
        <dd>
          {w} × {h} × {d} cm <span className="text-faint">(W × H × D, bounding box)</span>
        </dd>
      </dl>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <Button variant="outline" size="sm" onClick={() => useView.getState().frame(s.id)}>
          Focus
        </Button>
        <Button variant="outline" size="sm" onClick={() => useView.getState().isolate(isolated ? null : [s.id, ...(twin ? [twin.id] : [])])}>
          {isolated ? 'Show all' : 'Isolate'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => useView.getState().hide(s.id)}>
          Hide
        </Button>
        <Button variant="outline" size="sm" aria-pressed={bookmarked} onClick={() => useLab.getState().toggleBookmark(s.id)}>
          {bookmarked ? 'Bookmarked' : 'Bookmark'}
        </Button>
      </div>
      {twin && (
        <button className="mt-3 text-[13px] text-accent hover:underline" onClick={() => useView.getState().select(twin.id, { focus: true })}>
          Go to {twin.side} side
        </button>
      )}

      <h3 className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Neighbouring structures</h3>
      <ul className="mt-1.5">
        {near.map((n) => (
          <li key={n.id}>
            <button className="flex w-full items-center justify-between gap-2 py-1 text-left text-[13px] text-mute hover:text-ink" onClick={() => useView.getState().select(n.id, { focus: true })}>
              <span className="truncate">{displayName(n)}</span>
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: SYSTEM_BY_ID[n.system].color }} />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-faint">Nearest by bounding box among the visible layers.</p>
    </div>
  )
}

/** "In plain words": the Explore page for this structure (or its family), when there is one. */
function ExploreLink({ base, system }: { base: string; system: SystemId }) {
  const key = Shared.exploreFor(base, system)
  if (!key) return null
  return (
    <a href={Shared.exploreHref(key, EXPLORE_ROOT)} data-testid="explore-link" className="mt-3 flex items-center justify-between gap-3 rounded-md border border-line bg-panel-2/60 px-3 py-2.5 text-[13px] hover:border-accent">
      <span>
        <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-faint">In plain words</span>
        <span className="font-bold text-ink">{Shared.EXPLORE_NAMES[key]}</span> <span className="text-mute">in Explore: 3D, how it works, voice and AR</span>
      </span>
      <span aria-hidden className="text-accent">→</span>
    </a>
  )
}

function StudyPanel() {
  const q = useView((s) => s.question)
  const cards = useLab((s) => s.cards)
  const answered = useLab((s) => s.answered)
  const correct = useLab((s) => s.correct)
  const [system, setSystem] = useState<SystemId>(q?.system ?? 'skeletal')
  const [mode, setMode] = useState<'locate' | 'identify'>(q?.mode ?? 'locate')
  const d = useMemo(() => deck(getIndex() ?? [], system), [system])
  const m = mastery(d, cards)

  return (
    <div className="p-5" data-testid="study">
      <h2 className="text-sm font-semibold">Study</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="col-span-2 flex flex-col gap-1 text-[11px] text-faint">
          Deck
          <select value={system} onChange={(e) => setSystem(e.target.value as SystemId)} className="h-8 rounded-md border border-line bg-[#06080c] px-2 text-[13px] text-ink">
            {SYSTEMS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        {(['locate', 'identify'] as const).map((x) => (
          <button key={x} onClick={() => setMode(x)} aria-pressed={mode === x} className={`rounded-md border px-2 py-1.5 text-[13px] ${mode === x ? 'border-accent bg-accent/10' : 'border-line text-mute hover:text-ink'}`}>
            {x === 'locate' ? 'Locate on model' : 'Name the part'}
          </button>
        ))}
      </div>
      <Button variant="primary" className="mt-3 w-full" onClick={() => useView.getState().ask(mode, system)} data-testid="study-start">
        {q ? 'New question' : 'Start'}
      </Button>

      {q && (
        <div className="mt-5 rounded-md border border-line bg-panel-2/60 p-4" data-testid="question">
          {q.mode === 'locate' ? (
            <>
              <p className="text-[11px] uppercase tracking-[0.12em] text-faint">Click on the model</p>
              <p className="mt-1 text-lg font-semibold" data-testid="question-target">
                {q.target.base}
              </p>
            </>
          ) : (
            <>
              <p className="text-[11px] uppercase tracking-[0.12em] text-faint">What is the highlighted structure?</p>
              <ul className="mt-2 space-y-1.5">
                {q.options.map((o) => {
                  const isAnswer = q.result && o === q.target.base
                  const isWrong = q.result && !q.result.correct && o === q.result.picked
                  return (
                    <li key={o}>
                      <button disabled={!!q.result} onClick={() => useView.getState().answerIdentify(o)} className={`w-full rounded-md border px-3 py-2 text-left text-[13px] ${isAnswer ? 'border-accent bg-accent/15' : isWrong ? 'border-warn/60 bg-warn/10' : 'border-line hover:bg-white/5'}`}>
                        {o}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
          {q.result && (
            <div className="mt-3" role="status" data-testid="question-result">
              <p className={`text-sm font-medium ${q.result.correct ? 'text-accent' : 'text-warn'}`}>
                {q.result.correct ? 'Correct.' : q.mode === 'locate' ? `Not quite — you picked ${q.result.picked ?? 'nothing'}. The ${q.target.base} is highlighted.` : `Not quite — it’s the ${q.target.base}.`}
              </p>
              {NOTES[q.target.base] && <p className="mt-2 text-[13px] leading-relaxed text-mute">{NOTES[q.target.base]}</p>}
              <Button variant="outline" size="sm" className="mt-3" onClick={() => useView.getState().ask(q.mode, q.system)}>
                Next question
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <div className="flex justify-between text-[11px] text-faint">
          <span>{SYSTEM_BY_ID[system].label} deck</span>
          <span data-testid="mastery">
            {m.learned} learned · {m.seen} seen · {m.total} cards
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
          <div className="h-full bg-accent" style={{ width: `${m.total ? (m.learned / m.total) * 100 : 0}%` }} />
        </div>
        <p className="mt-3 text-[11px] text-faint">
          All decks: {answered} answered, {answered ? Math.round((correct / answered) * 100) : 0}% correct. A card counts as learned after three right answers in a row; missed cards come back next session.
        </p>
        {answered > 0 && (
          <button className="mt-2 text-[11px] text-faint underline hover:text-mute" onClick={() => confirm('Reset all study progress on this device?') && useLab.getState().resetProgress()}>
            Reset progress
          </button>
        )}
      </div>
    </div>
  )
}

const AXES: { id: ClipAxis; label: string }[] = [
  { id: 'none', label: 'No cut' },
  { id: 'axial', label: 'Axial' },
  { id: 'sagittal', label: 'Sagittal' },
  { id: 'coronal', label: 'Coronal' },
]

function Toolbar() {
  const clip = useView((s) => s.clip)
  const setClip = useView((s) => s.setClip)
  const isolated = useView((s) => s.isolated)
  const hidden = useView((s) => s.hidden)
  return (
    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 flex-wrap items-center whitespace-nowrap md:flex-nowrap justify-center gap-1 rounded-lg border border-line bg-panel/95 p-1 shadow-xl" role="toolbar" aria-label="View tools">
      {AXES.map((a) => (
        <button key={a.id} onClick={() => setClip({ axis: a.id })} aria-pressed={clip.axis === a.id} className={`rounded px-2.5 py-1 text-[12px] ${clip.axis === a.id ? 'bg-panel-2 text-ink' : 'text-mute hover:text-ink'}`}>
          {a.label}
        </button>
      ))}
      {clip.axis !== 'none' && (
        <>
          <input type="range" min={0} max={1} step={0.005} value={clip.pos} onChange={(e) => setClip({ pos: Number(e.target.value) })} className="w-36" aria-label="Cut position" />
          <button onClick={() => setClip({ flip: !clip.flip })} className="rounded px-2 py-1 text-[12px] text-mute hover:text-ink" title="Flip which side is kept">
            Flip
          </button>
        </>
      )}
      <span className="mx-1 h-5 w-px bg-line" />
      <button onClick={() => useView.getState().frame(null)} className="rounded px-2.5 py-1 text-[12px] text-mute hover:text-ink">
        Reset view
      </button>
      {(isolated || hidden.length > 0) && (
        <button onClick={() => useView.getState().showAll()} className="rounded px-2.5 py-1 text-[12px] text-accent hover:underline">
          Show all
        </button>
      )}
    </div>
  )
}

function LayerLoading() {
  const loading = useView((s) => s.loading)
  const busy = Object.entries(loading)
    .filter(([, v]) => v === 'loading')
    .map(([k]) => SYSTEM_BY_ID[k as SystemId].label)
  if (!busy.length) return null
  return (
    <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-md border border-line bg-panel/95 px-3 py-2 max-md:top-12">
      <Spinner label={`Loading ${busy.join(', ')}…`} />
    </div>
  )
}
