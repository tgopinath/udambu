// iPhone copies of the AR models: ar/<part>.glb → ar/<part>.usdz (AR Quick Look reads USDZ).
// Uses Kanal's converter page (three.js USDZExporter), so Kanal's dev server must be running on :5310 and
// ../kanal/models-src/ios/udambu must link to this ar/ folder.   node tools/ar-usdz.mjs [part]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const { chromium } = createRequire('/Users/gopi-4423/Documents/kanal/package.json')('playwright');
const keys = Object.keys(JSON.parse(fs.readFileSync('tools/ar-sources.json', 'utf8'))).filter(k => !process.argv[2] || k === process.argv[2]);
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
await page.goto('http://localhost:5310/tools/usdz.html');
await page.waitForSelector('body[data-ready="1"]', { state: 'attached' });
for (const k of keys) {
  const b64 = await page.evaluate(id => window.convert(id), 'udambu/' + k);
  const out = `ar/${k}.usdz`, raw = out + '.raw.usdz';
  fs.writeFileSync(raw, Buffer.from(b64, 'base64'));
  execFileSync('/usr/bin/usdcrush', [raw, '-o', out, '-c', 'widest', '-t', '85'], { stdio: 'pipe' }); fs.rmSync(raw);
  const check = execFileSync('/usr/bin/usdchecker', [out], { encoding: 'utf8' });
  console.log(k.padEnd(16), (fs.statSync(out).size / 1e6).toFixed(1), 'MB', /Success/.test(check) ? 'ok' : 'CHECK FAILED');
}
await browser.close();
