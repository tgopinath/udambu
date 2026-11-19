// Lightweight capability check (no three/XR imports) so 2D pages stay small.
export type XRSupport = 'immersive-vr' | 'emulated' | 'none' | 'checking'

export function isLocalhost() {
  return typeof location !== 'undefined' && ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
}

export async function detectXRSupport(): Promise<XRSupport> {
  try {
    const xr = (navigator as Navigator & { xr?: XRSystem }).xr
    const forced = import.meta.env.DEV && new URLSearchParams(location.search).get('xr') === 'emulate'
    if (forced) return 'emulated'
    if (!xr) return import.meta.env.DEV && isLocalhost() ? 'emulated' : 'none'
    return (await xr.isSessionSupported('immersive-vr')) ? 'immersive-vr' : 'none'
  } catch {
    return 'none'
  }
}
