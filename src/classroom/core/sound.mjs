// Classroom sounds, synthesised with WebAudio: no files to load, nothing to
// block on slow school networks. Every cue is short (under 1 s) and soft.
// Oyun Parkı = marimba, Arena = synth blips, Stüdyo = woodblock and piano.
// There is never a harsh buzzer: a miss is a soft "boing" or a low note.

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

export function createSound(initialSkin = 'studio') {
  let ctx = null;
  let master = null;
  let muted = false;
  let volume = 0.7;
  let skin = initialSkin;

  function ensure() {
    if (ctx) return ctx;
    const AC = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : volume;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ctx.destination);
    return ctx;
  }

  function tone({ freq, type = 'sine', at = 0, dur = 0.25, gain = 0.3, attack = 0.005, bend = 0, harmonic = 0 }) {
    const c = ensure(); if (!c) return;
    const t0 = c.currentTime + at;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    g.connect(master);
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (bend) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * bend), t0 + dur);
    o.connect(g); o.start(t0); o.stop(t0 + dur + 0.02);
    if (harmonic) {
      const o2 = c.createOscillator();
      const g2 = c.createGain();
      o2.type = 'sine'; o2.frequency.setValueAtTime(freq * harmonic, t0);
      g2.gain.setValueAtTime(gain * 0.25, t0); g2.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.4);
      o2.connect(g2); g2.connect(master); o2.start(t0); o2.stop(t0 + dur);
    }
  }

  function noise({ at = 0, dur = 0.08, gain = 0.2, freq = 2000, q = 1 }) {
    const c = ensure(); if (!c) return;
    const t0 = c.currentTime + at;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(master); src.start(t0);
  }

  // Instrument voices per skin.
  const voice = {
    park: (n, at = 0, dur = 0.5, gain = 0.32) => tone({ freq: NOTE(n), type: 'sine', at, dur, gain, harmonic: 4.0 }),
    arena: (n, at = 0, dur = 0.14, gain = 0.16) => tone({ freq: NOTE(n), type: 'square', at, dur, gain, attack: 0.002 }),
    studio: (n, at = 0, dur = 0.6, gain = 0.22) => tone({ freq: NOTE(n), type: 'triangle', at, dur, gain, harmonic: 2.0 }),
  };
  const play = (notes, spacing, dur, gain) => notes.forEach((n, i) => voice[skin](n, i * spacing, dur, gain));

  const cues = {
    tap() {
      if (skin === 'studio') noise({ dur: 0.04, gain: 0.25, freq: 2600, q: 6 });
      else if (skin === 'arena') voice.arena(84, 0, 0.05, 0.08);
      else voice.park(84, 0, 0.18, 0.18);
    },
    flip() {
      noise({ dur: 0.18, gain: skin === 'arena' ? 0.12 : 0.08, freq: 900, q: 0.7 });
      if (skin === 'park') play([72, 79], 0.07, 0.35, 0.22);
      if (skin === 'arena') play([76, 83], 0.05, 0.1, 0.1);
      if (skin === 'studio') voice.studio(76, 0.05, 0.4, 0.14);
    },
    boardsUp() {
      if (skin === 'park') play([67, 72, 76, 79], 0.09, 0.45, 0.26);
      else if (skin === 'arena') play([72, 79, 84], 0.07, 0.12, 0.14);
      else { noise({ dur: 0.05, gain: 0.3, freq: 1800, q: 5 }); noise({ at: 0.14, dur: 0.05, gain: 0.3, freq: 2400, q: 5 }); }
    },
    correct() {
      if (skin === 'park') play([72, 76, 79, 84], 0.08, 0.5, 0.28);
      else if (skin === 'arena') play([76, 81, 88], 0.06, 0.12, 0.14);
      else play([72, 79], 0.12, 0.7, 0.2);
    },
    miss() {
      if (skin === 'park') tone({ freq: NOTE(67), type: 'sine', dur: 0.45, gain: 0.25, bend: 0.72 });
      else if (skin === 'arena') voice.arena(52, 0, 0.18, 0.1);
      else voice.studio(55, 0, 0.5, 0.16);
    },
    card() {
      if (skin === 'park') play([79, 83, 86, 91], 0.06, 0.4, 0.2);
      else if (skin === 'arena') play([88, 84, 91], 0.05, 0.1, 0.12);
      else play([79, 84, 88], 0.09, 0.6, 0.14);
    },
    point() {
      if (skin === 'arena') voice.arena(91, 0, 0.05, 0.06);
      else if (skin === 'park') voice.park(91, 0, 0.2, 0.14);
      else noise({ dur: 0.03, gain: 0.18, freq: 3200, q: 8 });
    },
    tick() {
      if (skin === 'studio') noise({ dur: 0.02, gain: 0.12, freq: 3000, q: 8 });
      else voice[skin](skin === 'park' ? 88 : 96, 0, 0.05, 0.05);
    },
    timeUp() {
      if (skin === 'park') play([79, 76], 0.18, 0.6, 0.24);
      else if (skin === 'arena') play([84, 72], 0.1, 0.16, 0.12);
      else play([72, 67], 0.16, 0.6, 0.16);
    },
    drumroll() {
      for (let i = 0; i < 14; i++) noise({ at: i * 0.045, dur: 0.05, gain: 0.05 + i * 0.008, freq: 220, q: 0.9 });
      noise({ at: 0.7, dur: 0.25, gain: 0.3, freq: 180, q: 0.6 });
    },
    finale() {
      if (skin === 'park') play([72, 76, 79, 84, 88, 91], 0.1, 0.6, 0.24);
      else if (skin === 'arena') play([72, 76, 79, 84, 91], 0.07, 0.16, 0.13);
      else play([60, 67, 72, 76], 0.18, 0.9, 0.16);
    },
  };

  return {
    play(name) { if (muted) return; try { cues[name] && cues[name](); } catch { /* audio is optional */ } },
    unlock() { const c = ensure(); if (c && c.state === 'suspended') c.resume().catch(() => {}); },
    setSkin(s) { skin = voice[s] ? s : 'studio'; },
    setMuted(m) { muted = !!m; if (master) master.gain.value = muted ? 0 : volume; },
    setVolume(v) { volume = Math.max(0, Math.min(1, Number(v) || 0)); if (master && !muted) master.gain.value = volume; },
    get muted() { return muted; },
  };
}
