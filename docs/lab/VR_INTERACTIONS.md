# VR & input

| Action | Desktop | Touch | Quest controllers |
|---|---|---|---|
| Inspect a part | click | tap | point ray + **trigger** |
| Orbit / pan / zoom | drag / right-drag / scroll | drag / two-finger | walk around it, teleport |
| Move | — | — | **push stick forward** → arc → **trigger** to land (never inside the body) |
| Turn | — | — | flick right stick (snap 30°) or hold (smooth, with vignette) |
| Layers, isolate, hide, heartbeat, breathing, study answers | side panels | panels | **panel that follows you** (front-left) |
| Exit VR | — | — | "Exit VR" on the panel, or the Meta button |

- One picking path for every device (`Body.tsx`); a press-and-release up to 700 ms counts as a click.
- Teleport arcs appear only while a stick is pushed forward, so the trigger selects by default.
- The body stands life-size on a plinth; you start 1.4 m in front of it.

## Emulator test (automated, `tests/e2e/xr.spec.ts`)
IWER Quest 3 in headless Chrome: enter VR → teleport → ray-select a skull bone → isolate it from the VR panel →
start the heartbeat from the panel → exit VR. Emulated poses are static, so the test nudges controllers by 1 mm
for a few frames, and holds the trigger for two rendered frames.

## Still to do on a physical Quest
Frame rate with each layer; selection of small parts; panel reachability; teleport arc feel; hand tracking.
