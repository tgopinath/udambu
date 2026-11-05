// "Watch it work": a looping animation for every body part. Each one runs 8 seconds,
// in four 2-second steps that match the part's `how` captions (app.js shows them in time).
// Plain SVG + SMIL so it runs the same in browsers, Android WebView and iOS WKWebView.
const DEMO_CYCLE = 8;
const C = { red: '#d0312d', blue: '#3b6fd8', bone: '#efe6d2', boneLine: '#b8a47a', pink: '#f2a7a0', muscle: '#c8504a',
  skin: '#f3c9a8', nerve: '#f2b33d', germ: '#3aa66b', green: '#5aa64a', yellow: '#e7c43c', ink: 'currentColor', soft: '#9aa3b5' };

const dot = (r, fill, path, dur = 8, begin = 0, extra = '') =>
  `<circle r="${r}" fill="${fill}" ${extra}><animateMotion dur="${dur}s" begin="-${-begin}s" repeatCount="indefinite" path="${path}"/></circle>`;
const pulse = (from, to, dur, extra = '') =>
  `<animateTransform attributeName="transform" type="scale" values="${from};${to};${from}" dur="${dur}s" repeatCount="indefinite" additive="sum" ${extra}/>`;
// a group scaled around its own centre (cx, cy)
const around = (cx, cy, inner, anim) => `<g transform="translate(${cx} ${cy})"><g>${anim}<g transform="translate(${-cx} ${-cy})">${inner}</g></g></g>`;
const label = (x, y, t, anchor = 'middle') => `<text x="${x}" y="${y}" text-anchor="${anchor}" class="demo-label">${t}</text>`;
// fade an element in during one of the four steps (0-3)
const inStep = (i) => `<animate attributeName="opacity" values="${[0,1,2,3].map(s => s === i ? 1 : 0.15).join(';')};${i === 0 ? 1 : 0.15}" keyTimes="0;0.25;0.5;0.75;1" calcMode="discrete" dur="8s" repeatCount="indefinite"/>`;

const DEMOS = {
  heart() {
    const lungLoop = 'M160 92 C 120 70, 110 40, 160 32 C 210 40, 200 70, 160 92';
    const bodyLoop = 'M160 112 C 230 130, 250 190, 160 200 C 70 190, 90 130, 160 112';
    return `
      <path d="${lungLoop}" fill="none" stroke="${C.soft}" stroke-width="10" stroke-linecap="round" opacity=".25"/>
      <path d="${bodyLoop}" fill="none" stroke="${C.soft}" stroke-width="10" stroke-linecap="round" opacity=".25"/>
      ${[0, 1.3, 2.6, 3.9, 5.2, 6.5].map(b => dot(5, C.blue, lungLoop, 4, b)).join('')}
      ${[0, 1, 2, 3, 4, 5, 6, 7].map(b => dot(5, C.red, bodyLoop, 8, b)).join('')}
      <g>${around(160, 102, `<path d="M160 128 C 120 104, 118 74, 142 72 C 152 72, 158 80, 160 86 C 162 80, 168 72, 178 72 C 202 74, 200 104, 160 128Z" fill="${C.red}"/>
        <path d="M150 80 q10 -12 20 0" stroke="#fff" stroke-width="3" fill="none" opacity=".5"/>`, pulse(1, 0.88, 0.8))}</g>
      ${label(160, 22, 'Pulmonary circuit')}${label(160, 216, 'Systemic circuit')}
      ${label(60, 60, 'deoxygenated', 'start').replace('class', `fill="${C.blue}" class`)}${label(250, 160, 'oxygenated', 'end').replace('class', `fill="${C.red}" class`)}`;
  },
  breathe() {
    const lung = (x, flip) => `<path d="M${x} 60 C ${x + flip * 40} 62, ${x + flip * 52} 120, ${x + flip * 46} 160 C ${x + flip * 30} 170, ${x + flip * 8} 166, ${x} 150 Z" fill="${C.pink}" stroke="#c97a74" stroke-width="2"/>`;
    const air = 'M160 0 L160 70';
    return `
      ${around(160, 120, lung(150, -1) + lung(170, 1), `<animateTransform attributeName="transform" type="scale" values="0.85;1.08;0.85" dur="4s" repeatCount="indefinite"/>`)}
      <rect x="153" y="10" width="14" height="62" rx="6" fill="#e9b3ad" stroke="#c97a74" stroke-width="2"/>
      <path d="M160 68 L140 90 M160 68 L180 90" stroke="#c97a74" stroke-width="6" stroke-linecap="round"/>
      <path stroke="${C.muscle}" stroke-width="6" fill="none" stroke-linecap="round">
        <animate attributeName="d" values="M90 172 Q160 140 230 172;M90 180 Q160 178 230 180;M90 172 Q160 140 230 172" dur="4s" repeatCount="indefinite"/></path>
      ${[0, 0.7, 1.4].map(b => dot(4, '#7cc7f0', air, 2, b, 'opacity=".9"')).join('')}
      ${label(250, 186, 'diaphragm', 'end')}
      <text x="160" y="214" text-anchor="middle" class="demo-label"><tspan>inhale</tspan>
        <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;.45;.5;.95;1" dur="4s" repeatCount="indefinite"/></text>
      <text x="160" y="214" text-anchor="middle" class="demo-label" opacity="0">exhale
        <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.45;.5;.95;1" dur="4s" repeatCount="indefinite"/></text>`;
  },
  digest() {
    const path = 'M160 22 L160 70 C 160 86, 196 84, 196 104 C 196 124, 160 128, 146 124 C 120 132, 112 144, 128 150 C 150 156, 186 150, 184 160 C 182 170, 130 166, 128 176 C 126 186, 176 186, 186 180 C 210 176, 216 150, 214 120 C 212 106, 104 104, 104 120 C 102 150, 104 180, 112 196';
    return `
      <path d="M140 14 Q160 4 180 14 Q182 30 160 32 Q138 30 140 14Z" fill="${C.skin}" stroke="#d9a37e" stroke-width="2"/>
      <path d="${path}" fill="none" stroke="#e8b2a5" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
      ${around(184, 102, `<ellipse cx="184" cy="102" rx="24" ry="18" fill="#e58f7d"/>`, pulse(1, 0.9, 1))}
      <path d="${path}" fill="none" stroke="#c76e5d" stroke-width="2" stroke-dasharray="4 6" opacity=".6"/>
      ${dot(7, '#c77700', path, 8, 0, 'stroke="#fff" stroke-width="2"')}
      ${label(118, 20, 'mouth', 'end')}${label(228, 100, 'stomach', 'start')}${label(70, 165, 'intestines', 'start')}`;
  },
  chew() {
    const teeth = (y, dir) => Array.from({ length: 6 }, (_, i) => `<rect x="${104 + i * 19}" y="${y}" width="16" height="${22 * dir}" rx="4" fill="#fff" stroke="#c9c2b2" stroke-width="2" transform="${dir < 0 ? `translate(0 ${22})` : ''}"/>`).join('');
    return `
      <rect x="96" y="40" width="128" height="28" rx="12" fill="#e58f9a"/>
      ${teeth(60, 1)}
      <g><animateTransform attributeName="transform" type="translate" values="0 0;0 -26;0 0" dur="1s" repeatCount="indefinite"/>
        <rect x="96" y="150" width="128" height="28" rx="12" fill="#e58f9a"/>
        ${Array.from({ length: 6 }, (_, i) => `<rect x="${104 + i * 19}" y="130" width="16" height="22" rx="4" fill="#fff" stroke="#c9c2b2" stroke-width="2"/>`).join('')}</g>
      <circle cx="160" cy="112" r="16" fill="#c77700"><animate attributeName="r" values="16;16;0;0" keyTimes="0;.3;.4;1" dur="8s" repeatCount="indefinite"/></circle>
      ${[[-12, -4], [8, 6], [-2, 10], [14, -8], [-16, 8]].map(([x, y]) => `<circle cx="${160 + x}" cy="${112 + y}" r="5" fill="#c77700" opacity="0"><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.35;.4;.9;1" dur="8s" repeatCount="indefinite"/></circle>`).join('')}
      ${label(160, 210, 'mastication: teeth break food down')}`;
  },
  brain() {
    const lobe = (d, fill, step) => `<path d="${d}" fill="${fill}" stroke="#b9708a" stroke-width="2">${inStep(step)}</path>`;
    return `
      ${lobe('M110 120 C 90 70, 140 40, 170 48 C 180 50, 176 96, 150 120 Z', '#f3a6c0', 1)}
      ${lobe('M170 48 C 210 46, 236 76, 228 108 C 210 110, 186 104, 160 116 C 166 96, 178 70, 170 48Z', '#f6b9cc', 2)}
      ${lobe('M110 120 C 130 124, 140 126, 160 116 C 186 104, 210 110, 228 108 C 228 132, 200 146, 170 144 C 140 146, 116 140, 110 120Z', '#eea0b7', 0)}
      <path d="M160 144 C 162 158, 166 170, 168 196" stroke="#e9a3b8" stroke-width="12" stroke-linecap="round" fill="none"/>
      ${lobe('M176 140 C 200 140, 214 160, 196 168 C 182 172, 172 160, 176 140Z', '#e88aa6', 3)}
      <path d="M120 90 q 20 -10 40 0 M140 70 q 16 10 30 0 M190 70 q 10 14 26 10 M130 112 q 24 -6 40 4" stroke="#b9708a" stroke-width="2" fill="none"/>
      ${[0, 1, 2, 3].map(i => `<circle r="4" fill="${C.nerve}">${inStep(i)}<animateMotion dur="2s" repeatCount="indefinite" path="M${130 + i * 20} ${80 + (i % 2) * 20} l 30 10 l -10 20 l 30 -6"/></circle>`).join('')}
      ${label(70, 60, 'frontal lobe', 'middle')}${label(260, 70, 'parietal lobe', 'middle')}${label(260, 186, 'cerebellum', 'middle')}${label(70, 160, 'temporal lobe', 'middle')}`;
  },
  nerves() {
    const nerve = 'M80 40 C 90 80, 120 100, 160 110 C 200 120, 230 140, 250 180';
    return `
      <path d="M50 26 C 50 6, 110 6, 110 26 C 116 50, 44 50, 50 26Z" fill="#f3a6c0"/>${label(80, 64, 'brain')}
      <path d="${nerve}" fill="none" stroke="${C.nerve}" stroke-width="5" stroke-linecap="round"/>
      <path d="${nerve}" fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="2 8" opacity=".9"/>
      ${[0, 0.25, 0.5].map(b => `<circle r="6" fill="#fff4c2" stroke="${C.nerve}" stroke-width="2"><animateMotion dur="2s" begin="-${b}s" repeatCount="indefinite" path="${nerve}" keyPoints="1;0" keyTimes="0;1" calcMode="linear"/><animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;.5;.5;1;1" dur="8s" repeatCount="indefinite"/></circle>`).join('')}
      ${[0, 0.25, 0.5].map(b => `<circle r="6" fill="#fff4c2" stroke="${C.nerve}" stroke-width="2" opacity="0"><animateMotion dur="2s" begin="-${b}s" repeatCount="indefinite" path="${nerve}"/><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.5;.5;1;1" dur="8s" repeatCount="indefinite"/></circle>`).join('')}
      <g><animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 0;-18 -14;0 0" keyTimes="0;.74;.8;.95;1" dur="8s" repeatCount="indefinite"/>
        <path d="M244 176 q 6 -14 18 -10 l 14 -2 q 8 0 6 8 l -6 22 q -4 8 -14 8 l -14 -2 z" fill="${C.skin}" stroke="#d9a37e" stroke-width="2"/></g>
      <path d="M282 208 q -6 -10 0 -20 q 6 -10 0 -20" stroke="${C.red}" stroke-width="3" fill="none" opacity=".8"><animate attributeName="opacity" values=".9;.3;.9" dur="1s" repeatCount="indefinite"/></path>
      ${label(290, 220, 'stimulus', 'end')}`;
  },
  eye() {
    return `
      <circle cx="40" cy="110" r="18" fill="${C.red}"/>${label(40, 150, 'object')}
      <circle cx="190" cy="110" r="64" fill="#fff" stroke="#c9c2b2" stroke-width="3"/>
      <path d="M128 92 q -12 18 0 36" fill="#6fa8dc" stroke="#3f78ad" stroke-width="3"/>
      <ellipse cx="142" cy="110" rx="8" ry="20" fill="#cfe6f7" stroke="#7aa6c9" stroke-width="2"/>
      <path d="M252 80 q 12 30 0 60" stroke="#e98c8c" stroke-width="6" fill="none"/>
      <path d="M58 102 L142 104 L252 128" stroke="${C.yellow}" stroke-width="3" fill="none" stroke-dasharray="200" stroke-dashoffset="200">
        <animate attributeName="stroke-dashoffset" values="200;0;0;200" keyTimes="0;.4;.9;1" dur="8s" repeatCount="indefinite"/></path>
      <path d="M58 118 L142 116 L252 92" stroke="${C.yellow}" stroke-width="3" fill="none" stroke-dasharray="200" stroke-dashoffset="200">
        <animate attributeName="stroke-dashoffset" values="200;0;0;200" keyTimes="0;.4;.9;1" dur="8s" repeatCount="indefinite"/></path>
      <circle cx="246" cy="110" r="9" fill="${C.red}" opacity="0"><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.45;.5;.95;1" dur="8s" repeatCount="indefinite"/></circle>
      <path d="M254 110 C 280 110, 290 80, 300 60" stroke="${C.nerve}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <circle r="5" fill="#fff4c2" stroke="${C.nerve}" stroke-width="2" opacity="0"><animateMotion dur="2s" begin="6s" repeatCount="indefinite" path="M254 110 C 280 110, 290 80, 300 60"/><animate attributeName="opacity" values="0;0;1;1" keyTimes="0;.74;.75;1" dur="8s" repeatCount="indefinite"/></circle>
      ${label(142, 160, 'lens')}${label(300, 50, 'optic nerve', 'end')}`;
  },
  ear() {
    return `
      ${[0, 0.6, 1.2].map(b => `<path d="M60 70 q 22 40 0 80" stroke="${C.blue}" stroke-width="4" fill="none"><animateTransform attributeName="transform" type="translate" values="0 0;80 0" dur="1.8s" begin="-${b}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="1.8s" begin="-${b}s" repeatCount="indefinite"/></path>`).join('')}
      <path d="M20 90 l 20 -10 v 60 l -20 -10 z" fill="${C.soft}"/>
      <path d="M140 110 L190 110" stroke="${C.skin}" stroke-width="26" stroke-linecap="round"/>
      <path d="M196 84 Q 190 110 196 136" stroke="#d98c7a" stroke-width="5" fill="none">
        <animate attributeName="d" values="M196 84 Q 190 110 196 136;M196 84 Q 204 110 196 136;M196 84 Q 190 110 196 136" dur=".25s" repeatCount="indefinite"/></path>
      <g fill="${C.bone}" stroke="${C.boneLine}" stroke-width="2"><circle cx="210" cy="100" r="5"/><circle cx="222" cy="108" r="5"/><circle cx="234" cy="114" r="5"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;2 0;0 0" dur=".25s" repeatCount="indefinite"/></g>
      <path d="M262 112 m -18 0 a 18 18 0 1 1 18 18 a 12 12 0 1 1 -12 -12 a 6 6 0 1 1 6 6" stroke="#e7a94b" stroke-width="5" fill="none">${inStep(3)}</path>
      ${label(196, 160, 'eardrum')}${label(262, 160, 'cochlea')}`;
  },
  smell() {
    const drift = 'M70 150 C 110 120, 130 160, 170 120 C 200 90, 220 110, 240 92';
    return `
      <path d="M70 190 L70 150" stroke="${C.green}" stroke-width="5"/>
      ${[0, 72, 144, 216, 288].map(a => `<ellipse cx="70" cy="136" rx="9" ry="16" fill="#e56b8f" transform="rotate(${a} 70 150)"/>`).join('')}<circle cx="70" cy="150" r="8" fill="${C.yellow}"/>
      ${[0, 1, 2, 3, 4, 5].map(b => dot(4, '#e56b8f', drift, 3, b * 0.5, 'opacity=".75"')).join('')}
      <path d="M250 40 C 250 80, 236 96, 240 110 C 244 124, 270 124, 276 112" fill="${C.skin}" stroke="#d9a37e" stroke-width="3"/>
      <path d="M252 60 q 8 -4 16 4" stroke="${C.nerve}" stroke-width="4" fill="none">${inStep(2)}</path>
      ${label(70, 210, 'odour source')}${label(270, 140, 'olfactory epithelium')}`;
  },
  taste() {
    return `
      <path d="M80 140 C 80 80, 240 80, 240 140 C 240 190, 80 190, 80 140Z" fill="#ef8f98" stroke="#cf6d78" stroke-width="3"/>
      <path d="M160 96 L160 170" stroke="#cf6d78" stroke-width="2" opacity=".6"/>
      ${Array.from({ length: 22 }, (_, i) => `<circle cx="${100 + (i * 37) % 120}" cy="${110 + (i * 23) % 60}" r="3.5" fill="#fbd0d5">${inStep(2)}</circle>`).join('')}
      <circle cx="160" r="12" fill="${C.yellow}"><animate attributeName="cy" values="20;20;120;120;20" keyTimes="0;.15;.3;.95;1" dur="8s" repeatCount="indefinite"/></circle>
      ${label(160, 210, 'sweet · salty · sour · bitter · savoury')}`;
  },
  skin() {
    return `
      <rect x="40" y="110" width="240" height="20" fill="#f3c9a8"/><rect x="40" y="130" width="240" height="40" fill="#efb6a0"/><rect x="40" y="170" width="240" height="34" fill="#f6e2a5"/>
      ${[70, 140, 210].map((x, i) => `<path d="M${x} 170 L${x} 112" stroke="#9ac6e6" stroke-width="3"/><circle cx="${x}" r="5" fill="#9ac6e6"><animate attributeName="cy" values="112;112;70" keyTimes="0;.5;1" dur="8s" begin="-${i * 0.3}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0;1;0" keyTimes="0;.5;.6;1" dur="8s" begin="-${i * 0.3}s" repeatCount="indefinite"/></circle>`).join('')}
      ${[100, 180, 250].map((x, i) => `<g><animateTransform attributeName="transform" type="translate" values="0 -60;0 0;0 -60;0 -60" keyTimes="0;.2;.4;1" dur="8s" begin="-${i * 0.4}s" repeatCount="indefinite"/>${germ(x, 100, 9)}</g>`).join('')}
      ${label(30, 124, 'epidermis', 'start').replace('x="30"', 'x="44"')}${label(160, 24, 'barrier to pathogens · sweat cools')}`;
  },
  grow() {
    return `
      <rect x="40" y="130" width="240" height="70" fill="#f3c9a8"/>
      ${[90, 160, 230].map((x, i) => `<ellipse cx="${x}" cy="170" rx="10" ry="18" fill="#e7a17f"/><path d="M${x} 170 L${x} 40" stroke="#4a3426" stroke-width="5" stroke-linecap="round" stroke-dasharray="130" stroke-dashoffset="130"><animate attributeName="stroke-dashoffset" values="130;30;30" keyTimes="0;.9;1" dur="8s" begin="-${i * 0.4}s" repeatCount="indefinite"/></path>`).join('')}
      ${label(160, 216, 'hair grows from follicles in the dermis')}`;
  },
  bones() {
    return `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 -22;0 0" dur="1s" repeatCount="indefinite"/>${stickSkeleton(160, 30)}</g>
      <ellipse cx="160" cy="212" rx="40" ry="5" fill="${C.soft}" opacity=".4"/>`;
  },
  shield() {
    return `
      <path d="M100 150 C 90 70, 230 70, 220 150 L 210 168 L 110 168 Z" fill="${C.bone}" stroke="${C.boneLine}" stroke-width="3"/>
      <path d="M120 140 C 116 96, 204 96, 200 140 C 196 152, 124 152, 120 140Z" fill="#f3a6c0"/>${label(160, 132, 'brain')}
      <circle r="12" fill="#e7c43c" stroke="#b89418" stroke-width="2"><animateMotion dur="2s" repeatCount="indefinite" path="M300 20 L 220 86 L 300 40"/></circle>
      <path d="M212 80 l 10 -6 m -6 16 l 12 0" stroke="#b89418" stroke-width="3"><animate attributeName="opacity" values="0;1;0;0" keyTimes="0;.5;.6;1" dur="2s" repeatCount="indefinite"/></path>
      ${label(160, 200, 'the cranium protects the brain')}`;
  },
  spine() {
    let nest = '';
    for (let i = 8; i >= 0; i--) nest = `<g transform="translate(0 ${i ? 18 : 0})"><g><animateTransform attributeName="transform" type="rotate" values="0;${i ? 5 : 0};0;${i ? -5 : 0};0" dur="4s" repeatCount="indefinite"/>
      <rect x="-16" y="0" width="32" height="13" rx="5" fill="${C.bone}" stroke="${C.boneLine}" stroke-width="2"/><rect x="-12" y="13" width="24" height="5" rx="2" fill="#9ac6e6"/>${nest}</g></g>`;
    return `<g transform="translate(160 24)">${nest}</g>${label(300, 200, 'intervertebral discs allow movement', 'end')}`;
  },
  flex() {
    return `
      <rect x="70" y="60" width="100" height="22" rx="11" fill="${C.bone}" stroke="${C.boneLine}" stroke-width="2"/>
      ${around(120, 60, `<ellipse cx="120" cy="60" rx="44" ry="16" fill="${C.muscle}" opacity=".9"/>`, `<animateTransform attributeName="transform" type="scale" values="1 1;0.8 1.6;1 1" dur="4s" repeatCount="indefinite"/>`)}
      <g><animateTransform attributeName="transform" type="rotate" values="0 170 71;-75 170 71;0 170 71" dur="4s" repeatCount="indefinite"/>
        <rect x="168" y="62" width="100" height="18" rx="9" fill="${C.bone}" stroke="${C.boneLine}" stroke-width="2"/>
        <circle cx="276" cy="71" r="14" fill="${C.skin}" stroke="#d9a37e" stroke-width="2"/></g>
      <circle cx="170" cy="71" r="10" fill="#9ac6e6" stroke="#6d9fc3" stroke-width="2"/>
      ${label(120, 110, 'biceps contracts')}${label(176, 110, 'elbow joint', 'start').replace('x="176"', 'x="186"')}`;
  },
  hand() {
    const finger = (x, len, d) => `<g><animateTransform attributeName="transform" type="rotate" values="0 ${x} 120;${d} ${x} 120;0 ${x} 120" dur="3s" repeatCount="indefinite"/>
      ${[0, 1, 2].map(j => `<rect x="${x - 7}" y="${120 - (j + 1) * len}" width="14" height="${len - 3}" rx="6" fill="${C.bone}" stroke="${C.boneLine}" stroke-width="2"/>`).join('')}</g>`;
    return `
      <rect x="110" y="120" width="100" height="70" rx="20" fill="${C.bone}" stroke="${C.boneLine}" stroke-width="2"/>
      ${finger(124, 24, 30)}${finger(148, 28, 34)}${finger(172, 27, 34)}${finger(196, 22, 30)}
      <g><animateTransform attributeName="transform" type="rotate" values="0 110 160;40 110 160;0 110 160" dur="3s" repeatCount="indefinite"/>
        <rect x="70" y="134" width="40" height="16" rx="7" fill="${C.bone}" stroke="${C.boneLine}" stroke-width="2"/></g>
      ${label(160, 214, '27 bones: carpals, metacarpals, phalanges')}`;
  },
  walk() {
    const leg = (dir) => `<g><animateTransform attributeName="transform" type="rotate" values="${20 * dir} 160 90;${-20 * dir} 160 90;${20 * dir} 160 90" dur="1.2s" repeatCount="indefinite"/>
      <rect x="154" y="90" width="12" height="56" rx="6" fill="${C.bone}" stroke="${C.boneLine}" stroke-width="2"/>
      <rect x="154" y="148" width="12" height="52" rx="6" fill="${C.bone}" stroke="${C.boneLine}" stroke-width="2"/>
      <rect x="150" y="198" width="30" height="10" rx="5" fill="${C.bone}" stroke="${C.boneLine}" stroke-width="2"/><circle cx="160" cy="148" r="6" fill="#9ac6e6"/></g>`;
    return `<path d="M120 90 Q160 60 200 90 L190 100 L130 100Z" fill="${C.bone}" stroke="${C.boneLine}" stroke-width="2"/>${leg(1)}${leg(-1)}
      <path d="M0 214 H320" stroke="${C.soft}" stroke-width="2" stroke-dasharray="10 10"><animate attributeName="stroke-dashoffset" values="0;20" dur=".6s" repeatCount="indefinite"/></path>`;
  },
  factory() {
    return `
      <rect x="60" y="80" width="200" height="60" rx="30" fill="${C.bone}" stroke="${C.boneLine}" stroke-width="3"/>
      <rect x="84" y="94" width="152" height="32" rx="16" fill="#d9584f"/>${label(160, 72, 'red marrow: haematopoiesis')}
      ${[0, 1, 2, 3, 4, 5].map(i => `<circle r="${i % 3 === 1 ? 7 : 6}" fill="${['#d0312d', '#f4f4f4', '#d0312d', '#e7c43c', '#d0312d', '#f4f4f4'][i]}" stroke="#a33" stroke-width="1"><animateMotion dur="4s" begin="-${i * 0.66}s" repeatCount="indefinite" path="M${110 + i * 20} 110 C ${110 + i * 20} 160, ${80 + i * 30} 180, ${60 + i * 40} 214"/></circle>`).join('')}
      ${label(48, 200, 'red cells', 'start')}${label(160, 200, 'white cells')}${label(272, 200, 'platelets', 'end')}`;
  },
  blood() {
    return `
      <rect x="0" y="70" width="320" height="80" rx="40" fill="#f6d4d0"/><rect x="0" y="70" width="320" height="80" rx="40" fill="none" stroke="#e0a49e" stroke-width="4"/>
      ${[0, 1, 2, 3, 4, 5].map(i => `<g><animateMotion dur="6s" begin="-${i}s" repeatCount="indefinite" path="M-20 ${96 + (i % 3) * 14} H340"/>
        <ellipse rx="14" ry="9" fill="${C.red}"/><ellipse rx="6" ry="3" fill="#a3201c"/>
        <circle cx="8" cy="-8" r="4" fill="#7cc7f0"><animate attributeName="opacity" values="1;1;0" keyTimes="0;.6;.7" dur="6s" begin="-${i}s" repeatCount="indefinite"/></circle></g>`).join('')}
      <g><animateMotion dur="8s" repeatCount="indefinite" path="M-20 120 H340"/><circle r="12" fill="#f8f8f8" stroke="#ccc"/><circle r="5" fill="#b9b2d9"/></g>
      ${label(40, 60, 'oxygen', 'start').replace('class', `fill="#3f8fc4" class`)}${label(160, 180, 'red cells carry oxygen · white cells defend')}`;
  },
  voice() {
    return `
      <path d="M120 40 L200 40 L210 200 L110 200 Z" fill="#f2d2c6" stroke="#d9a37e" stroke-width="2"/>
      <path stroke="${C.muscle}" stroke-width="6" stroke-linecap="round" fill="none"><animate attributeName="d" values="M126 120 Q 150 116 158 120;M126 120 Q 150 126 158 120;M126 120 Q 150 116 158 120" dur=".12s" repeatCount="indefinite"/></path>
      <path stroke="${C.muscle}" stroke-width="6" stroke-linecap="round" fill="none"><animate attributeName="d" values="M194 120 Q 170 116 162 120;M194 120 Q 170 126 162 120;M194 120 Q 170 116 162 120" dur=".12s" repeatCount="indefinite"/></path>
      ${[0, 0.4, 0.8].map(b => dot(4, '#7cc7f0', 'M160 200 L160 30', 1.2, b)).join('')}
      ${[0, 0.5, 1].map(b => `<path d="M220 40 q 14 20 0 40" stroke="${C.blue}" stroke-width="3" fill="none"><animateTransform attributeName="transform" type="translate" values="0 0;60 0" dur="1.5s" begin="-${b}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="1.5s" begin="-${b}s" repeatCount="indefinite"/></path>`).join('')}
      ${label(160, 104, 'vocal cords')}${label(268, 110, 'sound waves', 'middle')}`;
  },
  liver() {
    return `
      <path d="M70 90 C 80 50, 240 40, 260 80 C 270 110, 200 150, 120 150 C 80 150, 64 120, 70 90Z" fill="#9b3b32" stroke="#7a2c25" stroke-width="3"/>
      ${label(160, 100, 'liver').replace('class', 'fill="#fff" class')}
      ${[0, 1, 2, 3, 4, 5].map(i => `<circle r="6" fill="${i % 2 ? '#5b6275' : C.red}"><animateMotion dur="4s" begin="-${i * 0.66}s" repeatCount="indefinite" path="M0 120 L 160 120 ${i % 2 ? 'L 160 210' : 'L 320 120'}"/></circle>`).join('')}
      ${label(20, 108, 'in', 'start')}${label(300, 108, 'filtered', 'end')}${label(170, 206, 'toxins removed', 'start')}`;
  },
  squirt() {
    return `
      ${around(110, 80, `<ellipse cx="110" cy="80" rx="34" ry="24" fill="#6aa84f" stroke="#4f7f3a" stroke-width="3"/>`, `<animateTransform attributeName="transform" type="scale" values="1;1;0.75;1" keyTimes="0;.5;.6;1" dur="8s" repeatCount="indefinite"/>`)}
      <path d="M140 92 C 170 110, 170 130, 200 140" stroke="#6aa84f" stroke-width="8" fill="none" stroke-linecap="round"/>
      <rect x="190" y="130" width="110" height="40" rx="20" fill="#e8b2a5"/>
      ${[0, 0.3, 0.6].map(b => `<circle r="5" fill="#6aa84f" opacity="0"><animateMotion dur="1s" begin="-${4 + b}s" repeatCount="indefinite" path="M140 92 C 170 110, 170 130, 210 150"/><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.5;.5;.75;.76" dur="8s" repeatCount="indefinite"/></circle>`).join('')}
      <circle cx="250" cy="150" r="14" fill="${C.yellow}"><animate attributeName="r" values="14;14;0;0" keyTimes="0;.7;.8;1" dur="8s" repeatCount="indefinite"/></circle>
      ${[[-8, -4], [6, 4], [10, -8], [-4, 8]].map(([x, y]) => `<circle cx="${250 + x}" cy="${150 + y}" r="4" fill="${C.yellow}" opacity="0"><animate attributeName="opacity" values="0;0;1;1" keyTimes="0;.75;.8;1" dur="8s" repeatCount="indefinite"/></circle>`).join('')}
      ${label(110, 130, 'contracts')}${label(250, 196, 'bile emulsifies fat')}`;
  },
  kidney() {
    return `
      <path d="M120 40 C 60 40, 60 170, 120 170 C 150 170, 150 140, 136 120 C 128 108, 128 100, 136 88 C 150 68, 150 40, 120 40Z" fill="#a8423b" stroke="#7a2c25" stroke-width="3"/>
      <path d="M136 104 C 180 110, 200 150, 210 210" stroke="#e7c43c" stroke-width="6" fill="none"/>
      ${[0, 1, 2, 3].map(i => `<circle r="6" fill="${C.red}"><animateMotion dur="3s" begin="-${i * 0.75}s" repeatCount="indefinite" path="M320 60 L 136 80 L 100 104 L 136 128 L 320 150"/></circle>`).join('')}
      ${[0, 1, 2, 3].map(i => `<circle r="4" fill="#5b6275"><animateMotion dur="3s" begin="-${i * 0.75}s" repeatCount="indefinite" path="M320 66 L 136 86 L 100 104"/></circle>`).join('')}
      ${[0, 0.7, 1.4].map(b => dot(4, C.yellow, 'M136 104 C 180 110, 200 150, 210 210', 2, b)).join('')}
      ${label(300, 50, 'blood in', 'end')}${label(300, 172, 'filtered blood out', 'end')}${label(220, 214, 'urine', 'start')}`;
  },
  bladder() {
    return `
      <path d="M120 20 C 120 60, 140 70, 150 90 M200 20 C 200 60, 180 70, 170 90" stroke="#e7c43c" stroke-width="5" fill="none"/>
      ${[0, 0.6].map(b => dot(4, C.yellow, 'M120 20 C 120 60, 140 70, 150 90', 1.2, b) + dot(4, C.yellow, 'M200 20 C 200 60, 180 70, 170 90', 1.2, b)).join('')}
      ${around(160, 130, `<ellipse cx="160" cy="130" rx="50" ry="44" fill="#f2d5d0" stroke="#d29a92" stroke-width="3"/>`, `<animateTransform attributeName="transform" type="scale" values="0.6;1.1;1.1;0.6" keyTimes="0;.6;.8;1" dur="8s" repeatCount="indefinite"/>`)}
      <rect x="120" width="80" fill="#e7c43c" opacity=".7"><animate attributeName="y" values="160;100;100;160" keyTimes="0;.6;.8;1" dur="8s" repeatCount="indefinite"/><animate attributeName="height" values="0;60;60;0" keyTimes="0;.6;.8;1" dur="8s" repeatCount="indefinite"/></rect>
      <text x="160" y="214" text-anchor="middle" class="demo-label" opacity="0">stretch receptors signal: full<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.55;.6;.8;.85" dur="8s" repeatCount="indefinite"/></text>`;
  },
  messenger() {
    const path = 'M90 50 C 140 60, 150 120, 220 140';
    return `
      <circle cx="80" cy="46" r="30" fill="#f3a6c0"/><circle cx="90" cy="58" r="7" fill="#b5367a">${inStep(0)}</circle>${label(80, 98, 'pituitary')}
      <path d="${path}" stroke="${C.red}" stroke-width="10" opacity=".25" fill="none" stroke-linecap="round"/>
      ${[0, 0.5, 1, 1.5].map(b => dot(5, '#b5367a', path, 2, b)).join('')}
            ${around(250, 210, stickSkeleton(250, 90, 0.55), `<animateTransform attributeName="transform" type="scale" values="1 0.8;1 0.8;1 1.05;1 0.8" keyTimes="0;.55;.9;1" dur="8s" repeatCount="indefinite"/>`)}`;
  },
  fight() {
    return `
      ${[[90, 70], [230, 60], [250, 160], [80, 170]].map(([x, y], i) => `<g>${germ(x, y, 12)}<animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;${(i * 0.2 + 0.25).toFixed(2)};${(i * 0.2 + 0.3).toFixed(2)};.98;1" dur="8s" repeatCount="indefinite"/></g>`).join('')}
      <g><animateMotion dur="8s" repeatCount="indefinite" path="M160 110 L 90 70 L 230 60 L 250 160 L 80 170 L 160 110" keyPoints="0;.2;.4;.6;.8;1" keyTimes="0;.25;.45;.65;.85;1" calcMode="linear"/>
        <circle r="22" fill="#f4f6fb" stroke="#b8c2dc" stroke-width="3"><animate attributeName="r" values="22;26;22" dur=".8s" repeatCount="indefinite"/></circle>
        <circle r="9" fill="#9d8fd6" cx="-4" cy="-3"/><circle r="6" fill="#9d8fd6" cx="7" cy="4"/></g>
      ${label(160, 214, 'phagocytes engulf pathogens')}`;
  },
  filter() {
    return `
      <path d="M0 110 C 60 110, 90 80, 130 80 L 190 80 C 230 80, 260 110, 320 110" stroke="#cfe3c4" stroke-width="16" fill="none"/>
      <ellipse cx="160" cy="80" rx="46" ry="30" fill="#8fbf7a" stroke="#5f8f4c" stroke-width="3"/>${label(160, 130, 'lymph node')}
      ${[0, 1, 2].map(i => `<g><animateMotion dur="4s" begin="-${i * 1.3}s" repeatCount="indefinite" path="M0 110 C 60 110, 90 80, 150 80"/>${germ(0, 0, 7)}<animate attributeName="opacity" values="1;1;0" keyTimes="0;.9;1" dur="4s" begin="-${i * 1.3}s" repeatCount="indefinite"/></g>`).join('')}
      ${[0, 1, 2].map(i => dot(5, '#e9f3e3', 'M170 80 C 230 80, 260 110, 320 110', 3, i, 'stroke="#8fbf7a" stroke-width="2"')).join('')}`;
  },
  cells() {
    return `
      <ellipse cx="160" cy="110" rx="50" ry="50" fill="#f6d1e0" stroke="#d688aa" stroke-width="3">
        <animate attributeName="rx" values="40;70;70;40" keyTimes="0;.45;.6;.61" dur="8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="1;1;1;0;0" keyTimes="0;.6;.6;.61;1" dur="8s" repeatCount="indefinite"/></ellipse>
      <circle cx="160" cy="110" r="14" fill="#b5367a"><animate attributeName="opacity" values="1;1;0;0" keyTimes="0;.25;.3;1" dur="8s" repeatCount="indefinite"/></circle>
      ${[-1, 1].map(s => `<circle cy="110" r="10" fill="#b5367a" opacity="0"><animate attributeName="cx" values="160;160;${160 + s * 30};${160 + s * 30};${160 + s * 70}" keyTimes="0;.3;.45;.6;1" dur="8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0;1;1" keyTimes="0;.28;.3;1" dur="8s" repeatCount="indefinite"/></circle>
        <circle cy="110" r="46" fill="#f6d1e0" stroke="#d688aa" stroke-width="3" opacity="0"><animate attributeName="cx" values="${160 + s * 34};${160 + s * 70}" dur="8s" keyTimes="0;1" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0;1;1" keyTimes="0;.6;.61;1" dur="8s" repeatCount="indefinite"/></circle>`).join('')}
      ${[-1, 1].map(s => `<circle cy="110" r="10" fill="#b5367a" opacity="0"><animate attributeName="cx" values="${160 + s * 34};${160 + s * 70}" dur="8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0;1;1" keyTimes="0;.6;.61;1" dur="8s" repeatCount="indefinite"/></circle>`).join('')}
      ${label(160, 206, 'mitosis: one cell becomes two')}`;
  },
  dna() {
    const N = 16, rungs = [], colors = ['#e56b8f', '#3b6fd8', '#e7c43c', '#3aa66b'];
    for (let i = 0; i < N; i++) {
      const x = 20 + i * 18.6;
      rungs.push(`<line x1="${x}" x2="${x}" stroke="${colors[i % 4]}" stroke-width="5" stroke-linecap="round">
        <animate attributeName="y1" values="${[0, 1, 2, 3, 4].map(k => (110 - 50 * Math.sin((i / N) * 2 * Math.PI * 2 + k * Math.PI / 2)).toFixed(1)).join(';')}" dur="4s" repeatCount="indefinite"/>
        <animate attributeName="y2" values="${[0, 1, 2, 3, 4].map(k => (110 + 50 * Math.sin((i / N) * 2 * Math.PI * 2 + k * Math.PI / 2)).toFixed(1)).join(';')}" dur="4s" repeatCount="indefinite"/></line>
        <circle cx="${x}" r="6" fill="#5b6275"><animate attributeName="cy" values="${[0, 1, 2, 3, 4].map(k => (110 - 50 * Math.sin((i / N) * 2 * Math.PI * 2 + k * Math.PI / 2)).toFixed(1)).join(';')}" dur="4s" repeatCount="indefinite"/></circle>
        <circle cx="${x}" r="6" fill="#0e8c8c"><animate attributeName="cy" values="${[0, 1, 2, 3, 4].map(k => (110 + 50 * Math.sin((i / N) * 2 * Math.PI * 2 + k * Math.PI / 2)).toFixed(1)).join(';')}" dur="4s" repeatCount="indefinite"/></circle>`);
    }
    return rungs.join('') + label(160, 210, 'double helix of base pairs');
  },
  baby() {
    return `
      <ellipse cx="160" cy="110" rx="90" ry="80" fill="#f6d1d8" stroke="#d98fa0" stroke-width="3"/>
      ${around(160, 110, `<circle cx="168" cy="92" r="22" fill="#f3c9a8"/><ellipse cx="156" cy="126" rx="30" ry="24" fill="#f3c9a8"/><circle cx="174" cy="90" r="2.5" fill="#5b6275"/>`,
        `<animateTransform attributeName="transform" type="scale" values="0.15;0.4;0.7;1;1" keyTimes="0;.25;.5;.75;1" dur="8s" repeatCount="indefinite"/>`)}
      <path d="M150 140 C 140 170, 180 176, 196 186" stroke="#d98fa0" stroke-width="4" fill="none"/>
      ${['1 month', '3 months', '6 months', '9 months'].map((t, i) => `<text x="160" y="214" text-anchor="middle" class="demo-label" opacity="0">${t}${inStep(i).replace('0.15', '0').replace(/;0\.15/g, ';0')}</text>`).join('')}`;
  },
};

function germ(x, y, r) {
  const spikes = Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<line x1="${x + Math.cos(a) * r}" y1="${y + Math.sin(a) * r}" x2="${x + Math.cos(a) * r * 1.5}" y2="${y + Math.sin(a) * r * 1.5}" stroke="${C.germ}" stroke-width="3" stroke-linecap="round"/>`; }).join('');
  return `${spikes}<circle cx="${x}" cy="${y}" r="${r}" fill="${C.germ}"/><circle cx="${x - r / 4}" cy="${y - r / 4}" r="${r / 3}" fill="#ffffff" opacity=".25"/>`;
}

function stickSkeleton(cx, top, s = 1) {
  const b = `fill="${C.bone}" stroke="${C.boneLine}" stroke-width="${2 / s}"`;
  return `<g transform="translate(${cx} ${top}) scale(${s})">
    <circle cx="0" cy="16" r="16" ${b}/><rect x="-4" y="32" width="8" height="64" rx="4" ${b}/>
    ${[44, 54, 64, 74].map(y => `<path d="M-22 ${y} Q0 ${y - 8} 22 ${y}" fill="none" stroke="${C.boneLine}" stroke-width="${4 / s}" stroke-linecap="round"/>`).join('')}
    <g><animateTransform attributeName="transform" type="rotate" values="20 0 40;-30 0 40;20 0 40" dur="1s" repeatCount="indefinite"/><rect x="-46" y="38" width="44" height="7" rx="3.5" ${b}/></g>
    <g><animateTransform attributeName="transform" type="rotate" values="-20 0 40;30 0 40;-20 0 40" dur="1s" repeatCount="indefinite"/><rect x="2" y="38" width="44" height="7" rx="3.5" ${b}/></g>
    <path d="M-18 96 Q0 86 18 96 L14 104 L-14 104Z" ${b}/>
    <rect x="-16" y="102" width="8" height="70" rx="4" ${b}/><rect x="8" y="102" width="8" height="70" rx="4" ${b}/>
  </g>`;
}

function demoSVG(kind) {
  const draw = DEMOS[kind] || DEMOS.heart;
  return `<svg class="demo-svg" viewBox="0 0 320 220" role="img" aria-hidden="true">${draw().replace(/ begin="-0s"/g, "")}</svg>`;
}
