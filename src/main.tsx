// Udambu Lab: the student level of Udambu (lab/index.html). Explore, the plain-words level, is the
// plain-JS app at the site root; both share settings, progress and links through shared/udambu-shared.js.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import '../vendor/tokens.css'
import './index.css'
import '../vendor/m3/kolam-m3.css'
import '../vendor/ios/kolam-ios.css'
import './native.css'
import { ErrorBoundary } from './ui/ui'
import { LabPage } from './ui/LabPage'
import { AboutPage } from './ui/AboutPage'
import { initNative } from './ui/native'

function NotFound() {
  return (
    <div className="grid h-full place-items-center text-center">
      <div>
        <h1 className="text-xl font-semibold">Page not found</h1>
        <Link to="/" className="mt-2 inline-block text-accent hover:underline">
          Open the Lab
        </Link>
      </div>
    </div>
  )
}

initNative()

// Hash routes (#/ and #/about) so the same files work on Vercel and bundled inside the phone apps.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/" element={<LabPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>,
)
