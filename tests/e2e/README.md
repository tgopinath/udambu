# Browser tests

`npm run test:e2e` starts Vite on port 5262 (Explore at `/`, Lab at `/lab/`) and drives the real app in Chrome:

- `explore.spec.ts`: Explore's home, part pages (3D, AR button, recorded voice), the quiz, and the shared layer:
  "See it in the Lab" deep links, the Lab's "In plain words" link back, one search, one settings screen, start level.
- `lab.spec.ts`, `build.spec.ts`, `study.spec.ts`: the Lab's layers, cross-sections, search, bookmarks, build-your-own body,
  heartbeat and breathing, standard views and spaced-repetition study, with real clicks on the WebGL canvas.
- `xr.spec.ts`: VR in the Meta Quest 3 emulator (IWER): enter VR, teleport, select with the controller ray, exit.

Each test uses a fresh browser context, so local storage starts empty. `window.__al` is a read-only bridge
(dev builds, or any build opened with `?e2e`) that reports where structures are on screen and the view state.
