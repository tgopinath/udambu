// Read-aloud. Recorded clips (audio/<id>.m4a, made by tools/voice.mjs) sound the same on every phone;
// anything without a clip falls back to the device's own voice.
const Voice = (() => {
  const CLIPS = new Set(typeof VOICE_CLIPS !== 'undefined' ? VOICE_CLIPS : []);
  let audio = null, busy = null;
  const mark = (btn, on) => { busy?.classList.remove('talking'); busy = on ? btn : null; btn?.classList.toggle('talking', !!on); };
  function stop() { audio?.pause(); audio = null; try { speechSynthesis.cancel(); } catch {} mark(null, false); }
  function speak(text, btn) {
    try {
      const u = new SpeechSynthesisUtterance(text); u.rate = 0.9; u.pitch = 1.1; u.lang = 'en-IN';
      const v = speechSynthesis.getVoices().find(v => /en[-_](IN|GB|US)/.test(v.lang)); if (v) u.voice = v;
      u.onend = () => mark(btn, false); speechSynthesis.speak(u); mark(btn, true);
    } catch {}
  }
  function play(id, text, btn) {
    const same = busy && busy === btn; stop(); if (same) return;   // tap again to stop
    if (CLIPS.has(id)) {
      audio = new Audio(`audio/${id}.m4a`); mark(btn, true);
      audio.onended = () => mark(btn, false);
      audio.play().catch(() => { audio = null; text && speak(text, btn); });
    } else if (text) speak(text, btn);
  }
  return { play, stop };
})();
