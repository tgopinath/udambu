// Udambu 3D: every body part modelled in three.js (r149, global THREE).
// - Anatomy.body(el, opts): the turnable, tappable 3D body on the home screen (layers: outside, organs, bones, muscles, nerves, blood)
// - Anatomy.image(key): a rendered 3D picture of one part (data URL, cached) for cards, quiz and lists
// - Anatomy.spin(el, key): a small live, slowly turning model of one part
// Units: the body stands about 18 tall, feet at y = 0, facing +z.
(() => {
  const T = THREE, V = (x, y, z) => new T.Vector3(x, y, z);
  T.ColorManagement.legacyMode = false;   // colours are real sRGB, so organs keep their true colour

  // ---------- materials ----------
  const mat = (color, o = {}) => new T.MeshPhysicalMaterial({ color, roughness: 0.42, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.35, ...o });
  const M = {
    brain: () => mat(0xe9a0b0, { roughness: .55 }), pink: () => mat(0xf0a3a0), lung: () => mat(0xeb9a98, { roughness: .6 }),
    heart: () => mat(0xb3262a, { clearcoat: .8 }), liver: () => mat(0x7d2b24, { clearcoat: .7 }), stomach: () => mat(0xe3907e),
    gut: () => mat(0xeea08c), colon: () => mat(0xc97a62), kidney: () => mat(0x8e3027, { clearcoat: .7 }), bladder: () => mat(0xe8c27a),
    green: () => mat(0x5d9a3c, { clearcoat: .9 }), spleen: () => mat(0x6a2f55), pancreas: () => mat(0xe9be78, { roughness: .65 }),
    gland: () => mat(0xb54a74), yellow: () => mat(0xe8b23a, { clearcoat: .6 }), bone: () => mat(0xeee3c8, { roughness: .6, clearcoat: .2 }),
    muscle: () => mat(0xb23c36, { roughness: .5 }), nerve: () => mat(0xf2bf3a, { emissive: 0x3a2500 }), artery: () => mat(0xc4232a),
    vein: () => mat(0x3460c8), lymph: () => mat(0x46a66b), white: () => mat(0xf2f2f4, { roughness: .3 }), tooth: () => mat(0xfaf7ef, { roughness: .25, clearcoat: 1 }),
    cartilage: () => mat(0x9fd0ec, { transmission: .3, roughness: .2 }), skin: () => mat(0xe2b192, { roughness: .6, clearcoat: .2 }),
    hair: () => mat(0x3a2518, { roughness: .7 }), eye: () => mat(0xffffff, { roughness: .1, clearcoat: 1 }), iris: () => mat(0x4a7fb0, { clearcoat: 1 }),
    lips: () => mat(0xc4606a), tongue: () => mat(0xdc7280), cell: () => mat(0xf3b9cf, { transmission: .35, roughness: .3, thickness: 1 }),
    nucleus: () => mat(0x8a3d8f), rbc: () => mat(0xc82a2e, { clearcoat: .8 }), fat: () => mat(0xf3d98a), dna1: () => mat(0x4b78d8), dna2: () => mat(0x1aa39a),
  };

  // ---------- geometry helpers ----------
  const mesh = (g, m) => { const x = new T.Mesh(g, m); return x; };
  const sph = (r, m, s = [1, 1, 1], seg = 40) => { const x = mesh(new T.SphereGeometry(r, seg, Math.round(seg * .75)), m); x.scale.set(...s); return x; };
  const at = (o, x, y, z, rx = 0, ry = 0, rz = 0) => { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); return o; };
  const group = (...kids) => { const g = new T.Group(); kids.flat().forEach(k => k && g.add(k)); return g; };
  const tube = (pts, r, m, seg = 64, closed = false) => mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p => V(...p)), closed, 'catmullrom', .5), seg, r, 12, closed), m);
  const cap = (r, len, m) => mesh(new T.CapsuleGeometry(r, len, 8, 16), m);
  // a capsule from point a to point b
  const limb = (a, b, r, m) => { const A = V(...a), B = V(...b), d = B.clone().sub(A), c = cap(r, Math.max(d.length() - 2 * r, .01), m);
    c.position.copy(A).add(B).multiplyScalar(.5); c.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return c; };
  // bumpy organic surface: push vertices along their normal by a smooth noise
  function lumpy(geo, amp, f, seed = 1) {
    const p = geo.attributes.position, n = geo.attributes.normal, v = new T.Vector3(), nn = new T.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i); nn.fromBufferAttribute(n, i);
      const k = Math.sin(v.x * f + seed) * Math.sin(v.y * f * 1.3 + seed * 2) * Math.sin(v.z * f * .9 + seed * 3)
        + .5 * Math.sin(v.x * f * 2.1 + v.z * f * 1.7 + seed);
      v.addScaledVector(nn, amp * k); p.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals(); return geo;
  }
  // bend a geometry: x' moves with y (kidney bean, stomach curve)
  function bend(geo, fn) { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const r = fn(p.getX(i), p.getY(i), p.getZ(i)); p.setXYZ(i, ...r); } geo.computeVertexNormals(); return geo; }

  // ---------- body parts ----------
  const B = {};
  B.brain = () => { const g = lumpy(new T.SphereGeometry(.85, 96, 72), .045, 15, 2); const b = mesh(g, M.brain()); b.scale.set(1, .78, 1.12);
    const cer = mesh(lumpy(new T.SphereGeometry(.38, 48, 36), .02, 26), M.brain()); at(cer, 0, -.42, -.5); cer.scale.set(1.3, .7, .9);
    const stem = limb([0, -.35, -.2], [0, -.95, -.3], .14, M.brain());
    return at(group(b, cer, stem), 0, 16.75, 0); };
  B.eyes = () => { const e = (x) => { const ball = sph(.17, M.eye()), ir = sph(.085, M.iris(), [1, 1, .4]), pu = sph(.04, mat(0x111111), [1, 1, .4]);
      at(ir, 0, 0, .15); at(pu, 0, 0, .19); return at(group(ball, ir, pu), x, 16.35, .86); }; return group(e(-.38), e(.38)); };
  B.ears = () => { const e = (x) => { const t = mesh(new T.TorusGeometry(.2, .07, 12, 32, Math.PI * 1.6), M.skin()); t.scale.set(.8, 1.3, 1);
      return at(t, x, 16.35, 0, 0, Math.sign(x) * Math.PI / 2, Math.PI * .7); }; return group(e(-1.05), e(1.05)); };
  B.nose = () => { const c = mesh(new T.ConeGeometry(.17, .5, 24), M.skin()); return at(c, 0, 16.12, .95, -.35); };
  B.mouth = () => { const lip = mesh(new T.TorusGeometry(.3, .07, 16, 48), M.lips()); lip.scale.set(1, .45, 1);
    const teeth = mesh(new T.CylinderGeometry(.27, .27, .09, 32, 1, true, -Math.PI / 2.4, Math.PI / 1.2), M.tooth());
    const tongue = sph(.2, M.tongue(), [1, .35, 1.2]); at(tongue, 0, -.05, -.12);
    return at(group(lip, at(teeth, 0, .04, -.1), tongue), 0, 15.75, .82); };
  B.teeth = () => { const row = []; for (let i = 0; i < 10; i++) { const a = -Math.PI * .45 + i * Math.PI * .1; const t = mesh(new T.BoxGeometry(.07, .1, .06, 2, 2, 2), M.tooth());
      at(t, Math.sin(a) * .26, 0, Math.cos(a) * .26 - .05, 0, a); row.push(t); } return at(group(row), 0, 15.79, .8); };
  B.tongue = () => at(sph(.18, M.tongue(), [1, .3, 1.3]), 0, 15.7, .72);
  B.tonsils = () => group(at(sph(.07, M.pink()), -.17, 15.68, .45), at(sph(.07, M.pink()), .17, 15.68, .45));
  B['voice-box'] = () => { const c = mesh(new T.CylinderGeometry(.19, .17, .32, 24), M.cartilage()); return at(c, 0, 15.25, .3); };
  B.thyroid = () => group(at(sph(.13, M.gland(), [.8, 1.4, .7]), -.2, 14.98, .38), at(sph(.13, M.gland(), [.8, 1.4, .7]), .2, 14.98, .38), limb([-.15, 14.92, .44], [.15, 14.92, .44], .05, M.gland()));
  B.windpipe = () => { const rings = []; for (let y = 13.9; y < 15.1; y += .12) rings.push(at(mesh(new T.TorusGeometry(.13, .035, 8, 24), M.cartilage()), 0, y, .3, Math.PI / 2));
    return group(rings, tube([[0, 13.9, .3], [-.25, 13.7, .25], [-.55, 13.45, .15]], .07, M.cartilage(), 20), tube([[0, 13.9, .3], [.25, 13.7, .25], [.55, 13.45, .15]], .07, M.cartilage(), 20)); };
  B['food-pipe'] = () => tube([[0, 15.4, .05], [.02, 14.4, -.05], [.06, 13.2, -.1], [.2, 12.3, -.05], [.4, 11.85, .1]], .09, M.stomach(), 40);
  B.lungs = () => { const l = (s) => { const g = lumpy(new T.SphereGeometry(.7, 48, 36), .025, 9, s); bend(g, (x, y, z) => [x + (y < 0 ? 0 : -s * .0 ), y, z]);
      const m = mesh(g, M.lung()); m.scale.set(.95, 1.75, .95); return at(m, s * .9, 13.25, -.1); }; return group(l(-1), l(1)); };
  B.heart = () => { const g = lumpy(new T.SphereGeometry(.5, 48, 36), .03, 7, 5);
    bend(g, (x, y, z) => { const t = (y + .5); return [x * (0.55 + .5 * t), y * 1.15 - (Math.abs(x) * .15), z * (0.6 + .45 * t)]; });
    const h = mesh(g, M.heart()); h.rotation.z = -.45;
    const aorta = tube([[.05, .3, 0], [.1, .75, 0], [-.25, .85, -.05], [-.35, .55, -.1]], .1, M.artery(), 30);
    const pulm = tube([[-.1, .3, .15], [-.15, .6, .2], [.2, .7, .1]], .08, M.vein(), 30);
    return at(group(h, aorta, pulm), .2, 12.85, .72); };
  B.diaphragm = () => { const d = mesh(new T.SphereGeometry(1.55, 48, 24, 0, Math.PI * 2, 0, Math.PI * .32), M.muscle()); d.material.side = T.DoubleSide; d.scale.set(1, .45, .7); return at(d, 0, 11.45, 0); };
  B.liver = () => { const g = lumpy(new T.SphereGeometry(.8, 48, 36), .02, 6, 3); bend(g, (x, y, z) => [x * 1.2, y * (x < 0 ? .55 : .36) + x * .1, z * .7]);
    return at(mesh(g, M.liver()), -.45, 11.55, .3, 0, 0, .1); };
  B.gallbladder = () => at(sph(.13, M.green(), [.8, 1.4, .8]), -.4, 11.18, .62, 0, 0, .5);
  B.stomach = () => { const curve = [[.15, 12, .1], [.45, 11.9, .3], [.85, 11.6, .35], [.95, 11.2, .35], [.65, 10.95, .4], [.25, 11.05, .35], [.0, 11.15, .3]];
    const t = mesh(new T.TubeGeometry(new T.CatmullRomCurve3(curve.map(p => V(...p))), 48, .28, 24), M.stomach());
    const p = t.geometry.attributes.position; // fatten the middle of the bag
    t.geometry.computeBoundingBox(); return t; };
  B.spleen = () => at(sph(.22, M.spleen(), [.6, 1.3, .9]), 1.28, 11.55, -.15, 0, 0, -.3);
  B.pancreas = () => tube([[-.25, 10.85, .05], [.15, 10.95, .0], [.55, 11.05, -.05], [.95, 11.2, -.1]], .1, M.pancreas(), 30);
  B.kidneys = () => { const k = (s) => { const g = new T.SphereGeometry(.3, 40, 30); bend(g, (x, y, z) => [x * .75 + s * .12 * Math.cos(y * 3), y * 1.4, z * .55]);
      return at(mesh(g, M.kidney()), s * .72, 10.75, -.45); }; return group(k(-1), k(1)); };
  B.adrenal = () => group(at(mesh(new T.ConeGeometry(.13, .2, 3), M.yellow()), -.72, 11.25, -.45), at(mesh(new T.ConeGeometry(.13, .2, 3), M.yellow()), .72, 11.25, -.45));
  B['small-intestine'] = () => { const pts = []; for (let i = 0; i <= 120; i++) { const t = i / 120, a = t * Math.PI * 14; pts.push([Math.sin(a) * (.6 - .1 * Math.cos(a * .3)), 10.5 - t * 1.1 + .12 * Math.sin(a * 2.1), .2 + .2 * Math.cos(a)]); }
    return tube(pts, .085, M.gut(), 600); };
  B['large-intestine'] = () => tube([[-.85, 9.3, .2], [-.95, 9.9, .25], [-.95, 10.55, .3], [-.5, 10.75, .4], [.2, 10.7, .45], [.9, 10.65, .3], [1.0, 10.1, .25], [.9, 9.4, .2], [.4, 9.05, .2], [.05, 8.95, .1]], .17, M.colon(), 120);
  B.appendix = () => tube([[-.85, 9.3, .2], [-.8, 9.05, .25], [-.68, 8.95, .3]], .05, M.colon(), 16);
  B.bladder = () => at(sph(.32, M.bladder(), [1, .85, .9]), 0, 8.9, .3);
  B.pituitary = () => at(sph(.09, M.gland()), 0, 16.35, .05);

  // ----- skeleton -----
  B.skull = () => { const k = SOLO.skull(); k.scale.setScalar(.98); return at(k, 0, 16.6, 0); };
  B.spine = () => { const v = []; for (let i = 0; i < 24; i++) { const y = 15.2 - i * .27; const z = -.55 + .15 * Math.sin(i / 24 * Math.PI * 2 - .4);
      v.push(at(mesh(new T.CylinderGeometry(.16 + i * .004, .16 + i * .004, .17, 16), M.bone()), 0, y, z), at(mesh(new T.CylinderGeometry(.14, .14, .07, 16), M.cartilage()), 0, y - .13, z)); }
    return group(v); };
  B.ribs = () => { const r = []; for (let i = 0; i < 10; i++) { const y = 14.3 - i * .28, w = 1.15 + Math.sin(i / 10 * Math.PI) * .45;
      [-1, 1].forEach(s => { const t = mesh(new T.TorusGeometry(w, .055, 8, 40, Math.PI * .92), M.bone()); t.scale.set(1, .62, 1);
        r.push(at(t, 0, y, -.15, Math.PI / 2 + .35, 0, s < 0 ? Math.PI * .04 : Math.PI * .96 + Math.PI * .08)); }); }
    r.push(at(mesh(new T.BoxGeometry(.2, 1.6, .1), M.bone()), 0, 13.4, .58));
    r.push(limb([-.15, 14.65, .45], [-1.7, 14.75, -.05], .06, M.bone()), limb([.15, 14.65, .45], [1.7, 14.75, -.05], .06, M.bone()));
    return group(r); };
  B.skeleton = () => { const p = mesh(new T.TorusGeometry(.78, .2, 16, 40), M.bone()); p.scale.set(1.25, 1, .9);
    return group(at(p, 0, 9.35, -.05, Math.PI / 2 - .35), at(sph(.55, M.bone(), [.9, 1, .35]), -.85, 9.6, -.2, 0, .5), at(sph(.55, M.bone(), [.9, 1, .35]), .85, 9.6, -.2, 0, -.5)); };
  const ARM = (s) => ({ sh: [s * 2.0, 14.55, -.05], el: [s * 2.35, 12.1, -.1], wr: [s * 2.65, 9.75, .1] });
  B['arm-bones'] = () => group([-1, 1].map(s => { const a = ARM(s); return group(limb(a.sh, a.el, .11, M.bone()), limb([a.el[0] - s * .06, a.el[1], a.el[2]], [a.wr[0] - s * .08, a.wr[1], a.wr[2]], .07, M.bone()), limb([a.el[0] + s * .07, a.el[1], a.el[2]], [a.wr[0] + s * .06, a.wr[1], a.wr[2]], .07, M.bone()), at(sph(.2, M.bone()), ...a.sh)); }));
  B.hand = () => group([-1, 1].map(s => { const w = ARM(s).wr, f = []; const palm = mesh(new T.BoxGeometry(.5, .55, .14, 3, 3, 1), M.bone()); at(palm, w[0] + s * .05, w[1] - .38, w[2]);
    for (let i = 0; i < 4; i++) { const x = w[0] + s * .05 + (i - 1.5) * .12; f.push(limb([x, w[1] - .65, w[2]], [x + s * .02, w[1] - 1.15 + Math.abs(i - 1.5) * .08, w[2] + .04], .04, M.bone())); }
    f.push(limb([w[0] - s * .2, w[1] - .35, w[2] + .05], [w[0] - s * .42, w[1] - .7, w[2] + .12], .045, M.bone())); return group(palm, f); }));
  const LEG = (s) => ({ hip: [s * .8, 9.2, 0], knee: [s * .78, 5.0, .05], ank: [s * .75, .9, -.05] });
  B['leg-bones'] = () => group([-1, 1].map(s => { const l = LEG(s); return group(limb(l.hip, l.knee, .15, M.bone()), limb([l.knee[0] - s * .05, l.knee[1] - .2, l.knee[2]], l.ank, .12, M.bone()), limb([l.knee[0] + s * .17, l.knee[1] - .3, l.knee[2] - .05], [l.ank[0] + s * .18, l.ank[1] + .1, l.ank[2]], .06, M.bone()), at(sph(.15, M.bone(), [1, 1, .6]), l.knee[0], l.knee[1], l.knee[2] + .2)); }));
  B.foot = () => group([-1, 1].map(s => { const a = LEG(s).ank, f = [at(sph(.22, M.bone(), [.9, .7, 1.2]), a[0], a[1] - .3, a[2] - .1)];
    for (let i = 0; i < 5; i++) f.push(limb([a[0] + s * (i - 2) * .09, a[1] - .4, a[2] + .1], [a[0] + s * (i - 2) * .11, a[1] - .62, a[2] + .85 - Math.abs(i - 1) * .06], .045, M.bone())); return group(f); }));
  B.joints = () => group([-1, 1].flatMap(s => [ARM(s).el, LEG(s).knee, ARM(s).sh, LEG(s).hip].map(p => at(sph(.2, M.cartilage()), ...p))));
  B['bone-marrow'] = () => group([-1, 1].map(s => { const l = LEG(s); return limb([l.hip[0], l.hip[1] - .6, l.hip[2] + .02], [l.knee[0], l.knee[1] + .6, l.knee[2] + .02], .07, mat(0xc8303a)); }));

  // ----- muscles, nerves, blood -----
  B.muscles = () => { const m = [];
    [-1, 1].forEach(s => { const a = ARM(s), l = LEG(s);
      m.push(at(sph(.75, M.muscle(), [1, .55, .3]), s * .75, 13.95, .55, 0, 0, s * -.2));          // chest
      m.push(at(sph(.42, M.muscle(), [.8, 1.1, .8]), s * 1.95, 14.35, 0));                          // shoulder
      m.push(limb([a.sh[0], a.sh[1] - .3, a.sh[2] + .15], [a.el[0], a.el[1] + .2, a.el[2] + .15], .25, M.muscle())); // biceps
      m.push(limb([a.el[0], a.el[1] - .2, a.el[2]], [a.wr[0], a.wr[1] + .3, a.wr[2]], .19, M.muscle()));
      m.push(limb([l.hip[0], l.hip[1] - .4, l.hip[2] + .2], [l.knee[0], l.knee[1] + .4, l.knee[2] + .2], .4, M.muscle()));        // thigh
      m.push(limb([l.knee[0], l.knee[1] - .5, l.knee[2] - .15], [l.ank[0], l.ank[1] + 1.4, l.ank[2] - .15], .3, M.muscle()));     // calf
    });
    for (let r = 0; r < 3; r++) for (const s of [-1, 1]) m.push(at(mesh(new T.BoxGeometry(.48, .55, .2, 3, 3, 2), M.muscle()), s * .27, 12.6 - r * .62, .7));
    m.forEach(x => x.geometry && lumpy(x.geometry, .01, 20)); return group(m); };
  B['spinal-cord'] = () => tube([[0, 16.1, -.2], [0, 15, -.45], [0, 13, -.6], [0, 11, -.5], [0, 9.6, -.45]], .085, M.nerve(), 60);
  B.nerves = () => { const n = []; [-1, 1].forEach(s => { const a = ARM(s), l = LEG(s);
      n.push(tube([[0, 14.6, -.5], [s * 1.2, 14.6, -.1], a.sh, a.el, a.wr, [a.wr[0], a.wr[1] - .9, a.wr[2] + .05]], .035, M.nerve(), 80));
      n.push(tube([[0, 9.8, -.45], [s * .5, 9.3, -.1], l.hip, l.knee, l.ank, [l.ank[0], .25, .7]], .045, M.nerve(), 80));
      for (let i = 0; i < 6; i++) n.push(tube([[0, 14 - i * .7, -.55], [s * .6, 13.9 - i * .7, -.2], [s * 1.3, 13.7 - i * .7, .3]], .02, M.nerve(), 16)); });
    return group(n); };
  B['blood-vessels'] = () => { const v = []; [[M.artery, .07, 0], [M.vein, .065, .12]].forEach(([mm, r, dx]) => { [-1, 1].forEach(s => { const a = ARM(s), l = LEG(s), o = s * dx;
      v.push(tube([[.2 + o, 13, .3], [s * 1, 14.3, .1], [a.sh[0] + o, a.sh[1] - .2, a.sh[2] + .1], [a.el[0] + o, a.el[1], a.el[2] + .15], [a.wr[0] + o, a.wr[1], a.wr[2] + .1]], r * .8, mm(), 80));
      v.push(tube([[.05 + o, 12.5, -.2], [o + s * .1, 10.5, -.25], [s * .4 + o, 9.4, 0], [l.hip[0] + o, l.hip[1] - .5, .2], [l.knee[0] + o, l.knee[1], -.1], [l.ank[0] + o, l.ank[1] + .2, .05]], r, mm(), 80));
      v.push(tube([[.1 + o, 13.4, .3], [o + s * .2, 14.8, .25], [o + s * .25, 15.6, .3], [o + s * .5, 16.4, .4]], r * .7, mm(), 40)); }); });
    return group(v); };
  const rbc = (r = .5) => { const g = new T.LatheGeometry([V(0, -.08, 0), V(.55, -.14, 0), V(.95, -.1, 0), V(1, 0, 0), V(.95, .1, 0), V(.55, .14, 0), V(0, .08, 0)].map(p => new T.Vector2(p.x, p.y)), 40); const m = mesh(g, M.rbc()); m.scale.setScalar(r); return m; };
  B.blood = () => group([[-.6, 12.2, .9], [1.9, 12.6, .5], [-1.95, 11.4, .5], [.75, 6.5, .6], [-.8, 3.4, .5]].map((p, i) => at(rbc(.22), ...p, i, i * 2, 0)));
  const wbc = (r) => { const g = lumpy(new T.IcosahedronGeometry(r, 4), r * .08, 14 / r); return mesh(g, M.white()); };
  B['white-cells'] = () => group([[1.4, 12.8, .7], [-1.3, 9.9, .6], [.9, 3.8, .5]].map(p => at(wbc(.2), ...p)));
  B.lymph = () => group([[-.4, 15.2, .25], [.4, 15.2, .25], [-1.6, 13.9, .2], [1.6, 13.9, .2], [-.65, 9.1, .4], [.65, 9.1, .4]].map(p => at(sph(.11, M.lymph(), [1.3, 1, 1]), ...p)));
  // outside
  B.skin = () => body(M.skin(), 1);
  B['hair-nails'] = () => { const h = mesh(new T.SphereGeometry(1.04, 48, 24, 0, Math.PI * 2, 0, Math.PI * .45), M.hair()); h.scale.set(1, 1.08, 1.12); return at(h, 0, 16.6, -.05, -.25); };

  // the outer body (skin) — head, neck, torso, arms, legs
  function body(material, solid) {
    const prof = [[0, 9.0], [1.25, 9.1], [1.5, 9.6], [1.45, 10.4], [1.3, 11.2], [1.4, 12.2], [1.6, 13.2], [1.75, 14.1], [1.6, 14.6], [.9, 15.0], [.42, 15.15], [0, 15.2]];
    const torso = mesh(new T.LatheGeometry(prof.map(([x, y]) => new T.Vector2(x, y)), 64), material); torso.scale.z = .62;
    const head = mesh(new T.SphereGeometry(1.02, 48, 36), material); head.scale.set(.92, 1.15, 1.02); at(head, 0, 16.45, 0);
    const neck = mesh(new T.CylinderGeometry(.42, .48, 1, 24), material); at(neck, 0, 15.25, -.05);
    const parts = [torso, head, neck];
    [-1, 1].forEach(s => { const a = ARM(s), l = LEG(s);
      parts.push(limb([a.sh[0] - s * .1, a.sh[1], a.sh[2]], a.el, .36, material), limb(a.el, a.wr, .28, material), at(sph(.32, material, [1, 1.3, .5]), a.wr[0] + s * .05, a.wr[1] - .55, a.wr[2] + .02));
      parts.push(limb([l.hip[0], l.hip[1] + .2, l.hip[2]], l.knee, .62, material), limb(l.knee, l.ank, .45, material), at(sph(.35, material, [.9, .45, 1.6]), l.ank[0], .28, l.ank[2] + .35)); });
    return group(parts);
  }

  // parts that don't live inside the body, built for their own picture
  const SOLO = {
    cells: () => { const c = sph(1, M.cell(), [1, .8, 1]); const n = sph(.38, M.nucleus()); const bits = [];
      for (let i = 0; i < 9; i++) { const a = i * 2.4; bits.push(at(sph(.13, mat([0xe2914a, 0x5ab06a, 0x5f7fd8][i % 3]), [1.6, .7, .7]), Math.cos(a) * .62, Math.sin(a * 1.7) * .3, Math.sin(a) * .62, 0, a)); }
      return group(c, n, bits); },
    dna: () => { const g = []; for (let i = 0; i < 26; i++) { const a = i * .5, y = i * .2 - 2.6;
        const p1 = V(Math.cos(a) * .7, y, Math.sin(a) * .7), p2 = V(-Math.cos(a) * .7, y, -Math.sin(a) * .7);
        g.push(at(sph(.13, M.dna1()), p1.x, y, p1.z), at(sph(.13, M.dna2()), p2.x, y, p2.z), limb(p1.toArray(), p2.toArray(), .045, mat([0xe56b8f, 0xe7c43c, 0x3aa66b, 0x7c5cd6][i % 4]))); }
      return group(g); },
    womb: () => { const w = mesh(new T.SphereGeometry(1, 48, 36), mat(0xe9a6b0, { roughness: .25, transparent: true, opacity: .35, depthWrite: false })); w.scale.set(1, 1.15, .9);
      const baby = group(at(sph(.34, M.skin()), .1, .3, 0), at(sph(.42, M.skin(), [1, .85, .9]), -.05, -.22, .05), limb([-.1, -.3, .3], [.25, -.45, .35], .1, M.skin()));
      const cord = tube([[-.1, -.25, .1], [-.45, -.3, -.2], [-.6, .2, -.4]], .05, mat(0xd98fa0), 20); return group(w, baby, cord); },
    skin: () => { const layers = [[0xe2b192, .18], [0xd98c86, .5], [0xf3d98a, .45]]; let y = .55; const g = [];
      layers.forEach(([c, h]) => { g.push(at(mesh(new T.BoxGeometry(2.2, h, 1.4), mat(c, { roughness: .6 })), 0, y - h / 2, 0)); y -= h; });
      for (let i = 0; i < 5; i++) g.push(limb([-.8 + i * .4, -.2, .2 - (i % 2) * .4], [-.75 + i * .4, 1.3, .25 - (i % 2) * .4], .025, M.hair()));
      g.push(tube([[-1, -.4, .7], [-.3, -.25, .5], [.4, -.45, .6], [1, -.3, .7]], .06, M.artery(), 30), tube([[-1, -.5, -.6], [0, -.35, -.5], [1, -.5, -.6]], .06, M.vein(), 30));
      return group(g); },
    'hair-nails': () => { const finger = limb([-1.4, 0, 0], [1, 0, 0], .45, M.skin()); const nail = mesh(new T.SphereGeometry(.42, 32, 16, 0, Math.PI * 2, 0, Math.PI * .32), mat(0xf6d2c4, { roughness: .15, clearcoat: 1 }));
      nail.scale.set(1.3, .5, .95); at(nail, .55, .3, 0); const hairs = []; for (let i = 0; i < 9; i++) hairs.push(tube([[-1.2 + i * .25, .35, -.2], [-1.15 + i * .25, .9, -.1], [-1 + i * .25, 1.5, -.3]], .025, M.hair(), 12));
      return group(finger, nail, hairs); },
    'bone-marrow': () => { const outer = mesh(new T.CylinderGeometry(.8, .8, 2.4, 40, 1, true), M.bone()); outer.material.side = T.DoubleSide;
      const spongy = mesh(lumpy(new T.CylinderGeometry(.62, .62, 2.3, 40, 12), .04, 14), mat(0xe8cfa8)); const red = mesh(new T.CylinderGeometry(.4, .4, 2.45, 32), mat(0xc8303a));
      const cut = mesh(new T.RingGeometry(.62, .8, 40), M.bone()); at(cut, 0, 1.2, 0, -Math.PI / 2); return group(outer, spongy, red, cut, at(rbc(.15), .9, 1.6, .3, 1), at(wbc(.12), -.9, 1.4, .4)); },
    blood: () => group([[0, 0, 0, .9, 0], [1.1, .5, -.3, .5, 1], [-1, .3, .2, .5, 2], [.3, -.9, .3, 1.2, 1], [-.6, -.7, -.4, .3, 0]].map(([x, y, z, rx, ry]) => at(rbc(.6), x, y, z, rx, ry, 0)), at(wbc(.45), .9, -.6, .5), ...[0, 1, 2].map(i => at(sph(.09, mat(0xe7c43c), [1.5, .5, 1]), -1.2 + i * .25, -1.1, .6))),
    'white-cells': () => { const w = wbc(1); w.material = mat(0xeeeef6, { transmission: .3, roughness: .35, thickness: .8 }); return group(w, at(sph(.35, M.nucleus()), -.2, .1, .2), at(sph(.3, M.nucleus()), .25, -.15, .1), at(sph(.25, M.nucleus()), .05, .3, -.2)); },
    nerves: () => { const soma = mesh(lumpy(new T.SphereGeometry(.45, 32, 24), .05, 8), M.nerve()); const d = [];
      for (let i = 0; i < 7; i++) { const a = i * .9; d.push(tube([[0, 0, 0], [Math.cos(a) * .8, Math.sin(a) * .8, .2], [Math.cos(a + .3) * 1.3, Math.sin(a + .3) * 1.3, .1]], .06, M.nerve(), 16)); }
      d.push(tube([[0, 0, 0], [1, -.8, 0], [2.2, -1, .2], [3.3, -1.6, 0]], .08, M.nerve(), 40));
      for (let i = 0; i < 4; i++) d.push(limb([1.05 + i * .55, -.85 - i * .17, .05], [1.4 + i * .55, -.95 - i * .17, .1], .14, mat(0xf5efe3)));
      return group(soma, d); },
    teeth: () => { const crown = mesh(lumpy(new T.SphereGeometry(.6, 40, 30), .04, 9), M.tooth()); crown.scale.set(1, .7, .9);
      const roots = [-.25, .25].map(x => limb([x, -.1, 0], [x * 1.4, -1.5, 0], .19, M.tooth()));
      const gum = mesh(new T.TorusGeometry(.55, .28, 16, 32), mat(0xe58f9a)); gum.scale.set(1.1, .9, 1);
      return group(at(crown, 0, .25, 0), roots, at(gum, 0, -.4, 0, Math.PI / 2)); },
    joints: () => group(limb([0, 2.2, 0], [0, .35, 0], .32, M.bone()), at(sph(.42, M.bone(), [1.15, .7, 1]), 0, .25, 0), at(mesh(new T.CylinderGeometry(.48, .48, .12, 32), M.cartilage()), 0, -.08, 0),
      limb([0, -.3, 0], [0, -2.2, 0], .3, M.bone()), at(sph(.2, M.bone(), [1, 1, .5]), 0, .1, .45)),
    muscles: () => group(limb([0, 2, 0], [0, -.2, 0], .14, M.bone()), limb([0, -.2, 0], [1.4, -1.4, 0], .1, M.bone()), at(sph(.42, M.muscle(), [.75, 2.1, .8]), .2, 1, .25)),
    heart: () => { const h = B.heart(); h.position.set(0, 0, 0); return h; },
    pancreas: () => { const g = lumpy(new T.CapsuleGeometry(.35, 2.4, 12, 24), .05, 9); bend(g, (x, y, z) => [x * (1 - y * .18) + .25 * Math.sin(y * 1.2), y, z * .7]);
      const p = mesh(g, M.pancreas()); p.rotation.z = Math.PI / 2 + .2; const duo = mesh(new T.TorusGeometry(.6, .22, 16, 32, Math.PI * 1.3), M.gut()); return group(p, at(duo, 1.55, .2, 0, 0, 0, -.6)); },
    eyes: () => { const ball = sph(1, M.eye()), ir = sph(.5, M.iris(), [1, 1, .35]), pu = sph(.22, mat(0x0d0d0d, { clearcoat: 1 }), [1, 1, .35]);
      const veins = [0, 1, 2, 3, 4].map(i => tube([[Math.cos(i * 1.3) * .95, Math.sin(i * 1.3) * .95, -.1], [Math.cos(i * 1.3 + .2) * .8, Math.sin(i * 1.3 + .2) * .8, .5]], .012, M.artery(), 8));
      return group(ball, at(ir, 0, 0, .88), at(pu, 0, 0, 1.0), veins, tube([[0, 0, -.9], [0, -.1, -1.6], [-.3, -.2, -2.4]], .18, M.nerve(), 20)); },
    ears: () => { const outer = mesh(lumpy(new T.TorusGeometry(.7, .2, 16, 48, Math.PI * 1.7), .03, 6), M.skin()); outer.scale.set(.75, 1.25, 1);
      const canal = tube([[0, -.1, 0], [.4, -.15, -.5], [.9, -.1, -.9]], .14, M.skin(), 20);
      const coil = []; for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 5, r = .35 - i * .004; coil.push([1.5 + Math.cos(a) * r, Math.sin(a) * r, -1.1 + i * .006]); }
      return group(at(outer, 0, 0, 0, 0, 0, Math.PI * .65), canal, tube(coil, .07, mat(0xe7a94b), 120), at(mesh(new T.CircleGeometry(.16, 24), mat(0xf3c9b8, { side: T.DoubleSide })), .95, -.1, -.95, 0, .8)); },
    nose: () => { const head = sph(1, mat(0xe2b192, { roughness: .6, transparent: true, opacity: .55 }), [.9, 1.15, 1]); const n = B.nose(); n.position.set(0, -.25, .97); n.rotation.x = -.35;
      n.traverse(x => x.isMesh && (x.material = mat(0xd98a6a, { emissive: 0x3a1000 })));
      const eye = (x) => at(sph(.12, M.eye()), x, .15, .86); return group(head, n, eye(-.35), eye(.35), at(sph(.25, M.lips(), [1, .3, .4]), 0, -.6, .85)); },
    tongue: () => { const g = lumpy(new T.SphereGeometry(1, 64, 48), .02, 30); bend(g, (x, y, z) => [x * (1 - .25 * Math.max(0, z)), y * .3 - .05 * x * x, z * 1.3]);
      return group(mesh(g, M.tongue()), limb([0, .29, -.9], [0, .29, .9], .03, mat(0xc25a69))); },
    mouth: () => { const lipT = mesh(new T.TorusGeometry(1, .22, 16, 48, Math.PI), M.lips()), lipB = mesh(new T.TorusGeometry(1, .24, 16, 48, Math.PI), M.lips());
      lipT.scale.set(1, .35, 1); lipB.scale.set(1, .4, 1); const row = (y, flip) => Array.from({ length: 8 }, (_, i) => at(mesh(new T.BoxGeometry(.2, .3, .15, 2, 2, 2), M.tooth()), -.7 + i * .2, y, .05 + (i === 0 || i === 7 ? -.15 : 0)));
      return group(at(lipT, 0, .25, 0), at(lipB, 0, -.25, 0, 0, 0, Math.PI), row(.12), row(-.18), at(sph(.55, M.tongue(), [1.1, .3, 1]), 0, -.25, -.3)); },
    skull: () => { const cran = mesh(lumpy(new T.SphereGeometry(1, 48, 36), .012, 4), M.bone()); cran.scale.set(.9, .95, 1.08);
      const face = sph(.7, M.bone(), [.95, 1, .7]); const cheek = (x) => at(sph(.25, M.bone(), [1.2, .7, 1]), x, -.45, .55);
      const socket = (x) => at(sph(.24, mat(0x2a2522), [1, .85, .4]), x, -.25, .83); const nose = at(mesh(new T.ConeGeometry(.12, .3, 3), mat(0x2a2522)), 0, -.55, .88, Math.PI);
      const jaw = mesh(new T.TorusGeometry(.48, .13, 12, 32, Math.PI), M.bone()); at(jaw, 0, -1.05, .2, Math.PI / 2 + .35, 0, Math.PI);
      const teeth = Array.from({ length: 8 }, (_, i) => at(mesh(new T.BoxGeometry(.08, .12, .06), M.tooth()), -.28 + i * .08, -.88, .72));
      return group(cran, at(face, 0, -.45, .25), cheek(-.42), cheek(.42), socket(-.3), socket(.3), nose, jaw, teeth); },
    'arm-bones': () => { const a = B['arm-bones'](); return a.children[1]; },
    'leg-bones': () => B['leg-bones']().children[1],
    hand: () => B.hand().children[1],
    foot: () => B.foot().children[1],
    kidneys: () => { const k = B.kidneys().children[0]; k.position.set(0, 0, 0); k.scale.setScalar(2.6);
      return group(k, tube([[.25, -.2, .1], [.4, -.9, .2], [.35, -2.2, .2]], .06, M.bladder(), 20), tube([[.2, .1, .2], [1.4, .25, .1]], .09, M.artery(), 10), tube([[.2, -.05, .25], [1.4, -.15, .2]], .09, M.vein(), 10)); },
    adrenal: () => { const k = B.kidneys().children[0]; k.position.set(0, 0, 0); k.scale.setScalar(2.4); const a = mesh(lumpy(new T.ConeGeometry(.45, .55, 5, 3), .03, 8), M.yellow()); return group(k, at(a, -.05, 1.15, 0)); },
    bladder: () => { const b = sph(.8, M.bladder(), [1, .85, .9]); return group(b, tube([[-.5, .4, 0], [-1, 1.3, -.2], [-1.2, 2.6, -.3]], .07, M.bladder(), 20), tube([[.5, .4, 0], [1, 1.3, -.2], [1.2, 2.6, -.3]], .07, M.bladder(), 20), at(cap(.12, .4, M.bladder()), 0, -.9, 0)); },
    thyroid: () => { const t = B.thyroid(); t.position.set(0, -14.95, 0); const w = []; for (let y = -.6; y < .7; y += .14) w.push(at(mesh(new T.TorusGeometry(.13, .035, 8, 24), M.cartilage()), 0, y, -.08, Math.PI / 2)); return group(group(t), w); },
    'voice-box': () => { const plate = (s) => at(mesh(new T.BoxGeometry(.7, .8, .06), M.cartilage()), s * .25, .2, .25, 0, s * .6); const rings = [];
      for (let y = -.3; y > -1.6; y -= .16) rings.push(at(mesh(new T.TorusGeometry(.32, .07, 10, 28), M.cartilage()), 0, y, 0, Math.PI / 2));
      return group(plate(-1), plate(1), at(mesh(new T.CylinderGeometry(.36, .34, .5, 28, 1, true), M.cartilage()), 0, .1, 0), rings, at(sph(.2, M.cartilage(), [1.2, .4, 1]), 0, .75, -.1)); },
    lungs: () => { const l = B.lungs(), w = B.windpipe(); return group(l, w); },
    'food-pipe': () => group(B['food-pipe'](), B.stomach()),
    appendix: () => { const c = B['large-intestine'](); c.material.transparent = true; c.material.opacity = .45; const a = tube([[-.85, 9.3, .2], [-.78, 8.95, .28], [-.62, 8.8, .35]], .08, mat(0xd05a40, { emissive: 0x401000 }), 16); return group(c, a); },
    tonsils: () => { const cave = mesh(new T.SphereGeometry(1, 40, 30, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x7a2d3a, { side: T.DoubleSide })); cave.scale.set(1, 1.1, .5);
      return group(at(cave, 0, 0, 0, Math.PI / 2), at(sph(.3, M.pink(), [.7, 1.2, .7]), -.62, -.05, .15), at(sph(.3, M.pink(), [.7, 1.2, .7]), .62, -.05, .15), at(cap(.1, .3, mat(0xe58f9a)), 0, .5, .2), at(sph(.55, M.tongue(), [1.2, .3, .8]), 0, -.85, .3)); },
    lymph: () => { const node = mesh(lumpy(new T.SphereGeometry(.6, 40, 30), .03, 9), M.lymph()); node.scale.set(1.4, 1, .9);
      return group(node, ...[[-2, .6], [-2, -.5], [2, .2]].map(([x, y]) => tube([[x, y, 0], [x * .5, y * .4, .1], [0, 0, 0]], .06, mat(0xbfe3c8, { transmission: .4 }), 20)), at(wbc(.15), .3, .2, .5)); },
    'blood-vessels': () => { const h = B.heart(); h.position.set(0, 0, 0); const v = [];
      const art = (pts) => v.push(tube(pts, .08, M.artery(), 30)), vein = (pts) => v.push(tube(pts, .08, M.vein(), 30));
      art([[-.1, .7, 0], [-.4, 1.6, 0], [-.9, 2.4, .1]]); art([[-.1, .7, 0], [.3, 1.7, 0], [.8, 2.5, .1]]); art([[-.2, .5, -.2], [-.3, -1, -.3], [-.7, -2.4, -.2]]); art([[-.2, .5, -.2], [.1, -1, -.3], [.6, -2.4, -.2]]);
      vein([[.3, .5, .2], [.9, 1.6, .2], [1.5, 2.3, .3]]); vein([[.3, .2, .2], [1.1, -1, .2], [1.4, -2.4, .3]]); vein([[.2, .5, .2], [-1.2, .9, .3], [-1.8, .2, .3]]); return group(h, v); },
    pituitary: () => { const b = B.brain(); b.position.set(0, 0, 0); b.traverse(n => { if (n.isMesh) { n.material.transparent = true; n.material.opacity = .28; n.material.depthWrite = false; } });
      return group(b, at(sph(.13, mat(0xd8407e, { emissive: 0x6a1030 })), 0, -.4, .05)); },
    'spinal-cord': () => { const v = []; for (let i = 0; i < 6; i++) { const ring = mesh(new T.TorusGeometry(.42, .2, 12, 32), M.bone()); ring.scale.set(1, 1, .6); v.push(at(ring, 0, i * .6 - 1.5, 0, Math.PI / 2), at(mesh(new T.CylinderGeometry(.5, .5, .32, 24), M.bone()), 0, i * .6 - 1.5, .7));
        v.push(tube([[0, i * .6 - 1.6, 0], [.6, i * .6 - 1.8, .2], [1.2, i * .6 - 2.0, .3]], .05, M.nerve(), 10), tube([[0, i * .6 - 1.6, 0], [-.6, i * .6 - 1.8, .2], [-1.2, i * .6 - 2.0, .3]], .05, M.nerve(), 10)); }
      return group(v, limb([0, -2.2, 0], [0, 2.2, 0], .16, M.nerve())); },
    skeleton: () => group(['skull', 'spine', 'ribs', 'skeleton', 'arm-bones', 'hand', 'leg-bones', 'foot'].map(k => B[k]())),
  };
  // pictures of parts that are pairs or spread out look better close-up
  const FOCUS = { eyes: 'eyes', ears: 'ears' };

  // ---------- rendering ----------
  let R = null;
  function renderer() {
    if (R) return R;
    const r = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1; r.setPixelRatio(1);
    R = r; return r;
  }
  function lights(scene) {
    scene.add(new T.HemisphereLight(0xffffff, 0x2a3040, .9));
    const key = new T.DirectionalLight(0xffffff, 2.2); key.position.set(3, 5, 6); scene.add(key);
    const rim = new T.DirectionalLight(0x8fbaff, 1.6); rim.position.set(-5, 3, -5); scene.add(rim);
    const fill = new T.DirectionalLight(0xffe2cc, .6); fill.position.set(-4, -2, 5); scene.add(fill);
  }
  function build(key) { const f = SOLO[key] || B[key]; return f ? f() : null; }
  function frame(cam, obj, pad = 1.25) {
    const box = new T.Box3().setFromObject(obj), c = box.getCenter(V(0, 0, 0)), s = box.getSize(V(0, 0, 0));
    obj.position.sub(c); const r = Math.max(s.x, s.y, s.z) * .5 * pad;
    cam.position.set(0, 0, r / Math.tan(cam.fov * Math.PI / 360)); cam.lookAt(0, 0, 0); cam.near = .01; cam.far = 100; cam.updateProjectionMatrix();
  }
  const cache = new Map();
  function image(key, w = 480, h = 360) {
    const id = key + w; if (cache.has(id)) return cache.get(id);
    const obj = build(key); if (!obj) return '';
    const scene = new T.Scene(); lights(scene); const pivot = new T.Group(); pivot.add(obj); scene.add(pivot);
    const cam = new T.PerspectiveCamera(30, w / h, .01, 100); frame(cam, obj); pivot.rotation.set(.12, -.5, 0);
    const r = renderer(); r.setSize(w, h, false); r.setClearColor(0x000000, 0); r.render(scene, cam);
    const url = r.domElement.toDataURL('image/png'); cache.set(id, url); dispose(scene); return url;
  }
  function dispose(o) { o.traverse(n => { n.geometry?.dispose(); n.material?.dispose?.(); }); }

  // fill every <img data-3d="key"> on the page, a few per frame so scrolling stays smooth
  function paint(root = document) {
    const imgs = [...root.querySelectorAll('img[data-3d]:not([src])')];
    const step = () => { const t = performance.now(); while (imgs.length && performance.now() - t < 24) { const im = imgs.shift(); im.src = image(im.dataset['3d']); } if (imgs.length) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  // ---------- live viewers ----------
  function viewer(el, scene, cam, onFrame) {
    const r = new T.WebGLRenderer({ antialias: true, alpha: true }); r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping;
    r.setPixelRatio(Math.min(devicePixelRatio, 2)); el.appendChild(r.domElement);
    const size = () => { const w = el.clientWidth, h = el.clientHeight; r.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    size(); const ro = new ResizeObserver(size); ro.observe(el);
    let raf, alive = true; const loop = (t) => { if (!alive) return; onFrame?.(t); r.render(scene, cam); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop);
    return { r, destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); dispose(scene); r.dispose(); r.domElement.remove(); } };
  }
  // drag to turn, pinch / wheel to zoom
  function turnable(el, pivot, cam, { minD, maxD, onTap }) {
    let down = null, moved = 0, pts = new Map(), pinch = 0, vel = 0;
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); down = [e.clientX, e.clientY]; moved = 0; vel = 0; });
    el.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return; const p = pts.get(e.pointerId), dx = e.clientX - p[0], dy = e.clientY - p[1]; pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) zoom(pinch / d); pinch = d; return; }
      moved += Math.abs(dx) + Math.abs(dy); vel = dx * .01; pivot.rotation.y += dx * .01; pivot.rotation.x = Math.max(-.5, Math.min(.5, pivot.rotation.x + dy * .005));
    });
    const up = e => { pts.delete(e.pointerId); pinch = 0; if (!pts.size && moved < 8 && down) onTap?.(e); down = null; };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', e => { e.preventDefault(); zoom(1 + e.deltaY * .001); }, { passive: false });
    const zoom = (k) => { cam.position.z = Math.max(minD, Math.min(maxD, cam.position.z * k)); };
    return { spin: () => { if (!pts.size && Math.abs(vel) > .0005) { pivot.rotation.y += vel; vel *= .94; } }, idle: () => !pts.size && Math.abs(vel) < .001 };
  }

  const LAYER_PARTS = {
    outside: ['skin', 'hair-nails', 'eyes', 'ears', 'nose', 'mouth'],
    organs: ['brain', 'eyes', 'tongue', 'teeth', 'tonsils', 'voice-box', 'thyroid', 'windpipe', 'food-pipe', 'lungs', 'heart', 'diaphragm', 'liver', 'gallbladder', 'stomach', 'spleen', 'pancreas', 'kidneys', 'adrenal', 'small-intestine', 'large-intestine', 'appendix', 'bladder'],
    bones: ['skull', 'spine', 'ribs', 'skeleton', 'arm-bones', 'hand', 'leg-bones', 'foot', 'joints'],
    muscles: ['muscles', 'diaphragm', 'heart', 'tongue'],
    nerves: ['brain', 'pituitary', 'spinal-cord', 'nerves', 'eyes'],
    blood: ['heart', 'blood-vessels', 'blood', 'white-cells', 'lymph', 'spleen', 'tonsils', 'bone-marrow'],
  };

  // the big body on the home screen
  function bodyView(el, { layer = 'organs', onPick } = {}) {
    const scene = new T.Scene(); lights(scene);
    const pivot = new T.Group(); scene.add(pivot);
    const cam = new T.PerspectiveCamera(32, 1, .1, 200); cam.position.set(0, 0, 36);
    const shell = body(new T.MeshPhysicalMaterial({ color: 0x9fc3ee, emissive: 0x0b1a2e, roughness: .2, transparent: true, opacity: .09, depthWrite: false, clearcoat: 1, side: T.FrontSide }));
    shell.traverse(n => { if (n.isMesh) n.renderOrder = 2; });
    const root = new T.Group(); root.position.y = -8.6; pivot.add(root); root.add(shell);
    const built = {}; // key -> object
    const get = (k) => { if (!built[k]) { const o = B[k](); o.traverse(n => { if (n.isMesh) { n.userData.part = k; n.material.userData.e = n.material.emissive?.getHex() ?? 0; } }); built[k] = o; root.add(o); } return built[k]; };
    const glow = new T.Color(0x2b6cff); let picked = null, current = layer;
    function show(l) {
      current = l; const want = new Set(LAYER_PARTS[l]);
      Object.entries(built).forEach(([k, o]) => o.visible = want.has(k));
      want.forEach(k => get(k).visible = true);
      shell.visible = l !== 'outside';
      select(null);
    }
    function select(k) {
      picked = k;
      Object.entries(built).forEach(([key, o]) => o.traverse(n => { if (!n.isMesh) return;
        n.material.emissive?.set(key === k ? glow : n.material.userData.e);
        n.material.emissiveIntensity = key === k ? .55 : 1;
        const tr = !!k && key !== k; if (n.material.transparent !== tr) { n.material.transparent = tr; n.material.needsUpdate = true; } n.material.opacity = tr ? .3 : 1; }));
    }
    show(layer);
    const ray = new T.Raycaster(), ndc = new T.Vector2();
    const ctl = turnable(el, pivot, cam, { minD: 8, maxD: 46, onTap: (e) => {
      const b = el.getBoundingClientRect(); ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
      ray.setFromCamera(ndc, cam);
      const hit = ray.intersectObjects(Object.values(built).filter(o => o.visible), true).find(h => h.object.userData.part);
      const k = hit?.object.userData.part || null; select(k);
      onPick?.(k, k ? project(k) : null);
    } });
    function project(k) { const box = new T.Box3().setFromObject(built[k]), c = box.getCenter(V(0, 0, 0)); c.y = box.max.y; c.project(cam);
      const b = el.getBoundingClientRect(); return { x: (c.x + 1) / 2 * b.width, y: (1 - c.y) / 2 * b.height }; }
    let beat = 0;
    const v = viewer(el, scene, cam, (t) => { ctl.spin(); if (ctl.idle() && !picked) pivot.rotation.y += .0025;
      const h = built.heart; if (h && h.visible) { beat = 1 + .05 * Math.max(0, Math.sin(t / 130)) ** 6; h.scale.setScalar(beat); }
      const l = built.lungs; if (l && l.visible) l.scale.set(1 + .03 * Math.sin(t / 900), 1 + .02 * Math.sin(t / 900), 1); });
    return { show, select, focusPoint: project, destroy: v.destroy,
      reset() { pivot.rotation.set(0, 0, 0); cam.position.z = 36; root.position.y = -8.6; },
      // move in close to a small part (for the Find game); big parts keep the whole body in view
      zoomTo(k) { const o = get(k), box = new T.Box3().setFromObject(o), sz = box.getSize(V(0, 0, 0)); if (Math.max(sz.x, sz.y) > 3) return;
        const cy = (box.min.y + box.max.y) / 2 - root.position.y; root.position.y = -cy; cam.position.z = 14; } };
  }

  // a slowly turning model of one part (part pages, quiz answers)
  function spin(el, key) {
    const obj = build(key); if (!obj) return null;
    const scene = new T.Scene(); lights(scene); const pivot = new T.Group(); pivot.add(obj); scene.add(pivot);
    const cam = new T.PerspectiveCamera(30, 1, .01, 100); frame(cam, obj, 1.3); const d = cam.position.z; pivot.rotation.x = .12;
    const ctl = turnable(el, pivot, cam, { minD: d * .4, maxD: d * 2 });
    const v = viewer(el, scene, cam, () => { ctl.spin(); if (ctl.idle()) pivot.rotation.y += .006; });
    return v;
  }

  window.Anatomy = { image, paint, body: bodyView, spin, LAYER_PARTS, has: (k) => !!(SOLO[k] || B[k]) };
})();
