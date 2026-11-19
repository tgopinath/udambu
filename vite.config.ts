import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

/**
 * Production builds never run the WebXR emulator, but @pmndrs/xr references it through a dynamic
 * import, which would ship IWER + multi-MB synthetic rooms. Swap it for a stub in `vite build`.
 */
function stripXREmulator(): Plugin {
  const STUB = '\0ww-xr-emulator-stub'
  return {
    name: 'ww-strip-xr-emulator',
    apply: 'build',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source === './emulate.js' && importer?.includes('@pmndrs/xr')) return STUB
      return null
    },
    load(id) {
      if (id === STUB) return 'export function emulate() { throw new Error("WebXR emulator is not available in production builds") }'
      return null
    },
  }
}

/**
 * One site, two levels:
 *   /            Explore: the plain-JS app at the repo root (index.html, app.js, data files). No build step;
 *                tools/assemble.mjs copies it into dist/ after `vite build`.
 *   /lab/        Lab: this React + R3F app (lab/index.html -> src/main.tsx), built by Vite.
 * base './' keeps every URL relative, so the same dist/ works on Vercel, inside the Android app
 * (https://localhost) and inside the iPhone app (bundled files).
 */
export default defineConfig({
  base: './',
  publicDir: 'public',
  plugins: [stripXREmulator(), react(), tailwindcss()],
  resolve: { dedupe: ['three'], alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5260, host: true },
  preview: { port: 5260 },
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'lab/assets',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      input: { lab: fileURLToPath(new URL('./lab/index.html', import.meta.url)) },
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules/three/')) return 'three'
          if (id.includes('@react-three') || id.includes('@pmndrs') || id.includes('troika')) return 'r3f'
          return undefined
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', 'dist', 'tests'],
    environment: 'jsdom',
  },
})
