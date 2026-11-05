// One screenshot of a local page in headless Chrome (WebGL via SwiftShader): node tools/snap.mjs <path> <out.png> [w] [h] [waitMs]
import fs from 'node:fs'; import path from 'node:path'; import { spawn } from 'node:child_process';
const [pg, out, w = 1400, h = 1000, wait = 15000, js = ''] = process.argv.slice(2);   // js: run after load, then wait again
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', sleep = ms => new Promise(r => setTimeout(r, ms));
const port = 5900 + Math.floor(Math.random() * 90), dbg = port + 1000, tmp = fs.mkdtempSync('/tmp/snap-');
const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { stdio: 'ignore' });
const chrome = spawn(CHROME, ['--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars', `--remote-debugging-port=${dbg}`, `--user-data-dir=${tmp}`, 'about:blank'], { stdio: 'ignore' });
try {
  let ws; for (let i = 0; i < 60 && !ws; i++) { try { const p = (await (await fetch(`http://127.0.0.1:${dbg}/json`)).json()).find(t => t.type === 'page'); if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch {} if (!ws) await sleep(250); }
  await new Promise(r => ws.onopen = r); let id = 0; const pend = {}; ws.onmessage = e => { const m = JSON.parse(e.data); pend[m.id]?.(m); };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  await sleep(600); await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/${pg}` }); await sleep(+wait);
  if (js) { await send('Runtime.evaluate', { expression: js }); await sleep(+wait); }
  const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); fs.writeFileSync(out, Buffer.from(s.result.data, 'base64')); ws.close();
} finally { chrome.kill(); server.kill(); await sleep(500); fs.rmSync(tmp, { recursive: true, force: true }); }
