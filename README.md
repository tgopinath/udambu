# Udambu (உடம்பு)

The human body in two levels, in one app.

- **Explore**: plain words for everyone. 63 body parts in real 3D, a four-step "how it works" animation for each, 49 common conditions, a teaching quiz, every line read aloud, and "View in your room" AR on iPhone, Android and the web.
- **Lab**: for students. A 3D and VR atlas of 2,827 named structures (BodyParts3D / Z-Anatomy): layers, cross-sections, build-your-own body, heartbeat and breathing, spaced-repetition study, and life-size WebXR on Meta Quest.

Every Explore part links to the same structure in the Lab ("See it in the Lab"), and Lab structures link back ("In plain words"). One home, one settings screen, one progress store and one search cover both.

Live: https://udambu.vercel.app (Lab: https://udambu.vercel.app/lab/) · Android APK: GitHub release v1.0.0 · iPhone shell: github.com/tgopinath/Udambu-iOS

## Develop

```sh
npm install
npm run dev        # Explore at http://localhost:5260/, Lab at /lab/
npm test           # Vitest: Lab engine + shared layer
npm run test:e2e   # Playwright: Explore, Lab and the VR emulator
npm run build      # dist/: the Lab built by Vite, Explore copied as it is
```

Phone apps: `~/Documents/android-wrappers/udambu/sync-web.sh` (APK) and `../Udambu-iOS/sync-web.sh` (simulator). Both bundle `dist/`.

Read [ARCHITECTURE.md](ARCHITECTURE.md) for how the two levels fit together.

## Licences

Lab models: BodyParts3D (DBCLS, CC BY-SA 2.1 JP) and Z-Anatomy (CC BY-SA 4.0) with non-commercial components, used under CC BY-NC-SA 4.0; notice in `public/lab/models/License.txt`. Explore 3D and AR models: Sketchfab authors, credited in the app. General information, not medical advice.
