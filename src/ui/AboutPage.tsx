import { Link } from 'react-router-dom'
import { EXPLORE_ROOT } from '@/shared/udambu'
import { LevelSwitch, Logo } from './ui'

const FEATURES = [
  { title: '2,827 named structures', body: 'Every bone, muscle, vessel, nerve and organ from the BodyParts3D / Z-Anatomy atlas, at true scale.' },
  { title: 'Layers and cross-sections', body: 'Switch systems on and off, make layers see-through, and cut axial, sagittal or coronal sections.' },
  { title: 'Study with spaced repetition', body: 'Locate and name quizzes per system. Cards you miss come back sooner; ones you know drift away.' },
  { title: 'Life-size in VR', body: 'Open it in Meta Quest Browser and walk around the body at 1:1 scale. Point to select, teleport, snap-turn.' },
]

export function AboutPage() {
  return (
    <div className="about-page h-full overflow-y-auto">
      <header className="about-head mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-4">
        <Logo />
        <LevelSwitch />
      </header>
      <main className="mx-auto max-w-3xl space-y-8 px-5 pb-16 text-[15px] leading-relaxed text-mute">
        <section>
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-accent">Udambu Lab</p>
          <h1 className="mt-1 text-2xl font-bold text-ink">Sources, licence and privacy</h1>
          <p className="mt-2">
            The Lab is Udambu’s student level: a 3D and VR anatomy atlas. Explore, the plain-words level, explains the same body in simple language with 3D models, voice and AR. Both are free educational tools, not medical devices, and must not be used for diagnosis or treatment.
          </p>
          <div className="mt-4 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-panel p-4">
                <h2 className="font-bold text-ink">{f.title}</h2>
                <p className="mt-1 text-sm">{f.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/" className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-on-accent">
              Open the Lab
            </Link>
            <Link to="/?mode=study" className="rounded-md border border-line px-4 py-2 text-sm font-bold text-ink hover:bg-white/5">
              Start studying
            </Link>
          </div>
        </section>

        <section>
          <h2 className="font-bold text-ink">Lab 3D models</h2>
          <p className="mt-2">The anatomical models are the seven system files (skeletal, muscular, joints, cardiovascular, nervous, visceral, lymphatic) published by the open-source 3d-anatomy project, exported from Z-Anatomy, which is built on BodyParts3D. Required attributions:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink/90">
            <li>"BodyParts3D - The Database Center for Life Science - CC-BY-SA 2.1 Japan"</li>
            <li>"Z-Anatomy - The open source atlas of anatomy - CC-BY-SA 4.0"</li>
            <li>"Cranial Nerves and Foramina - by University of Dundee, CAHID - CC-BY 4.0"</li>
            <li>"Anatomy of the Inner Ear - by University of Dundee School of Medicine - CC-BY-NC-SA 4.0"</li>
            <li>"Kidney - by lissiecowley - CC-BY-NC 4.0"</li>
            <li>"Brainder" and "White matter" from the University of Washington (licence not stated upstream)</li>
          </ul>
          <p className="mt-2">
            Because two components are non-commercial, the models as used here are under <b className="text-ink">CC BY-NC-SA 4.0</b>: free to share and adapt for non-commercial purposes with attribution, under the same licence. The upstream notice ships unmodified at{' '}
            <a className="text-accent hover:underline" href="models/License.txt">
              models/License.txt
            </a>
            . Meshes are shown as published; this app only recolours them by tissue type.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-ink">Explore 3D models, AR and voice</h2>
          <p className="mt-2">
            Explore’s live 3D models are hand-picked Sketchfab models shown in Sketchfab’s own viewer, each credited on its page with its author and licence. The “View in your room” AR models are openly licensed (CC Attribution and CC Attribution-ShareAlike) copies from the Objaverse mirror of Sketchfab, credited in the AR sheet. Read-aloud clips were recorded with the macOS “Samantha” voice. Condition pages are general information based on WHO and NHS guidance, not medical advice.{' '}
            <a className="text-accent hover:underline" href={EXPLORE_ROOT + '#/settings'}>
              Settings and progress
            </a>
          </p>
        </section>

        <section>
          <h2 className="font-bold text-ink">Study notes</h2>
          <p className="mt-2">Short notes on about 50 commonly studied structures were written for this app from standard textbook facts. Other structures show their system, tissue group, size and neighbouring structures computed from the model.</p>
        </section>

        <section>
          <h2 className="font-bold text-ink">Privacy</h2>
          <p className="mt-2">No account, no analytics, no ads. Your settings, layer choices and progress in both levels are stored only on this device (localStorage). When you enter VR, the XR library downloads standard controller and hand models from the public jsDelivr CDN; no personal data is included.</p>
        </section>

        <section>
          <h2 className="font-bold text-ink">Known limitations</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>VR is verified in Meta’s Quest 3 emulator; it has not yet been tested on a physical headset.</li>
            <li>The heart/vessel and nerve layers are dense (about 2.5 M and 1.4 M triangles) and may be slow on phones and standalone headsets.</li>
            <li>Cut surfaces are open (hollow), not capped.</li>
          </ul>
        </section>
      </main>
    </div>
  )
}
