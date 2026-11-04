// Records every line the app can read aloud with a macOS voice → audio/<id>.m4a, and lists them in audio/clips.js.
// Re-run after changing text: only new or changed lines are recorded again.  node tools/voice.mjs
import fs from 'node:fs'; import { execFileSync } from 'node:child_process'; import os from 'node:os';
const src = ['parts.js', 'illnesses.js', 'quiz.js'].map(f => fs.readFileSync(f, 'utf8')).join('\n');
const { PARTS, ILLNESSES, SYSTEMS, QUIZ } = new Function(src + '; return { PARTS, ILLNESSES, SYSTEMS, QUIZ };')();
const LAYERS = [['organs', 'Organs'], ['bones', 'Bones'], ['muscles', 'Muscles'], ['nerves', 'Nerves'], ['blood', 'Blood'], ['outside', 'Skin']].map(([key, name]) => ({ key, name }));
const lines = {};
const add = (id, t) => { lines[id] = t; };
for (const p of PARTS) {
  add(`${p.key}-say`, `${p.name}. ${p.say}`); add(`${p.key}-more`, p.more); add(`name-${p.key}`, p.name); add(`find-${p.key}`, `Find the ${p.name}!`); add(`which-${p.key}`, p.how.join(' '));
  p.how.forEach((t, n) => add(`${p.key}-how-${n}`, t)); p.facts.forEach((t, n) => add(`${p.key}-fact-${n}`, t)); p.care.forEach((t, n) => add(`${p.key}-care-${n}`, t));
}
for (const i of ILLNESSES) {
  add(`${i.key}-say`, `${i.name}. ${i.say}`);
  i.signs.forEach((t, n) => add(`${i.key}-sign-${n}`, t)); i.better.forEach((t, n) => add(`${i.key}-better-${n}`, t)); i.safe.forEach((t, n) => add(`${i.key}-safe-${n}`, t));
}
for (const l of LAYERS) add(`layer-${l.key}`, l.name);
for (const p of PARTS) { add(`ok-${p.key}`, 'Correct! ' + p.say); add(`ans-${p.key}`, `The answer is the ${p.name}. ` + p.say); }
QUIZ.forEach((q, i) => {
  if (q.q) add(`quiz-${i}`, q.q); else add(`quiz-${i}`, 'What is this body part?');
  if (q.opts) { add(`quiz-ok-${i}`, 'Correct! ' + q.learn); add(`quiz-ans-${i}`, `The answer is: ${q.opts[q.a]}. ` + q.learn); }
});
for (let n = 0; n <= 10; n++) { const m = n >= 8 ? 'Excellent. You know your body well.' : n >= 5 ? 'Well done. You learned a lot.' : 'Good try. Play again to learn more.'; add(`ui-score-${n}`, `You got ${n} out of 10. ${m}`); }
for (const s of SYSTEMS) add(`sys-${s.key}`, `${s.name}. ${s.say}`);
Object.assign(lines, {
  'ui-home': 'Pick a body system, then tap a part to see it in 3D and learn what it does.',
  'ui-parts': 'Here are all the parts of your body. Tap a picture to explore it.',
  'ui-sick': 'Sometimes our body gets sick or hurt. Tap one to learn about it, and how to stay healthy.',
  'ui-grownup': 'Feeling sick? Tell a grown-up. Only a doctor can say what is wrong.',
  'ui-play': 'Pick a game. In the body quiz, answer questions and learn about every part. In what does this, watch and pick the part.',
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
