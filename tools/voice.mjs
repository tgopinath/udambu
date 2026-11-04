// Records every line the app can read aloud with a macOS voice → audio/<id>.m4a, and lists them in audio/clips.js.
// Re-run after changing text: only new or changed lines are recorded again.  node tools/voice.mjs
import fs from 'node:fs'; import { execFileSync } from 'node:child_process'; import os from 'node:os';
const src = ['parts.js', 'illnesses.js', 'bodymap.js'].map(f => fs.readFileSync(f, 'utf8')).join('\n');
const { PARTS, ILLNESSES, LAYERS, SYSTEMS } = new Function(src + '; return { PARTS, ILLNESSES, LAYERS, SYSTEMS };')();
const lines = {};
const add = (id, t) => { lines[id] = t; };
for (const p of PARTS) {
  add(`${p.key}-say`, `${p.name}. ${p.say}`); add(`${p.key}-more`, p.more); add(`name-${p.key}`, p.name); add(`find-${p.key}`, `Find the ${p.name}!`);
  p.how.forEach((t, n) => add(`${p.key}-how-${n}`, t)); p.facts.forEach((t, n) => add(`${p.key}-fact-${n}`, t)); p.care.forEach((t, n) => add(`${p.key}-care-${n}`, t));
}
for (const i of ILLNESSES) {
  add(`${i.key}-say`, `${i.name}. ${i.say}`);
  i.signs.forEach((t, n) => add(`${i.key}-sign-${n}`, t)); i.better.forEach((t, n) => add(`${i.key}-better-${n}`, t)); i.safe.forEach((t, n) => add(`${i.key}-safe-${n}`, t));
}
for (const l of LAYERS) add(`layer-${l.key}`, l.name);
for (const s of SYSTEMS) add(`sys-${s.key}`, `${s.name}. ${s.say}`);
Object.assign(lines, {
  'ui-home': 'Tap a part of the body to learn about it. Change the picture with the buttons.',
  'ui-parts': 'Here are all the parts of your body. Tap a picture to explore it.',
  'ui-sick': 'Sometimes our body gets sick or hurt. Tap a picture to learn about it, and how to stay healthy.',
  'ui-grownup': 'Feeling sick? Tell a grown-up. Only a doctor can say what is wrong.',
  'ui-play': 'Pick a game. Find it: find the body part on the body. Who does this? Watch and pick the right part.',
  'ui-3d': 'Drag with your finger to turn it around.', 'which-q': 'Which part does this?',
});
const man = fs.existsSync('.work/voice.json') ? JSON.parse(fs.readFileSync('.work/voice.json', 'utf8')) : {};
const todo = Object.entries(lines).filter(([id, t]) => man[id] !== t || !fs.existsSync(`audio/${id}.m4a`));
console.log(Object.keys(lines).length, 'lines,', todo.length, 'to record');
const tmp = fs.mkdtempSync(os.tmpdir() + '/udv-');
let n = 0;
for (const [id, t] of todo) {
  const aiff = `${tmp}/${id}.aiff`;
  execFileSync('say', ['-v', 'Samantha', '-r', '165', '-o', aiff, t.replace(/[“”]/g, '"')]);
  execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '40000', '-c', '1', aiff, `audio/${id}.m4a`]);
  fs.unlinkSync(aiff); man[id] = t; if (++n % 100 === 0) console.log(n);
}
for (const f of fs.readdirSync('audio')) if (f.endsWith('.m4a') && !lines[f.slice(0, -4)]) fs.unlinkSync('audio/' + f);
fs.writeFileSync('.work/voice.json', JSON.stringify(man, null, 1));
fs.writeFileSync('audio/clips.js', '// Made by tools/voice.mjs — ids of the recorded voice clips in this folder.\nconst VOICE_CLIPS = ' + JSON.stringify(Object.keys(lines)) + ';\n');
