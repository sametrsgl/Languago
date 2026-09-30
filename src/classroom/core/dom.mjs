// Small DOM helpers shared by the classroom games.

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function $(sel, root = document) { return root.querySelector(sel); }
export function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function toast(root, text, ms = 2200) {
  const node = el(`<div class="cr-toast" role="status">${esc(text)}</div>`);
  root.appendChild(node);
  setTimeout(() => node.remove(), ms);
}

// Fit N tiles into a box: pick the column count that gives the biggest tile
// with a pleasant aspect ratio.
export function bestGrid(n, boxW, boxH, tileAspect = 1.25, gapRatio = 0.06) {
  let best = { cols: n, rows: 1, size: 0 };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const w = boxW / (cols + (cols - 1) * gapRatio);
    const h = boxH / (rows + (rows - 1) * gapRatio);
    const tileW = Math.min(w, h * tileAspect);
    if (tileW > best.size) best = { cols, rows, size: tileW };
  }
  return best;
}

export function reducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

// ---- stems with blanks (pure text, no DOM) -------------------------------
const BLANK = /_{2,}/g;

// What goes into each blank of a stem. One blank takes the whole key; a
// two-blank stem like "What ___ you ___ at ten?" splits "were ... doing" into
// ["were", "doing"]. Returns null when the key cannot be split to match.
export function blankParts(stem, key) {
  const n = (String(stem ?? '').match(BLANK) || []).length;
  if (n < 2) return [String(key ?? '')];
  const parts = String(key ?? '').split(/\s*(?:\.{3}|…|,|\/)\s*/).map((p) => p.trim()).filter(Boolean);
  return parts.length === n ? parts : null;
}

// The stem with its blanks filled in. When a multi-blank key cannot be split,
// only the first blank takes the key and the others stay "___" (the key is
// never repeated). Stems without a blank come back unchanged.
export function fillBlanks(stem, key) {
  const s = String(stem ?? '');
  const parts = blankParts(s, key) || [String(key ?? '')];
  let i = 0;
  return s.replace(BLANK, (m) => (i < parts.length ? parts[i++] : m));
}

// Turkish-only letters: a name with these is cased as Turkish (lang="tr"),
// everything else on the stage as English (no dotted İ in "ANİMALS").
export function langOf(text) {
  return /[çğıöşüÇĞİÖŞÜ]/.test(String(text ?? '')) ? 'tr' : 'en';
}

// Confetti in team colours AND shapes (finale only).
export function confetti(root, colors, { ms = 2600 } = {}) {
  if (reducedMotion()) return;
  const c = document.createElement('canvas');
  c.className = 'cr-confetti';
  root.appendChild(c);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  const shapes = ['circle', 'tri', 'square', 'star'];
  const parts = Array.from({ length: 140 }, (_, i) => ({
    x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.5,
    vx: (Math.random() - 0.5) * 2.4, vy: 2 + Math.random() * 3.5,
    r: 6 + Math.random() * 8, a: Math.random() * Math.PI, va: (Math.random() - 0.5) * 0.25,
    color: colors[i % colors.length], shape: shapes[i % shapes.length],
  }));
  const t0 = performance.now();
  function frame(t) {
    const done = t - t0 > ms;
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.a += p.va; p.vy += 0.03;
      g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.color; g.globalAlpha = done ? Math.max(0, 1 - (t - t0 - ms) / 600) : 1;
      g.beginPath();
      if (p.shape === 'circle') g.arc(0, 0, p.r / 2, 0, Math.PI * 2);
      else if (p.shape === 'tri') { g.moveTo(0, -p.r / 2); g.lineTo(p.r / 2, p.r / 2); g.lineTo(-p.r / 2, p.r / 2); }
      else if (p.shape === 'square') g.rect(-p.r / 2, -p.r / 2, p.r, p.r);
      else { for (let k = 0; k < 10; k++) { const rr = k % 2 ? p.r / 4 : p.r / 2; const an = (k / 10) * Math.PI * 2 - Math.PI / 2; g.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } }
      g.fill(); g.restore();
    }
    if (t - t0 < ms + 600) requestAnimationFrame(frame); else c.remove();
  }
  requestAnimationFrame(frame);
}

export const ICONS = {
  undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
  sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6M16 9l6 6"/></svg>',
  full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
  score: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><path d="M9.5 9.2a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.2-2.5 3.9M12 17.3v.2"/></svg>',
  speak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>',
  swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 0 1-14.3 4.9M4 12A8 8 0 0 1 18.3 7.1"/><path d="M18.5 3v4.3h-4.3M5.5 21v-4.3h4.3"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg>',
  freeze: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="18" height="14" rx="2"/><rect x="9" y="19" width="6" height="2" rx="1"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2.5 2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.2l-5.9 3.3 1.3-6.6-4.9-4.5 6.6-.8z"/></svg>',
  gift: '<svg viewBox="0 0 64 64"><rect x="8" y="26" width="48" height="32" rx="4" fill="#ff8a3d"/><rect x="5" y="18" width="54" height="12" rx="3" fill="#ffb13d"/><rect x="28" y="18" width="8" height="40" fill="#fff4d6"/><path d="M32 18c-6-10-18-10-16-2 1 4 10 3 16 2zm0 0c6-10 18-10 16-2-1 4-10 3-16 2z" fill="#e0508f"/></svg>',
};

// Treasure chest for Oyun Parkı tiles.
export const CHEST_SVG = `<svg class="cr-chest" viewBox="0 0 120 96" aria-hidden="true">
  <ellipse cx="60" cy="90" rx="50" ry="5" fill="rgba(90,50,10,.18)"/>
  <path d="M12 40h96v42a8 8 0 0 1-8 8H20a8 8 0 0 1-8-8z" fill="#b86b2e"/>
  <path d="M12 40h96v10H12z" fill="#8c4b1c"/>
  <path d="M10 42c0-22 20-34 50-34s50 12 50 34z" fill="#cf7d38"/>
  <path d="M10 42c0-22 20-34 50-34v34z" fill="#d98a45"/>
  <rect x="20" y="10" width="10" height="80" rx="3" fill="#ffc94a"/>
  <rect x="90" y="10" width="10" height="80" rx="3" fill="#ffc94a"/>
  <path d="M8 40h104v7H8z" fill="#ffc94a"/>
  <circle cx="25" cy="64" r="2.2" fill="#b07a12"/><circle cx="95" cy="64" r="2.2" fill="#b07a12"/>
  <path d="M26 20c6-4 14-6 22-7" stroke="#fff3d1" stroke-width="3" stroke-linecap="round" fill="none" opacity=".7"/>
</svg>`;

// An opened chest: lid up, gold inside (the team gem sits on top via HTML).
export const OPEN_CHEST_SVG = `<svg class="cr-chest" viewBox="0 0 120 96" aria-hidden="true">
  <ellipse cx="60" cy="90" rx="50" ry="5" fill="rgba(90,50,10,.18)"/>
  <path d="M16 6h88l6 30H10z" fill="#8c4b1c"/>
  <path d="M20 10h80l4 22H16z" fill="#6b3a12"/>
  <path d="M14 44c10-10 22-12 30-8 6-8 20-9 28-2 8-6 22-5 34 10z" fill="#ffd34d"/>
  <circle cx="36" cy="40" r="6" fill="#ffe89a"/><circle cx="64" cy="36" r="7" fill="#ffe89a"/><circle cx="88" cy="41" r="5.5" fill="#ffe89a"/>
  <path d="M12 44h96v38a8 8 0 0 1-8 8H20a8 8 0 0 1-8-8z" fill="#b86b2e"/>
  <path d="M12 44h96v8H12z" fill="#8c4b1c"/>
  <rect x="20" y="44" width="10" height="46" rx="3" fill="#ffc94a"/>
  <rect x="90" y="44" width="10" height="46" rx="3" fill="#ffc94a"/>
  <path d="M8 42h104v6H8z" fill="#ffc94a"/>
  <path d="M60 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#fff" opacity=".9"/>
  <path d="M104 22l1.4 4 4 1.4-4 1.4-1.4 4-1.4-4-4-1.4 4-1.4z" fill="#fff" opacity=".85"/>
</svg>`;

// A-D answer marks: A red triangle, B blue circle, C yellow square, D green star.
export const OPTION_SHAPES = [
  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5 22.5 21h-21z"/></svg>',
  '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>',
  '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="2.5" y="2.5" width="19" height="19" rx="3"/></svg>',
  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 1.5 3.2 6.7 7.3.9-5.4 5 1.4 7.3L12 17.8l-6.5 3.6 1.4-7.3-5.4-5 7.3-.9z"/></svg>',
];
export const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
