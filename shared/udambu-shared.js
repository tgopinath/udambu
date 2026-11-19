// Udambu shared layer: used by BOTH levels of the app.
//   Explore (index.html, plain JS) loads it as an ordinary <script> before app.js.
//   Lab (lab/, React + TypeScript) imports it for its side effect (see src/shared/udambu.ts).
// It sets globalThis.UdambuShared. No DOM work here, so it also runs under Node / Vitest.
//
//   CROSSLINKS  Explore part key -> the same structure in the Lab's 3D atlas ("See it in the Lab")
//   exploreFor  Lab structure -> the Explore part that explains it in plain words
//   settings    one settings store for both levels (start level, read-aloud, VR comfort)
//   progress    one progress store (parts opened, quiz bests, Lab study answers)
//   search      one ranked search over Explore parts, conditions and Lab structure names
(function (g) {
  'use strict';

  // [system, base name in the Lab model] — base names come from the BodyParts3D / Z-Anatomy model
  // (src/data/structures.json); a test checks that every one exists. null base = show the whole layer.
  // Parts the male atlas does not model (skin, uterus, blood, cells…) have no entry.
  const CROSSLINKS = {
    brain: ['nervous', 'Precentral gyrus'],
    'spinal-cord': ['nervous', 'White matter of spinal cord'],
    nerves: ['nervous', 'Sciatic nerve'],
    eyes: ['nervous', 'Posterior segment of eyeball'],
    ears: ['nervous', 'Cochlea'],
    nose: ['skeletal', 'Nasal bone'],
    tongue: ['visceral', 'Tongue'],
    teeth: ['skeletal', 'Upper first molar tooth'],
    skeleton: ['skeletal', null],
    skull: ['skeletal', 'Frontal bone'],
    spine: ['skeletal', 'Vertebra L1'],
    ribs: ['skeletal', 'Fifth rib'],
    'arm-bones': ['skeletal', 'Humerus'],
    hand: ['skeletal', 'Third metacarpal bone'],
    'leg-bones': ['skeletal', 'Femur'],
    foot: ['skeletal', 'Second metatarsal bone'],
    joints: ['joints', 'Articular capsule of knee joint'],
    muscles: ['muscular', null],
    diaphragm: ['muscular', 'Diaphragm'],
    heart: ['cardiovascular', 'Left ventricle'],
    'blood-vessels': ['cardiovascular', 'Ascending aorta'],
    windpipe: ['visceral', 'Trachea'],
    'voice-box': ['skeletal', 'Thyroid cartilage'],
    lungs: ['visceral', 'Superior lobe of right lung'],
    'food-pipe': ['visceral', 'Oesophagus'],
    stomach: ['visceral', 'Stomach'],
    liver: ['visceral', 'Liver'],
    gallbladder: ['visceral', 'Gallbladder'],
    pancreas: ['visceral', 'Pancreas'],
    'small-intestine': ['visceral', 'Jejunum'],
    'large-intestine': ['visceral', 'Transverse colon'],
    appendix: ['visceral', 'Vermiform appendix'],
    kidneys: ['visceral', 'Kidney'],
    bladder: ['visceral', 'Urinary bladder'],
    pituitary: ['visceral', 'Adenohypophysis'],
    thyroid: ['visceral', 'Thyroid gland'],
    adrenal: ['visceral', 'Suprarenal gland'],
    spleen: ['lymphatic', 'Spleen'],
    tonsils: ['lymphatic', 'Palatine tonsil'],
    lymph: ['lymphatic', null],
    pelvis: ['skeletal', 'Hip bone'],
    shoulder: ['skeletal', 'Scapula'],
    kneecap: ['skeletal', 'Patella'],
    tendons: ['muscular', 'Calcaneal tendon'],
    ligaments: ['joints', null],
    cartilage: ['skeletal', 'Cricoid cartilage'],
    thymus: ['lymphatic', 'Right lobe of thymus'],
    parathyroid: ['visceral', 'Superior parathyroid gland'],
    hypothalamus: ['nervous', 'Hypothalamus'],
    pineal: ['visceral', 'Pineal gland'],
    sinuses: ['skeletal', 'Sinus of frontal bone'],
    ureters: ['visceral', 'Ureter'],
  };

  // Explore part names, so the Lab can offer "plain-words" pages without loading parts.js.
  // A test checks these match parts.js.
  const EXPLORE_NAMES = {
    brain: 'Brain', 'spinal-cord': 'Spinal cord', nerves: 'Nerves', eyes: 'Eyes', ears: 'Ears', nose: 'Nose', tongue: 'Tongue',
    teeth: 'Teeth', skeleton: 'Skeleton', skull: 'Skull', spine: 'Spine', ribs: 'Ribs', 'arm-bones': 'Arm bones', hand: 'Hands',
    'leg-bones': 'Leg bones', foot: 'Feet', joints: 'Joints', muscles: 'Muscles', diaphragm: 'Diaphragm', heart: 'Heart',
    'blood-vessels': 'Blood vessels', windpipe: 'Trachea (windpipe)', 'voice-box': 'Larynx (voice box)', lungs: 'Lungs',
    'food-pipe': 'Oesophagus', stomach: 'Stomach', liver: 'Liver', gallbladder: 'Gallbladder', pancreas: 'Pancreas',
    'small-intestine': 'Small intestine', 'large-intestine': 'Large intestine', appendix: 'Appendix', kidneys: 'Kidneys',
    bladder: 'Bladder', pituitary: 'Pituitary gland', thyroid: 'Thyroid', adrenal: 'Adrenal glands', spleen: 'Spleen',
    tonsils: 'Tonsils', lymph: 'Lymph nodes', pelvis: 'Pelvis', shoulder: 'Shoulder girdle', kneecap: 'Kneecap',
    tendons: 'Tendons', ligaments: 'Ligaments', cartilage: 'Cartilage', thymus: 'Thymus', parathyroid: 'Parathyroid glands',
    hypothalamus: 'Hypothalamus', pineal: 'Pineal gland', sinuses: 'Sinuses', ureters: 'Ureters',
  };

  // Lab structure -> Explore part. Exact targets first, then families of structures (order matters).
  const FAMILIES = [
    [/^vertebra |^sacrum$|^coccyx$|^intervertebral/i, 'spine'],
    [/ rib$|^first rib|sternum/i, 'ribs'],
    [/(incisor|canine|premolar|molar tooth)$/i, 'teeth'],
    [/(frontal|parietal|occipital|temporal|sphenoid|ethmoid|zygomatic|lacrimal|nasal) bone$|^mandible$|^maxilla$/i, 'skull'],
    [/metacarpal|carpal|of hand$|^(scaphoid|lunate|triquetrum|pisiform|trapezium|trapezoid|capitate|hamate)/i, 'hand'],
    [/metatarsal|of foot$|^(talus|calcaneus|navicular|cuboid)|cuneiform/i, 'foot'],
    [/^(humerus|radius|ulna)$/i, 'arm-bones'],
    [/^(femur|tibia|fibula)$/i, 'leg-bones'],
    [/^(scapula|clavicle)$/i, 'shoulder'],
    [/^hip bone$/i, 'pelvis'],
    [/^(left|right) (atrium|ventricle)$|valve|papillary muscle/i, 'heart'],
    [/aorta|vena cava|artery|arteries|vein|veins/i, 'blood-vessels'],
    [/lobe of (left|right) lung|bronch/i, 'lungs'],
    [/colon$/i, 'large-intestine'],
    [/^(duodenum|jejunum)$/i, 'small-intestine'],
    [/segment of liver/i, 'liver'],
    [/hypophysis/i, 'pituitary'],
    [/lobe of thymus/i, 'thymus'],
    [/parathyroid gland/i, 'parathyroid'],
    [/gyrus|gyri|sulcus|lobule|thalamus$|^pons$|^midbrain$|medulla oblongata|cerebell|corpus callosum|ventricle of brain|fornix/i, 'brain'],
    [/spinal cord|cauda equina/i, 'spinal-cord'],
    [/eyeball|^cornea$|^lens$|^iris$|retina$|^sclera/i, 'eyes'],
    [/cochlea$|tympanic membrane|^(incus|malleus|stapes)$|semicircular/i, 'ears'],
    [/ nerve( \(|$)|nerve \(|plexus/i, 'nerves'],
    [/ nodes?$/i, 'lymph'],
    [/tendon$/i, 'tendons'],
  ];

  const LAB_TO_EXPLORE = {};
  for (const [key, [, base]] of Object.entries(CROSSLINKS)) if (base) LAB_TO_EXPLORE[base.toLowerCase()] = key;

  /** Explore part key for a Lab structure (by its base name and system), or null. */
  function exploreFor(base, system) {
    if (!base) return null;
    const clean = String(base).replace(/^\((.*)\)$/, '$1');
    const exact = LAB_TO_EXPLORE[clean.toLowerCase()];
    if (exact) return exact;
    for (const [re, key] of FAMILIES) if (re.test(clean)) return key;
    if (system === 'muscular' && /muscle|muscles$/i.test(clean)) return 'muscles';
    if (system === 'joints' && /ligament/i.test(clean)) return 'ligaments';
    if (system === 'skeletal' && /cartilage/i.test(clean)) return 'cartilage';
    return null;
  }

  // The two pages, relative to each other. Inside the phone apps a folder URL does not open its index.html
  // (iPhone: files opened from disk; Android: Capacitor's local server falls back to the root page), so name the file.
  const onDisk = !!(g.location && (g.location.protocol === 'file:' || g.Capacitor || /Udambu-Android/.test((g.navigator && g.navigator.userAgent) || '')));
  const LAB_URL = onDisk ? 'lab/index.html' : 'lab/';          // from Explore
  const EXPLORE_URL = onDisk ? '../index.html' : '../';        // from the Lab

  /** Lab deep link for an Explore part: `${prefix}#/?focus=<system>:<base>` (prefix = the Lab page, from Explore). */
  function labHref(key, prefix) {
    const link = CROSSLINKS[key];
    if (!link) return null;
    const [system, base] = link;
    return (prefix == null ? LAB_URL : prefix) + '#/?focus=' + encodeURIComponent(system + ':' + (base || ''));
  }

  /** Parse a focus value back into { system, base } (base null = whole layer). */
  function parseFocus(value) {
    if (!value) return null;
    const i = value.indexOf(':');
    if (i < 1) return null;
    const system = value.slice(0, i), base = value.slice(i + 1);
    return { system, base: base || null };
  }

  /** Explore deep link from the Lab: `${prefix}#/part/<key>` (prefix = the Explore page, from the Lab). */
  function exploreHref(key, prefix) {
    return (prefix == null ? EXPLORE_URL : prefix) + '#/part/' + key;
  }

  // ---------- storage (localStorage; tests pass their own) ----------
  function safeStorage() { try { return g.localStorage || null; } catch { return null; } }
  function makeStore(key, defaults, storage) {
    const st = () => (storage === undefined ? safeStorage() : storage);
    const read = () => {
      try { const raw = st()?.getItem(key); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
    };
    const write = (v) => { try { st()?.setItem(key, JSON.stringify(v)); } catch { /* private mode: keep going */ } };
    const listeners = new Set();
    return {
      key,
      get() { const v = read(); return deepMerge(defaults(), v); },
      set(patch) { const next = deepMerge(this.get(), patch); write(next); listeners.forEach((f) => f(next)); return next; },
      replace(v) { write(v); listeners.forEach((f) => f(v)); return v; },
      subscribe(f) { listeners.add(f); return () => listeners.delete(f); },
    };
  }
  function deepMerge(a, b) {
    if (!b || typeof b !== 'object' || Array.isArray(b)) return b === undefined ? a : b;
    const out = Array.isArray(a) ? [...a] : { ...a };
    for (const [k, v] of Object.entries(b)) out[k] = v && typeof v === 'object' && !Array.isArray(v) && a && typeof a[k] === 'object' && !Array.isArray(a[k]) ? deepMerge(a[k], v) : v;
    return out;
  }

  // ---------- settings: one screen for both levels ----------
  const SETTINGS_DEFAULTS = () => ({
    version: 1,
    startLevel: null,            // 'explore' | 'lab' | null (not chosen yet: Home asks once)
    autoRead: false,             // Explore reads pages aloud by itself (Listen buttons always work)
    vr: { turn: 'snap', snapDegrees: 30, teleport: true, vignette: true },   // Lab VR comfort
  });

  // ---------- progress: one store for both levels ----------
  const PROGRESS_DEFAULTS = () => ({
    version: 1,
    seen: {},                    // Explore part key -> first-opened time (ms)
    best: {},                    // Explore game -> best score out of 10 ('quiz', 'which')
    lab: { answered: 0, correct: 0, learned: 0, opened: {} },  // Lab study totals; opened = Lab focus links used
  });

  const LAB_KEY = 'anatomylab:v1';
  function createShared(storage) {
    const settings = makeStore('udambu:settings', SETTINGS_DEFAULTS, storage);
    const progress = makeStore('udambu:progress', PROGRESS_DEFAULTS, storage);
    // The Lab keeps its study cards in its own key (src/state/labStore.ts); a reset clears them too.
    const clearLabStudy = () => {
      try {
        const st = storage === undefined ? safeStorage() : storage;
        const raw = st?.getItem(LAB_KEY); if (!raw) return;
        const lab = JSON.parse(raw);
        st.setItem(LAB_KEY, JSON.stringify({ ...lab, cards: {}, session: 0, answered: 0, correct: 0 }));
      } catch { /* nothing to clear */ }
    };
    const P = {
      ...progress,
      markSeen(key) { const p = progress.get(); if (p.seen[key]) return p; return progress.set({ seen: { [key]: Date.now() } }); },
      setBest(game, n) { const p = progress.get(); if (p.best[game] != null && p.best[game] >= n) return p; return progress.set({ best: { [game]: n } }); },
      setLab(stats) { return progress.set({ lab: stats }); },
      reset(level) {
        const p = progress.get(), d = PROGRESS_DEFAULTS();
        if (level === 'explore') return progress.replace({ ...p, seen: {}, best: {} });
        if (level !== 'explore') clearLabStudy();
        if (level === 'lab') return progress.replace({ ...p, lab: d.lab });
        return progress.replace(d);
      },
      summary(totalParts) {
        const p = progress.get();
        const seen = Object.keys(p.seen).length;
        return {
          partsSeen: seen, partsTotal: totalParts || 0,
          quizBest: p.best.quiz ?? null, whichBest: p.best.which ?? null,
          labAnswered: p.lab.answered, labCorrect: p.lab.correct, labLearned: p.lab.learned,
          labAccuracy: p.lab.answered ? Math.round((p.lab.correct / p.lab.answered) * 100) : null,
        };
      },
    };
    return { settings, progress: P };
  }

  // ---------- one search over both content sets ----------
  const norm = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  function rank(name, q, words) {
    const n = norm(name);
    if (!words.every((w) => n.includes(w))) return -1;
    const r = n === q ? 100 : n.startsWith(q) ? 80 : n.split(' ').some((w) => w.startsWith(words[0])) ? 60 : 40;
    return r - Math.min(n.length, 80) / 10;
  }
  /**
   * Ranked search. sources = { parts: [{key,name,term}], illnesses: [{key,name}], lab: [[system, base], …] }.
   * Returns { parts, illnesses, lab } each sorted best first; Lab hits carry the Explore key when one explains them.
   */
  function search(query, sources, limit) {
    const q = norm(query || ''), max = limit || 8;
    const empty = { parts: [], illnesses: [], lab: [] };
    if (!q) return empty;
    const words = q.split(' ');
    const pick = (list, names) => list.map((x) => ({ x, s: Math.max(...names(x).filter(Boolean).map((n) => rank(n, q, words))) }))
      .filter((h) => h.s >= 0).sort((a, b) => b.s - a.s).slice(0, max).map((h) => h.x);
    return {
      parts: pick(sources.parts || [], (p) => [p.name, p.term, p.key.replace(/-/g, ' ')]),
      illnesses: pick(sources.illnesses || [], (i) => [i.name]),
      lab: pick(sources.lab || [], ([, base]) => [base]).map(([system, base]) => ({ system, base, explore: exploreFor(base, system) })),
    };
  }

  const api = { version: 1, LAB_URL, EXPLORE_URL, CROSSLINKS, EXPLORE_NAMES, exploreFor, labHref, exploreHref, parseFocus, search, createShared, norm };
  Object.assign(api, createShared());
  g.UdambuShared = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
