// Udambu — a human body atlas for adults: real 3D models of every part, how each one works, key figures,
// common conditions and a quiz. Every line can also be read aloud.
const $ = (s, r = document) => r.querySelector(s);
const app = $('#app');
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SYS = Object.fromEntries(SYSTEMS.map(s => [s.key, s]));
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem('be.' + k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('be.' + k, JSON.stringify(v)); } catch {} } };

// ---------- App mode (inside the iOS / Android shells) ----------
(() => {
  const ua = navigator.userAgent, q = new URLSearchParams(location.search).get('app');
  const ios = q === 'ios' || /Udambu-iOS/.test(ua);
  const android = q === 'android' || (!ios && (window.Capacitor?.getPlatform?.() === 'android' || /Udambu-Android/.test(ua)));
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
};
const icon = (n, cls = '') => `<svg class="k-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));
$('#back').innerHTML = icon('back');

// ---------- Voice ----------
let muted = store.get('muted', true);   // pages don't read themselves aloud unless the reader turns it on; Listen buttons always work
const muteBtn = $('#mute');
const paintMute = () => { muteBtn.innerHTML = icon(muted ? 'mute' : 'speaker'); muteBtn.setAttribute('aria-label', muted ? 'Auto read-aloud off' : 'Auto read-aloud on'); muteBtn.setAttribute('aria-pressed', String(muted)); };
paintMute();
muteBtn.onclick = () => { muted = !muted; store.set('muted', muted); if (muted) Voice.stop(); paintMute(); };
// say: plays the recorded clip when there is one, otherwise the device voice
function say(id, text, btn) { if (muted) return; Voice.play(id, text, btn); }
// a big round speaker button that reads `text`
const speakBtn = (id, text, label = 'Listen', iconOnly = false) => `<button class="speak${iconOnly ? ' icon-only' : ''}" data-say="${esc(id)}" data-text="${esc(text)}" aria-label="${esc(label)}">${icon('speaker')}${iconOnly ? '' : `<span>${esc(label)}</span>`}</button>`;
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-say]');
  if (b) { e.preventDefault(); e.stopPropagation(); haptic(); Voice.play(b.dataset.say, b.dataset.text, b); }
}, true);


// ---------- Router ----------
const routes = [
  [/^#?\/?$/, home], [/^#\/parts$/, partsPage], [/^#\/part\/([\w-]+)$/, partPage],
  [/^#\/sick$/, sickPage], [/^#\/ill\/([\w-]+)$/, illPage], [/^#\/play$/, playPage],
  [/^#\/play\/quiz$/, quizGame], [/^#\/play\/which$/, whichGame],
];
let cleanups = [];
const onLeave = (fn) => cleanups.push(fn);
function render() {
  cleanups.forEach(f => { try { f(); } catch {} }); cleanups = []; Voice.stop();
  const h = location.hash || '#/';
  for (const [re, fn] of routes) { const m = h.match(re); if (m) { fn(...m.slice(1)); break; } }
  const tab = /^#\/part/.test(h) ? 'parts' : /^#\/(sick|ill)/.test(h) ? 'sick' : /^#\/play/.test(h) ? 'play' : 'body';
  document.querySelectorAll('.tabbar a').forEach(a => a.dataset.tab === tab ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  const deep = /^#\/(part|ill)\/|^#\/play\//.test(h);
  $('#back').hidden = !deep; document.body.classList.toggle('deep', deep);
  window.scrollTo(0, 0);
  mountSketchfab(app);
}
$('#back').onclick = () => { haptic(); history.length > 1 ? history.back() : (location.hash = '#/'); };
window.addEventListener('hashchange', render);
const setTitle = (t) => { $('#title').textContent = t || ''; document.title = t ? `${t} · Udambu` : 'Udambu'; };
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
          ${speakBtn('ui-home', 'Choose a body system, then open a part to see it in 3D, learn how it works and what can go wrong.', 'Listen')}
        </div>
      </div>
      <section class="systems">
        <div class="row-head"><h2 class="heading-2">Body systems</h2><a class="link" href="#/parts">All parts ${icon('next')}</a></div>
        <div class="sysrail" role="tablist">${SYSTEMS.map(s => { const first = PARTS.find(p => p.sys === s.key);
          return `<button class="systile" role="tab" data-sys="${s.key}" aria-selected="${s.key === sys}" style="--sys:${s.color}">${img3d(first.key)}<span><b>${esc(s.name)}</b><small>${PARTS.filter(p => p.sys === s.key).length} parts</small></span></button>`; }).join('')}</div>
      </section>
      <section class="sysparts" id="sysparts"></section>
    </section>`;
  const paint = (speak) => {
    const s = SYS[sys];
    $('#sysparts').innerHTML = `<div class="row-head"><div><h2 class="heading-2">${esc(s.name)}</h2><p class="muted">${esc(s.say)}</p></div>${speakBtn('sys-' + s.key, s.name + '. ' + s.say, 'Listen', true)}</div>
      <div class="pgrid">${PARTS.filter(p => p.sys === sys).map(partCard).join('')}</div>`;
    document.querySelectorAll('.systile').forEach(b => b.setAttribute('aria-selected', String(b.dataset.sys === sys)));
    if (speak) say('sys-' + s.key, s.name + '. ' + s.say);
  };
  paint();
  app.querySelector('.sysrail').onclick = (e) => { const b = e.target.closest('[data-sys]'); if (!b) return; haptic(); sys = b.dataset.sys; store.set('homeSys', sys); paint(true); };
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
  setTitle(p.name);
  const s = SYS[p.sys], m = MODELS[key];
  const team = PARTS.filter(x => x.sys === p.sys), i = team.indexOf(p);
  const prev = team[(i - 1 + team.length) % team.length], next = team[(i + 1) % team.length];
  app.innerHTML = `<article class="part" style="--sys:${s.color}">
    <header class="part-hero">
      <div class="hero-model">${img3d(key, 'poster')}${sketchfab(key, p.name)}<p class="stage-hint">${icon('cube')} Drag to turn · pinch to zoom</p></div>
      <div class="hero-text">
        ${eyebrow(s.name)}
        <div class="part-title"><div><h1 class="display">${esc(p.name)}</h1>${p.term ? `<p class="term">${esc(p.term)}</p>` : ''}</div>${speakBtn(key + '-say', p.name + '. ' + p.say, 'Listen')}</div>
        <p class="lede">${esc(p.say)}</p>
        ${p.where ? `<p class="where">${icon('person')}<span>${esc(p.where)}</span></p>` : ''}
        ${p.stats ? `<dl class="stats">${p.stats.map(([l, v]) => `<div><dt>${esc(l)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
        ${credit(key)}
        <nav class="jump">${[['how', 'How it works'], ['more', 'What it does'], ['facts', 'Facts'], ['care', 'Care']].map(([id, t]) => `<a href="#${id}" data-jump="${id}">${t}</a>`).join('')}</nav>
      </div>
    </header>

    <section class="block" id="how">
      <div class="block-head"><span class="num">01</span><h2 class="heading-2">How it works</h2><button class="k-iconbtn playpause" id="pp" aria-label="Pause">${icon('pause')}</button></div>
      <div class="demo-grid"><div class="demo-stage" id="stage">${demoSVG(p.demo)}</div>
      <ol class="steps" id="steps">${p.how.map((t, n) => `<li><button data-say="${key}-how-${n}" data-text="${esc(t)}"><span class="n">${n + 1}</span><span>${esc(t)}</span></button></li>`).join('')}</ol></div>
    </section>

    <section class="block" id="more">
      <div class="block-head"><span class="num">02</span><h2 class="heading-2">What it does</h2>${speakBtn(key + '-more', p.more, 'Listen')}</div>
      <p class="body-lg prose">${esc(p.more)}</p>
    </section>

    <section class="block" id="facts">
      <div class="block-head"><span class="num">03</span><h2 class="heading-2">Facts</h2></div>
      <ul class="rows">${p.facts.map((f, n) => `<li><button data-say="${key}-fact-${n}" data-text="${esc(f)}">${icon('bulb')}<span>${esc(f)}</span>${icon('speaker', 'row-say')}</button></li>`).join('')}</ul>
    </section>

    <section class="block" id="care">
      <div class="block-head"><span class="num">04</span><h2 class="heading-2">Keeping it healthy</h2></div>
      <ul class="rows care">${p.care.map((c, n) => `<li><button data-say="${key}-care-${n}" data-text="${esc(c)}">${icon('check')}<span>${esc(c)}</span>${icon('speaker', 'row-say')}</button></li>`).join('')}</ul>
    </section>

    ${p.ill.length ? `<section class="block">
      <div class="block-head"><span class="num">05</span><h2 class="heading-2">Illnesses</h2></div>
      <div class="ill-chips">${p.ill.map(k => ILL[k] && `<a class="ill-chip" href="#/ill/${k}">${icon(kindIcon(ILL[k]))}${esc(ILL[k].name)}${icon('next')}</a>`).join('')}</div>
    </section>` : ''}

    <nav class="prevnext">
      <a href="#/part/${prev.key}">${icon('back')}<span><small>Previous</small>${esc(prev.name)}</span></a>
      <a href="#/part/${next.key}"><span><small>Next</small>${esc(next.name)}</span>${icon('next')}</a>
    </nav>
  </article>`;

  app.querySelector('.jump').onclick = (e) => { const a = e.target.closest('[data-jump]'); if (!a) return; e.preventDefault(); document.getElementById(a.dataset.jump).scrollIntoView({ behavior: 'smooth' }); };
  // step captions follow the 8-second animation
  const svg = $('#stage svg'), steps = [...document.querySelectorAll('#steps li')];
  let paused = false, raf;
  const tick = () => { const n = Math.floor((svg.getCurrentTime() % DEMO_CYCLE) / (DEMO_CYCLE / 4)); steps.forEach((li, k) => li.classList.toggle('on', k === n)); raf = requestAnimationFrame(tick); };
  tick(); onLeave(() => cancelAnimationFrame(raf));
  $('#pp').onclick = () => { paused = !paused; haptic(); paused ? svg.pauseAnimations() : svg.unpauseAnimations();
    $('#pp').innerHTML = icon(paused ? 'play' : 'pause'); $('#pp').setAttribute('aria-label', paused ? 'Play' : 'Pause'); };
  setTimeout(() => say(key + '-say', p.name + '. ' + p.say, $('.part-title .speak')), 300);
}

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

const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const scoreBar = (score, round) => `<div class="score" aria-label="Question ${round + 1} of 10">${Array.from({ length: 10 }, (_, n) => `<i class="${n < score.length ? (score[n] ? 'ok' : 'no') : n === round ? 'now' : ''}"></i>`).join('')}</div>`;
function finish(game, score) {
  const n = score.filter(Boolean).length, best = store.get('best', {});
  if (best[game] == null || n > best[game]) { best[game] = n; store.set('best', best); }
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
      <div class="lesson-actions">${speakBtn(sayId, text, 'Listen')}<a class="k-btn k-btn-outline" href="#/part/${k}">Learn more</a>
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
// Android hardware Back: go back inside the app, leave it from the home screen
window.Capacitor?.Plugins?.App?.addListener('backButton', () => {
  if ((location.hash || '#/') === '#/') window.Capacitor.Plugins.App.exitApp(); else history.back();
});
if ('serviceWorker' in navigator && location.protocol === 'https:' && !document.documentElement.classList.contains('app')) navigator.serviceWorker.register('sw.js').catch(() => {});
