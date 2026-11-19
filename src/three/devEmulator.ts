// DEV ONLY: force the IWER Meta Quest 3 emulator even when the browser exposes its own WebXR
// (desktop Chrome does, so the XR library's built-in emulator stays off). Open /play?xr=emulate.
// Never bundled in production: callers guard with import.meta.env.DEV.
export async function installForcedEmulator() {
  const [{ XRDevice, metaQuest3 }, { DevUI }] = await Promise.all([import('iwer'), import('@iwer/devui')])
  const device = new XRDevice(metaQuest3)
  device.installRuntime({ forceInstall: true })
  // ?xrui=off skips the on-screen emulator panel so scripted tests can hold controller poses.
  if (new URLSearchParams(location.search).get('xrui') !== 'off') device.installDevUI(DevUI)
  // Handle for scripted controller tests from the console / automation.
  ;(window as unknown as { __iwer: unknown }).__iwer = device
  return device
}
