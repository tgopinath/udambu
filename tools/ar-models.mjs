// Prepares the AR models: .work/ar-src/<uid>.glb (Objaverse copies of Sketchfab CC models, see tools/ar-sources.json)
// → ar/<part>.glb, welded, simplified, 1024 px textures, standing on y = 0 at a size that is easy to see on the floor.
//   node tools/ar-models.mjs [part]
// Uses the glTF-Transform install in ../kanal (same pipeline as Kanal's dishes).
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('/Users/gopi-4423/Documents/kanal/package.json');
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const { dedup, weld, simplify, textureCompress, prune, getBounds, flatten, join, metalRough } = require('@gltf-transform/functions');
const { MeshoptSimplifier } = require('meshoptimizer');
const sharp = require('sharp');

const SRC = JSON.parse(fs.readFileSync('tools/ar-sources.json', 'utf8'));
// tallest side in metres when it lands on the floor
const SIZE = { body: 1.75, skeleton: 1.75, blood: .5, 'white-cells': .5, cells: .5, dna: .7, nerves: .7, teeth: .4, 'spinal-cord': 1.2, spine: 1.2, 'leg-bones': .9, 'arm-bones': .9 };
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
await MeshoptSimplifier.ready;
for (const [key, m] of Object.entries(SRC)) {
  if (process.argv[2] && key !== process.argv[2]) continue;
  const doc = await io.read(`.work/ar-src/${m.uid}.glb`);
  // parts of the source we don't want on the floor (e.g. a ground plane), by node name
  for (const n of doc.getRoot().listNodes()) if (m.drop?.some(d => n.getName().startsWith(d))) n.dispose();
  const tris = () => doc.getRoot().listMeshes().flatMap(x => x.listPrimitives()).reduce((n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3, 0);
  const before = tris();
  // animations and morph targets aren't needed on the floor; hard normals stop vertices from welding
  doc.getRoot().listAnimations().forEach(a => a.dispose());
  for (const p of doc.getRoot().listMeshes().flatMap(x => x.listPrimitives())) {
    p.listTargets().forEach(t => t.dispose());
    ['NORMAL', 'TANGENT'].forEach(a => p.getAttribute(a) && p.setAttribute(a, null));
  }
  // older specular-glossiness materials → standard metal-roughness (AR viewers only read the standard one)
  if (doc.getRoot().listExtensionsUsed().some(e => e.extensionName === 'KHR_materials_pbrSpecularGlossiness')) await doc.transform(metalRough());
  if (m.tint) doc.getRoot().listMaterials().forEach(x => x.setBaseColorFactor(m.tint).setRoughnessFactor(.7).setMetallicFactor(0));
  await doc.transform(dedup(), flatten(), join(), weld());
    // simplify until it fits the triangle budget (looser error each round)
  for (const error of [0.002, 0.01, 0.03, 0.08]) {
    const ratio = Math.min(1, 80000 / Math.max(1, tris())); if (ratio >= 1) break;
    await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio, error, lockBorder: false }));
  }
  for (const p of doc.getRoot().listMeshes().flatMap(x => x.listPrimitives())) smoothNormals(doc, p);
  // PNGs whose alpha channel is fully opaque become JPEG too
  for (const t of doc.getRoot().listTextures()) {
    if (t.getMimeType() !== 'image/png') continue;
    const img = sharp(Buffer.from(t.getImage())); const st = await img.stats();
    if (st.isOpaque) { t.setImage(new Uint8Array(await sharp(Buffer.from(t.getImage())).resize(1024, 1024, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer())).setMimeType('image/jpeg').setURI(''); }
  }
  await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'jpeg', resize: [1024, 1024], quality: 82, slots: /^(?!.*(normal|occlusion|metallicRoughness)).*$/ }),
    textureCompress({ encoder: sharp, resize: [1024, 1024] }), prune());   // anything left (PNG with transparency, normal maps) is only resized
  // stand it on the floor, centred, at a readable size
  const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
  const b = getBounds(scene), size = Math.max(...[0, 1, 2].map(i => b.max[i] - b.min[i])), k = (SIZE[key] ?? .6) / size;
  const root = doc.createNode('udambu').setScale([k, k, k]).setTranslation([-(b.min[0] + b.max[0]) / 2 * k, -b.min[1] * k, -(b.min[2] + b.max[2]) / 2 * k]);
  for (const n of scene.listChildren()) { scene.removeChild(n); root.addChild(n); }
  scene.addChild(root);
  // unlit scans look flat in AR: give them ordinary PBR shading
  doc.getRoot().listExtensionsUsed().filter(e => e.extensionName === 'KHR_materials_unlit').forEach(e => e.dispose());
  await io.write(`ar/${key}.glb`, doc);
  console.log(key.padEnd(16), String(Math.round(before)).padStart(8), '→', String(Math.round(tris())).padStart(6), 'tris', (fs.statSync(`ar/${key}.glb`).size / 1e6).toFixed(1), 'MB');
}

// smooth vertex normals on the welded mesh (glTF-Transform's normals() would unweld it again)
function smoothNormals(doc, prim) {
  const pos = prim.getAttribute('POSITION'), idx = prim.getIndices(); if (!pos || !idx) return;
  const P = pos.getArray(), I = idx.getArray(), N = new Float32Array(P.length);
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const v of [a, b, c]) { N[v] += nx; N[v + 1] += ny; N[v + 2] += nz; }
  }
  for (let i = 0; i < N.length; i += 3) { const l = Math.hypot(N[i], N[i + 1], N[i + 2]) || 1; N[i] /= l; N[i + 1] /= l; N[i + 2] /= l; }
  prim.setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(N).setBuffer(pos.getBuffer()));
}
