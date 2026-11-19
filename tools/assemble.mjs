// After `vite build` (which writes the Lab to dist/lab/), copy the Explore level into dist/ as it is:
// Explore has no build step. dist/ is what Vercel serves and what both phone shells bundle.
import { cpSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = join(root, 'dist')
if (!existsSync(join(dist, 'lab', 'index.html'))) throw new Error('Run vite build first: dist/lab/index.html is missing')

// Explore files at the repo root. Everything else at the root is source, tooling or docs.
const FILES = ['index.html', 'app.js', 'parts.js', 'illnesses.js', 'models.js', 'quiz.js', 'ar.js', 'demos.js', 'voice.js',
  'styles.css', 'sw.js', 'manifest.webmanifest', 'icon.svg']
const DIRS = ['vendor', 'fonts', 'img', 'audio', 'ar']
for (const f of FILES) cpSync(join(root, f), join(dist, f))
for (const d of DIRS) cpSync(join(root, d), join(dist, d), { recursive: true, filter: (src) => !src.endsWith('.DS_Store') })
// The shared layer: the script both levels load, and the Lab name list Explore's search reads.
cpSync(join(root, 'shared'), join(dist, 'shared'), { recursive: true, filter: (src) => !/\.(test|spec)\.|\.DS_Store$/.test(src) })

const size = (p) => statSync(p).isDirectory() ? readdirSync(p).reduce((n, c) => n + size(join(p, c)), 0) : statSync(p).size
console.log(`assembled dist/: Explore + Lab, ${(size(dist) / 1e6).toFixed(0)} MB`)
