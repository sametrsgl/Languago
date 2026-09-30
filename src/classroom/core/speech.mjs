// English read-aloud with an honest fallback. Many Pardus / Turkish-locale
// boards have no English voice; then the game says "Öğretmen okur" instead of
// silently failing, and never waits for speech before moving on.

// What the English voice should say: parenthetical cues such as "(small)",
// "(they)" or a Turkish "(yasak)" stay on screen but are never read aloud.
export function spokenText(text) {
  return String(text ?? '')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function createSpeech() {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  let voice = null;

  function pickVoice() {
    if (!synth) return null;
    const voices = synth.getVoices() || [];
    const en = voices.filter((v) => /^en[-_]/i.test(v.lang) || /english/i.test(v.name));
    const prefer = ['en-GB', 'en-US', 'en-AU', 'en-IE'];
    for (const lang of prefer) {
      const local = en.find((v) => v.lang.replace('_', '-') === lang && v.localService);
      if (local) return local;
      const any = en.find((v) => v.lang.replace('_', '-') === lang);
      if (any) return any;
    }
    return en[0] || null;
  }

  // Voices load late on some browsers: wait up to ~1.2 s once.
  function probe(timeoutMs = 1200) {
    return new Promise((resolve) => {
      if (!synth) { resolve(false); return; }
      voice = pickVoice();
      if (voice) { resolve(true); return; }
      const done = () => { voice = pickVoice(); resolve(!!voice); };
      const timer = setTimeout(done, timeoutMs);
      synth.addEventListener?.('voiceschanged', () => { clearTimeout(timer); done(); }, { once: true });
    });
  }

  function speak(text, { rate = 1 } = {}) {
    const said = spokenText(text);
    if (!synth || !voice || !said) return false;
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(said.replace(/_{2,}/g, ', blank, '));
      u.voice = voice; u.lang = voice.lang; u.rate = rate; u.pitch = 1;
      synth.speak(u);
      return true;
    } catch {
      return false;
    }
  }

  return {
    probe,
    speak,
    stop() { try { synth && synth.cancel(); } catch { /* ignore */ } },
    get available() { return !!voice; },
    get voiceName() { return voice ? `${voice.name} (${voice.lang})` : null; },
  };
}
