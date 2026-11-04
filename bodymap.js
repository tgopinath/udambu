// The tappable body on the home screen. One child figure (viewBox 240 × 520) with layers:
// outside, organs, bones, muscles, nerves, blood. Every shape with data-part opens that part.
const LAYERS = [
  { key: 'outside', name: 'Outside', icon: 'person' },
  { key: 'organs',  name: 'Organs',  icon: 'heart' },
  { key: 'bones',   name: 'Bones',   icon: 'bone' },
  { key: 'muscles', name: 'Muscles', icon: 'muscle' },
  { key: 'nerves',  name: 'Nerves',  icon: 'zap' },
  { key: 'blood',   name: 'Blood',   icon: 'drop' },
];

const BM = { bone: '#efe6d2', boneLine: '#a8956a', skin: '#f1c7a5', skinLine: '#cf9a76' };

// outline of the child, shared by every layer
const BODY_OUTLINE = `
  <path class="bm-body" d="M120 14 C 152 14, 168 40, 166 70 C 165 92, 152 108, 136 112 L 136 124
    C 160 128, 180 134, 186 150 C 192 176, 200 230, 206 290 C 208 304, 212 312, 210 322 C 206 334, 192 332, 192 320
    C 190 304, 186 296, 182 286 C 176 250, 172 220, 170 200 C 168 240, 172 290, 172 330
    C 174 380, 170 430, 166 476 C 172 482, 180 488, 178 496 C 170 504, 140 502, 136 494 C 134 470, 132 420, 126 360
    C 124 350, 116 350, 114 360 C 108 420, 106 470, 104 494 C 100 502, 70 504, 62 496 C 60 488, 68 482, 74 476
    C 70 430, 66 380, 68 330 C 68 290, 72 240, 70 200 C 68 220, 64 250, 58 286 C 54 296, 50 304, 48 320
    C 48 332, 34 334, 30 322 C 28 312, 32 304, 34 290 C 40 230, 48 176, 54 150 C 60 134, 80 128, 104 124
    L 104 112 C 88 108, 75 92, 74 70 C 72 40, 88 14, 120 14 Z"/>`;

const HOT = {
  outside: `
    <path data-part="hair-nails" class="bm-hot" d="M78 58 C 76 26, 100 10, 120 10 C 146 10, 166 28, 162 58 C 150 40, 132 32, 120 32 C 104 32, 88 40, 78 58Z" fill="#5a3b2a"/>
    <g data-part="eyes" class="bm-hot"><ellipse cx="104" cy="68" rx="8" ry="6" fill="#fff" stroke="#5b6275"/><circle cx="104" cy="68" r="3.5" fill="#3d2a1e"/>
      <ellipse cx="136" cy="68" rx="8" ry="6" fill="#fff" stroke="#5b6275"/><circle cx="136" cy="68" r="3.5" fill="#3d2a1e"/></g>
    <g data-part="ears" class="bm-hot"><ellipse cx="74" cy="72" rx="7" ry="12" fill="${BM.skin}" stroke="${BM.skinLine}" stroke-width="2"/><ellipse cx="166" cy="72" rx="7" ry="12" fill="${BM.skin}" stroke="${BM.skinLine}" stroke-width="2"/></g>
    <path data-part="nose" class="bm-hot" d="M120 72 C 116 80, 112 86, 116 88 C 118 89, 122 89, 124 88 C 128 86, 124 80, 120 72Z" fill="#e8ad8a" stroke="${BM.skinLine}" stroke-width="1.5"/>
    <path data-part="mouth" class="bm-hot" d="M106 96 Q 120 108 134 96 Q 120 100 106 96Z" fill="#d9646f" stroke="#b44a55" stroke-width="1.5"/>
    <path data-part="skin" class="bm-hot bm-zone" d="M78 150 C 100 140, 140 140, 162 150 L 166 250 C 140 262, 100 262, 74 250Z"/>
    <g data-part="hand" class="bm-hot bm-zone"><circle cx="38" cy="318" r="14"/><circle cx="202" cy="318" r="14"/></g>
    <g data-part="foot" class="bm-hot bm-zone"><ellipse cx="82" cy="494" rx="22" ry="10"/><ellipse cx="158" cy="494" rx="22" ry="10"/></g>`,
  organs: `
    <path data-part="brain" class="bm-hot" d="M86 54 C 84 30, 104 20, 120 22 C 140 20, 158 30, 154 54 C 152 64, 140 66, 120 64 C 100 66, 88 64, 86 54Z" fill="#f3a6c0" stroke="#c9789a" stroke-width="2"/>
    <path d="M100 36 q 8 6 18 0 M124 40 q 10 -6 20 2 M98 52 q 10 -6 22 2 M126 54 q 10 -6 20 0" stroke="#c9789a" stroke-width="1.5" fill="none" pointer-events="none"/>
    <g data-part="eyes" class="bm-hot"><circle cx="104" cy="72" r="6" fill="#fff" stroke="#5b6275"/><circle cx="136" cy="72" r="6" fill="#fff" stroke="#5b6275"/></g>
    <rect data-part="tongue" class="bm-hot" x="112" y="94" width="16" height="7" rx="3.5" fill="#e56b7b"/>
    <path data-part="teeth" class="bm-hot" d="M108 89 H132 V93 H108Z" fill="#fff" stroke="#c9c2b2"/>
    <circle data-part="tonsils" class="bm-hot" cx="120" cy="104" r="4" fill="#e88aa6"/>
    <rect data-part="voice-box" class="bm-hot" x="113" y="110" width="14" height="10" rx="4" fill="#f0b7a8" stroke="#c97a74"/>
    <path data-part="thyroid" class="bm-hot" d="M106 122 C 110 116, 116 118, 120 122 C 124 118, 130 116, 134 122 C 132 128, 124 128, 120 126 C 116 128, 108 128, 106 122Z" fill="#c25b8a"/>
    <rect data-part="windpipe" class="bm-hot" x="115" y="128" width="10" height="30" rx="4" fill="#e9b3ad" stroke="#c97a74" stroke-width="1.5"/>
    <path data-part="food-pipe" class="bm-hot" d="M128 128 L 132 236" stroke="#e8b2a5" stroke-width="5" stroke-linecap="round" fill="none"/>
    <g data-part="lungs" class="bm-hot" fill="#f2a7a0" stroke="#c97a74" stroke-width="2">
      <path d="M112 156 C 90 152, 78 180, 80 232 C 94 240, 108 236, 114 228 Z"/><path d="M128 156 C 150 152, 162 180, 160 232 C 146 240, 134 236, 126 228 Z"/></g>
    <path data-part="heart" class="bm-hot" d="M128 222 C 108 208, 108 190, 120 188 C 125 188, 128 192, 129 195 C 131 190, 135 187, 140 188 C 152 192, 148 210, 128 222Z" fill="#d0312d" stroke="#9f1f1c" stroke-width="1.5"/>
    <path data-part="diaphragm" class="bm-hot" d="M78 240 Q 120 222 162 240 L 162 245 Q 120 228 78 245Z" fill="#c8504a"/>
    <path data-part="liver" class="bm-hot" d="M76 250 C 90 242, 122 242, 128 250 C 128 262, 110 272, 92 272 C 80 272, 74 262, 76 250Z" fill="#8f3a31" stroke="#6e2a23" stroke-width="1.5"/>
    <ellipse data-part="gallbladder" class="bm-hot" cx="104" cy="272" rx="6" ry="4.5" fill="#5f9a44"/>
    <path data-part="stomach" class="bm-hot" d="M132 246 C 150 240, 166 252, 160 268 C 154 282, 136 282, 130 274 C 138 270, 146 266, 142 258 C 138 254, 132 254, 132 246Z" fill="#e58f7d" stroke="#bf6c5b" stroke-width="1.5"/>
    <ellipse data-part="spleen" class="bm-hot" cx="164" cy="258" rx="5" ry="10" fill="#7b3b63"/>
    <path data-part="pancreas" class="bm-hot" d="M108 282 C 122 276, 140 278, 154 276 C 156 282, 140 286, 124 288 C 114 290, 106 288, 108 282Z" fill="#efc58b" stroke="#c99a55" stroke-width="1"/>
    <g data-part="kidneys" class="bm-hot" fill="#a8423b"><ellipse cx="92" cy="286" rx="7" ry="11"/><ellipse cx="148" cy="290" rx="7" ry="11"/></g>
    <g data-part="adrenal" class="bm-hot" fill="#e7c43c"><path d="M86 274 l 6 -6 l 6 6z"/><path d="M142 278 l 6 -6 l 6 6z"/></g>
    <path data-part="large-intestine" class="bm-hot" d="M90 330 L 90 300 Q 90 292 98 292 L 142 292 Q 150 292 150 300 L 150 336" stroke="#d98a6e" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path data-part="small-intestine" class="bm-hot" d="M100 302 C 120 296, 140 302, 140 308 C 140 314, 100 310, 100 316 C 100 322, 140 318, 140 324 C 140 330, 110 330, 104 328" stroke="#efaa93" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path data-part="appendix" class="bm-hot" d="M90 330 q -2 8 4 10" stroke="#d98a6e" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse data-part="bladder" class="bm-hot" cx="120" cy="344" rx="12" ry="9" fill="#f2d5a0" stroke="#d1a85a" stroke-width="1.5"/>`,
  bones: `
    <path data-part="skull" class="bm-hot" d="M84 60 C 80 26, 104 16, 120 16 C 136 16, 160 26, 156 60 C 156 80, 148 92, 140 98 L 100 98 C 92 92, 84 80, 84 60Z" fill="${BM.bone}" stroke="${BM.boneLine}" stroke-width="2"/>
    <g pointer-events="none"><ellipse cx="104" cy="66" rx="9" ry="8" fill="#5b6275"/><ellipse cx="136" cy="66" rx="9" ry="8" fill="#5b6275"/><path d="M116 84 l 4 -8 l 4 8z" fill="#5b6275"/></g>
    <path data-part="teeth" class="bm-hot" d="M104 98 H136 L132 106 H108Z" fill="#fff" stroke="${BM.boneLine}"/>
    <rect data-part="spine" class="bm-hot" x="115" y="108" width="10" height="200" rx="5" fill="${BM.bone}" stroke="${BM.boneLine}" stroke-width="1.5"/>
    <g data-part="ribs" class="bm-hot" fill="none" stroke="${BM.boneLine}" stroke-width="5" stroke-linecap="round">
      ${[156, 172, 188, 204, 220, 236].map(y => `<path d="M118 ${y} C 96 ${y - 6}, 80 ${y + 4}, 82 ${y + 14}"/><path d="M122 ${y} C 144 ${y - 6}, 160 ${y + 4}, 158 ${y + 14}"/>`).join('')}
      </g>
    <g data-part="arm-bones" class="bm-hot" stroke="${BM.bone}" stroke-width="7" stroke-linecap="round">
      <path d="M70 146 L 58 224 L 42 302"/><path d="M170 146 L 182 224 L 198 302"/><path d="M60 140 L 100 136 M180 140 L 140 136" stroke-width="6"/></g>
    <g data-part="joints" class="bm-hot" fill="#9ac6e6" stroke="#6d9fc3" stroke-width="2"><circle cx="58" cy="224" r="6"/><circle cx="182" cy="224" r="6"/><circle cx="92" cy="412" r="7"/><circle cx="148" cy="412" r="7"/></g>
    <g data-part="hand" class="bm-hot" stroke="${BM.bone}" stroke-width="4" stroke-linecap="round" fill="none">
      <path d="M40 306 l -8 20 M42 308 l -2 22 M44 308 l 4 22 M46 306 l 10 16"/><path d="M200 306 l 8 20 M198 308 l 2 22 M196 308 l -4 22 M194 306 l -10 16"/></g>
    <path data-part="skeleton" class="bm-hot" d="M86 300 C 100 292, 140 292, 154 300 L 150 330 C 140 322, 100 322, 90 330Z" fill="${BM.bone}" stroke="${BM.boneLine}" stroke-width="2"/>
    <g data-part="leg-bones" class="bm-hot" stroke="${BM.bone}" stroke-width="9" stroke-linecap="round"><path d="M98 330 L 92 406 M 92 418 L 88 482"/><path d="M142 330 L 148 406 M 148 418 L 152 482"/></g>
    <g data-part="foot" class="bm-hot" fill="${BM.bone}" stroke="${BM.boneLine}" stroke-width="1.5"><path d="M80 484 L 98 484 L 92 500 L 66 500Z"/><path d="M142 484 L 160 484 L 174 500 L 148 500Z"/></g>
    <g data-part="bone-marrow" class="bm-hot" stroke="#d9584f" stroke-width="3" stroke-linecap="round"><path d="M97 340 L 93 396"/><path d="M143 340 L 147 396"/></g>`,
  muscles: `
    <g data-part="muscles" class="bm-hot" fill="#c8504a" stroke="#9f3732" stroke-width="1.5">
      <path d="M84 146 C 100 140, 114 142, 118 150 L 118 182 C 104 186, 90 180, 82 170Z"/><path d="M156 146 C 140 140, 126 142, 122 150 L 122 182 C 136 186, 150 180, 158 170Z"/>
      <path d="M100 190 h 40 v 90 h -40z" opacity=".85"/><path d="M120 190 v 90 M100 214 h40 M100 238 h40 M100 262 h40" stroke="#9f3732" fill="none"/>
      <path d="M66 150 C 56 170, 54 200, 58 222 C 66 210, 72 180, 72 160Z"/><path d="M174 150 C 184 170, 186 200, 182 222 C 174 210, 168 180, 168 160Z"/>
      <path d="M58 230 C 50 260, 44 286, 42 300 C 52 290, 60 262, 62 240Z"/><path d="M182 230 C 190 260, 196 286, 198 300 C 188 290, 180 262, 178 240Z"/>
      <path d="M74 336 C 70 370, 80 400, 92 404 C 110 396, 116 360, 114 336Z"/><path d="M166 336 C 170 370, 160 400, 148 404 C 130 396, 124 360, 126 336Z"/>
      <path d="M80 420 C 76 444, 82 466, 90 474 C 98 464, 102 440, 98 420Z"/><path d="M160 420 C 164 444, 158 466, 150 474 C 142 464, 138 440, 142 420Z"/></g>
    <path data-part="heart" class="bm-hot" d="M128 222 C 112 210, 112 196, 121 194 C 125 194, 127 197, 128 199 C 130 196, 133 193, 137 194 C 146 197, 143 211, 128 222Z" fill="#d0312d" stroke="#fff" stroke-width="1.5"/>
    <path data-part="diaphragm" class="bm-hot" d="M80 288 Q 120 270 160 288 L 160 294 Q 120 276 80 294Z" fill="#e0756d"/>
    <path data-part="tongue" class="bm-hot" d="M110 94 Q 120 104 130 94 Z" fill="#e56b7b"/>`,
  nerves: `
    <path data-part="brain" class="bm-hot" d="M86 54 C 84 30, 104 20, 120 22 C 140 20, 158 30, 154 54 C 152 64, 140 66, 120 64 C 100 66, 88 64, 86 54Z" fill="#f3a6c0" stroke="#c9789a" stroke-width="2"/>
    <circle data-part="pituitary" class="bm-hot" cx="120" cy="66" r="5" fill="#b5367a" stroke="#fff" stroke-width="1.5"/>
    <path data-part="spinal-cord" class="bm-hot" d="M120 64 L 120 300" stroke="#f2b33d" stroke-width="7" stroke-linecap="round"/>
    <g data-part="nerves" class="bm-hot" stroke="#f2b33d" stroke-width="2.5" fill="none" stroke-linecap="round">
      <path d="M120 140 C 90 140, 70 150, 60 224 C 52 270, 44 296, 38 318"/><path d="M120 140 C 150 140, 170 150, 180 224 C 188 270, 196 296, 202 318"/>
      ${[170, 200, 230, 260].map(y => `<path d="M120 ${y} q -24 4 -36 16 M120 ${y} q 24 4 36 16"/>`).join('')}
      <path d="M118 300 C 100 330, 92 400, 88 490"/><path d="M122 300 C 140 330, 148 400, 152 490"/></g>
    <g data-part="eyes" class="bm-hot"><circle cx="104" cy="72" r="6" fill="#fff" stroke="#5b6275"/><circle cx="136" cy="72" r="6" fill="#fff" stroke="#5b6275"/></g>`,
  blood: `
    <g data-part="blood-vessels" class="bm-hot" fill="none" stroke-width="3" stroke-linecap="round">
      <g stroke="#d0312d"><path d="M126 200 C 126 160, 112 130, 112 100 M126 200 L 126 300 C 110 340, 96 400, 92 490 M126 300 C 140 340, 150 400, 150 490 M126 170 C 90 160, 66 200, 56 230 C 48 270, 42 300, 38 318 M126 170 C 160 160, 176 200, 184 230 C 192 270, 198 300, 202 318"/></g>
      <g stroke="#3b6fd8"><path d="M116 200 C 116 160, 128 130, 128 100 M116 200 L 116 300 C 102 340, 90 400, 86 490 M116 300 C 132 340, 144 400, 146 490 M116 176 C 84 168, 62 206, 52 234 C 44 272, 38 300, 34 316 M116 176 C 156 168, 180 206, 188 234 C 196 272, 202 300, 206 316"/></g></g>
    <path data-part="heart" class="bm-hot" d="M122 222 C 100 206, 100 186, 113 184 C 118 184, 121 188, 122 191 C 124 187, 128 183, 133 184 C 146 188, 142 208, 122 222Z" fill="#d0312d" stroke="#fff" stroke-width="2"/>
    <g data-part="blood" class="bm-hot">${[[70, 260], [176, 262], [98, 380], [146, 440], [44, 300]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="5" fill="#d0312d" stroke="#fff"/>`).join('')}</g>
    <g data-part="lymph" class="bm-hot" fill="#3aa66b" stroke="#fff">${[[104, 116], [136, 116], [80, 150], [160, 150], [96, 320], [144, 320]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5"/>`).join('')}</g>
    <ellipse data-part="spleen" class="bm-hot" cx="160" cy="258" rx="6" ry="11" fill="#7b3b63" stroke="#fff"/>
    <circle data-part="tonsils" class="bm-hot" cx="120" cy="100" r="5" fill="#e88aa6" stroke="#fff"/>
    <g data-part="white-cells" class="bm-hot"><circle cx="84" cy="200" r="7" fill="#f4f6fb" stroke="#9aa3b5"/><circle cx="82" cy="199" r="3" fill="#9d8fd6"/>
      <circle cx="156" cy="360" r="7" fill="#f4f6fb" stroke="#9aa3b5"/><circle cx="154" cy="359" r="3" fill="#9d8fd6"/></g>
    <g data-part="bone-marrow" class="bm-hot" stroke="#efe6d2" stroke-width="6" stroke-linecap="round" opacity=".9"><path d="M98 342 L 94 398"/><path d="M142 342 L 146 398"/></g>`,
};

function bodyMapSVG(layer) {
  return `<svg class="bodymap layer-${layer}" viewBox="0 0 240 520" role="group" aria-label="Body map, ${layer}">
    ${BODY_OUTLINE}<g class="bm-layer">${HOT[layer] || ''}</g></svg>`;
}

// parts you can tap in a layer (for the screen-reader list and the game)
function layerParts(layer) {
  return [...new Set([...(HOT[layer] || '').matchAll(/data-part="([^"]+)"/g)].map(m => m[1]))];
}
