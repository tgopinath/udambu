// Udambu — kids tap a body part to see it in real 3D, hear about it and watch it work.
// Built for children who can't read yet: big picture buttons, and every word can be heard.
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
let muted = store.get('muted', false);
const muteBtn = $('#mute');
const paintMute = () => { muteBtn.innerHTML = icon(muted ? 'mute' : 'speaker'); muteBtn.setAttribute('aria-label', muted ? 'Voice off' : 'Voice on'); muteBtn.setAttribute('aria-pressed', String(muted)); };
paintMute();
muteBtn.onclick = () => { muted = !muted; store.set('muted', muted); if (muted) Voice.stop(); paintMute(); };
// say: plays the recorded clip when there is one, otherwise the device voice
function say(id, text, btn) { if (muted) return; Voice.play(id, text, btn); }
// a big round speaker button that reads `text`
const speakBtn = (id, text, label = 'Hear it') => `<button class="speak" data-say="${esc(id)}" data-text="${esc(text)}" aria-label="${esc(label)}">${icon('speaker')}</button>`;
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-say]');
  if (b) { e.preventDefault(); e.stopPropagation(); haptic(); Voice.play(b.dataset.say, b.dataset.text, b); }
}, true);

// ---------- Router ----------
const routes = [
  [/^#?\/?$/, home], [/^#\/parts$/, partsPage], [/^#\/part\/([\w-]+)$/, partPage],
  [/^#\/sick$/, sickPage], [/^#\/ill\/([\w-]+)$/, illPage], [/^#\/play$/, playPage],
  [/^#\/play\/find$/, findGame], [/^#\/play\/which$/, whichGame],
];
let cleanup = null;
function render() {
  cleanup?.(); cleanup = null; Voice.stop();
  const h = location.hash || '#/';
  for (const [re, fn] of routes) { const m = h.match(re); if (m) { fn(...m.slice(1)); break; } }
  const tab = /^#\/part/.test(h) ? 'parts' : /^#\/(sick|ill)/.test(h) ? 'sick' : /^#\/play/.test(h) ? 'play' : 'body';
  document.querySelectorAll('.tabbar a').forEach(a => a.dataset.tab === tab ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  const deep = /^#\/(part|ill)\/|^#\/play\//.test(h);
  $('#back').hidden = !deep; document.body.classList.toggle('deep', deep);
  window.scrollTo(0, 0);
}
$('#back').onclick = () => { haptic(); history.length > 1 ? history.back() : (location.hash = '#/'); };
window.addEventListener('hashchange', render);
const setTitle = (t) => { $('#title').textContent = t || ''; document.title = t ? `${t} · Udambu` : 'Udambu'; };

// picture card for a part (real 3D model snapshot)
const partCard = (p, extra = '') => `<a class="pcard" href="#/part/${p.key}" style="--sys:${SYS[p.sys].color}" ${extra}>
  <img src="img/3d/${p.key}.jpg" alt="" loading="lazy"><span class="pcard-name">${esc(p.name)}</span></a>`;

// ---------- Home: the body map ----------
function home() {
  setTitle('');
  let layer = store.get('layer', 'organs');
  app.innerHTML = `
    <section class="home">
      <div class="home-head">
        <h1 class="heading-1">Tap your body!</h1>
        ${speakBtn('ui-home', 'Tap a part of the body to learn about it. Change the picture with the buttons.')}
      </div>
      <div class="layers" role="tablist" aria-label="What to show">
        ${LAYERS.map(l => `<button class="layer" role="tab" data-layer="${l.key}" aria-selected="${l.key === layer}">${icon(l.icon)}<span>${l.name}</span></button>`).join('')}
      </div>
      <div class="map-wrap"><div class="map" id="map"></div><div class="map-pop" id="pop" hidden></div></div>
      <div class="chips" id="chips"></div>
    </section>`;
  const paint = () => {
    $('#map').innerHTML = bodyMapSVG(layer);
    $('#chips').innerHTML = layerParts(layer).map(k => PART[k] && `<a class="chip" href="#/part/${k}"><img src="img/3d/${k}.jpg" alt="">${esc(PART[k].name)}</a>`).join('');
    document.querySelectorAll('.layer').forEach(b => b.setAttribute('aria-selected', String(b.dataset.layer === layer)));
    $('#pop').hidden = true;
  };
  paint();
  app.querySelector('.layers').onclick = (e) => {
    const b = e.target.closest('[data-layer]'); if (!b) return;
    haptic(); layer = b.dataset.layer; store.set('layer', layer); paint();
    say('layer-' + layer, LAYERS.find(l => l.key === layer).name);
  };
  // first tap shows the name + says it, second tap (or the bubble) opens the part
  let picked = null;
  $('#map').onclick = (e) => {
    const hot = e.target.closest('[data-part]'); const pop = $('#pop');
    if (!hot) { pop.hidden = true; picked = null; return; }
    const p = PART[hot.dataset.part]; if (!p) return;
    haptic();
    if (picked === p.key) { location.hash = '#/part/' + p.key; return; }
    picked = p.key;
    document.querySelectorAll('.bm-hot.on').forEach(n => n.classList.remove('on'));
    document.querySelectorAll(`[data-part="${p.key}"]`).forEach(n => n.classList.add('on'));
    const r = $('#map').getBoundingClientRect(), hr = hot.getBoundingClientRect();
    pop.innerHTML = `<a href="#/part/${p.key}"><img src="img/3d/${p.key}.jpg" alt=""><b>${esc(p.name)}</b>${icon('next')}</a>`;
    pop.hidden = false;
    const x = Math.min(Math.max(hr.left + hr.width / 2 - r.left, 90), r.width - 90);
    pop.style.left = x + 'px'; pop.style.top = Math.max(hr.top - r.top - 8, 40) + 'px';
    say('name-' + p.key, p.name);
  };
}

// ---------- All parts, by body team ----------
function partsPage() {
  setTitle('Parts');
  app.innerHTML = `<section class="page">
    <div class="page-head"><h1 class="heading-1">All body parts</h1>${speakBtn('ui-parts', 'Here are all the parts of your body. Tap a picture to explore it.')}</div>
    <nav class="sysnav" aria-label="Body teams">${SYSTEMS.map(s => `<a href="#sys-${s.key}" style="--sys:${s.color}">${esc(s.name)}</a>`).join('')}</nav>
    ${SYSTEMS.map(s => `<section class="sys" id="sys-${s.key}" style="--sys:${s.color}">
      <div class="sys-head"><h2 class="heading-2">${esc(s.name)}</h2>${speakBtn('sys-' + s.key, s.name + '. ' + s.say)}</div>
      <div class="pgrid">${PARTS.filter(p => p.sys === s.key).map(p => partCard(p)).join('')}</div></section>`).join('')}
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
      <span class="sys-badge">${esc(s.name)}</span>
      <div class="part-title"><h1 class="display-lg">${esc(p.name)}</h1>${speakBtn(key + '-say', p.name + '. ' + p.say, 'Hear about the ' + p.name)}</div>
      <p class="part-say body-lg">${esc(p.say)}</p>
    </header>

    <div class="tiles">
      <button class="tile" data-go="m3d">${icon('cube')}<span>3D</span></button>
      <button class="tile" data-go="demo">${icon('play')}<span>Watch</span></button>
      <button class="tile" data-go="facts">${icon('bulb')}<span>Facts</span></button>
      <button class="tile" data-go="care">${icon('shield')}<span>Healthy</span></button>
    </div>

    <section class="card m3d" id="m3d">
      <h2 class="sec-title">${icon('cube')} Real 3D</h2>
      <div class="viewer" id="viewer">
        <button class="viewer-start" aria-label="Open the 3D ${esc(p.name)}">
          <img src="img/3d/${key}.jpg" alt=""><span class="viewer-cta">${icon('cube')} Tap to turn it</span></button>
      </div>
      ${m ? `<p class="credit">3D model “${esc(m.name)}” by ${esc(m.by)} on Sketchfab${m.license ? ' · ' + esc(m.license) : ''}</p>` : ''}
    </section>

    <section class="card demo" id="demo">
      <div class="sec-row"><h2 class="sec-title">${icon('play')} Watch it work</h2>
        <button class="k-iconbtn playpause" id="pp" aria-label="Pause">${icon('pause')}</button></div>
      <div class="demo-stage" id="stage">${demoSVG(p.demo)}</div>
      <ol class="steps" id="steps">${p.how.map((t, n) => `<li><button data-say="${key}-how-${n}" data-text="${esc(t)}"><span class="num">${n + 1}</span>${esc(t)}</button></li>`).join('')}</ol>
    </section>

    <section class="card more">
      <div class="sec-row"><h2 class="sec-title">${icon('sparkle')} What it does</h2>${speakBtn(key + '-more', p.more, 'Read it to me')}</div>
      <p class="body-lg">${esc(p.more)}</p>
    </section>

    <section class="card" id="facts">
      <h2 class="sec-title">${icon('bulb')} Wow facts</h2>
      <ul class="facts">${p.facts.map((f, n) => `<li><button data-say="${key}-fact-${n}" data-text="${esc(f)}">${icon('star')}<span>${esc(f)}</span></button></li>`).join('')}</ul>
    </section>

    <section class="card" id="care">
      <h2 class="sec-title">${icon('shield')} Keep it healthy</h2>
      <ul class="care">${p.care.map((c, n) => `<li><button data-say="${key}-care-${n}" data-text="${esc(c)}">${icon('check')}<span>${esc(c)}</span></button></li>`).join('')}</ul>
    </section>

    ${p.ill.length ? `<section class="card">
      <h2 class="sec-title">${icon('germ')} When it gets sick</h2>
      <div class="ill-chips">${p.ill.map(k => ILL[k] && `<a class="ill-chip" href="#/ill/${k}">${icon(kindIcon(ILL[k]))}${esc(ILL[k].name)}</a>`).join('')}</div>
    </section>` : ''}

    <nav class="prevnext">
      <a href="#/part/${prev.key}" aria-label="Before: ${esc(prev.name)}">${icon('back')}<img src="img/3d/${prev.key}.jpg" alt=""><span>${esc(prev.name)}</span></a>
      <a href="#/part/${next.key}" aria-label="Next: ${esc(next.name)}"><span>${esc(next.name)}</span><img src="img/3d/${next.key}.jpg" alt="">${icon('next')}</a>
    </nav>
  </article>`;

  app.querySelector('.tiles').onclick = (e) => {
    const t = e.target.closest('[data-go]'); if (!t) return; haptic();
    const go = t.dataset.go; document.getElementById(go).scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (go === 'm3d') open3D();
  };
  const open3D = () => {
    if (!m || $('#viewer iframe')) return;
    $('#viewer').innerHTML = `<iframe title="${esc(p.name)} in 3D" allow="autoplay; fullscreen; xr-spatial-tracking" allowfullscreen
      src="https://sketchfab.com/models/${m.uid}/embed?autostart=1&preload=1&ui_theme=dark&ui_infos=0&ui_watermark=0&ui_watermark_link=0&ui_controls=1&ui_stop=0&ui_inspector=0&ui_settings=0&ui_vr=0&ui_ar=0&ui_help=0&ui_annotations=0&dnt=1"></iframe>
      <p class="viewer-hint">${icon('cube')} Drag to turn · pinch to zoom</p>`;
    say('ui-3d', 'Drag with your finger to turn it around.');
  };
  $('.viewer-start').onclick = () => { haptic(); open3D(); };

  // step captions follow the 8-second animation
  const svg = $('#stage svg'), steps = [...document.querySelectorAll('#steps li')];
  let t0 = performance.now(), paused = false, raf;
  const tick = () => {
    const n = Math.floor(((svg.getCurrentTime?.() ?? (performance.now() - t0) / 1000) % DEMO_CYCLE) / (DEMO_CYCLE / 4));
    steps.forEach((li, k) => li.classList.toggle('on', k === n));
    raf = requestAnimationFrame(tick);
  };
  tick();
  $('#pp').onclick = () => {
    paused = !paused; haptic();
    paused ? svg.pauseAnimations() : svg.unpauseAnimations();
    $('#pp').innerHTML = icon(paused ? 'play' : 'pause'); $('#pp').setAttribute('aria-label', paused ? 'Play' : 'Pause');
  };
  cleanup = () => cancelAnimationFrame(raf);
  // read the part out loud as soon as it opens (kids arrive here by tapping, so sound is allowed)
  setTimeout(() => say(key + '-say', p.name + '. ' + p.say, $('.part-title .speak')), 250);
}

const kindIcon = (ill) => ill.kind === 'hurt' ? 'hurt' : ill.kind === 'germ' ? 'germ' : 'heart';
const MOSQUITO = new Set(['malaria', 'dengue']);

// ---------- Sickness ----------
function sickPage() {
  setTitle('Sickness');
  let f = store.get('sickFilter', 'all');
  const kinds = [['all', 'All', 'grid'], ['germ', 'Germs', 'germ'], ['body', 'Body', 'heart'], ['hurt', 'Hurts', 'hurt']];
  app.innerHTML = `<section class="page">
    <div class="page-head"><h1 class="heading-1">When we get sick</h1>${speakBtn('ui-sick', 'Sometimes our body gets sick or hurt. Tap a picture to learn about it, and how to stay healthy.')}</div>
    <div class="k-alert grownup">${icon('doctor')}<div><b>Feeling sick? Tell a grown-up.</b><br>This app helps you learn. Only a doctor can say what is wrong.</div>${speakBtn('ui-grownup', 'Feeling sick? Tell a grown-up. Only a doctor can say what is wrong.')}</div>
    <div class="layers filter" role="tablist">${kinds.map(([k, n, ic]) => `<button class="layer" data-k="${k}" aria-selected="${k === f}">${icon(ic)}<span>${n}</span></button>`).join('')}</div>
    <div class="igrid" id="ig"></div></section>`;
  const paint = () => {
    $('#ig').innerHTML = ILLNESSES.filter(i => f === 'all' || i.kind === f).map(i => `<a class="icard kind-${i.kind}" href="#/ill/${i.key}">
      <span class="icard-ic">${icon(kindIcon(i))}</span><span class="icard-name">${esc(i.name)}</span>
      ${i.spread ? `<span class="tag">${icon('people')} spreads</span>` : MOSQUITO.has(i.key) ? `<span class="tag">${icon('mosquito')} mosquito</span>` : ''}</a>`).join('');
    document.querySelectorAll('.filter .layer').forEach(b => b.setAttribute('aria-selected', String(b.dataset.k === f)));
  };
  paint();
  app.querySelector('.filter').onclick = (e) => { const b = e.target.closest('[data-k]'); if (!b) return; haptic(); f = b.dataset.k; store.set('sickFilter', f); paint(); };
}

function illPage(key) {
  const i = ILL[key]; if (!i) return (location.hash = '#/sick');
  setTitle(i.name);
  const list = (arr, id, ic) => `<ul class="care">${arr.map((t, n) => `<li><button data-say="${key}-${id}-${n}" data-text="${esc(t)}">${icon(ic)}<span>${esc(t)}</span></button></li>`).join('')}</ul>`;
  app.innerHTML = `<article class="part ill kind-${i.kind}">
    <header class="part-hero">
      <span class="sys-badge">${i.kind === 'germ' ? 'Caused by germs' : i.kind === 'hurt' ? 'An injury' : 'Happens inside the body'}</span>
      <div class="part-title"><h1 class="display-lg">${esc(i.name)}</h1>${speakBtn(key + '-say', i.name + '. ' + i.say)}</div>
      <p class="part-say body-lg">${esc(i.say)}</p>
      <div class="badges">${i.spread ? `<span class="k-badge k-badge-warning">${icon('people')} It can spread</span>` : MOSQUITO.has(key) ? `<span class="k-badge k-badge-warning">${icon('mosquito')} Mosquitoes spread it</span>` : `<span class="k-badge k-badge-success">${icon('shield')} You can’t catch it from a friend</span>`}</div>
    </header>
    <section class="card"><h2 class="sec-title">${icon('bulb')} Signs</h2>${list(i.signs, 'sign', 'sparkle')}</section>
    <section class="card"><h2 class="sec-title">${icon('heart')} Getting better</h2>${list(i.better, 'better', 'check')}</section>
    <section class="card"><h2 class="sec-title">${icon('shield')} Stay safe</h2>${list(i.safe, 'safe', 'shield')}</section>
    <section class="card"><h2 class="sec-title">${icon('person')} Body parts it affects</h2><div class="pgrid small">${i.parts.map(k => PART[k] && partCard(PART[k])).join('')}</div></section>
    <div class="k-alert grownup">${icon('doctor')}<div><b>Feeling sick? Tell a grown-up.</b><br>Only a doctor can say what is wrong and what medicine you need.</div></div>
  </article>`;
  setTimeout(() => say(key + '-say', i.name + '. ' + i.say, $('.part-title .speak')), 250);
}

// ---------- Play ----------
function playPage() {
  setTitle('Play');
  const best = store.get('best', {});
  app.innerHTML = `<section class="page">
    <div class="page-head"><h1 class="heading-1">Let’s play!</h1>${speakBtn('ui-play', 'Pick a game. Find it: find the body part on the body. What does this? Watch and pick the right part.')}</div>
    <div class="games">
      <a class="game" href="#/play/find">${icon('person', 'big')}<b>Find it!</b><span>Tap the right part</span>${best.find ? `<span class="best">${icon('star')} ${best.find}/10</span>` : ''}</a>
      <a class="game" href="#/play/which">${icon('play', 'big')}<b>Who does this?</b><span>Watch, then pick</span>${best.which ? `<span class="best">${icon('star')} ${best.which}/10</span>` : ''}</a>
    </div></section>`;
}

const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
// which layer shows each part best, for the Find game
const FIND_LAYER = {};
for (const l of ['organs', 'bones', 'outside', 'nerves', 'blood', 'muscles']) for (const k of layerParts(l)) FIND_LAYER[k] ??= l;

function scoreBar(score, round) { return `<div class="score"><span>${Array.from({ length: 10 }, (_, n) => `<i class="${n < round ? (n < score.length && score[n] ? 'ok' : 'no') : ''}"></i>`).join('')}</span></div>`; }
function finish(game, score) {
  const n = score.filter(Boolean).length, best = store.get('best', {});
  if (!best[game] || n > best[game]) { best[game] = n; store.set('best', best); }
  app.querySelector('.gamebox').innerHTML = `<div class="done"><div class="stars">${Array.from({ length: 3 }, (_, k) => icon('star', n >= [3, 6, 9][k] ? 'lit' : '')).join('')}</div>
    <h2 class="display-lg">${n} / 10</h2><p class="body-lg">${n >= 8 ? 'Super body explorer!' : n >= 5 ? 'Great job!' : 'Good try! Play again?'}</p>
    <div class="done-actions"><button class="k-btn k-btn-primary k-btn-lg" id="again">${icon('refresh')} Play again</button><a class="k-btn k-btn-outline k-btn-lg" href="#/play">All games</a></div></div>`;
  confetti(); Sound.win();
  say('ui-score', `You got ${n} out of 10. ${n >= 8 ? 'Super body explorer!' : n >= 5 ? 'Great job!' : 'Good try!'}`);
  $('#again').onclick = () => render();
}

function findGame() {
  setTitle('Find it!');
  const pool = shuffle(Object.keys(FIND_LAYER).filter(k => PART[k])).slice(0, 10), score = [];
  let round = 0, locked = false;
  app.innerHTML = `<section class="page gamebox"></section>`;
  const ask = () => {
    if (round >= 10) return finish('find', score);
    const k = pool[round], p = PART[k], layer = FIND_LAYER[k]; locked = false;
    app.querySelector('.gamebox').innerHTML = `${scoreBar(score, round)}
      <div class="ask"><span>Find the</span><b>${esc(p.name)}</b>${speakBtn('find-' + k, 'Find the ' + p.name + '!')}</div>
      <div class="map-wrap game-map"><div class="map" id="gmap">${bodyMapSVG(layer)}</div></div>`;
    say('find-' + k, 'Find the ' + p.name + '!');
    $('#gmap').onclick = (e) => {
      const hot = e.target.closest('[data-part]'); if (!hot || locked) return;
      if (hot.dataset.part === k) {
        locked = true; score.push(true); haptic('success'); Sound.yes(); confetti(e.clientX, e.clientY);
        document.querySelectorAll(`#gmap [data-part="${k}"]`).forEach(n => n.classList.add('on', 'right'));
        setTimeout(() => { round++; ask(); }, 1600);
      } else {
        haptic('error'); Sound.no(); hot.classList.add('shake'); setTimeout(() => hot.classList.remove('shake'), 500);
        if (score.length === round) score.push(false);
        say('name-' + hot.dataset.part, 'That is the ' + (PART[hot.dataset.part]?.name || 'wrong part') + '. Try again!');
        app.querySelector('.score').outerHTML = scoreBar(score, round + 1);
      }
    };
  };
  ask();
}

function whichGame() {
  setTitle('Who does this?');
  const pool = shuffle(PARTS.filter(p => !['nerves', 'skull', 'ribs'].includes(p.key))).slice(0, 10), score = [];
  let round = 0;
  app.innerHTML = `<section class="page gamebox"></section>`;
  const ask = () => {
    if (round >= 10) return finish('which', score);
    const p = pool[round];
    const wrong = shuffle(PARTS.filter(x => x.demo !== p.demo && x.sys !== p.sys)).slice(0, 2);
    const opts = shuffle([p, ...wrong]);
    app.querySelector('.gamebox').innerHTML = `${scoreBar(score, round)}
      <div class="ask"><span>Which part does this?</span>${speakBtn('which-' + p.key, p.how.join(' '), 'Hear the clue')}</div>
      <div class="demo-stage">${demoSVG(p.demo)}</div>
      <div class="opts">${opts.map(o => `<button class="opt" data-k="${o.key}"><img src="img/3d/${o.key}.jpg" alt=""><span>${esc(o.name)}</span></button>`).join('')}</div>`;
    say('which-q', 'Which part does this?');
    let tried = false;
    app.querySelector('.opts').onclick = (e) => {
      const b = e.target.closest('.opt'); if (!b || b.disabled) return;
      if (b.dataset.k === p.key) {
        if (!tried) score.push(true); haptic('success'); Sound.yes(); b.classList.add('right'); confetti();
        say('name-' + p.key, p.name);
        document.querySelectorAll('.opt').forEach(x => x.disabled = true);
        setTimeout(() => { round++; ask(); }, 1800);
      } else {
        if (!tried) score.push(false); tried = true; haptic('error'); Sound.no(); b.classList.add('wrong'); b.disabled = true;
        say('name-' + b.dataset.k, 'Not the ' + PART[b.dataset.k].name + '. Try again!');
      }
    };
  };
  ask();
}

// ---------- Little celebrations (Web Audio, no files) ----------
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
