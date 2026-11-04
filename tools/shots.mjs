// Captures the screenshots used on the portfolio card: node tools/shots.mjs
// Phone shots: 600-wide JPEGs in prototype/shots. Desktop: shots-desktop/web.jpg (1440×900) for the card's browser window
// (copy it to gopinath-portfolio/assets/thumbs/web-udambu.jpg).
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const SHOTS = path.join(ROOT, 'prototype', 'shots');
const DESK = path.join(ROOT, 'shots-desktop');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Shoots the live site, so the card always shows what is published.
const ORIGIN = 'https://udambu.vercel.app', SERVER = null;
const ON_LOAD = null, SEED = '';
const SHOTS_LIST = [
  { file: 'body', hash: '#/' },
  { file: 'heart', hash: '#/part/heart', wait: 8000 },
  { file: 'illness', hash: '#/ill/common-cold' },
  { file: 'play', hash: '#/play' },
  { file: 'web', hash: '#/', desktop: true },
];

fs.mkdirSync(SHOTS, { recursive: true }); fs.mkdirSync(DESK, { recursive: true });
const tmp = fs.mkdtempSync(path.join(ROOT, '.shots-'));
const port = 5700 + Math.floor(Math.random() * 200), dbg = port + 1000;
const server = ORIGIN ? null : spawn(SERVER[0], SERVER.slice(1).map(a => a.replace('$PORT', port)), { cwd: ROOT, stdio: 'ignore', env: { ...process.env, PORT: String(port) } });
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', `--remote-debugging-port=${dbg}`, `--user-data-dir=${tmp}/profile`, 'about:blank'], { stdio: 'ignore' });
try {
  let ws;
  for (let i = 0; i < 60 && !ws; i++) {
    try { const p = (await (await fetch(`http://127.0.0.1:${dbg}/json`)).json()).find(t => t.type === 'page'); if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch {}
    if (!ws) await sleep(250);
  }
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pending = {};
  ws.onmessage = e => { const m = JSON.parse(e.data); if (pending[m.id]) { pending[m.id](m); delete pending[m.id]; } };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const origin = ORIGIN || `http://127.0.0.1:${port}`;
  await sleep(800);
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  const grab = async ({ file, hash = '#/', js, wait = 3000, desktop = false }) => {
    await send('Emulation.setDeviceMetricsOverride', desktop ? { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false } : { width: 390, height: 849, deviceScaleFactor: 2, mobile: true });
    await send('Page.navigate', { url: `${origin}/` }); await sleep(1200);
    await send('Runtime.evaluate', { expression: `(async () => { localStorage.clear(); ${SEED || ''} })()`, awaitPromise: true }); await sleep(300);
    await send('Page.navigate', { url: `${origin}/?shot=${file}${hash}` }); await sleep(wait);
    if (ON_LOAD) { await send('Runtime.evaluate', { expression: ON_LOAD }); await sleep(500); }
    if (js) { const r = await send('Runtime.evaluate', { expression: `(async () => { ${js} })()`, awaitPromise: true }); if (r.result?.exceptionDetails) console.warn(file, r.result.exceptionDetails.text); await sleep(1500); }
    const s = await send('Page.captureScreenshot', { format: 'png' });
    const png = path.join(tmp, file + '.png');
    fs.writeFileSync(png, Buffer.from(s.result.data, 'base64'));
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '84', '--resampleWidth', desktop ? '1440' : '600', png, '--out', path.join(desktop ? DESK : SHOTS, file + '.jpg')], { stdio: 'pipe' });
  };
  for (const s of SHOTS_LIST) await grab(s);
  console.log('captured', fs.readdirSync(SHOTS).join(', '), '+ shots-desktop/web.jpg');
  ws.close();
} finally {
  const exited = new Promise(r => chrome.once('exit', r));
  chrome.kill(); server?.kill();
  await Promise.race([exited, sleep(5000)]);
  fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
