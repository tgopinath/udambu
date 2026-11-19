// Udambu — Explore, the plain-words level: real 3D models of every part, how each one works, key figures,
// common conditions and a quiz. Every line can also be read aloud. The Lab (lab/, React + three.js) is the
// student level; both share settings, progress, search and links through shared/udambu-shared.js (US below).
const $ = (s, r = document) => r.querySelector(s);
const app = $('#app');
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SYS = Object.fromEntries(SYSTEMS.map(s => [s.key, s]));
const US = window.UdambuShared;                      // shared with the Lab: settings, progress, links, search
const LAB = US.LAB_URL;                              // the Lab page, relative to this one
document.querySelectorAll('[data-lab-link]').forEach(a => a.setAttribute('href', LAB));
// "Start in the Lab" (Settings): on a fresh launch at Home, open the Lab instead. Only once per session,
// so the Explore switch always works afterwards.
try {
  if (US.settings.get().startLevel === 'lab' && ['', '#', '#/'].includes(location.hash) && !sessionStorage.getItem('udambu.started')) {
    sessionStorage.setItem('udambu.started', '1'); location.replace(LAB);
  }
  sessionStorage.setItem('udambu.started', '1');
} catch {}
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem('be.' + k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('be.' + k, JSON.stringify(v)); } catch {} } };

// ---------- App mode (inside the iOS / Android shells) ----------
(() => {
  const ua = navigator.userAgent, q = new URLSearchParams(location.search).get('app');
  // iOS: the shared Kolam iOS kit decides (Udambu-iOS shell, ?app=ios); it wins over Android when both match
  const ios = window.KolamIOS ? (KolamIOS.isIOS || KolamIOS.detect(['Udambu-iOS'])) : (q === 'ios' || /Udambu-iOS/.test(ua));
  const android = !ios && (q === 'android' || window.Capacitor?.getPlatform?.() === 'android' || /Udambu-Android/.test(ua));
  if (ios) document.documentElement.classList.remove('k-android');
  if (ios || android) document.documentElement.classList.add('app', ios ? 'ios' : 'android');
})();
const haptic = (kind = 'tap') => { try { window.webkit?.messageHandlers?.haptic?.postMessage(kind); navigator.vibrate?.(kind === 'error' ? [30, 40, 30] : 12); } catch {} };

// ---------- Icons (line icons, 24px grid) ----------
const ICONS = {
  person: '<circle cx="12" cy="5" r="2.5"/><path d="M12 8v7m0 0-3 6m3-6 3 6M6 11l6-1 6 1"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  germ: '<circle cx="12" cy="12" r="5"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/><circle cx="10.5" cy="11" r=".6" fill="currentColor"/><circle cx="13.5" cy="13" r=".6" fill="currentColor"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z"/>',
  speaker: '<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
  mute: '<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="m17 9 5 6m0-6-5 6"/>',
  cube: '<path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7Z"/><path d="M3.5 7 12 11.5 20.5 7M12 11.5v10"/>',
  play: '<circle cx="12" cy="12" r="9.5"/><path d="M10 8.5v7l6-3.5Z" fill="currentColor"/>',
  pause: '<circle cx="12" cy="12" r="9.5"/><path d="M10 8.5v7M14 8.5v7"/>',
  back: '<path d="M15 5 8 12l7 7"/>', next: '<path d="m9 5 7 7-7 7"/>',
  heart: '<path d="M12 20s-7.5-4.6-9-9.5C2 7 4.3 4.5 7 4.5c2 0 3.6 1.3 5 3 1.4-1.7 3-3 5-3 2.7 0 5 2.5 4 6-1.5 4.9-9 9.5-9 9.5Z"/>',
  bone: '<path d="M7.5 6.5a2.5 2.5 0 1 0-3 3l9 9a2.5 2.5 0 1 0 3 3 2.5 2.5 0 1 0 3-3 2.5 2.5 0 1 0-3-3l-9-9a2.5 2.5 0 1 0-3-3"/>',
  muscle: '<path d="M5 18c2-6 4-9 7-11 1-1 3-1 3 1 0 1-1 2-2 2m-8 8c4 2 10 2 14-3 1-2 0-5-3-5-2 0-3 1-4 2"/>',
  zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>', drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>', bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z"/>',
  shield: '<path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  doctor: '<circle cx="12" cy="7" r="3.5"/><path d="M5 21c0-4 3-7 7-7s7 3 7 7"/><path d="M12 15v3M10.5 16.5h3"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
  hurt: '<path d="m7 4 13 13a2.1 2.1 0 0 1-3 3L4 7a2.1 2.1 0 0 1 3-3Z"/><path d="m10 10 1 1M13 13l1 1M12 9l1 1M9 12l1 1"/>',
  people: '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20c0-3.5 2.5-6 5.5-6s5.5 2.5 5.5 6M14 14.5c3 0 5.5 2 5.5 5.5"/>',
  mosquito: '<path d="M12 9v10M12 9l-5-5M12 9l5-5M12 13l-6 2M12 13l6 2M12 16l-5 4M12 16l5 4"/><ellipse cx="12" cy="11" rx="1.8" ry="3"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/>',
  ar: '<path d="M12 3 20 7.5v9L12 21l-8-4.5v-9Z"/><path d="M12 12 20 7.5M12 12v9M12 12 4 7.5"/><path d="M3 4V2h2M21 4V2h-2M3 20v2h2M21 20v2h-2" stroke-width="1.4"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 13 9 5 9-5"/>',
  vr: '<path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h13A2.5 2.5 0 0 1 21 8.5v6a2.5 2.5 0 0 1-2.5 2.5h-3l-2-2.5h-3l-2 2.5h-3A2.5 2.5 0 0 1 3 14.5Z"/><circle cx="8" cy="11.5" r="1.6"/><circle cx="16" cy="11.5" r="1.6"/>',
};
const icon = (n, cls = '') => `<svg class="k-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));
$('#back').innerHTML = icon('back');
$('#searchBtn').innerHTML = icon('search'); $('#settingsBtn').innerHTML = icon('settings');

// ---------- Voice ----------
// pages don't read themselves aloud unless the reader turns it on (Settings, or the speaker button); Listen buttons always work
let muted = !US.settings.get().autoRead;
const muteBtn = $('#mute');
const paintMute = () => { muteBtn.innerHTML = icon(muted ? 'mute' : 'speaker'); muteBtn.setAttribute('aria-label', muted ? 'Auto read-aloud off' : 'Auto read-aloud on'); muteBtn.setAttribute('aria-pressed', String(muted)); };
paintMute();
muteBtn.onclick = () => { muted = !muted; US.settings.set({ autoRead: !muted }); if (muted) Voice.stop(); paintMute(); };
// say: plays the recorded clip when there is one, otherwise the device voice
function say(id, text, btn) { if (muted) return; Voice.play(id, text, btn); }
// a big round speaker button that reads `text`
const speakBtn = (id, text, label = 'Listen', iconOnly = false) => `<button class="speak${iconOnly ? ' icon-only' : ''}" data-say="${esc(id)}" data-text="${esc(text)}" aria-label="${esc(label)}">${icon('speaker')}${iconOnly ? '' : `<span>${esc(label)}</span>`}</button>`;
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-say]');
  if (b) { e.preventDefault(); e.stopPropagation(); haptic(); Voice.play(b.dataset.say, b.dataset.text, b); }
}, true);



// ---------- AR: put a part on the floor ----------
// iPhone app → AR Quick Look (native, model inside the app) · Android app → Google Scene Viewer · web → <model-viewer>
// (WebXR / Scene Viewer / Quick Look). Android's Scene Viewer fetches the file itself, so it uses the published copy.
const AR_WEB_BASE = 'https://udambu.vercel.app/ar/';
const isIOSApp = () => document.documentElement.classList.contains('ios');
const isAndroidApp = () => document.documentElement.classList.contains('android');
const arButton = (k, label = 'View in your room') => AR_MODELS[k] ? `<button class="ar-btn" data-ar="${k}">${icon('ar')}<span>${esc(label)}</span></button>` : '';
let mvLoad = null;
const loadModelViewer = () => mvLoad ??= new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'vendor/model-viewer.min.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
function openAR(k) {
  const p = PART[k] || { name: 'Human skeleton' }, m = AR_MODELS[k]; if (!m) return;
  haptic();
  if (isIOSApp() && window.webkit?.messageHandlers?.ar) { window.webkit.messageHandlers.ar.postMessage({ file: `ar/${k}.usdz`, title: p.name }); return; }
  if (isAndroidApp()) {
    const file = encodeURIComponent(AR_WEB_BASE + k + '.glb'), title = encodeURIComponent(p.name);
    location.href = `intent://arvr.google.com/scene-viewer/1.0?file=${file}&mode=ar_preferred&title=${title}&resizable=true#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(AR_WEB_BASE + k + '.glb')};end;`;
    return;
  }
  const sheet = document.createElement('div'); sheet.className = 'arsheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', `${p.name} in your room`);
  sheet.innerHTML = `<header><div><p class="eyebrow">Augmented reality</p><h2 class="heading-2">${esc(p.name)}</h2></div><button class="k-iconbtn" data-close aria-label="Close">${icon('close')}</button></header>
    <div class="ar-stage"><p class="ar-wait">${icon('cube')} Loading the 3D model…</p></div>
    <footer><p class="muted">${icon('ar')} On a phone, tap <b>Open camera</b>, point it at the floor and tap to place the ${esc(p.name.toLowerCase())}. Pinch to resize, drag to turn.</p>
    <p class="credit">“${esc(m.name)}” by ${esc(m.by)} · ${esc(m.license)} · via Sketchfab</p></footer>`;
  document.body.appendChild(sheet); document.body.classList.add('noscroll');
  const close = () => { sheet.remove(); document.body.classList.remove('noscroll'); removeEventListener('keydown', esc_); };
  const esc_ = (e) => e.key === 'Escape' && close(); addEventListener('keydown', esc_);
  sheet.querySelector('[data-close]').onclick = close;
  loadModelViewer().then(() => {
    sheet.querySelector('.ar-stage').innerHTML = `<model-viewer src="ar/${k}.glb" ios-src="ar/${k}.usdz" alt="${esc(p.name)}, 3D model" ar ar-modes="webxr scene-viewer quick-look" ar-placement="floor" ar-scale="auto"
      camera-controls touch-action="pan-y" auto-rotate rotation-per-second="18deg" shadow-intensity="1" shadow-softness=".8" exposure="1.05" environment-image="neutral">
      <button slot="ar-button" class="ar-open">${icon('ar')} Open camera</button>
      <p slot="progress-bar"></p></model-viewer>`;
    const mv = sheet.querySelector('model-viewer');
    mv.addEventListener('load', () => { if (!mv.canActivateAR) sheet.querySelector('footer .muted').innerHTML = `${icon('ar')} AR opens on a phone. Here you can turn the model around and zoom in.`; });
  }).catch(() => { sheet.querySelector('.ar-stage').innerHTML = `<p class="ar-wait">The 3D viewer could not load.</p>`; });
}
// opening a part from anywhere starts on its Overview tab (the Surprising facts cards open Facts)
document.addEventListener('click', (e) => { const a = e.target.closest('a[href^="#/part/"]'); if (a && !a.hasAttribute('data-facts')) sessionStorage.setItem('be.tab', 'overview'); }, true);
document.addEventListener('click', (e) => { const b = e.target.closest('[data-ar]'); if (b) { e.preventDefault(); openAR(b.dataset.ar); } });

// ---------- Android app mode (Material Design 3, from the shared Kolam M3 kit) ----------
// Only inside the Android app (or ?app=android); in a browser KolamM3.init returns a stub and nothing changes.
const m3Actions = () => [
  { id: 'm3Search', icon: 'search', label: 'Search', href: '#/search' },
  { id: 'm3Mute', icon: muted ? 'volume_off' : 'volume_up', label: muted ? 'Auto read-aloud off' : 'Auto read-aloud on',
    onClick: () => { muteBtn.click(); m3.setActions(m3Actions()); } },
  { id: 'm3Settings', icon: 'settings', label: 'Settings', href: '#/settings' }];
const m3 = window.KolamM3 ? KolamM3.init({
  primary: '#0a8fc7', title: 'Udambu',
  destinations: [
    { id: 'body', label: 'Body', icon: 'accessibility_new', href: '#/' },
    { id: 'parts', label: 'Parts', icon: 'grid_view', href: '#/parts' },
    { id: 'sick', label: 'Health', icon: 'health_and_safety', href: '#/sick' },
    { id: 'play', label: 'Quiz', icon: 'quiz', href: '#/play' },
    { id: 'lab', label: 'Lab', icon: 'view_in_ar', href: LAB },
  ],
  actions: m3Actions(), icons: ['volume_off', 'volume_up', 'search', 'settings'],
  hide: ['.topbar', '.tabbar'],
}) : { enabled: false, setTitle() {}, setActive() {}, setBack() {}, setActions() {} };

// ---------- iPhone app mode (Apple HIG, from the shared Kolam iOS kit; local copy in vendor/ios) ----------
// Only inside the Udambu-iOS shell (or ?app=ios); KolamIOS.init returns null in a browser and nothing changes.
const IOS_UP = { parts: ['#/parts', 'Parts'], sick: ['#/sick', 'Health'], play: ['#/play', 'Quiz'], body: ['#/', 'Body'] };
const iosIcon = n => icon(n, 'ios-icon');
const iosActions = () => [
  { id: 'iosSearch', icon: iosIcon('search'), label: 'Search', onClick: () => (location.hash = '#/search') },
  { id: 'iosMute', icon: iosIcon(muted ? 'mute' : 'speaker'), label: muted ? 'Auto read-aloud off' : 'Auto read-aloud on',
    onClick: () => { muteBtn.click(); iosNav(); } },
  { id: 'iosSettings', icon: iosIcon('settings'), label: 'Settings', onClick: () => (location.hash = '#/settings') }];
const ios = document.documentElement.classList.contains('ios') && window.KolamIOS ? KolamIOS.init({
  appName: 'Udambu', uaTokens: ['Udambu-iOS'],
  tint: { light: '#0070ac', dark: '#6fd4ff' },
  tabs: [
    { id: 'body', label: 'Body', icon: iosIcon('person'), href: '#/' },
    { id: 'parts', label: 'Parts', icon: 'square.grid.2x2', href: '#/parts' },
    { id: 'sick', label: 'Health', icon: iosIcon('shield'), href: '#/sick' },
    { id: 'play', label: 'Quiz', icon: 'star', href: '#/play' },
    { id: 'lab', label: 'Lab', icon: iosIcon('cube'), href: LAB },
  ],
  currentTab: 'body', content: '#app',
}) : null;
let iosState = { title: 'Udambu', up: null };
function iosNav() {
  if (!ios) return;
  const { title, up } = iosState;
  if (up) KolamIOS.navBar.set({ title, back: { label: up[1], onClick: () => (history.length > 1 ? history.back() : (location.hash = up[0])) }, actions: iosActions(), keepTitle: true });
  else KolamIOS.navBar.set({ title, large: title !== 'Udambu', actions: iosActions(), keepTitle: true });
}

// ---------- Router ----------
const routes = [
  [/^#?\/?$/, home], [/^#\/parts$/, partsPage], [/^#\/part\/([\w-]+)$/, partPage],
  [/^#\/sick$/, sickPage], [/^#\/ill\/([\w-]+)$/, illPage], [/^#\/play$/, playPage],
  [/^#\/play\/quiz$/, quizGame], [/^#\/play\/which$/, whichGame],
  [/^#\/search(?:\?q=(.*))?$/, searchPage], [/^#\/settings$/, settingsPage],
];
let cleanups = [];
const onLeave = (fn) => cleanups.push(fn);
function render() {
  cleanups.forEach(f => { try { f(); } catch {} }); cleanups = []; Voice.stop();
  const h = location.hash || '#/';
  for (const [re, fn] of routes) { const m = h.match(re); if (m) { fn(...m.slice(1)); break; } }
  const tab = /^#\/part/.test(h) ? 'parts' : /^#\/(sick|ill)/.test(h) ? 'sick' : /^#\/play/.test(h) ? 'play' : 'body';
  document.querySelectorAll('.tabbar a').forEach(a => a.dataset.tab === tab ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  const deep = /^#\/(part|ill)\/|^#\/play\/|^#\/(search|settings)/.test(h);
  $('#back').hidden = !deep; document.body.classList.toggle('deep', deep);
  // Android app (M3): the kit resets its overrides on every route change, so set ours just after it
  if (m3.enabled) setTimeout(() => { m3.setActive(tab); m3.setBack(/^#\/part\//.test(h) ? '#/parts' : /^#\/ill\//.test(h) ? '#/sick' : /^#\/play\//.test(h) ? '#/play' : /^#\/(search|settings)/.test(h) ? '#/' : null); });
  if (ios) {   // root pages: the page's own heading becomes the large title (the page copy is hidden in styles.css)
    const ph = app.querySelector('.page-head h1');
    if (ph && !deep) iosState.title = ph.textContent;
    KolamIOS.tabBar.select(tab); iosState.up = deep ? IOS_UP[tab] : null; iosNav(); KolamIOS.enhance(app);
  }
  window.scrollTo(0, 0);
  mountSketchfab(app);
}
$('#back').onclick = () => { haptic(); history.length > 1 ? history.back() : (location.hash = '#/'); };
window.addEventListener('hashchange', render);
const setTitle = (t) => { $('#title').textContent = t || ''; document.title = t ? `${t} · Udambu` : 'Udambu'; m3.setTitle(t || 'Udambu'); iosState.title = t || 'Udambu'; };
const img3d = (k, cls = '') => `<img class="${cls}" src="img/models/${k}.jpg" alt="" loading="lazy">`;
// a real 3D model from Sketchfab, turning by itself until the child drags it. The still picture underneath
// stays until Sketchfab's viewer says the model is drawn (viewer API), so a child never sees a loading screen.
const sketchfab = (k, title) => MODELS[k] ? `<iframe class="sf" data-uid="${MODELS[k].uid}" title="${esc(title)} in 3D" allow="autoplay; fullscreen; xr-spatial-tracking" allowfullscreen></iframe>` : '';
const SF_OPTS = { autostart: 1, preload: 1, autospin: 0.25, ui_theme: 'dark', ui_infos: 0, ui_watermark: 0, ui_watermark_link: 0, ui_controls: 0, ui_stop: 0, ui_inspector: 0,
  ui_settings: 0, ui_vr: 0, ui_ar: 0, ui_help: 0, ui_annotations: 0, ui_hint: 2, ui_loading: 0, ui_fullscreen: 0, dnt: 1 };
let sfApi = null;
function mountSketchfab(root = document) {
  const frames = [...root.querySelectorAll('iframe.sf:not([data-on])')]; if (!frames.length || /[?&]shot=/.test(location.search)) return;   // screenshots keep the still picture
  sfApi ??= new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js'; s.onload = () => ok(window.Sketchfab); s.onerror = no; document.head.appendChild(s); });
  frames.forEach(f => { f.dataset.on = 1;
    const plain = () => { f.src = `https://sketchfab.com/models/${f.dataset.uid}/embed?` + new URLSearchParams(SF_OPTS); setTimeout(() => f.classList.add('ready'), 4000); };
    sfApi.then(SF => new SF('1.12.1', f).init(f.dataset.uid, { ...SF_OPTS,
      success: (api) => { api.start(); api.addEventListener('viewerready', () => f.classList.add('ready')); }, error: plain })).catch(plain);
  });
}
const credit = (k) => { const m = MODELS[k]; return m ? `<p class="credit">3D model “${esc(m.name)}” by ${esc(m.by)} on Sketchfab${m.license ? ' · ' + esc(m.license) : ''}</p>` : ''; };
const eyebrow = (t) => `<p class="eyebrow">${esc(t)}</p>`;

// "See it in the Lab": the same structure in the student atlas (layers, sections, VR), when the Lab model has it
const labButton = (k, label = 'See it in the Lab') => { const href = US.labHref(k, LAB); return href ? `<a class="lab-btn" href="${href}" data-testid="see-in-lab">${icon('layers')}<span>${esc(label)}</span></a>` : ''; };

// picture card for a part (its 3D model)
const partCard = (p) => `<a class="pcard" href="#/part/${p.key}" style="--sys:${SYS[p.sys].color}">
  <span class="pcard-art">${img3d(p.key)}</span><span class="pcard-text"><span class="pcard-sys">${esc(SYS[p.sys].name)}</span><span class="pcard-name">${esc(p.name)}</span></span></a>`;

// ---------- Home: full-body 3D hero, then body systems ----------
function home() {
  setTitle('');
  let sys = store.get('homeSys', SYSTEMS[0].key);
  app.innerHTML = `
    <section class="home">
      <div class="hero3d">
        <div class="hero3d-model">${img3d('body', 'poster')}${sketchfab('body', 'The human body')}</div>
        <div class="hero3d-text">
          ${eyebrow('Human body atlas')}
          <h1 class="display">Explore the<br>human body</h1>
          <p class="lede">${PARTS.length} parts of the human body in real 3D: what each one does, how it works, and what can go wrong.</p>
          <div class="hero-actions">${arButton('body', 'Skeleton in your room')}${speakBtn('ui-home', 'Choose a body system, then open a part to see it in 3D, learn how it works and what can go wrong.', 'Listen')}</div>
        </div>
      </div>
      <section class="wowsec">
        <div class="row-head"><div><h2 class="heading-2">Surprising facts</h2><p class="muted">Things your body does that you might not believe.</p></div>
          <button class="k-btn k-btn-outline" id="moreFacts">${icon('refresh')} More facts</button></div>
        <div class="wowgrid" id="wowgrid"></div>
      </section>
      ${levelChooser()}
      <section class="systems">
        <div class="row-head"><h2 class="heading-2">Body systems</h2><a class="link" href="#/parts">All parts ${icon('next')}</a></div>
        <div class="sysrail" role="tablist">${SYSTEMS.map(s => { const first = PARTS.find(p => p.sys === s.key);
          return `<button class="systile" role="tab" data-sys="${s.key}" aria-selected="${s.key === sys}" style="--sys:${s.color}">${img3d(first.key)}<span><b>${esc(s.name)}</b><small>${PARTS.filter(p => p.sys === s.key).length} parts</small></span></button>`; }).join('')}</div>
      </section>
      <section class="sysparts" id="sysparts"></section>
      ${labPromo()}
      ${progressStrip()}
    </section>`;
  app.querySelectorAll('[data-level]').forEach(b => b.onclick = () => { haptic(); const lv = b.dataset.level; US.settings.set({ startLevel: lv });
    if (lv === 'lab') location.href = LAB; else render(); });
  const paint = (speak) => {
    const s = SYS[sys];
    $('#sysparts').innerHTML = `<div class="row-head"><div><h2 class="heading-2">${esc(s.name)}</h2><p class="muted">${esc(s.say)}</p></div>${speakBtn('sys-' + s.key, s.name + '. ' + s.say, 'Listen', true)}</div>
      <div class="pgrid">${PARTS.filter(p => p.sys === sys).map(partCard).join('')}</div>`;
    document.querySelectorAll('.systile').forEach(b => b.setAttribute('aria-selected', String(b.dataset.sys === sys)));
    if (speak) say('sys-' + s.key, s.name + '. ' + s.say);
  };
  paint();
  app.querySelector('.sysrail').onclick = (e) => { const b = e.target.closest('[data-sys]'); if (!b) return; haptic(); sys = b.dataset.sys; store.set('homeSys', sys); paint(true); };
  // four surprising facts at a time; tapping one opens that part on its Facts tab
  const facts = shuffle(PARTS.filter(p => p.wow)); let at = 0;
  const paintFacts = () => { const four = Array.from({ length: 4 }, (_, n) => facts[(at + n) % facts.length]); at = (at + 4) % facts.length;
    $('#wowgrid').innerHTML = four.map(p => `<a class="wowcard" href="#/part/${p.key}" data-facts style="--sys:${SYS[p.sys].color}"><span class="wowcard-art">${img3d(p.key)}</span>
      <span class="wowcard-body"><small>${esc(p.name)}</small><span>${esc(p.wow)}</span></span></a>`).join(''); };
  paintFacts();
  $('#moreFacts').onclick = () => { haptic(); paintFacts(); };
  $('#wowgrid').onclick = (e) => { if (e.target.closest('[data-facts]')) sessionStorage.setItem('be.tab', 'facts'); };
}

// ---------- All parts, by body system ----------
function partsPage() {
  setTitle('Body parts');
  app.innerHTML = `<section class="page">
    <header class="page-head"><div>${eyebrow(`${PARTS.length} parts · ${SYSTEMS.length} systems`)}<h1 class="display">Body parts</h1></div>${speakBtn('ui-parts', 'All the parts of the human body, grouped by system. Open any part to explore it in 3D.', 'Listen')}</header>
    <nav class="sysnav" aria-label="Body systems">${SYSTEMS.map(s => `<a href="#sys-${s.key}" style="--sys:${s.color}"><i></i>${esc(s.name)}</a>`).join('')}</nav>
    ${SYSTEMS.map(s => `<section class="sys" id="sys-${s.key}" style="--sys:${s.color}">
      <div class="sys-head"><div><h2 class="heading-2">${esc(s.name)}</h2><p class="muted">${esc(s.say)}</p></div>${speakBtn('sys-' + s.key, s.name + '. ' + s.say, 'Listen', true)}</div>
      <div class="pgrid">${PARTS.filter(p => p.sys === s.key).map(partCard).join('')}</div></section>`).join('')}
  </section>`;
  app.querySelector('.sysnav').onclick = (e) => { const a = e.target.closest('a'); if (!a) return; e.preventDefault(); document.querySelector(a.getAttribute('href')).scrollIntoView({ behavior: 'smooth' }); };
}

// ---------- One body part ----------
function partPage(key) {
  const p = PART[key]; if (!p) return (location.hash = '#/parts');
  setTitle(p.name); US.progress.markSeen(key);
  const s = SYS[p.sys];
  const team = PARTS.filter(x => x.sys === p.sys), i = team.indexOf(p);
  const prev = team[(i - 1 + team.length) % team.length], next = team[(i + 1) % team.length];
  const TABS = [['overview', 'Overview'], ['how', 'How it works'], ['facts', 'Facts'], ['health', 'Health']];
  let tab = sessionStorage.getItem('be.tab') || 'overview';
  app.innerHTML = `<article class="part" style="--sys:${s.color}">
    <header class="part-hero">
      <div class="hero-model">${img3d(key, 'poster')}${sketchfab(key, p.name)}<p class="stage-hint">${icon('cube')} Drag to turn · pinch to zoom</p></div>
      <div class="hero-text">
        ${eyebrow(s.name)}
        <h1 class="display">${esc(p.name)}</h1>${p.term ? `<p class="term">${esc(p.term)}</p>` : ''}
        <p class="lede">${esc(p.say)}</p>
        <div class="hero-actions">${arButton(key)}${labButton(key)}${speakBtn(key + '-say', p.name + '. ' + p.say, 'Listen', !!AR_MODELS[key])}</div>
      </div>
    </header>
    ${p.wow ? `<button class="wow" data-say="${key}-wow" data-text="${esc(p.wow)}"><span class="wow-k">${icon('sparkle')} Did you know?</span><span class="wow-t">${esc(p.wow)}</span></button>` : ''}
    <nav class="tabs" role="tablist">${TABS.map(([k, t]) => `<button role="tab" data-tab="${k}" aria-selected="${k === tab}">${t}</button>`).join('')}</nav>
    <section class="tabpanel" id="panel"></section>
    <nav class="prevnext">
      <a href="#/part/${prev.key}">${icon('back')}<span><small>Previous</small>${esc(prev.name)}</span></a>
      <a href="#/part/${next.key}"><span><small>Next</small>${esc(next.name)}</span>${icon('next')}</a>
    </nav>
  </article>`;

  const panel = $('#panel');
  let stop = () => {};
  const show = (t) => {
    stop(); stop = () => {}; tab = t; sessionStorage.setItem('be.tab', t);
    app.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
    if (t === 'overview') panel.innerHTML = `
      <div class="ov">
        <div><p class="body-lg prose">${esc(p.more)}</p>${speakBtn(key + '-more', p.more, 'Read it to me')}</div>
        <aside class="ov-side">
          ${p.where ? `<div class="ov-where"><p class="eyebrow">Where it is</p><p>${esc(p.where)}</p></div>` : ''}
          ${p.stats ? `<dl class="stats">${p.stats.map(([l, v]) => `<div><dt>${esc(l)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
        </aside>
      </div>${credit(key)}`;
    if (t === 'how') { panel.innerHTML = `
      <div class="player">
        <div class="demo-stage" id="stage">${demoSVG(p.demo)}</div>
        <div class="player-side">
          <p class="eyebrow" id="stepk">Step 1 of 4</p>
          <p class="step-now" id="stepnow"></p>
          <div class="step-dots" id="dots">${p.how.map((_, n) => `<button data-step="${n}" aria-label="Step ${n + 1}"></button>`).join('')}</div>
          <div class="player-ctl">
            <button class="k-iconbtn" id="sprev" aria-label="Previous step">${icon('back')}</button>
            <button class="k-iconbtn play" id="pp" aria-label="Pause">${icon('pause')}</button>
            <button class="k-iconbtn" id="snext" aria-label="Next step">${icon('next')}</button>
            ${speakBtn(key + '-how', p.how.join(' '), 'Listen', true)}
          </div>
        </div>
      </div>`;
      const svg = $('#stage svg'), Q = DEMO_CYCLE / 4; let paused = false, last = -1, raf;
      const paint = (n) => { if (n === last) return; last = n; $('#stepk').textContent = `Step ${n + 1} of 4`; $('#stepnow').textContent = p.how[n];
        $('#dots').querySelectorAll('button').forEach((d, k) => d.classList.toggle('on', k === n)); };
      const tick = () => { paint(Math.floor((svg.getCurrentTime() % DEMO_CYCLE) / Q)); raf = requestAnimationFrame(tick); };
      const go = (n) => { n = (n + 4) % 4; svg.setCurrentTime(n * Q + .05); paint(n); haptic(); };
      tick(); stop = () => cancelAnimationFrame(raf);
      $('#snext').onclick = () => go(last + 1); $('#sprev').onclick = () => go(last - 1);
      $('#dots').onclick = (e) => { const d = e.target.closest('[data-step]'); if (d) go(+d.dataset.step); };
      $('#pp').onclick = () => { paused = !paused; haptic(); paused ? svg.pauseAnimations() : svg.unpauseAnimations();
        $('#pp').innerHTML = icon(paused ? 'play' : 'pause'); $('#pp').setAttribute('aria-label', paused ? 'Play' : 'Pause'); };
    }
    if (t === 'facts') panel.innerHTML = `<ol class="factlist">${[p.wow, ...p.facts].filter(Boolean).map((f, n) => `<li><button data-say="${key}-${n ? 'fact-' + (n - 1) : 'wow'}" data-text="${esc(f)}"><span class="fn">${String(n + 1).padStart(2, '0')}</span><span>${esc(f)}</span></button></li>`).join('')}</ol>`;
    if (t === 'health') panel.innerHTML = `
      <p class="eyebrow">Keeping it healthy</p>
      <ul class="rows care">${p.care.map((c, n) => `<li><button data-say="${key}-care-${n}" data-text="${esc(c)}">${icon('check')}<span>${esc(c)}</span></button></li>`).join('')}</ul>
      ${p.ill.length ? `<p class="eyebrow">Related conditions</p><div class="ill-chips">${p.ill.map(k => ILL[k] && `<a class="ill-chip" href="#/ill/${k}">${icon(kindIcon(ILL[k]))}${esc(ILL[k].name)}${icon('next')}</a>`).join('')}</div>` : ''}`;
  };
  app.querySelector('.tabs').onclick = (e) => { const b = e.target.closest('[data-tab]'); if (b && b.dataset.tab !== tab) { haptic(); show(b.dataset.tab); } };
  show(tab); onLeave(() => stop());
  setTimeout(() => say(key + '-say', p.name + '. ' + p.say, $('.hero-actions .speak')), 300);
}

// ---------- Two levels: Explore (here) and the Lab ----------
// Asked once on Home (and changeable in Settings): who is learning decides where Udambu opens.
function levelChooser() {
  if (US.settings.get().startLevel) return '';
  return `<section class="chooser" aria-labelledby="chooserTitle">
    <div><p class="eyebrow">Two levels</p><h2 class="heading-2" id="chooserTitle">Who is learning today?</h2>
      <p class="muted">Pick where Udambu opens. You can switch levels at any time.</p></div>
    <div class="chooser-opts">
      <button class="chooser-opt" data-level="explore">${icon('person')}<span><b>Explore</b><small>Plain words for everyone from age 5: real 3D parts, how they work, voice, AR and a quiz.</small></span></button>
      <button class="chooser-opt" data-level="lab">${icon('layers')}<span><b>Lab</b><small>For students: 2,827 named structures, layers, cross-sections, study cards and VR.</small></span></button>
    </div></section>`;
}
function labPromo() {
  const feats = [['layers', '2,827 structures', 'Every named bone, muscle, vessel, nerve and organ, layer by layer.'],
    ['cube', 'Cross-sections', 'Cut axial, sagittal or coronal slices through the real model.'],
    ['check', 'Study cards', 'Locate and name quizzes with spaced repetition.'],
    ['vr', 'Life-size VR', 'Walk around the body in a Meta Quest browser.']];
  return `<section class="labpromo">
    <div class="labpromo-head"><div><p class="eyebrow">Udambu Lab · for students</p><h2 class="heading-2">Go deeper in the Lab</h2>
      <p class="muted">The same body as a full anatomy atlas from open data (BodyParts3D and Z-Anatomy). Every part page here links to its structure there.</p></div>
      <div class="labpromo-actions"><a class="k-btn k-btn-primary" href="${LAB}">${icon('layers')} Open the Lab</a><a class="k-btn k-btn-outline" href="${LAB}#/?mode=study">Start studying</a></div></div>
    <ul class="labfeats">${feats.map(([ic, t, d]) => `<li>${icon(ic)}<b>${t}</b><span>${d}</span></li>`).join('')}</ul></section>`;
}
function progressStrip() {
  const s = US.progress.summary(PARTS.length);
  if (!s.partsSeen && s.quizBest == null && !s.labAnswered) return '';
  const cell = (v, l) => `<div class="k-stat"><span class="k-stat-value">${v}</span><span class="k-stat-label">${l}</span></div>`;
  return `<section class="progress-strip"><div class="row-head"><h2 class="heading-2">Your progress</h2><a class="link" href="#/settings">Settings ${icon('next')}</a></div>
    <div class="stats-row">${cell(`${s.partsSeen}<small>/${s.partsTotal}</small>`, 'Parts explored')}${cell(s.quizBest == null ? '–' : `${s.quizBest}<small>/10</small>`, 'Best body quiz')}
    ${cell(s.labAnswered, 'Lab cards answered')}${cell(s.labAccuracy == null ? '–' : s.labAccuracy + '%', 'Lab answers right')}</div></section>`;
}

// ---------- One search across both levels ----------
let labNames = null;
const loadLabNames = () => labNames ??= new Promise((ok) => {
  if (window.UDAMBU_LAB_NAMES) return ok(window.UDAMBU_LAB_NAMES);
  const s = document.createElement('script'); s.src = 'shared/lab-names.js';
  s.onload = () => ok(window.UDAMBU_LAB_NAMES || []); s.onerror = () => ok([]); document.head.appendChild(s);
});
const LAB_SYS = { skeletal: 'Skeletal', muscular: 'Muscular', joints: 'Joints & ligaments', cardiovascular: 'Cardiovascular', nervous: 'Nervous', visceral: 'Organs', lymphatic: 'Lymphatic' };
function searchPage(q0) {
  setTitle('Search');
  const q = decodeURIComponent(q0 || '');
  app.innerHTML = `<section class="page search">
    <header class="page-head"><div>${eyebrow('Explore and Lab')}<h1 class="display">Search</h1></div></header>
    <label class="searchbox">${icon('search')}<input type="search" id="q" value="${esc(q)}" placeholder="A part, a condition or any of 2,827 structures" aria-label="Search Udambu" autocomplete="off"></label>
    <div id="results" aria-live="polite"></div></section>`;
  const input = $('#q'), out = $('#results');
  const paint = async () => {
    const v = input.value.trim();
    if (!v) { out.innerHTML = `<p class="muted">Try “heart”, “femur”, “migraine” or “sciatic nerve”.</p>`; return; }
    const r = US.search(v, { parts: PARTS, illnesses: ILLNESSES, lab: await loadLabNames() }, 8);
    if (input.value.trim() !== v) return;
    const none = !r.parts.length && !r.illnesses.length && !r.lab.length;
    out.innerHTML = none ? `<p class="muted">Nothing found for “${esc(v)}”.</p>` : `
      ${r.parts.length ? `<h2 class="eyebrow res-h">Explore · body parts</h2><div class="pgrid small">${r.parts.map(partCard).join('')}</div>` : ''}
      ${r.illnesses.length ? `<h2 class="eyebrow res-h">Explore · conditions</h2><div class="ill-chips">${r.illnesses.map(i => `<a class="ill-chip" href="#/ill/${i.key}">${icon(kindIcon(i))}${esc(i.name)}${icon('next')}</a>`).join('')}</div>` : ''}
      ${r.lab.length ? `<h2 class="eyebrow res-h">Lab · 3D atlas structures</h2><ul class="rows labhits">${r.lab.map(h => `<li><a href="${LAB}#/?focus=${encodeURIComponent(h.system + ':' + h.base)}">${icon('layers')}<span><b>${esc(h.base.replace(/^\((.*)\)$/, '$1'))}</b><small>${LAB_SYS[h.system] || h.system}${h.explore && PART[h.explore] ? ' · explained in Explore as ' + esc(PART[h.explore].name) : ''}</small></span>${icon('next')}</a></li>`).join('')}</ul>` : ''}`;
  };
  let t; input.oninput = () => { clearTimeout(t); t = setTimeout(() => { history.replaceState(null, '', '#/search' + (input.value ? '?q=' + encodeURIComponent(input.value) : '')); paint(); }, 120); };
  paint(); setTimeout(() => input.focus(), 50);
}

// ---------- One settings screen for both levels ----------
function settingsPage() {
  setTitle('Settings');
  const st = US.settings.get();
  const seg = (name, val, opts) => `<div class="seg" role="radiogroup" data-set="${name}">${opts.map(([v, l]) => `<button role="radio" data-v="${v}" aria-checked="${String(v) === String(val)}" aria-selected="${String(v) === String(val)}">${l}</button>`).join('')}</div>`;
  const sw = (name, on, text, sub) => `<label class="k-switch setrow"><span><b>${text}</b>${sub ? `<small>${sub}</small>` : ''}</span><input type="checkbox" data-sw="${name}" ${on ? 'checked' : ''}><span class="k-switch-track" aria-hidden="true"></span></label>`;
  const s = US.progress.summary(PARTS.length);
  app.innerHTML = `<section class="page settings">
    <header class="page-head"><div>${eyebrow('Explore and Lab')}<h1 class="display">Settings</h1></div></header>
    <section class="setgroup"><h2 class="heading-3">Open Udambu in</h2><p class="muted">Where a fresh start lands. Explore for plain words, the Lab for students.</p>
      ${seg('startLevel', st.startLevel ?? 'ask', [['explore', 'Explore'], ['lab', 'Lab'], ['ask', 'Ask me']])}</section>
    <section class="setgroup"><h2 class="heading-3">Voice</h2>
      ${sw('autoRead', st.autoRead, 'Read pages aloud automatically', 'Listen buttons always work, with or without this.')}</section>
    <section class="setgroup"><h2 class="heading-3">VR comfort in the Lab</h2><p class="muted">For Meta Quest and other headsets. Takes effect next time you enter VR.</p>
      <p class="setlabel">Turning</p>${seg('vr.turn', st.vr.turn, [['snap', 'Snap turn'], ['smooth', 'Smooth turn']])}
      <p class="setlabel">Snap angle</p>${seg('vr.snapDegrees', st.vr.snapDegrees, [[30, '30°'], [45, '45°']])}
      ${sw('vr.teleport', st.vr.teleport, 'Teleport', 'Push a thumbstick forward to aim, pull the trigger to jump.')}
      ${sw('vr.vignette', st.vr.vignette, 'Comfort vignette', 'Darkens the edges while turning, which helps with motion sickness.')}</section>
    <section class="setgroup"><h2 class="heading-3">Your progress</h2><p class="muted">Kept on this device only.</p>
      <div class="stats-row">
        <div class="k-stat"><span class="k-stat-value">${s.partsSeen}<small>/${s.partsTotal}</small></span><span class="k-stat-label">Parts explored</span></div>
        <div class="k-stat"><span class="k-stat-value">${s.quizBest ?? '–'}${s.quizBest == null ? '' : '<small>/10</small>'}</span><span class="k-stat-label">Best body quiz</span></div>
        <div class="k-stat"><span class="k-stat-value">${s.labAnswered}</span><span class="k-stat-label">Lab cards answered</span></div>
        <div class="k-stat"><span class="k-stat-value">${s.labLearned}</span><span class="k-stat-label">Lab cards learned</span></div></div>
      <div class="set-actions"><button class="k-btn k-btn-outline" data-reset="explore">Reset Explore</button><button class="k-btn k-btn-outline" data-reset="lab">Reset Lab study</button><button class="k-btn k-btn-outline" data-reset="all">Reset everything</button></div></section>
    <section class="setgroup"><h2 class="heading-3">About</h2>
      <ul class="rows labhits"><li><a href="${LAB}#/about">${icon('layers')}<span><b>Sources, licences and privacy</b><small>Lab models: BodyParts3D and Z-Anatomy (CC BY-SA), used under CC BY-NC-SA 4.0. Explore models: Sketchfab authors, credited on each page.</small></span>${icon('next')}</a></li></ul>
      <p class="credit">General information, not medical advice. No accounts, no analytics.</p></section>
  </section>`;
  const save = (path, v) => { const [a, b] = path.split('.'); US.settings.set(b ? { [a]: { [b]: v } } : { [a]: v }); haptic(); };
  app.querySelectorAll('[data-set]').forEach(g => g.onclick = (e) => { const b = e.target.closest('[data-v]'); if (!b) return;
    let v = b.dataset.v; if (g.dataset.set === 'startLevel' && v === 'ask') v = null; if (g.dataset.set === 'vr.snapDegrees') v = +v;
    save(g.dataset.set, v); g.querySelectorAll('[data-v]').forEach(x => { const on = x === b; x.setAttribute('aria-checked', on); x.setAttribute('aria-selected', on); }); });
  app.querySelectorAll('[data-sw]').forEach(i => i.onchange = () => { save(i.dataset.sw, i.checked); if (i.dataset.sw === 'autoRead') { muted = !i.checked; if (muted) Voice.stop(); paintMute(); } });
  app.querySelectorAll('[data-reset]').forEach(b => b.onclick = () => {
    const what = { explore: 'parts explored and quiz scores', lab: 'Lab study cards and answers', all: 'all progress in Explore and the Lab' }[b.dataset.reset];
    if (!confirm(`Reset ${what} on this device?`)) return;
    US.progress.reset(b.dataset.reset === 'all' ? undefined : b.dataset.reset);
    if (b.dataset.reset !== 'lab') store.set('best', {});
    toast('Progress reset'); render();
  });
}
const toast = (t) => { const w = $('#toast'); w.innerHTML = `<div class="k-toast"><span class="k-toast-text">${esc(t)}</span></div>`; setTimeout(() => (w.innerHTML = ''), 2400); };

const kindIcon = (ill) => ill.kind === 'hurt' ? 'hurt' : ill.kind === 'germ' ? 'germ' : 'heart';
const MOSQUITO = new Set(['malaria', 'dengue']);
const KIND_NAME = { germ: 'Infection', body: 'Condition', hurt: 'Injury' };

// ---------- Illnesses ----------
function sickPage() {
  setTitle('Health');
  let f = store.get('sickFilter', 'all');
  const kinds = [['all', 'All'], ['germ', 'Germs'], ['body', 'Inside the body'], ['hurt', 'Injuries']];
  app.innerHTML = `<section class="page">
    <header class="page-head"><div>${eyebrow(`${ILLNESSES.length} conditions`)}<h1 class="display">Common conditions</h1></div>${speakBtn('ui-sick', 'Common conditions, with their causes, symptoms, treatment, prevention and when to see a doctor.', 'Listen')}</header>
    <div class="note">${icon('doctor')}<p><b>General information, not medical advice.</b> For a diagnosis or treatment, talk to a doctor. In an emergency, call your local emergency number.</p></div>
    <div class="seg" role="tablist">${kinds.map(([k, n]) => `<button data-k="${k}" aria-selected="${k === f}">${n}</button>`).join('')}</div>
    <div class="ilist" id="ig"></div></section>`;
  const paint = () => {
    $('#ig').innerHTML = ILLNESSES.filter(i => f === 'all' || i.kind === f).map(i => `<a class="irow kind-${i.kind}" href="#/ill/${i.key}">
      <span class="irow-art">${img3d(i.parts[0])}</span>
      <span class="irow-text"><b>${esc(i.name)}</b><small>${esc(i.parts.map(k => PART[k]?.name).filter(Boolean).slice(0, 2).join(' · '))}</small></span>
      ${i.spread ? `<span class="tag">${icon('people')} Spreads</span>` : MOSQUITO.has(i.key) ? `<span class="tag">${icon('mosquito')} Mosquito</span>` : ''}${icon('next')}</a>`).join('');
    document.querySelectorAll('.seg button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.k === f)));
  };
  paint();
  app.querySelector('.seg').onclick = (e) => { const b = e.target.closest('[data-k]'); if (!b) return; haptic(); f = b.dataset.k; store.set('sickFilter', f); paint(); };
}

function illPage(key) {
  const i = ILL[key]; if (!i) return (location.hash = '#/sick');
  setTitle(i.name);
  const list = (arr, id, ic) => `<ul class="rows">${arr.map((t, n) => `<li><button data-say="${key}-${id}-${n}" data-text="${esc(t)}">${icon(ic)}<span>${esc(t)}</span>${icon('speaker', 'row-say')}</button></li>`).join('')}</ul>`;
  app.innerHTML = `<article class="part ill kind-${i.kind}">
    <header class="part-hero">
      <div class="hero-model">${img3d(i.parts[0], 'hero-img')}</div>
      <div class="hero-text">
        ${eyebrow(KIND_NAME[i.kind])}
        <div class="part-title"><h1 class="display">${esc(i.name)}</h1>${speakBtn(key + '-say', i.name + '. ' + i.say, 'Listen')}</div>
        <p class="lede">${esc(i.say)}</p>
        <p class="badges">${i.spread ? `<span class="k-badge k-badge-warning">${icon('people')} Contagious</span>` : MOSQUITO.has(key) ? `<span class="k-badge k-badge-warning">${icon('mosquito')} Spread by mosquitoes</span>` : `<span class="k-badge k-badge-success">${icon('shield')} Not contagious</span>`}</p>
      </div>
    </header>
    ${i.cause ? `<section class="block"><div class="block-head"><span class="num">01</span><h2 class="heading-2">Causes</h2></div><p class="body-lg prose">${esc(i.cause)}</p></section>` : ''}
    <section class="block"><div class="block-head"><span class="num">02</span><h2 class="heading-2">Symptoms</h2></div>${list(i.signs, 'sign', 'sparkle')}</section>
    <section class="block"><div class="block-head"><span class="num">03</span><h2 class="heading-2">Diagnosis &amp; treatment</h2></div>${list(i.better, 'better', 'heart')}</section>
    <section class="block"><div class="block-head"><span class="num">04</span><h2 class="heading-2">Prevention</h2></div>${list(i.safe, 'safe', 'shield')}</section>
    <section class="block"><div class="block-head"><span class="num">05</span><h2 class="heading-2">Parts of the body affected</h2></div><div class="pgrid small">${i.parts.map(k => PART[k] && partCard(PART[k])).join('')}</div></section>
    <div class="note warn">${icon('doctor')}<p><b>When to see a doctor.</b> ${esc(i.doctor || 'If symptoms are severe, unusual or not getting better, see a doctor.')}</p></div>
    <p class="credit">General information, not medical advice.</p>
  </article>`;
  setTimeout(() => say(key + '-say', i.name + '. ' + i.say, $('.part-title .speak')), 300);
}

// ---------- Quiz & games ----------
function playPage() {
  setTitle('Quiz');
  const best = store.get('best', {});
  const card = (href, k, title, sub, id, lead) => `<a class="game${lead ? ' lead' : ''}" href="${href}"><span class="game-art">${img3d(k)}</span>
    <span class="game-text"><b>${title}</b><span>${sub}</span>${best[id] != null ? `<small>Best: ${best[id]} / 10</small>` : ''}</span>${icon('next')}</a>`;
  app.innerHTML = `<section class="page">
    <header class="page-head"><div>${eyebrow('Test what you know')}<h1 class="display">Quiz</h1></div>${speakBtn('ui-play', 'Pick a quiz. The body quiz has ten questions with a short explanation after each answer. In what does this, watch an animation and name the part.', 'Listen')}</header>
    <div class="games">
      ${card('#/play/quiz', 'heart', 'Body quiz', '10 questions. Learn something new after every answer.', 'quiz', true)}
      ${card('#/play/which', 'lungs', 'What does this?', 'Watch the animation, then pick the part.', 'which')}
    </div></section>`;
}

function shuffle(a) { return shuffleArr(a); }
const shuffleArr = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const scoreBar = (score, round) => `<div class="score" aria-label="Question ${round + 1} of 10">${Array.from({ length: 10 }, (_, n) => `<i class="${n < score.length ? (score[n] ? 'ok' : 'no') : n === round ? 'now' : ''}"></i>`).join('')}</div>`;
function finish(game, score) {
  const n = score.filter(Boolean).length, best = store.get('best', {});
  if (best[game] == null || n > best[game]) { best[game] = n; store.set('best', best); }
  US.progress.setBest(game, n);
  const msg = n >= 8 ? 'Excellent. You know the body well.' : n >= 5 ? 'Good result. Review the explanations to learn more.' : 'Keep going. Each answer explains the facts.';
  app.querySelector('.gamebox').innerHTML = `<div class="done"><p class="eyebrow">Your score</p><p class="done-score">${n}<span>/10</span></p>
    <div class="stars">${[3, 6, 9].map(t => icon('star', n >= t ? 'lit' : '')).join('')}</div><p class="lede">${msg}</p>
    <div class="done-actions"><button class="k-btn k-btn-primary k-btn-lg" id="again">${icon('refresh')} Play again</button><a class="k-btn k-btn-outline k-btn-lg" href="#/play">All games</a></div></div>`; Sound.win();
  say('ui-score-' + n, `You got ${n} out of 10. ${msg}`);
  $('#again').onclick = () => render();
}

// lesson card shown after every quiz answer
function lesson(box, k, right, text, onNext, last, sayId, answer) {
  const p = PART[k];
  box.innerHTML = `<div class="lesson ${right ? 'right' : 'wrong'}">
    <p class="verdict">${icon(right ? 'check' : 'sparkle')} ${right ? 'Correct' : `The answer is ${esc(answer || 'the ' + p.name.toLowerCase())}`}</p>
    <div class="lesson-body"><div class="lesson-model" id="lmodel">${img3d(k)}<button class="turn3d" id="turn">${icon('cube')} Turn in 3D</button></div>
      <div><h3 class="heading-2">${esc(p.name)}</h3><p class="body-lg">${esc(text)}</p>
      <div class="lesson-actions">${speakBtn(sayId, text, 'Listen')}<a class="k-btn k-btn-outline" href="#/part/${k}">Learn more</a>${arButton(k, 'In your room')}
      <button class="k-btn k-btn-primary k-btn-lg" id="next">${last ? 'See score' : 'Next question'} ${icon('next')}</button></div></div></div></div>`;
  $('#turn').onclick = () => { haptic(); $('#lmodel').innerHTML = img3d(k, 'poster') + sketchfab(k, p.name); mountSketchfab($('#lmodel')); };
  $('#next').onclick = () => { haptic(); onNext(); };
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function quizGame() {
  setTitle('Body quiz');
  const qs = [...shuffle(QUIZ.filter(q => q.a && !q.opts)).slice(0, 5), ...shuffle(QUIZ.filter(q => q.pic)).slice(0, 2), ...shuffle(QUIZ.filter(q => q.opts)).slice(0, 3)];
  const order = shuffle(qs), score = [];
  let round = 0;
  app.innerHTML = `<section class="page gamebox"></section>`;
  const ask = () => {
    if (round >= 10) return finish('quiz', score);
    const q = order[round], box = app.querySelector('.gamebox'); let answered = false;
    const id = `quiz-${QUIZ.indexOf(q)}`;
    let prompt, opts, correct, learnKey, learnText;
    if (q.opts) {                                   // text answers
      prompt = q.q; correct = q.a; learnKey = q.part; learnText = q.learn;
      opts = q.opts.map((t, n) => ({ n, html: `<span class="opt-text">${esc(t)}</span>`, say: t }));
      opts = shuffle(opts);
    } else {                                        // pick the part, or name the part in the picture
      const k = q.a || q.pic, p = PART[k];
      const others = shuffle(PARTS.filter(x => x.key !== k && x.sys !== p.sys)).slice(0, 2);
      learnKey = k; learnText = p.say; correct = k; prompt = q.q || 'What is this body part?';
      opts = shuffle([p, ...others]).map(o => ({ n: o.key, html: q.pic ? `<span class="opt-text">${esc(o.name)}</span>` : `${img3d(o.key)}<span>${esc(o.name)}</span>`, say: o.name }));
    }
    box.innerHTML = `${scoreBar(score, round)}
      <div class="qhead"><p class="eyebrow">Question ${round + 1} of 10</p><h2 class="question">${esc(prompt)}</h2>${speakBtn(id, prompt, 'Listen')}</div>
      ${q.pic ? `<div class="qpic">${img3d(q.pic)}</div>` : ''}
      <div class="opts ${q.opts || q.pic ? 'text' : ''}">${opts.map(o => `<button class="opt" data-n="${o.n}">${o.html}</button>`).join('')}</div>
      <div id="lesson"></div>`;
    say(id, prompt);
    box.querySelector('.opts').onclick = (e) => {
      const b = e.target.closest('.opt'); if (!b || answered) return; answered = true;
      const right = String(b.dataset.n) === String(correct);
      score.push(right); haptic(right ? 'success' : 'error'); right ? Sound.yes() : Sound.no();
      box.querySelectorAll('.opt').forEach(x => { x.disabled = true; if (String(x.dataset.n) === String(correct)) x.classList.add('right'); });
      if (!right) b.classList.add('wrong');
      box.querySelector('.score').outerHTML = scoreBar(score, round + 1);
      const qi = QUIZ.indexOf(q), ans = q.opts ? q.opts[q.a] : null;
      const vid = q.opts ? `quiz-${right ? 'ok' : 'ans'}-${qi}` : `${right ? 'ok' : 'ans'}-${learnKey}`;
      const vtext = (right ? 'Correct! ' : q.opts ? `The answer is: ${ans}. ` : `The answer is the ${PART[learnKey].name}. `) + learnText;
      lesson($('#lesson'), learnKey, right, learnText, () => { round++; ask(); }, round === 9, vid, ans);
      say(vid, vtext);
    };
  };
  ask();
}

function whichGame() {
  setTitle('What does this?');
  const pool = shuffle(PARTS.filter(p => !['nerves', 'skull', 'ribs'].includes(p.key))).slice(0, 10), score = [];
  let round = 0;
  app.innerHTML = `<section class="page gamebox"></section>`;
  const ask = () => {
    if (round >= 10) return finish('which', score);
    const p = pool[round], box = app.querySelector('.gamebox');
    const opts = shuffle([p, ...shuffle(PARTS.filter(x => x.demo !== p.demo && x.sys !== p.sys)).slice(0, 2)]);
    box.innerHTML = `${scoreBar(score, round)}
      <div class="qhead"><p class="eyebrow">Question ${round + 1} of 10</p><h2 class="question">Which part does this?</h2>${speakBtn('which-' + p.key, p.how.join(' '), 'Listen to a clue')}</div>
      <div class="demo-stage">${demoSVG(p.demo)}</div>
      <div class="opts">${opts.map(o => `<button class="opt" data-k="${o.key}">${img3d(o.key)}<span>${esc(o.name)}</span></button>`).join('')}</div><div id="lesson"></div>`; say('which-q', 'Which part does this?');
    let answered = false;
    box.querySelector('.opts').onclick = (e) => {
      const b = e.target.closest('.opt'); if (!b || answered) return; answered = true;
      const right = b.dataset.k === p.key; score.push(right); haptic(right ? 'success' : 'error'); right ? Sound.yes() : Sound.no();
      box.querySelectorAll('.opt').forEach(x => { x.disabled = true; if (x.dataset.k === p.key) x.classList.add('right'); });
      if (!right) b.classList.add('wrong');
      box.querySelector('.score').outerHTML = scoreBar(score, round + 1);
      const vid = (right ? 'ok-' : 'ans-') + p.key;
      lesson($('#lesson'), p.key, right, p.say, () => { round++; ask(); }, round === 9, vid);
      say(vid, (right ? 'Correct! ' : `The answer is the ${p.name}. `) + p.say);
    };
  };
  ask();
}

const Sound = (() => {
  let ctx;
  const tone = (f, t, d, type = 'sine', g = 0.15) => {
    if (muted) return; ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), v = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, ctx.currentTime + t);
    v.gain.setValueAtTime(g, ctx.currentTime + t); v.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d);
    o.connect(v).connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + d);
  };
  return { yes: () => { tone(660, 0, .15); tone(880, .1, .25); }, no: () => { tone(220, 0, .25, 'triangle'); tone(160, .12, .3, 'triangle'); },
    win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, i * .12, .3)) };
})();
function confetti(x = innerWidth / 2, y = innerHeight / 2) {
  const colors = ['#0077b6', '#d63384', '#0e8c8c', '#e7c43c', '#d0312d'];
  for (let i = 0; i < 26; i++) {
    const c = document.createElement('i'); c.className = 'confetti';
    c.style.cssText = `left:${x}px;top:${y}px;background:${colors[i % 5]};--dx:${(Math.random() - .5) * 320}px;--dy:${-80 - Math.random() * 220}px;--r:${Math.random() * 720}deg`;
    document.body.appendChild(c); setTimeout(() => c.remove(), 1200);
  }
}

render();
// Android hardware Back outside M3 mode (the M3 kit handles it in the app): back inside the app, leave from home
if (!m3.enabled) window.Capacitor?.Plugins?.App?.addListener('backButton', () => {
  if ((location.hash || '#/') === '#/') window.Capacitor.Plugins.App.exitApp(); else history.back();
});
if ('serviceWorker' in navigator && location.protocol === 'https:' && !document.documentElement.classList.contains('app')) navigator.serviceWorker.register('sw.js').catch(() => {});
