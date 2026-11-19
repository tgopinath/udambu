# Changelog

## 0.2.0 — 2026-11-17 — Anatomy Lab
Replaces the children's maths app (0.1.0, still in git history) with a human-anatomy atlas on the same WebXR base.

### Added
- 7 body systems / 2,827 named structures from BodyParts3D + Z-Anatomy (via 3d-anatomy, CC BY-NC-SA 4.0),
  loaded on demand with local Draco decoding and BVH picking.
- Explore: search, parts browser by system and body area, details (side, tissue, extent, notes, twin,
  neighbours), focus / isolate / hide / bookmark, x-ray selection, per-layer opacity.
- Build your own body: add parts one by one, "Show only my parts", "Add major organs"; saved.
- Standard views (front, back, left, right, top, bottom) around the body or the selection.
- Cross-sections (axial, sagittal, coronal) with the camera turning to face the cut.
- Body in action: heartbeat with phases and schematic ECG; breathing with lungs and diaphragm.
- Study: locate and identify quizzes with Leitner spaced repetition.
- VR: life-size body, ray selection, thumbstick teleport (never into the body), panel that follows the player.
- Landing page and Sources & licence page with all required attributions.
- 16 unit tests; 10 Playwright tests incl. real clicks on the model and a WebXR emulator flow.

### Fixed during development
- XR ray clicks did nothing: XR pointer events carry their hit in `intersection` and throw on `delta`.
- The last change could be lost if the tab closed inside the save debounce; now flushed on page hide.
- The floor contact shadow re-rendered the multi-million-triangle scene every frame; now only on layer change.
- Vercel rewrites would have served `index.html` for models and the Draco decoder; CSP now allows WebAssembly.

## 0.1.0 — 2026-11-17 — WonderWorld VR (children's maths MVP; superseded)
