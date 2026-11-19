# Testing

| Layer | Command | Covers |
|---|---|---|
| Unit (Vitest) | `npm test` | Index integrity (life-size, orientation, unique ids), every study note maps to a real part, names/pairs, search ranking, neighbours, body areas, quiz deck/options/locate, Leitner scheduling, cardiac + breathing timing, heart and lung grouping |
| Browser (Playwright, installed Chrome) | `npm run test:e2e` | Landing → lab; real click on the femur → details, isolate/hide/show all; search loads the right layer, bookmark persists after reload; layers + cross-section; build-your-own (add/remove parts, only those render, persists); heartbeat phases + mesh actually moves, breathing; standard views; locate quiz by clicking the model; identify quiz wrong → explained → next, progress persists |
| WebXR emulator | (part of `test:e2e`) | Enter VR, teleport, ray-select, VR panel isolate + heartbeat, exit |

Last full run on 2026-11-17: 16/16 unit; browser suite 8/10 in one pass, with all 10 passing when run
individually. The two that failed in the full pass (animations, and the VR flow's final heartbeat step) load the
2.5 M-triangle cardiovascular layer under software WebGL while the machine was at load average ~150 from other
software, and hit time-outs.
Software WebGL renders only a few fps, so helpers wait on rendered frames (`__al.frames()`), not sleeps.

`window.__al` (dev builds or `?e2e`) is a read-only bridge: structure screen/world positions, a visible click
point on a part, current view/lab state, rendered frame count, XR poses, and `exitVR`.
