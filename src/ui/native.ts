// Native looks for the Lab, the same way Explore does it (app.js): Material 3 from the Kolam M3 kit
// inside the Android app, Apple HIG from the Kolam iOS kit inside the iPhone app. In a browser both
// kits do nothing and the Lab keeps its web look. ?app=android / ?app=ios force a look for testing.
// The five destinations match Explore's, plus Lab; Explore's live on the other page (../#/…).
import { EXPLORE_ROOT } from '@/shared/udambu'

interface M3Api {
  enabled: boolean
  setTitle(t: string): void
  setActive(id: string): void
  setBack(v: boolean | string | null): void
}
interface IOSApi {
  navBar: { set(cfg: Record<string, unknown>): unknown }
  tabBar: { select(id: string): void }
  icon(name: string): string
}
interface Kits {
  KolamM3?: { init(o: Record<string, unknown>): M3Api }
  KolamIOS?: { isIOS: boolean; detect(tokens: string[]): boolean; init(o: Record<string, unknown>): IOSApi | null }
}

const X = EXPLORE_ROOT
// Line icons drawn on the same 24px grid as Explore's (app.js ICONS)
const svg = (d: string) => `<svg class="k-icon ios-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`
const PERSON = svg('<circle cx="12" cy="5" r="2.5"/><path d="M12 8v7m0 0-3 6m3-6 3 6M6 11l6-1 6 1"/>')
const SHIELD = svg('<path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>')
const LAB = svg('<path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7Z"/><path d="M3.5 7 12 11.5 20.5 7M12 11.5v10"/>')
const GEAR = svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>')

export let m3: M3Api | null = null
export let ios: IOSApi | null = null

export function initNative() {
  const w = window as unknown as Kits
  const root = document.documentElement
  const isIOS = !!w.KolamIOS && (w.KolamIOS.isIOS || w.KolamIOS.detect(['Udambu-iOS']))
  if (isIOS) root.classList.remove('k-android')

  if (!isIOS && w.KolamM3) {
    const api = w.KolamM3.init({
      primary: '#0a8fc7',
      title: 'Lab',
      destinations: [
        { id: 'body', label: 'Body', icon: 'accessibility_new', href: X + '#/' },
        { id: 'parts', label: 'Parts', icon: 'grid_view', href: X + '#/parts' },
        { id: 'sick', label: 'Health', icon: 'health_and_safety', href: X + '#/sick' },
        { id: 'play', label: 'Quiz', icon: 'quiz', href: X + '#/play' },
        { id: 'lab', label: 'Lab', icon: 'view_in_ar', href: '#/' },
      ],
      active: 'lab',
      home: X + '#/',
      isRoot: () => !/^#\/about/.test(location.hash),
      actions: [{ id: 'm3Settings', icon: 'settings', label: 'Settings', href: X + '#/settings' }],
      icons: ['settings', 'view_in_ar'],
      hide: ['.lab-web-only'],
    })
    if (api.enabled) {
      m3 = api
      root.classList.add('app', 'android')
      const sync = () => setTimeout(() => {
        api.setActive('lab')
        const about = /^#\/about/.test(location.hash)
        api.setTitle(about ? 'Sources' : 'Lab')
        api.setBack(about ? '#/' : null)
      })
      sync()
      window.addEventListener('hashchange', sync)
    }
  }

  if (isIOS && w.KolamIOS) {
    const api = w.KolamIOS.init({
      appName: 'Udambu',
      uaTokens: ['Udambu-iOS'],
      tint: { light: '#0070ac', dark: '#6fd4ff' },
      tabs: [
        { id: 'body', label: 'Body', icon: PERSON, href: X + '#/' },
        { id: 'parts', label: 'Parts', icon: 'square.grid.2x2', href: X + '#/parts' },
        { id: 'sick', label: 'Health', icon: SHIELD, href: X + '#/sick' },
        { id: 'play', label: 'Quiz', icon: 'star', href: X + '#/play' },
        { id: 'lab', label: 'Lab', icon: LAB, href: '#/' },
      ],
      currentTab: 'lab',
      content: '#root',
    })
    if (api) {
      ios = api
      root.classList.add('app', 'ios')
      const settings = { id: 'iosSettings', icon: GEAR, label: 'Settings', onClick: () => (location.href = X + '#/settings') }
      const sync = () => {
        api.tabBar.select('lab')
        if (/^#\/about/.test(location.hash)) api.navBar.set({ title: 'Sources', back: { label: 'Lab', onClick: () => (location.hash = '#/') }, keepTitle: true })
        else api.navBar.set({ title: 'Lab', actions: [settings], keepTitle: true })
      }
      sync()
      window.addEventListener('hashchange', sync)
    }
  }
}
