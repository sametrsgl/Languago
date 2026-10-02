// Kelime Şehri: stage for the Monopoly-style city board (shared setup + own flow).
// Teacher chrome is Turkish; everything students read on the stage is English.
// The state already holds where a roll ends (lastMove): the hops are only drawn
// on screen, so an undo or a resume never replays them.
import { createStore, readSave, readJson, writeJson } from '../../core/store.mjs';
import { createSound } from '../../core/sound.mjs';
import { createSpeech } from '../../core/speech.mjs';
import { makeBoardCode } from '../../core/rng.mjs';
import { createSetup, teamGlyph } from '../../core/setup.mjs';
import { esc, $, $$, el, confetti, reducedMotion, promptHtml, fullSentence, langOf, ICONS, OPEN_CHEST_SVG, OPTION_SHAPES, OPTION_LETTERS } from '../../core/dom.mjs';
import {
  createGame, reduce, presented, priceOf, buildCost, rentDue, canBuy, freePlaces, streetOwner, ranking, endingTitles,
  chanceCards, errorSentence, micPrompt, labelOf, round10,
  MAX_TOPICS, SQUARE_COUNT, STREETS, GARAGE, DEFAULT_MINUTES, CURRENCY, SHADOW, ANSWER_BONUS, EVERYONE_BONUS, TASK_REWARDS,
  PAY_OUT_FEE, MAX_LEVEL, RENT_RATES, GRADES,
} from './logic.mjs';
import { STAGE_NAMES, NEST_BREAKS } from './banks.mjs';

const SAVE_KEY = 'lg:kelime-sehri:save';
const CLOCK_KEY = 'lg:kelime-sehri:clock';
const LOCK_MS = 450;
const HOP_MS = 260;
const CORNERS = [0, 6, 10, 16];
const DARK_INK = '#10161f';
const HEX = /^#[0-9a-f]{6}$/i;
const PENDING_KINDS = ['question', 'deed', 'info', 'chance-task', 'mic', 'nest', 'garage', 'pick'];
// Street colours per look: editorial (Stüdyo), neon (Arena), bright and warm (Oyun Parkı).
const STREET_COLORS = {
  studio: ['#1f7a72', '#d9573f', '#c99412', '#3d4a9c'],
  arena: ['#3df2ff', '#ff4fd8', '#b6ff3d', '#a98bff'],
  park: ['#ff8a3d', '#2fb36b', '#f2b705', '#ff5d8f'],
};

// White or dark ink, whichever has the higher contrast on a colour (WCAG
// luminance), so a street letter never relies on a light band's hue alone.
function inkOn(hex) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '');
  if (!m) return '#fff';
  const lin = (h) => { const c = parseInt(h, 16) / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const l = 0.2126 * lin(m[1]) + 0.7152 * lin(m[2]) + 0.0722 * lin(m[3]);
  return 1.05 / (l + 0.05) >= (l + 0.05) / 0.057 ? '#fff' : DARK_INK;
}
const STREET_INK = Object.fromEntries(Object.entries(STREET_COLORS).map(([m, list]) => [m, list.map(inkOn)]));
// The setup preview of how topics fill the streets (the rule lives in logic.mjs).
const TOPIC_MAP = { 1: [0, 0, 0, 0], 2: [0, 1, 0, 1], 3: [0, 1, 2, 0], 4: [0, 1, 2, 3] };
const LEGEND_TITLES = { studio: 'Streets', arena: 'Sectors', park: 'Treasure map' };
const CHANCE_TITLES = { studio: 'Chance', arena: 'Signal', park: 'Magic' };
const JOKER_NAMES = { fifty: '50:50', swap: 'Swap', shield: 'Shield' };
const JOKER_TEXT = {
  fifty: 'Use it on your own question: two wrong answers disappear.',
  swap: 'Use it on your own question: you get a new one.',
  shield: 'It blocks your next rent payment.',
};
const BUILDINGS = { studio: ['house', 'hotel'], arena: ['module', 'station ring'], park: ['', ''] };
const GRADE_NAMES = { great: 'Great', ok: 'OK', try: 'Try again' };
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

// Buildings are drawn in the owner's colour (currentColor).
const HOUSE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5V21H3z" fill="currentColor" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><rect x="10" y="14" width="4" height="7" fill="#fff"/></svg>';
const HOTEL_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21V6l8-4 8 4v15z" fill="currentColor" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path d="M7.5 8h3v2.5h-3zM13.5 8h3v2.5h-3zM7.5 12.5h3V15h-3zM13.5 12.5h3V15h-3z" fill="#fff"/><rect x="10.5" y="16.5" width="3" height="4.5" fill="#fff"/></svg>';
const MODULE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="7.5" width="19" height="9" rx="4.5" fill="currentColor" stroke="#fff" stroke-width="1.6"/><circle cx="8.5" cy="12" r="1.7" fill="#fff"/><circle cx="15.5" cy="12" r="1.7" fill="#fff"/></svg>';
const RING_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.6" fill="none" stroke="#fff" stroke-width="5"/><circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="12" cy="12" r="3.8" fill="currentColor" stroke="#fff" stroke-width="1.4"/></svg>';

// Everything the stage reads without a check (and every value written into
// an attribute or a style) must be there and of the right kind; anything else
// is dropped, so a broken save can never brick the setup page.
export function validSave(save) {
  const s = save && save.state;
  const finite = (n) => typeof n === 'number' && Number.isFinite(n);
  const obj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
  const isInt = (n, lo, hi) => Number.isInteger(n) && n >= lo && n < hi;
  if (!s || s.v !== 1 || s.game !== 'kelime-sehri' || !obj(s.profile) || !STAGE_NAMES[s.profile.mode]) return false;
  if (!finite(s.profile.huddle) || !finite(s.profile.optionsDelay) || !finite(s.minutes) || !finite(s.pot) || typeof s.code !== 'string') return false;
  if (!['roll', 'pending', 'end'].includes(s.phase) || !Number.isInteger(s.turnCount)) return false;
  if (!Array.isArray(s.board) || s.board.length !== SQUARE_COUNT || !s.board.every((sq, i) => obj(sq) && sq.index === i && typeof sq.name === 'string')) return false;
  if (!Array.isArray(s.topics) || !s.topics.length || !s.topics.every((t) => obj(t) && typeof t.title === 'string')) return false;
  if (!Array.isArray(s.streets) || s.streets.length !== STREETS.length || !s.streets.every((st) => obj(st) && typeof st.label === 'string')) return false;
  if (!obj(s.items) || !Array.isArray(s.queues) || !obj(s.places) || !Array.isArray(s.missed) || !Array.isArray(s.log)) return false;
  if (!s.board.every((sq) => sq.kind !== 'place' || (obj(s.places[sq.index]) && STREETS.includes(sq.street)))) return false;
  if (!Array.isArray(s.teams) || !s.teams.length || !s.teams.every((t) => obj(t) && /^[\w-]{1,40}$/.test(String(t.id)) && typeof t.name === 'string'
    && HEX.test(String(t.hex)) && (t.ink == null || HEX.test(String(t.ink))) && finite(t.cash) && finite(t.seats) && Array.isArray(t.jokers) && isInt(t.pos, 0, SQUARE_COUNT))) return false;
  if (!isInt(s.turn, 0, s.teams.length)) return false;
  const p = s.pending;
  if ((s.phase === 'pending') !== obj(p)) return false;
  if (s.phase === 'roll' && !finite(s.seat)) return false;
  if (!p) return true;
  if (!PENDING_KINDS.includes(p.kind) || !finite(s.seat)) return false;
  if (p.kind === 'question') {
    if (!['prompt', 'talk', 'revealed'].includes(p.stage) || !obj(p.chips)) return false;
    if (p.purpose === 'fix') return Number.isInteger(p.errorIdx);
    return ['claim', 'rent', 'build', 'everyone'].includes(p.purpose) && obj(s.items[p.itemId]) && STREETS.includes(p.street)
      && (p.purpose === 'everyone' || !!s.board[p.square]) && (p.purpose !== 'rent' && p.purpose !== 'build' || !!(s.places[p.square] && s.places[p.square].owner));
  }
  if (p.kind === 'deed') return !!(s.board[p.square] && s.board[p.square].kind === 'place');
  if (p.kind === 'chance-task') return obj(p.card) && typeof p.card.text === 'string';
  return true;
}

// Grid cell [row, column] of a square on the 7x5 ring: 0 is the bottom-right
// corner, 1-5 run left along the bottom, 7-9 up the left, 11-15 right along the
// top and 17-19 down the right side.
function cellOf(i) {
  if (i === 0) return [5, 7];
  if (i < 6) return [5, 7 - i];
  if (i === 6) return [5, 1];
  if (i < 10) return [5 - (i - 6), 1];
  if (i === 10) return [1, 1];
  if (i < 16) return [1, 1 + (i - 10)];
  if (i === 16) return [1, 7];
  return [1 + (i - 16), 7];
}

function dieSvg(n) {
  const pips = (PIPS[n] || []).map((k) => `<circle cx="${14 + (k % 3) * 18}" cy="${14 + Math.floor(k / 3) * 18}" r="5.6"/>`).join('');
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><rect class="ks-dieface" x="2" y="2" width="60" height="60" rx="13"/>${pips || '<text x="32" y="43" text-anchor="middle" font-size="30" font-weight="800">?</text>'}</svg>`;
}

function unitText(mode, n) {
  const c = CURRENCY[mode] || CURRENCY.studio;
  return `${n} ${Math.abs(n) === 1 ? c.one : c.many}`;
}

export function mountKelimeSehri(root, { dataBase = '/sinif-oyunlari/paket', mascot = '/logo/kommo-512.png' } = {}) {
  const sound = createSound('studio');
  const speech = createSpeech();
  let voiceReady = false;
  speech.probe().then((ok) => { voiceReady = ok; });
  let store = null;
  let ui = freshUi();

  function freshUi() {
    return {
      key: null, optsKey: null, cardKey: null, delay: null, talk: null, left: 0, total: 0, paused: false, lockUntil: 0, revealKey: null,
      endShown: false, lastScores: null, speakTimers: [], anim: null, animT: null, tumbleT: null, tumble: false, mic: null,
      splashQ: [], splashOn: false, seenLog: null, lastTime: false, clock: null, clockT: null, revealT: null, talkRan: false, pickAt: null,
    };
  }

  const applySkin = (m) => { root.dataset.skin = m; sound.setSkin(m); };

  const dropSave = () => { try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(CLOCK_KEY); } catch { /* ignore */ } };

  function readResumable() {
    const save = readSave(SAVE_KEY);
    if (!save) return null;
    if (!validSave(save)) { dropSave(); return null; }
    return save.state.phase !== 'end' ? save : null;
  }

  // ------------------------------------------------------------ setup ----
  const setupUi = createSetup(root, {
    gameId: 'kelime-sehri',
    title: 'Kelime Şehri',
    lead: 'Monopoly tarzı şehir oyunu: takımlar zar atar, durdukları yerin sorusunu bilip yeri alır, rakibin yerinde kira sorusu gelir. Bütün takımlar her soruya kartla cevap verir. Çocuk görünümünde kimse puan kaybetmez.',
    mascot,
    dataBase,
    minTeams: 2,
    maxTeams: 6,
    defaultTeamCount: 2,
    isActive: () => !store,
    onSkin: applySkin,
    beforeRender: () => stopTimers(),
    // null = the look's own default (Süre and Başlangıç tapusu differ per look).
    gameDefaults: () => ({ extra: [], minutes: null, deed: null }),
    gameSection: ({ opts, modeId, chip, sourceKey, choices, loading }) => {
      const extra = (opts.extra || []).filter((k) => k !== sourceKey && choices.some((c) => c.key === k));
      const selected = [sourceKey, ...extra].filter(Boolean);
      const main = choices.find((c) => c.key === sourceKey);
      const full = selected.length >= MAX_TOPICS;
      const minutes = opts.minutes || DEFAULT_MINUTES[modeId];
      const deed = opts.deed ?? modeId !== 'park';
      const titles = selected.map((k) => { const c = choices.find((x) => x.key === k); return c ? c.title : k; });
      const map = TOPIC_MAP[Math.max(1, Math.min(MAX_TOPICS, titles.length))];
      const streetMap = titles.length ? `<div class="ks-map" aria-label="Sokak dağılımı">${STREETS.map((id, k) => {
        const label = labelOf(titles[map[k]]);
        return `<span class="ks-mapst" style="--sc:${STREET_COLORS[modeId][k]};--si:${STREET_INK[modeId][k]}" title="${esc(label)}"><b>${id}</b><span lang="${langOf(label)}">${esc(label)}</span></span>`;
      }).join('')}</div>` : '';
      return `<section class="cr-card" aria-labelledby="st4">
        <h2 class="cr-step" id="st4"><b>4</b> Sokaklar</h2>
        <p class="cr-note" style="margin-top:0">${main ? `1. sokak: <b>${esc(main.title)}</b> (2. adımda seçtiğiniz). ` : '2. adımda bir konu seçin; o ilk sokak olur. '}En fazla ${MAX_TOPICS - 1} konu daha ekleyebilirsiniz · şu an ${selected.length} konu.</p>
        ${extra.length ? `<div class="cr-row">${extra.map((k) => { const c = choices.find((x) => x.key === k); return `<button class="cr-chip" data-act="catadd" data-v="${esc(k)}" aria-pressed="true" title="Çıkar">${esc(c ? c.title : k)} ✕</button>`; }).join('')}</div>` : ''}
        <div class="ks-pick" role="group" aria-label="Sokak konusu ekle">
          ${loading ? '<p class="cr-note">Konular yükleniyor…</p>' : choices.filter((c) => c.key !== sourceKey && !extra.includes(c.key)).map((c) => `<button class="cr-topic ks-add" data-act="catadd" data-v="${esc(c.key)}" ${full ? 'disabled' : ''}>${c.pic ? `<img src="${esc(c.pic)}" alt="" style="width:22px;height:22px;float:right">` : ''}<strong>+ ${esc(c.title)}</strong><small>${c.kind === 'picture' ? 'resimli kelimeler' : c.kind === 'mine' ? 'Paketlerim' : 'dil bilgisi'}</small></button>`).join('')}
        </div>
        ${streetMap}
        <div class="cr-row" style="margin-top:12px"><span class="cr-row-label">Süre · bitince son tur oynanır</span>
          ${[20, 30, 40, 50].map((n) => chip(`${n} dk`, 'minutes', n, n === minutes)).join('')}</div>
        <div class="cr-row"><span class="cr-row-label">Başlangıç tapusu · ${modeId === 'park' ? 'her takım 1 hazineyle başlar, ziyaretler erken gelir' : 'her takım 1 yerle başlar, kira erken gelir'}</span>
          ${chip('Açık', 'deed', 1, deed)}${chip('Kapalı', 'deed', 0, !deed)}</div>
      </section>`;
    },
    onGameAct: (act, v, { opts, setOpt }) => {
      if (act === 'catadd') {
        const extra = (opts.extra || []).slice();
        const i = extra.indexOf(v);
        if (i >= 0) extra.splice(i, 1); else if (extra.length < MAX_TOPICS - 1) extra.push(v);
        setOpt('extra', extra);
        return true;
      }
      if (act === 'minutes') { setOpt('minutes', Number(v)); return true; }
      if (act === 'deed') { setOpt('deed', v === '1'); return true; }
      return false;
    },
    resumeInfo: () => {
      try {
        const save = readResumable();
        if (!save) return null;
        const st = save.state;
        const clock = readJson(CLOCK_KEY, null);
        const played = clock && clock.code === st.code ? Math.round((Number(clock.ms) || 0) / 60000) : 0;
        return { title: st.topics.map((t) => t.title).join(' + ') || 'Kelime Şehri', code: st.code, savedAt: save.savedAt, detail: `${st.turnCount} hamle · ${played}/${st.minutes} dk` };
      } catch { dropSave(); return null; }
    },
    onResume: () => {
      const s = readResumable();
      if (!s) { setupUi.render('Kayıt bulunamadı.'); return; }
      try { enterStage(s.state, true); } catch {
        // A save that passed the check but still cannot be drawn: back to the setup.
        stopTimers(); stopHops(); stopClock(); dropSave();
        store = null; ui = freshUi();
        setupUi.render('Kayıt açılamadı, silindi. Yeni bir oyun başlatın.');
      }
    },
    onDiscard: dropSave,
    onStart: ({ profile, pack, teams, opts, sourceKey, packFromKey }) => {
      const extra = (opts.extra || []).filter((k) => k !== sourceKey).slice(0, MAX_TOPICS - 1);
      const topics = [{ title: pack.title, pack }, ...extra.map((k) => { const p = packFromKey(k); return p ? { title: p.title, pack: p } : null; })]
        .filter((t) => t && t.pack.items.length);
      if (!topics.length) { setupUi.render('Bu konuda oynanabilir soru yok. 2. adımdan başka bir konu seçin.'); return; }
      const state = createGame({
        profile, topics, teams, code: makeBoardCode(`${Date.now()}:${Math.random()}`), now: Date.now(),
        starterDeed: opts.deed ?? profile.mode !== 'park', minutes: opts.minutes || DEFAULT_MINUTES[profile.mode],
      });
      if (state.topics.every((t) => !(t.tiers[1].length + t.tiers[2].length + t.tiers[3].length))) {
        setupUi.render('Seçilen konularda çoktan seçmeli ya da resimli soru yok. Başka bir konu seçin.');
        return;
      }
      try { localStorage.removeItem(CLOCK_KEY); } catch { /* ignore */ }
      enterStage(state);
    },
  });

  // ------------------------------------------------------------ stage ----
  function enterStage(state, resumed = false) {
    sound.unlock();
    stopClock();
    ui = freshUi();
    store = createStore(state, reduce, { saveKey: SAVE_KEY });
    applySkin(state.profile.mode);
    ui.lastTime = resumed && state.turnCount > 0;
    root.innerHTML = `
      <div class="cr-stage ks-stage">
        <div class="cr-teambar" data-teams></div>
        <div class="cr-boardwrap ks-wrap"><div class="ks-board" data-board></div></div>
        <div class="cr-dock" data-dock></div>
      </div>
      <div data-overlay></div>`;
    store.subscribe(render);
    startClock();
    render(store.state, { action: { type: resumed ? 'RESUME' : 'START' } });
    requestFull();
    if (resumed) stageToast('Oyun kaldığı yerden devam ediyor.');
    else if (!voiceReady && state.profile.autoRead) stageToast('Bu cihazda İngilizce ses yok: soruları öğretmen okur.', 3600);
  }

  // Stage toasts sit at the top of the centre panel (between the title and
  // the legend), never over the bottom row where the first hops happen.
  // kids: Oyun Parkı's big orange English line.
  function stageToast(text, ms = 2200, kids = false) {
    const n = el(`<div class="cr-toast${kids ? ' ks-toast' : ''}" role="status"${kids ? ' lang="en"' : ''}>${esc(text)}</div>`);
    const c = $('.ks-centre', root);
    if (c) { n.style.top = `${Math.round(c.getBoundingClientRect().top) + 10}px`; n.style.bottom = 'auto'; }
    root.appendChild(n);
    setTimeout(() => n.remove(), ms);
  }

  function requestFull() {
    const d = document.documentElement;
    if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen().catch(() => {});
    try { navigator.wakeLock?.request('screen').catch(() => {}); } catch { /* optional */ }
  }

  const lock = (ms = LOCK_MS) => { ui.lockUntil = performance.now() + ms; };
  const locked = () => performance.now() < ui.lockUntil;
  const overlay = () => $('[data-overlay]', root);
  const teamById = (s, id) => s.teams.find((t) => t.id === id) || null;
  const streetColor = (s, k) => (STREET_COLORS[s.profile.mode] || STREET_COLORS.studio)[k] || 'var(--accent)';
  const streetVars = (s, k) => `--sc:${streetColor(s, k)};--si:${(STREET_INK[s.profile.mode] || STREET_INK.studio)[k] || '#fff'};`;
  // Team colour plus its ink (the Yellow team's glyph is dark, not white).
  const teamVars = (t) => `--tc:${t.hex};--ti:${t.ink || '#fff'};`;
  const seatWord = (s) => (s.profile.mode === 'park' ? 'Player' : 'Speaker');
  const scoreText = (s, n) => (s.profile.mode === 'park' ? `★ ${n}` : String(n));
  const teamPill = (t, m, cls = '') => `<span class="cr-qteam ks-pill ${cls}${t.name.length > 16 ? ' is-long' : ''}" style="${teamVars(t)}" title="${esc(t.name)}"><span class="cr-team-ico">${teamGlyph(t, m)}</span><span lang="${langOf(t.name)}">${esc(t.name)}</span></span>`;
  const jokerChips = (t, cls) => (t.jokers.length ? `<span class="${cls}" lang="en">${t.jokers.map((j) => `<span class="ks-jk">${JOKER_NAMES[j] || ''}</span>`).join('')}</span>` : '');
  const nameHtml = (t) => (t ? `<b lang="${langOf(t.name)}">${esc(t.name)}</b>` : '');
  const icon = (slug, cls) => `<img class="${cls}" src="/pictures/board/${esc(slug)}.svg" alt="">`;
  // "the Launch Pad", "the Harbour", but plain "START".
  const startName = (s) => (s.profile.mode === 'studio' ? 'START' : `the ${s.board[0].name}`);
  const garageName = (s) => (s.profile.mode === 'arena' ? 'the Asteroid Belt' : 'the Garage');

  // A place's picture: a CSS planet in Arena, a board icon everywhere else.
  function picHtml(s, sq, cls) {
    if (s.profile.mode === 'arena' && sq.kind === 'place') return `<span class="ks-planet t${sq.tier} ${cls}" style="${streetVars(s, STREETS.indexOf(sq.street))}" aria-hidden="true"></span>`;
    return icon(sq.icon, cls);
  }

  function buildingSvg(mode, level) {
    if (mode === 'arena') return level >= 2 ? RING_SVG : MODULE_SVG;
    return level >= 2 ? HOTEL_SVG : HOUSE_SVG;
  }

  function render(s, meta = {}) {
    if (!store) return;
    const type = meta.action && meta.action.type;
    if (type === 'UNDO' || type === 'REDO' || type === 'CONTINUE') stopSpeech();
    if (type === 'UNDO' || type === 'REDO') { stopHops(); clearTimeout(ui.revealT); ui.revealT = null; ui.talkRan = false; }
    collectSplashes(s, meta.action || {});
    if (type === 'ROLL' && s.lastMove && !reducedMotion()) beginHops(s);
    ui.tumble = false;
    if (s.phase !== 'end' && !ui.clockT) startClock();
    renderTeams(s);
    renderBoard(s);
    renderDock(s);
    if (s.phase === 'end') { stopClock(); renderEnd(s); return; }
    ui.endShown = false;
    if (ui.anim) { clearOverlay(); if (ui.anim.fresh) runHops(); return; }
    renderOverlay(s);
  }

  function clearOverlay() {
    stopTimers(); ui.key = null; ui.cardKey = null;
    const o = overlay(); if (o) o.innerHTML = '';
  }

  function renderOverlay(s) {
    if (ui.lastTime) { stopTimers(); ui.key = null; ui.cardKey = null; renderLastTime(s); return; }
    const p = s.pending;
    if (s.phase === 'pending' && p) {
      if (p.kind === 'question') { ui.cardKey = null; renderQuestion(s); return; }
      // Wormhole / Windy Corner: the teacher taps a square on the board itself.
      if (p.kind === 'pick') { clearOverlay(); return; }
      ui.key = null;
      renderCard(s);
      return;
    }
    clearOverlay();
  }

  function renderTeams(s) {
    const box = $('[data-teams]', root);
    if (!box) return;
    const m = s.profile.mode;
    const prev = ui.lastScores || {};
    const many = s.teams.length > 4;
    // While the token hops, the bar keeps the scores from before the roll:
    // a START bonus or a card's coins show up when the token lands.
    const held = ui.anim ? ui.anim.scores : null;
    box.classList.toggle('ks-many', many);
    box.innerHTML = s.teams.map((t, i) => {
      const active = i === s.turn && s.phase !== 'end';
      const bits = [];
      // Five or six teams: the speaker is only on the centre card, so names get the room.
      if (active && !many) bits.push(`${seatWord(s)} ${s.seat}`);
      if (t.jail) bits.push(m === 'arena' ? 'in the Belt' : 'in the Garage');
      const jokers = jokerChips(t, 'ks-jks');
      const cash = held && held[t.id] != null ? held[t.id] : t.cash;
      return `<div class="cr-team${active ? ' is-active' : ''}" style="${teamVars(t)}" data-team="${esc(t.id)}" title="${esc(t.name)}">
        <span class="cr-team-ico">${teamGlyph(t, m)}</span>
        <span class="ks-tmid"><span class="cr-team-name" lang="${langOf(t.name)}">${esc(t.name)}</span>${bits.length || jokers ? `<span class="cr-team-sub ks-sub">${bits.length ? `<span class="ks-subt" lang="en">${esc(bits.join(' · '))}</span>` : ''}${jokers}</span>` : ''}</span>
        <span class="cr-team-score">${scoreText(s, cash)}</span>
      </div>`;
    }).join('');
    if (held) return;
    if (ui.lastScores && s.teams.some((t) => prev[t.id] != null && prev[t.id] < t.cash)) sound.play('point');
    ui.lastScores = Object.fromEntries(s.teams.map((t) => [t.id, t.cash]));
  }

  // ---- board -------------------------------------------------------------
  function renderBoard(s) {
    const board = $('[data-board]', root);
    if (!board) return;
    const p = s.pending;
    const picking = s.phase === 'pending' && p && p.kind === 'pick' && !ui.anim;
    const free = picking ? freePlaces(s) : [];
    if (!free.includes(ui.pickAt)) ui.pickAt = null;
    board.classList.toggle('is-picking', picking);
    board.innerHTML = s.board.map((sq) => squareHtml(s, sq, free.includes(sq.index))).join('') + centreHtml(s);
    renderTokens(s);
  }

  function squareHtml(s, sq, pickable) {
    const m = s.profile.mode;
    const [r, c] = cellOf(sq.index);
    const place = s.places[sq.index];
    const owner = place && place.owner ? teamById(s, place.owner) : null;
    const k = sq.street ? STREETS.indexOf(sq.street) : -1;
    const cls = ['ks-sq', sq.kind === 'place' ? 'is-place' : 'is-special', CORNERS.includes(sq.index) ? 'is-corner' : '', owner ? 'is-owned' : '', pickable ? 'is-pick' : ''].filter(Boolean).join(' ');
    const price = sq.price && m !== 'park' ? `<span class="ks-price">${m === 'studio' ? icon('coin', '') : '<i aria-hidden="true">◆</i>'}${sq.price}</span>` : '';
    const bld = owner && place.level ? `<span class="ks-bld" style="color:${owner.hex}" title="${esc(BUILDINGS[m][place.level - 1])}">${buildingSvg(m, place.level)}</span>` : '';
    const style = `grid-area:${r} / ${c};${k >= 0 ? streetVars(s, k) : ''}${owner ? teamVars(owner) : ''}`;
    const label = `${sq.name}${sq.street ? ` (${sq.street})` : ''}${owner ? `: ${owner.name}` : ''}`;
    // The owner's flag flies in the street band: a flag, never a disc, so it
    // cannot be mistaken for a token standing on the square.
    const flag = owner ? `<span class="ks-own" title="${esc(owner.name)}">${teamGlyph(owner, m)}</span>` : '';
    const inner = `
      ${sq.street ? `<span class="ks-band"><b>${sq.street}</b>${flag}</span>` : ''}
      <span class="ks-main">${picHtml(s, sq, 'ks-ico')}<span class="ks-name" lang="en">${esc(sq.name)}</span></span>
      <span class="ks-foot">${price}${bld}<span class="ks-toks" data-toks="${sq.index}"></span></span>`;
    return pickable
      ? `<button class="${cls}${ui.pickAt === sq.index ? ' is-cursor' : ''}" style="${style}" data-act="pick" data-v="${sq.index}" aria-label="${esc(label)}: seç">${inner}</button>`
      : `<div class="${cls}" style="${style}" aria-label="${esc(label)}">${inner}</div>`;
  }

  // Tokens only: redrawn on every hop without touching the squares.
  function renderTokens(s) {
    const board = $('[data-board]', root);
    if (!board) return;
    const at = {};
    s.teams.forEach((t, i) => {
      const pos = ui.anim && ui.anim.teamId === t.id ? ui.anim.pos : t.pos;
      (at[pos] = at[pos] || []).push({ t, i });
    });
    for (const box of $$('[data-toks]', board)) {
      const list = at[box.dataset.toks] || [];
      // Tokens overlap more as they crowd, so they never cover the price or
      // the building beside them in the foot of a place.
      const n = list.length;
      const ov = box.parentNode.querySelector('.ks-price, .ks-bld') ? (n >= 4 ? -1.65 : n === 3 ? -1.3 : 0.15) : (n >= 5 ? -0.8 : 0.15);
      box.style.setProperty('--ov', `calc(var(--u) * ${ov})`);
      box.innerHTML = list.map(({ t, i }) => {
        const cls = ['ks-tok'];
        if (i === s.turn && s.phase !== 'end') cls.push('is-turn');
        if (ui.anim && ui.anim.teamId === t.id) cls.push(ui.anim.jump ? 'is-jump' : 'is-hop');
        return `<span class="${cls.join(' ')}" style="${teamVars(t)}" title="${esc(t.name)}">${teamGlyph(t, s.profile.mode)}</span>`;
      }).join('');
    }
  }

  function centreHtml(s) {
    const m = s.profile.mode;
    const team = s.teams[s.turn];
    const p = s.pending;
    const lm = s.lastMove;
    const die = ui.anim ? ui.anim.value : lm ? lm.value : 0;
    // The team (and the jokers it holds) on one line; the speaker and the
    // Roll button share the next.
    const who = `<div class="ks-who">${teamPill(team, m)}${s.phase === 'end' ? '' : jokerChips(team, 'ks-cjks')}</div>`;
    const seat = `<span class="cr-seat"><span lang="en">${seatWord(s)}</span><b>${s.seat}</b></span>`;
    let turn;
    if (s.phase === 'end') turn = '<p class="ks-pickmsg" lang="en">Game over!</p>';
    else if (ui.anim) turn = `<div class="ks-count" data-count aria-live="polite">${ui.anim.count ? `<b>${ui.anim.count}</b>` : ''}</div>`;
    else if (s.phase === 'roll') turn = `${who}<div class="ks-go">${seat}<button class="cr-bigbtn ks-roll is-pulse" data-act="roll" lang="en" title="Zar at (Boşluk)">Roll the die</button></div>`;
    else if (p && p.kind === 'pick') {
      turn = `${who}<p class="ks-pickmsg" lang="en">${m === 'arena' ? 'Wormhole! Fly to any free planet.' : 'Whoosh! The wind takes you to a free place.'}</p><p class="ks-tnote">Öğretmen parlayan boş karelerden birine dokunur ya da oklarla seçip Boşluk'a basar.</p>`;
    } else turn = `${who}<div class="ks-go">${seat}</div>`;
    const anim = ui.anim ? teamById(s, ui.anim.teamId) : null;
    const ev = anim ? `${nameHtml(anim)} rolled ${ui.anim.value}.` : eventText(s, s.lastEvent) || (s.turnCount ? '' : 'Roll the die to start!');
    const legend = s.streets.map((st, k) => {
      const own = streetOwner(s, st.id);
      const t = own ? teamById(s, own) : null;
      return `<li style="${streetVars(s, k)}"><b>${st.id}</b><span lang="${langOf(st.label)}">${esc(st.label)}</span>${t ? `<i class="ks-legown" style="${teamVars(t)}" title="${esc(t.name)}">${teamGlyph(t, m)}</i>` : ''}</li>`;
    }).join('');
    return `<div class="ks-centre">
      <div class="ks-title"><span lang="en">${esc(STAGE_NAMES[m] || 'Word City')}</span>${s.finalRound && s.phase !== 'end' ? '<span class="ks-final" lang="en">Final round!</span>' : ''}</div>
      <div class="ks-die${ui.anim && ui.anim.rolling ? ' is-rolling' : ''}" data-die>${dieSvg(die)}</div>
      <div class="ks-turn">${turn}</div>
      <div class="ks-event" lang="en">${m === 'park' ? `<img src="${esc(mascot)}" alt="">` : ''}<span>${ev || '&nbsp;'}</span></div>
      <div class="ks-legend"><h3 lang="en">${LEGEND_TITLES[m]}</h3><ul>${legend}</ul>
        ${m === 'studio' ? `<p class="ks-pot" lang="en">${icon('coin', '')}Open Mic pot: <b>${s.pot}</b></p>` : ''}</div>
    </div>`;
  }

  // The last thing that happened, in English, for the centre line.
  function eventText(s, ev) {
    if (!ev) return '';
    const m = s.profile.mode;
    const who = nameHtml(teamById(s, ev.teamId));
    const place = (sq) => esc(s.board[sq]?.name || '');
    const amt = (n) => unitText(m, n);
    let text = '';
    switch (ev.type) {
      case 'move': text = ev.via === 'roll' ? `${who} rolled ${ev.value}.` : `${who} moved ${ev.value} squares.`; break;
      case 'pass': text = `${who} passed ${startName(s)}: +${amt(ev.amount)}.`; break;
      case 'jail': text = `${who} went to ${garageName(s)}.`; break;
      case 'joker': text = ev.joker ? `${who} got a joker: ${JOKER_NAMES[ev.joker]}.` : `${who}: +${amt(ev.amount)} (two jokers already).`; break;
      case 'useJoker': text = `${who} used the ${JOKER_NAMES[ev.joker]} joker.`; break;
      case 'chance': text = `${who} drew a ${CHANCE_TITLES[m]} card.`; break;
      case 'gain': text = `${who}: +${amt(ev.amount)}.`; break;
      case 'payPot': text = `${who} paid ${amt(ev.amount)} to the pot.`; break;
      case 'allGain': text = `Everybody gets +${amt(ev.amount)}!`; break;
      case 'treasure': text = `${who} found the treasure at ${place(ev.square)}!`; break;
      case 'bonus': text = `${who}: +${amt(ev.amount)} for a right answer.`; break;
      case 'claim': text = `${who} claimed ${place(ev.square)} for ${amt(ev.amount)}.`; break;
      case 'buy': text = `${who} bought ${place(ev.square)} for ${amt(ev.amount)}.`; break;
      case 'steal': text = `Stolen! ${who} took ${place(ev.square)} for ${amt(ev.amount)}.`; break;
      case 'passDeed': text = `${who} passed on ${place(ev.square)}.`; break;
      case 'wrong':
        if (ev.purpose === 'claim') text = m === 'park' ? 'The treasure goes back to sleep.' : `${place(ev.square)} stays free.`;
        else if (ev.purpose === 'build') text = `${who}: no building this time.`;
        else text = `${who}: not this time.`;
        break;
      case 'visit': text = `${who} visited ${nameHtml(teamById(s, ev.owner))}: a star for both!`; break;
      case 'shield': text = `${who} used a Shield: no rent!`; break;
      case 'rent': text = ev.amount ? `${who} paid ${amt(ev.amount)} to ${nameHtml(teamById(s, ev.owner))}.` : `${who} paid no ${m === 'arena' ? 'docking fee' : 'rent'}.`; break;
      case 'build': text = `${who} built a ${BUILDINGS[m][ev.level - 1]} on ${place(ev.square)}.`; break;
      case 'task': text = ev.amount ? `${who}: ${GRADE_NAMES[ev.grade]}! +${amt(ev.amount)}.` : `${who}: try again next time.`; break;
      case 'mic': text = ev.amount ? `${who} won ${amt(ev.amount)} at the Open Mic!` : `${who}: try again next time.`; break;
      case 'home': text = `${who} is home at ${place(ev.square)}: +${amt(ev.amount)}.`; break;
      case 'everyone': text = `${ev.teams.length} ${ev.teams.length === 1 ? 'team' : 'teams'} right: +${amt(ev.amount)} each.`; break;
      case 'free':
        if (ev.how === 'fix') text = `${who} fixed the sentence and rolls now!`;
        else if (ev.how === 'pay') text = `${who} paid ${amt(ev.amount)} to leave.`;
        else text = `${who} waits. Free next turn.`;
        break;
      case 'finalRound': text = 'Final round! Every team plays once more.'; break;
      default: text = '';
    }
    if (ev.streetComplete) text += ` Street ${ev.streetComplete} complete!`;
    return text;
  }

  function renderDock(s) {
    const dock = $('[data-dock]', root);
    if (!dock) return;
    const roll = s.phase === 'roll' && !ui.anim;
    dock.innerHTML = `
      <div class="cr-dock-group"><span class="cr-dock-info">kod <b>${esc(s.code)}</b> · <span data-clock>${clockText(s)}</span>${s.profile.mode === 'studio' ? ` · kasa ${s.pot}` : ''}</span></div>
      <div class="cr-dock-group ks-dice"${roll ? '' : ' hidden'}><span class="cr-dock-info">Gerçek zar:</span>${[1, 2, 3, 4, 5, 6].map((n) => `<button class="cr-dbtn ks-dbtn" data-act="die" data-v="${n}" title="Gerçek zar ${n} (${n} tuşu)">${n}</button>`).join('')}</div>
      <div class="cr-dock-group">
        <button class="cr-dbtn" data-act="undo" ${store.canUndo() ? '' : 'disabled'} title="Geri al (U)">${ICONS.undo}<span>Geri al</span></button>
        <button class="cr-dbtn" data-act="scores" title="Puanı düzelt (E)">${ICONS.score}<span>Puan</span></button>
        <button class="cr-dbtn" data-act="mute" aria-pressed="${sound.muted}" aria-label="Ses" title="Ses (M)">${sound.muted ? ICONS.mute : ICONS.sound}</button>
        <button class="cr-dbtn" data-act="full" aria-label="Tam ekran" title="Tam ekran (F)">${ICONS.full}</button>
        <button class="cr-dbtn" data-act="freeze" aria-label="Ekranı karart" title="Ekranı karart (. veya B)">${ICONS.freeze}</button>
        ${!s.finalRound && s.phase !== 'end' ? `<button class="cr-dbtn" data-act="final" title="Son turu şimdi başlat: sıra ilk takıma dönünce oyun biter">${ICONS.flag}<span>Son tur</span></button>` : ''}
        <button class="cr-dbtn cr-dbtn--warn" data-act="finish" title="Oyunu bitir">${ICONS.flag}<span>Bitir</span></button>
      </div>`;
  }

  // ---- hops (view only) ----------------------------------------------------
  // A roll is shown square by square, then a chance step card, then a jump
  // (Garage, START, slide) from the info card's from/to. The pending card
  // or question opens only when the last hop has landed.
  function beginHops(s) {
    stopHops();
    const lm = s.lastMove;
    const steps = [];
    [lm, ...(lm.then || [])].forEach((leg, li) => {
      if (li > 0) steps.push({ flash: leg.via });
      for (let k = 1; k <= leg.value; k++) steps.push({ pos: (leg.from + k) % SQUARE_COUNT, count: k });
    });
    const p = s.pending;
    if (p && p.kind === 'info' && Number.isInteger(p.from) && Number.isInteger(p.to) && p.from !== p.to) steps.push({ wait: 420 }, { pos: p.to, jump: true });
    ui.anim = { teamId: lm.teamId, pos: lm.from, count: 0, value: lm.value, steps, fresh: true, rolling: ui.tumble, jump: false, scores: ui.lastScores };
    ui.tumble = false;
  }

  function runHops() {
    const a = ui.anim;
    if (!a || !a.fresh) return;
    a.fresh = false;
    let i = 0;
    const next = () => {
      if (ui.anim !== a) return;
      if (i >= a.steps.length) { ui.animT = setTimeout(finish, 420); return; }
      const st = a.steps[i++];
      if (st.wait) { a.count = 0; drawHop(); ui.animT = setTimeout(next, st.wait); return; }
      if (st.flash) { a.count = 0; drawHop(); showFlash(st.flash); ui.animT = setTimeout(next, 1900); return; }
      a.pos = st.pos;
      if (st.jump) { a.jump = true; a.count = 0; sound.play('card'); drawHop(); ui.animT = setTimeout(next, 600); return; }
      a.jump = false; a.count = st.count;
      sound.note(st.count - 1);
      drawHop();
      ui.animT = setTimeout(next, HOP_MS);
    };
    const finish = () => {
      if (ui.anim !== a) return;
      ui.anim = null;
      if (store) render(store.state, {});
    };
    if (a.rolling) tumble(a, () => { ui.animT = setTimeout(next, 160); });
    else ui.animT = setTimeout(next, 200);
  }

  // The on-screen die tumbles for half a second before the hops start.
  function tumble(a, done) {
    let n = 0;
    ui.tumbleT = setInterval(() => {
      const box = $('[data-die]', root);
      n += 1;
      if (n < 7) { if (box) box.innerHTML = dieSvg(1 + Math.floor(Math.random() * 6)); return; }
      clearInterval(ui.tumbleT); ui.tumbleT = null;
      a.rolling = false;
      if (box) { box.innerHTML = dieSvg(a.value); box.classList.remove('is-rolling'); }
      done();
    }, 75);
  }

  function drawHop() {
    if (!store) return;
    renderTokens(store.state);
    const c = $('[data-count]', root);
    if (c) c.innerHTML = ui.anim && ui.anim.count ? `<b>${ui.anim.count}</b>` : '';
  }

  function stopHops() {
    clearTimeout(ui.animT); clearInterval(ui.tumbleT);
    ui.animT = null; ui.tumbleT = null; ui.anim = null;
    for (const n of $$('.ks-flash', root)) n.remove();
  }

  // A chance "move n squares" card, shown between the roll and its extra hops.
  function showFlash(ref) {
    const s = store.state;
    const card = chanceCards(s.profile).find((c) => c.ref === ref);
    if (!card) return;
    sound.play('card');
    const node = el(`<div class="ks-flash" role="status"><div class="ks-flash-card">${icon(s.board[3].icon, 'ks-flashico')}<b lang="en">${CHANCE_TITLES[s.profile.mode]}</b><span lang="en">${esc(card.text)}</span></div></div>`);
    root.appendChild(node);
    setTimeout(() => node.remove(), 1800);
  }

  // ---- splashes ------------------------------------------------------------
  function splash(html, ms = 1300) {
    ui.splashQ.push({ html, ms });
    if (!ui.splashOn) nextSplash();
  }
  function nextSplash() {
    const it = ui.splashQ.shift();
    if (!it) { ui.splashOn = false; return; }
    ui.splashOn = true;
    const node = el(`<div class="cr-boards ks-splash" aria-hidden="true">${it.html}</div>`);
    root.appendChild(node);
    setTimeout(() => { node.remove(); nextSplash(); }, it.ms);
  }

  // New log entries since the last render: STOLEN!, a complete street (Park: a
  // treasure chest) and the final round get a splash. Undo and resume never
  // do, nor does the clock putting back a final round that an undo removed.
  function collectSplashes(s, action) {
    const prev = ui.seenLog;
    ui.seenLog = new Set(s.log);
    if (!prev || action.quiet || ['UNDO', 'REDO', 'RESUME', 'START'].includes(action.type)) return;
    for (const ev of s.log) {
      if (prev.has(ev)) continue;
      if (ev.type === 'steal') { sound.play('boardsUp'); splash('<span lang="en">Stolen!</span>'); }
      if (ev.streetComplete) {
        sound.play('drumroll');
        if (ev.chest) splash(`<div class="ks-chest">${OPEN_CHEST_SVG}<b lang="en">Treasure chest! +${ev.chest} stars</b></div>`, 2000);
        else splash('<span lang="en">Street complete!</span>', 1500);
      }
      if (ev.type === 'finalRound') { sound.play('drumroll'); splash('<span lang="en">Final round!</span>', 1600); }
    }
  }

  // ---- question overlay ------------------------------------------------
  function purposeLabel(s, p) {
    const park = s.profile.mode === 'park';
    const name = s.board[p.square]?.name || '';
    switch (p.purpose) {
      case 'claim': return park ? `Treasure: ${name}` : `Claim: ${name}`;
      case 'rent': return park ? 'Visit a friend!' : s.profile.mode === 'arena' ? `Docking fee: ${name}` : `Rent: ${name}`;
      case 'build': return `Build: ${name}`;
      case 'everyone': return `Street ${p.street} · ${s.streets[STREETS.indexOf(p.street)]?.label || ''}`;
      default: return 'Fix it!';
    }
  }

  const promptText = (s, p) => { const pres = presented(s, p.itemId, p.salt); return pres.stem ?? s.items[p.itemId].stem; };
  function answerSentence(s, p) {
    const pres = presented(s, p.itemId, p.salt);
    return pres.kind === 'vocab' ? pres.say : fullSentence(s.items[p.itemId].stem, pres.options[pres.answer].text);
  }

  // Arena: who would steal after a wrong claim (as the reducer decides it:
  // the right team with the fewest credits after its shadow credit).
  function thiefFor(s, p) {
    const team = s.teams[s.turn];
    const n = s.teams.length;
    const half = Math.ceil(priceOf(s, p.square) / 2);
    const order = (t) => (s.teams.indexOf(t) - s.turn + n) % n;
    return s.teams.filter((t) => t !== team && p.chips[t.id])
      .sort((a, b) => a.cash - b.cash || order(a) - order(b))
      .find((t) => t.cash + SHADOW.arena >= half) || null;
  }

  // What the chips on screen will do, in English: the active team's outcome
  // and the shadow reward for every other team with the right card.
  function rewardLine(s, p) {
    const m = s.profile.mode;
    const team = s.teams[s.turn];
    const sq = s.board[p.square];
    const right = !!p.chips[team.id];
    const amt = (n) => unitText(m, n);
    if (p.purpose === 'everyone') return `Every team with the right card: <b>+${amt(EVERYONE_BONUS[m])}</b>`;
    const place = esc(sq.name);
    let out = '';
    if (p.purpose === 'claim') {
      if (m === 'park') out = right ? `+1 star and the treasure of ${place}!` : 'The treasure goes back to sleep.';
      else if (m === 'arena') {
        if (right) {
          const bonus = ANSWER_BONUS.arena + (team.streak + 1 >= 3 ? 1 : 0);
          out = team.cash + bonus >= sq.price ? `+${amt(bonus)}, then ${place} is yours (${amt(sq.price)}).` : `+${amt(bonus)} (not enough to claim ${place}).`;
        } else {
          const thief = thiefFor(s, p);
          out = thief ? `wrong, so ${nameHtml(thief)} steals ${place} for ${amt(Math.ceil(sq.price / 2))}!` : `${place} stays free.`;
        }
      } else if (right) {
        const bonus = ANSWER_BONUS.studio;
        if (s.profile.level !== 'a1') out = `+${amt(bonus)}, then Buy or Pass.`;
        else out = team.cash + bonus >= sq.price ? `+${amt(bonus)} and buys ${place} (${amt(sq.price)}).` : `+${amt(bonus)} (not enough to buy ${place}).`;
      } else out = `${place} stays free.`;
    } else if (p.purpose === 'rent') {
      const owner = teamById(s, s.places[p.square].owner);
      if (m === 'park') out = right ? `+1 star, and ${nameHtml(owner)} gets +1 star too!` : 'No stars this time.';
      else {
        const due = rentDue(s, p.square, right);
        if (due > 0 && team.jokers.includes('shield')) out = 'the Shield blocks the rent!';
        else if (!due) out = m === 'arena' ? 'no docking fee!' : 'no rent!';
        else out = `pays ${amt(Math.min(team.cash, due))} to ${nameHtml(owner)}${right && m === 'studio' ? ' (half rent)' : ''}.`;
      }
    } else if (p.purpose === 'build') {
      const level = s.places[p.square].level;
      const cost = buildCost(s, p.square);
      if (!right) out = 'no building this time.';
      else if (level < MAX_LEVEL && team.cash >= cost) out = `builds a ${BUILDINGS[m][level]} on ${place} (${amt(cost)}).`;
      else out = `+${amt(ANSWER_BONUS[m] + (m === 'arena' && team.streak + 1 >= 3 ? 1 : 0))}.`;
    }
    return `${nameHtml(team)}: ${out} <span class="ks-others">Other teams with the right card: +${amt(SHADOW[m])}</span>`;
  }

  function ringHtml(visible) {
    return `<div class="cr-ring" style="${visible ? '' : 'visibility:hidden'}"><svg viewBox="0 0 44 44"><circle class="cr-ring-track" cx="22" cy="22" r="19" fill="none" stroke-width="5"/><circle class="cr-ring-bar" cx="22" cy="22" r="19" fill="none" stroke-width="5" stroke-linecap="round" stroke-dasharray="119.4" stroke-dashoffset="0" data-ringbar/></svg><b data-ringn>${store.state.profile.huddle}</b><small lang="en">Team talk</small></div>`;
  }

  function questionHtml(s, p) {
    const m = s.profile.mode;
    const park = m === 'park';
    const team = s.teams[s.turn];
    const pres = presented(s, p.itemId, p.salt);
    const item = s.items[p.itemId];
    const revealed = p.stage === 'revealed';
    const showOpts = p.stage !== 'prompt';
    const okey = `${p.itemId}${p.salt}`;
    const animate = showOpts && ui.optsKey !== okey;
    if (showOpts) ui.optsKey = okey;
    const stem = pres.stem ?? item.stem;
    const hidden = p.hidden || [];
    const opts = pres.options.map((opt, i) => {
      const cls = ['cr-opt'];
      if (hidden.includes(i)) cls.push('is-gone');
      if (revealed) cls.push(i === pres.answer ? 'is-key' : 'is-dim');
      return `<button class="${cls.join(' ')}" data-k="${i}" aria-label="${OPTION_LETTERS[i]}: ${esc(opt.text)}"${animate ? '' : ' style="animation:none"'} tabindex="-1" lang="en">
        <span class="cr-optmark">${OPTION_SHAPES[i]}<b>${OPTION_LETTERS[i]}</b></span>${pres.optionImgs && opt.img ? `<img class="cr-optpic" src="${esc(opt.img)}" alt="">` : `<span class="cr-opttext">${esc(opt.text)}</span>`}</button>`;
    }).join('');
    const everyone = p.purpose === 'everyone';
    const head = `${everyone ? '<span class="cr-qteam" style="--tc:var(--accent)"><span lang="en">Everybody!</span></span><span></span>' : `${teamPill(team, m)}<span class="cr-seat"><span lang="en">${seatWord(s)}</span><b>${s.seat}</b></span>`}
      <span class="cr-tileval ks-purpose" style="--sc:${streetColor(s, STREETS.indexOf(p.street))}" lang="en"><i aria-hidden="true"></i>${esc(purposeLabel(s, p))}</span>`;
    let bar;
    if (p.stage === 'prompt') bar = '<button class="cr-bigbtn" data-act="talk" lang="en">Team talk ▶</button>';
    else if (p.stage === 'talk') bar = `<span class="cr-dock-info" style="font-size:calc(var(--u)*1.4)">Bütün takımlar kartını hazırlasın, sonra:</span><button class="cr-bigbtn is-pulse" data-act="reveal" lang="en">${park ? '1, 2, 3… Show me!' : 'Show me!'}</button><button class="cr-dbtn" data-act="plus10">+10</button>`;
    else {
      const sentence = answerSentence(s, p);
      const keyOpt = pres.options[pres.answer];
      const why = item.whyTr || keyOpt.why || (item.type === 'vocab' && item.tr && s.profile.trGloss ? `${item.term} = ${item.tr}` : '');
      bar = `<div class="cr-reveal ks-reveal">
        ${sentence ? `<span class="cr-echo" lang="en">Everyone says it: “${esc(sentence)}”</span>` : ''}
        ${why ? `<div class="cr-why">${esc(why)}${item.rule ? `<small>Kural: ${esc(item.rule)}</small>` : ''}</div>` : ''}
        <div class="ks-reward" lang="en">${rewardLine(s, p)}</div>
        <div class="cr-shadow"><span class="cr-shadow-label">Doğru kart gösteren takımlar · yanlış gösterenlere dokunun</span>
          ${s.teams.map((t) => `<button class="cr-schip${t === team && !everyone ? ' is-main' : ''}" style="--tc:${t.hex}" data-act="chip" data-v="${esc(t.id)}" aria-pressed="${!!p.chips[t.id]}"><span class="ks-chipico">${teamGlyph(t, m)}</span><span lang="${langOf(t.name)}">${esc(t.name)}</span></button>`).join('')}</div>
        <button class="cr-bigbtn" data-act="continue">Devam ▶</button>
      </div>`;
    }
    // Fifty and Swap are the active team's own jokers (the Shield works by itself).
    const jokers = !revealed && ['claim', 'rent', 'build'].includes(p.purpose) ? [...new Set(team.jokers)].filter((j) => j !== 'shield') : [];
    const tools = `${jokers.map((j) => `<button class="cr-dbtn ks-joker" data-act="joker" data-v="${j}" lang="en" title="Joker" ${j === 'fifty' && (hidden.length || pres.options.length < 3) ? 'disabled' : ''}>${JOKER_NAMES[j]}</button>`).join('')}${revealed ? '' : `<button class="cr-dbtn" data-act="replace" title="Soruyu değiştir (N)">${ICONS.swap}</button>`}`;
    return `<section class="cr-q ks-q${revealed ? ' is-revealed' : ''}${pres.img ? ' has-pic' : ''}" role="dialog" aria-modal="true" aria-label="Soru">
      <div class="cr-qhead">${head}</div>
      <div class="cr-qbody">
        <div class="cr-prompt">
          ${park ? `<div class="cr-host"><img src="${esc(mascot)}" alt=""><span class="cr-bubble" lang="en">${revealed ? 'Say it with me!' : 'Listen!'}</span></div>` : '<span aria-hidden="true"></span>'}
          <div class="cr-prompt-main">
            ${pres.img ? `<img class="cr-qpic" src="${esc(pres.img)}" alt="">` : ''}
            <div class="cr-prompt-text" lang="en">${revealed ? (pres.kind === 'vocab' ? `<span class="cr-blank is-filled">${esc(pres.say)}</span>` : promptHtml(item.stem, pres.options[pres.answer].text)) : promptHtml(stem)}</div>
          </div>
          <button class="cr-speak" data-act="speak" aria-label="Soruyu sesli oku">${ICONS.speak}</button>
        </div>
        <div class="cr-options${pres.options.length === 3 ? ' is-three' : ''}${pres.optionImgs ? ' is-pics' : ''}" ${showOpts ? '' : 'hidden'}>${opts}</div>
      </div>
      <div class="cr-qfoot">
        ${ringHtml(p.stage !== 'revealed')}
        <div class="cr-stagebar">${bar}</div>
        <div class="cr-hints">${tools}</div>
      </div>
    </section>`;
  }

  // The Garage card: the wrong sentence; the reveal shows the right one and
  // the teacher judges what the speaker said.
  function fixHtml(s, p) {
    const m = s.profile.mode;
    const team = s.teams[s.turn];
    const e = errorSentence(s, p.errorIdx) || { wrong: '', right: '', tr: '' };
    const revealed = p.stage === 'revealed';
    const head = `${teamPill(team, m)}<span class="cr-seat"><span lang="en">${seatWord(s)}</span><b>${s.seat}</b></span><span class="cr-tileval" lang="en">Fix it!</span>`;
    let bar;
    if (p.stage === 'prompt') bar = '<button class="cr-bigbtn" data-act="talk" lang="en">Team talk ▶</button>';
    else if (p.stage === 'talk') bar = `<span class="cr-dock-info" style="font-size:calc(var(--u)*1.4)">Konuşmacı doğru cümleyi söylesin, sonra:</span><button class="cr-bigbtn is-pulse" data-act="reveal" lang="en">Show the answer</button><button class="cr-dbtn" data-act="plus10">+10</button>`;
    else bar = `<div class="cr-reveal ks-reveal">${e.tr ? `<div class="cr-why">${esc(e.tr)}</div>` : ''}<div class="cr-judge"><button class="cr-dbtn cr-yes" data-act="fixok" title="1 ya da Boşluk">Düzeltti ✓</button><button class="cr-dbtn cr-no" data-act="fixno" title="2">Henüz değil</button></div><span class="ks-keys">Klavye: 1 ya da Boşluk = Düzeltti · 2 = Henüz değil</span></div>`;
    return `<section class="cr-q ks-q ks-fixq${revealed ? ' is-revealed' : ''}" role="dialog" aria-modal="true" aria-label="Cümle düzeltme">
      <div class="cr-qhead">${head}</div>
      <div class="cr-qbody ks-fixbody">
        <div class="ks-fix">
          ${icon(s.board[GARAGE].icon, 'ks-fixico')}
          <p class="ks-fix-ask" lang="en">${revealed ? 'Say it right:' : 'Find the mistake. Say it right!'}</p>
          <div class="ks-fix-wrong" lang="en">${esc(e.wrong)}</div>
          ${revealed ? `<div class="ks-fix-right" lang="en">${esc(e.right)}</div>` : ''}
        </div>
      </div>
      <div class="cr-qfoot">
        ${ringHtml(!revealed)}
        <div class="cr-stagebar">${bar}</div>
        <div class="cr-hints">${revealed ? '' : `<button class="cr-dbtn" data-act="replace" title="Başka cümle (N)">${ICONS.swap}</button>`}</div>
      </div>
    </section>`;
  }

  function renderQuestion(s) {
    const p = s.pending;
    const key = `q:${s.turnCount}:${p.purpose}:${p.purpose === 'fix' ? `e${p.errorIdx}` : p.itemId}`;
    overlay().innerHTML = p.purpose === 'fix' ? fixHtml(s, p) : questionHtml(s, p);
    afterQuestionRender(s, p, key);
  }

  function afterQuestionRender(s, p, key) {
    if (ui.key !== key) {
      stopTimers(); ui.key = key; ui.revealKey = null; ui.talkRan = false;
      if (p.stage === 'prompt') {
        sound.play('flip');
        // A wrong sentence is never read aloud.
        if (s.profile.autoRead && p.purpose !== 'fix') speakLater(promptText(s, p), 0.8, 350);
      }
    }
    // The options come after the delay. Armed again whenever the question is
    // back at 'prompt' with no delay running (an undo of a 50:50, say).
    if (p.stage === 'prompt' && !ui.delay) {
      ui.delay = setTimeout(() => {
        ui.delay = null;
        const cur = store && store.state.pending;
        if (cur && cur.kind === 'question' && cur.stage === 'prompt') store.dispatch({ type: 'STAGE', stage: 'talk', transient: true });
      }, s.profile.optionsDelay * 1000);
    }
    if (p.stage === 'talk' && !ui.talkRan) { ui.talkRan = true; startTalk(s); }
    if (p.stage === 'talk') drawRing();
    if (p.stage === 'revealed' && ui.revealKey !== key) {
      ui.revealKey = key;
      sound.play('correct');
      const sentence = p.purpose === 'fix' ? (errorSentence(s, p.errorIdx) || {}).right : answerSentence(s, p);
      if (sentence) { speakLater(sentence, s.profile.autoRead ? 0.8 : 0.95, 500); if (s.profile.mode === 'park') speakLater(sentence, 0.8, 3400); }
    }
  }

  // ---- cards -----------------------------------------------------------------
  function renderCard(s) {
    const p = s.pending;
    const key = `c:${s.turnCount}:${p.kind}:${p.note || ''}:${p.square ?? ''}:${p.ref || ''}`;
    const fresh = ui.cardKey !== key;
    if (fresh) {
      stopTimers(); ui.cardKey = key; ui.mic = null;
      sound.play('card');
      const said = cardSpeech(s, p);
      if (said && s.profile.autoRead) speakLater(said, 0.85, 450);
    }
    const { html, style = '' } = cardHtml(s, p);
    overlay().innerHTML = `<div class="cr-cardov ks-cardov" role="dialog" aria-modal="true" aria-label="Kart"><div class="cr-bigcard ks-card ks-card--${esc(p.kind)}" style="${style}${fresh ? '' : 'animation:none;'}">${html}</div></div>`;
    if (p.kind === 'mic') drawMic();
  }

  // Kids hear the whole-class cards read out.
  function cardSpeech(s, p) {
    if (p.kind === 'nest') return (NEST_BREAKS[p.breakIdx] || NEST_BREAKS[0]).text;
    if (p.kind === 'chance-task' && s.profile.mode === 'park') return p.card.text;
    if (p.kind === 'info' && p.note === 'home') return `Home sweet home! ${s.board[p.square].name}!`;
    if (p.kind === 'info' && p.note === 'event' && p.card && s.profile.mode === 'park') return p.card.text;
    return null;
  }

  function rateButtons(r) {
    return `<div class="cr-actions ks-rates">
      <button class="cr-bigbtn ks-great" data-act="rate" data-v="great" lang="en" title="1">Great! <small>+${r.great}</small></button>
      <button class="cr-bigbtn ks-ok" data-act="rate" data-v="ok" lang="en" title="2">OK <small>+${r.ok}</small></button>
      <button class="cr-bigbtn ks-alt" data-act="rate" data-v="try" lang="en" title="3">Try again</button>
    </div>`;
  }

  const everybodyPill = () => '<span class="cr-qteam ks-cardteam" style="--tc:var(--accent)"><span lang="en">Everybody!</span></span>';

  function cardHtml(s, p) {
    const m = s.profile.mode;
    const team = s.teams[s.turn];
    const who = teamPill(team, m, 'ks-cardteam');
    if (p.kind === 'deed') {
      const sq = s.board[p.square];
      const k = STREETS.indexOf(sq.street);
      const st = s.streets[k];
      const can = canBuy(s);
      return {
        style: `${streetVars(s, k)}border-color:var(--sc);`,
        html: `<div class="ks-deedband"><span lang="en">Street ${sq.street}</span><span lang="${langOf(st.label)}">${esc(st.label)}</span></div>
          ${who}
          ${picHtml(s, sq, 'ks-cardpic')}
          <h2 lang="en">${esc(sq.name)}</h2>
          <p class="ks-big" lang="en">Price: <b>${unitText(m, sq.price)}</b> · Rent: ${unitText(m, round10(sq.price * RENT_RATES[0]))}</p>
          <p class="ks-have${can ? '' : ' is-warn'}" lang="en">${can ? `You have ${unitText(m, team.cash)}.` : `Not enough coins: you have ${team.cash}.`}</p>
          <div class="cr-actions">
            <button class="cr-bigbtn" data-act="buy" lang="en" ${can ? 'data-main' : 'disabled'}>Let’s buy it!</button>
            <button class="cr-bigbtn ks-alt" data-act="pass" lang="en" ${can ? '' : 'data-main'}>It’s too expensive.</button>
          </div>
          <p class="cr-note">Takım kararını bu cümlelerden biriyle söylesin, sonra dokunun.</p>`,
      };
    }
    if (p.kind === 'garage') {
      const fee = m === 'studio';
      return {
        html: `${who}
          ${icon(s.board[GARAGE].icon, 'ks-cardpic')}
          <h2 lang="en">${esc(s.board[GARAGE].name)}</h2>
          <p class="ks-big" lang="en">${m === 'arena' ? 'You are stuck in the Asteroid Belt.' : 'Your car is in the Garage.'} How do you get out?</p>
          <div class="cr-actions">
            <button class="cr-bigbtn" data-act="fix" data-main lang="en">Fix a sentence</button>
            ${fee ? `<button class="cr-bigbtn ks-alt" data-act="payout" lang="en" ${team.cash >= PAY_OUT_FEE ? '' : 'disabled'}>Pay ${PAY_OUT_FEE} to leave</button>` : ''}
            <button class="cr-bigbtn ks-alt" data-act="wait" lang="en">Wait</button>
          </div>
          <p class="cr-note">Cümleyi düzeltirse hemen zar atar. “Wait” bu turu geçirir, sonraki turda takım serbesttir.${fee ? ' Ödeme Open Mic kasasına gider.' : ''}</p>`,
      };
    }
    if (p.kind === 'chance-task') {
      const card = p.card;
      if (m === 'park') {
        return {
          html: `${everybodyPill()}
            ${icon(s.board[3].icon, 'ks-cardpic')}
            <h2 lang="en">${CHANCE_TITLES[m]}</h2>
            <p class="ks-big" lang="en">${esc(card.text)}</p>
            <div class="cr-actions"><button class="cr-bigbtn" data-act="ok" data-main lang="en">Done!</button></div>
            <p class="cr-note">Bütün sınıf birlikte yapar; her takım +1 yıldız. ${esc(card.tr || '')}</p>`,
        };
      }
      return {
        html: `${who}
          ${icon(s.board[3].icon, 'ks-cardpic')}
          <h2 lang="en">${CHANCE_TITLES[m]}</h2>
          <p class="ks-big" lang="en">${esc(card.text)}</p>
          ${card.criteria ? `<p class="ks-crit" lang="en">✓ ${esc(card.criteria)}</p>` : ''}
          ${rateButtons(TASK_REWARDS[m])}
          <p class="cr-note">${esc(card.tr || '')} · Değerlendirin (1, 2, 3 tuşları da olur).</p>`,
      };
    }
    if (p.kind === 'mic') {
      const mp = micPrompt(s, p.micIdx) || { text: '', criteria: '', tr: '' };
      const half = Math.min(s.pot, round10(s.pot / 2));
      // One clock button that changes in place (start, pause, go on), so the
      // card never moves under the teacher's finger.
      const mic = ui.mic;
      const clockBtn = !mic ? '<button class="cr-bigbtn is-pulse" data-act="mictoggle" data-main lang="en">Start the clock ▶</button>'
        : mic.left <= 0 ? '<button class="cr-bigbtn ks-alt" disabled lang="en">Time’s up!</button>'
        : mic.timer ? '<button class="cr-bigbtn ks-alt" data-act="mictoggle" data-main lang="en">Pause ❚❚</button>'
        : '<button class="cr-bigbtn" data-act="mictoggle" data-main lang="en">Go on ▶</button>';
      return {
        html: `${who}
          <h2 lang="en">${esc(s.board[10].name)}</h2>
          <div class="ks-microw">
            <div class="cr-ring ks-micring"><svg viewBox="0 0 44 44"><circle class="cr-ring-track" cx="22" cy="22" r="19" fill="none" stroke-width="5"/><circle class="cr-ring-bar" cx="22" cy="22" r="19" fill="none" stroke-width="5" stroke-linecap="round" stroke-dasharray="119.4" stroke-dashoffset="0" data-micbar/></svg><b data-micn>30</b></div>
            <div class="ks-mictext"><p class="ks-big" lang="en">${esc(mp.text)}</p><p class="ks-crit" lang="en">✓ ${esc(mp.criteria)}</p></div>
          </div>
          <p class="ks-pot" lang="en">${icon('coin', '')}Pot: <b>${unitText(m, s.pot)}</b> · Great wins it all, OK wins half.</p>
          <div class="cr-actions ks-micbtn">${clockBtn}</div>
          ${rateButtons({ great: s.pot, ok: half })}
          <p class="cr-note">${esc(mp.tr)} · 30 saniye konuşma. Boşluk: saati başlatır ya da durdurur; 1, 2, 3: değerlendirme. “Try again”: konu bir sonraki sefere kalır.</p>`,
      };
    }
    if (p.kind === 'nest') {
      const br = NEST_BREAKS[p.breakIdx] || NEST_BREAKS[0];
      return {
        html: `${everybodyPill()}
          <img class="ks-cardpic ks-kommo" src="${esc(mascot)}" alt="">
          <h2 lang="en">${esc(s.board[6].name)}</h2>
          <p class="ks-big" lang="en">${esc(br.text)}</p>
          <div class="cr-actions"><button class="cr-bigbtn" data-act="ok" data-main lang="en">Done!</button></div>
          <p class="cr-note">Hareket molası: bütün sınıf yapar, her takım +1 yıldız. ${esc(br.tr)}</p>`,
      };
    }
    return { html: infoHtml(s, p, who) };
  }

  // Every info note the rules emit: one picture, one English line, an amount.
  function infoHtml(s, p, who) {
    const m = s.profile.mode;
    const b = s.board;
    const sq = p.square != null ? b[p.square] : null;
    let pic = sq ? picHtml(s, sq, p.note === 'home' ? 'ks-cardpic is-home' : 'ks-cardpic') : '';
    let title = sq ? sq.name : '';
    let text = '';
    let amount = '';
    let tr = '';
    switch (p.note) {
      case 'start':
        pic = icon(b[0].icon, 'ks-cardpic'); title = b[0].name;
        text = m === 'park' ? 'You are back at the Harbour!' : m === 'arena' ? 'Back on the Launch Pad!' : 'You landed on START!';
        amount = `+${unitText(m, p.amount)}`;
        break;
      case 'visiting':
        text = m === 'arena' ? 'Just flying past the asteroids.' : 'Just visiting!';
        tr = 'Sadece ziyaret: bir şey olmaz.';
        break;
      case 'toGarage':
        text = m === 'arena' ? 'The tractor beam pulls you into the Asteroid Belt! Next turn, fix a sentence to get out.' : 'Do not pass START. Next turn, fix a sentence to get out.';
        tr = 'Takım garaja gider. Sıradaki turunda cümle düzeltme kartı gelir.';
        break;
      case 'slide':
        text = 'Wheee! Slide down to the Harbour!';
        amount = `+${unitText(m, p.amount)}`;
        break;
      case 'joker':
        text = p.joker ? `You got a joker: ${JOKER_NAMES[p.joker]}!` : 'You already have two jokers.';
        amount = p.joker ? '' : `+${unitText(m, p.amount)}`;
        tr = p.joker ? `${JOKER_TEXT[p.joker]} (50:50 ve Swap soru ekranında düğme olarak çıkar; Shield kirada kendiliğinden kullanılır.)` : '';
        break;
      case 'event': {
        pic = icon(b[3].icon, 'ks-cardpic'); title = CHANCE_TITLES[m];
        text = p.card ? p.card.text : '';
        tr = p.card ? p.card.tr || '' : '';
        const e = p.card ? p.card.effect : {};
        if (e.type === 'gain' || e.type === 'toStart') amount = `+${unitText(m, p.amount)}`;
        else if (e.type === 'payPot') amount = `−${unitText(m, p.amount)}`;
        else if (e.type === 'allGain') amount = `Everybody +${unitText(m, p.amount)}`;
        else if (e.type === 'joker') amount = p.joker ? `Joker: ${JOKER_NAMES[p.joker]}` : `+${unitText(m, p.amount)}`;
        break;
      }
      case 'no-free':
        text = m === 'arena' ? 'No free planets left!' : m === 'park' ? 'All the treasures are found!' : 'No free places left!';
        amount = p.amount ? `+${unitText(m, p.amount)}` : '';
        break;
      case 'cant-afford':
        text = `Not enough coins to buy ${sq ? sq.name : 'it'} (${unitText(m, p.amount)}).`;
        tr = 'A1: doğru cevapta yer kendiliğinden alınır; para yetmediği için boş kaldı.';
        break;
      case 'home':
        title = 'Home sweet home!';
        text = `${sq ? sq.name : ''}! Say it together!`;
        amount = '+1 star';
        tr = 'Sınıf yerin adını birlikte söyler.';
        break;
      case 'no-items':
        text = 'No questions left here.';
        tr = 'Bu sokakta soru kalmadı; devam edin.';
        break;
      default:
        text = '';
    }
    return `${who}
      ${pic}
      <h2 lang="en">${esc(title)}</h2>
      ${text ? `<p class="ks-big" lang="en">${esc(text)}</p>` : ''}
      ${amount ? `<p class="ks-amount" lang="en">${esc(amount)}</p>` : ''}
      <div class="cr-actions"><button class="cr-bigbtn" data-act="ok" data-main>Devam ▶</button></div>
      ${tr ? `<p class="cr-note">${esc(tr)}</p>` : ''}`;
  }

  // ---- resume: "Last time…" ----------------------------------------------------
  function renderLastTime(s) {
    const m = s.profile.mode;
    overlay().innerHTML = `<div class="cr-cardov" data-act="lasttime" role="dialog" aria-modal="true" aria-label="Geçen dersin durumu"><div class="cr-bigcard ks-card">
      <h2 lang="en">Last time…</h2>
      <ol class="ks-standings">${ranking(s).map((t) => `<li style="${teamVars(t)}"><span class="ks-place">${t.place + 1}.</span><span class="cr-team-ico">${teamGlyph(t, m)}</span><span class="ks-sname" lang="${langOf(t.name)}">${esc(t.name)}</span><b>${scoreText(s, m === 'park' ? t.cash : t.worth)}</b></li>`).join('')}</ol>
      <p class="cr-note">${m === 'park' ? 'Yıldızlar' : m === 'arena' ? 'Kredi + gezegenler' : 'Jeton + yerlerin değeri'}. Devam etmek için dokunun.</p>
    </div></div>`;
  }

  // ---- timers ------------------------------------------------------------
  // keep: go on from ui.left (the +10 after the ring ran out), not a new huddle.
  function startTalk(s, keep = false) {
    if (ui.talk) return;
    if (!keep) { ui.total = s.profile.huddle; ui.left = ui.total; }
    ui.talk = setInterval(() => {
      if (ui.paused) return;
      ui.left -= 1;
      if (ui.left <= 3 && ui.left > 0) sound.play('tick');
      drawRing();
      if (ui.left <= 0) { clearInterval(ui.talk); ui.talk = null; sound.play('timeUp'); }
    }, 1000);
  }
  function drawRing() {
    const bar = $('[data-ringbar]', root); const n = $('[data-ringn]', root);
    if (!bar || !n) return;
    const k = ui.total ? Math.max(0, ui.left) / ui.total : 0;
    bar.style.strokeDashoffset = String(119.4 * (1 - k));
    n.textContent = String(Math.max(0, ui.left));
  }
  // Open Mic: 30 seconds, started by the teacher when the speaker is ready;
  // the same button pauses the clock and goes on.
  function toggleMic() {
    const mic = ui.mic || (ui.mic = { left: 30, total: 30, timer: null });
    if (mic.timer) { clearInterval(mic.timer); mic.timer = null; }
    else if (mic.left > 0) {
      mic.timer = setInterval(() => {
        if (ui.paused) return;
        mic.left -= 1;
        if (mic.left <= 3 && mic.left > 0) sound.play('tick');
        drawMic();
        if (mic.left <= 0) { clearInterval(mic.timer); mic.timer = null; sound.play('timeUp'); if (store && ui.mic === mic) renderCard(store.state); }
      }, 1000);
    }
    renderCard(store.state);
  }
  function drawMic() {
    const bar = $('[data-micbar]', root); const n = $('[data-micn]', root);
    if (!bar || !n) return;
    const left = ui.mic ? Math.max(0, ui.mic.left) : 30;
    const total = ui.mic ? ui.mic.total : 30;
    bar.style.strokeDashoffset = String(119.4 * (1 - left / total));
    n.textContent = String(left);
  }
  function stopTimers() {
    clearTimeout(ui.delay); clearInterval(ui.talk); clearTimeout(ui.revealT); ui.delay = null; ui.talk = null; ui.revealT = null;
    if (ui.mic && ui.mic.timer) { clearInterval(ui.mic.timer); ui.mic.timer = null; }
  }
  function stopSpeech() { for (const t of ui.speakTimers) clearTimeout(t); ui.speakTimers = []; speech.stop(); }
  function speakLater(text, rate, ms) { ui.speakTimers.push(setTimeout(() => { if (voiceReady) speech.speak(text, { rate }); }, ms)); }

  // ---- lesson clock ------------------------------------------------------------
  // Counts only while the stage is open and is kept per board code, so it
  // pauses between lessons. Five minutes before the end a warning; at the end
  // the final round starts. The clock's final round is not undoable: an undo
  // that takes it away gets it back on the next tick (without a second splash).
  function clockText(s) {
    const c = ui.clock;
    const sec = Math.floor((c ? c.ms : 0) / 1000);
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')} / ${s.minutes} dk`;
  }
  function startClock() {
    stopClock();
    const code = store.state.code;
    const c = readJson(CLOCK_KEY, null);
    ui.clock = c && c.code === code ? { code, ms: Number(c.ms) || 0, warned: !!c.warned, fired: !!c.fired } : { code, ms: 0, warned: false, fired: false };
    let last = performance.now();
    ui.clockT = setInterval(() => {
      const now = performance.now();
      const dt = Math.min(now - last, 65000); // a sleeping laptop does not eat the lesson
      last = now;
      if (!store || store.state.phase === 'end') return;
      ui.clock.ms += dt;
      tickClock();
    }, 1000);
  }
  function tickClock() {
    const s = store.state;
    const c = ui.clock;
    const total = s.minutes * 60000;
    if (!c.warned && c.ms >= total - 5 * 60000) {
      c.warned = true;
      if (s.profile.mode === 'park') stageToast('The ship leaves in 5 minutes!', 4200, true);
      else stageToast('Son 5 dakika: süre bitince son tur başlar.', 4200);
    }
    if (c.ms >= total && !s.finalRound && s.phase !== 'end') {
      const quiet = !!c.fired;
      c.fired = true;
      store.dispatch({ type: 'FINAL_ROUND', transient: true, quiet });
    }
    writeJson(CLOCK_KEY, c);
    const n = $('[data-clock]', root);
    if (n) n.textContent = clockText(store.state);
  }
  function stopClock() { clearInterval(ui.clockT); ui.clockT = null; }

  // ---- end -----------------------------------------------------------------
  // Drawn again after every change (a score fix with E), but the fanfare,
  // the confetti and the entrance animations come only the first time.
  function renderEnd(s) {
    stopTimers(); stopHops();
    const first = !ui.endShown;
    ui.endShown = true;
    const m = s.profile.mode;
    const awards = endingTitles(s);
    const titleOf = (id) => (awards.find((a) => a.teamId === id) || {}).title;
    const table = ranking(s);
    const missed = s.missed.map((id) => s.items[id]).filter(Boolean);
    const badge = (t) => `<span class="cr-badge" style="display:inline-grid;vertical-align:middle;margin-right:10px;background:${t.hex};color:${t.ink || '#fff'}">${teamGlyph(t, m)}</span>`;
    let body;
    if (m === 'studio') {
      const mvp = awards.find((a) => a.title === 'Language MVP');
      body = `<h1 lang="en">${esc(STAGE_NAMES.studio)} · Final results</h1>
        <table class="cr-table ks-worth" lang="en"><thead><tr><th></th><th>Team</th><th>Coins</th><th>Places</th><th>Net worth</th></tr></thead><tbody>
        ${table.map((t) => `<tr><td style="width:3ch;font-family:var(--font-display)">${t.place + 1}.</td><td>${badge(t)}<span lang="${langOf(t.name)}">${esc(t.name)}</span>${mvp && mvp.teamId === t.id ? '<span class="ks-mvp">Language MVP</span>' : ''}</td><td>${t.cash}</td><td>${t.owned}</td><td>${t.worth}</td></tr>`).join('')}
        </tbody></table>
        <p class="ks-endnote" lang="en">Net worth = coins + the price of every place + the buildings on them.${mvp ? ' Language MVP: the most right answers.' : ''}</p>`;
    } else if (m === 'arena') {
      const heights = [12, 9, 6.5];
      const pod = [table[1], table[0], table[2]].filter(Boolean);
      body = `<h1 lang="en">${esc(STAGE_NAMES.arena)} · Final</h1>
        <div class="cr-podium">${pod.map((t) => `<div class="cr-pod" style="--tc:${t.hex}"><h3 lang="${langOf(t.name)}">${esc(t.name)}</h3><div class="cr-pod-block" style="height:calc(var(--u)*${heights[Math.min(2, t.place)]})">${t.place + 1}</div><div class="ks-podscore" lang="en">${t.worth} <small>${t.worth === 1 ? 'point' : 'points'}</small></div></div>`).join('')}</div>
        <p class="ks-endnote" lang="en">Points = credits + the price of every planet + 2 for each module or ring.</p>
        <div class="cr-awards">${table.map((t, i) => `<div class="cr-award" style="${teamVars(t)}animation-delay:${i * 0.1}s"><span class="cr-team-ico">${teamGlyph(t, m)}</span><h3 lang="${langOf(t.name)}">${t.place + 1}. ${esc(t.name)}</h3><div class="cr-award-title" lang="en">${esc(titleOf(t.id) || 'Team spirit')}</div><div class="cr-award-score" lang="en">${t.worth} points: ${unitText(m, t.cash)} · ${t.owned} ${t.owned === 1 ? 'planet' : 'planets'} · best streak ${t.bestStreak}</div></div>`).join('')}</div>`;
    } else {
      body = `<h1 lang="en">Well done, everyone!</h1>
        <div class="cr-awards">${table.map((t, i) => `<div class="cr-award" style="${teamVars(t)}animation-delay:${i * 0.1}s"><span class="cr-team-ico">${teamGlyph(t, m)}</span><h3 lang="${langOf(t.name)}">${esc(t.name)}</h3><div class="cr-award-title" lang="en">${esc(titleOf(t.id) || 'Island Friends')}</div><div class="cr-award-score" lang="en">★ ${t.cash} · ${t.owned} ${t.owned === 1 ? 'treasure' : 'treasures'}</div></div>`).join('')}</div>`;
    }
    const review = missed.length ? `<div class="cr-review"><h2>${m === 'park' ? '<span lang="en">Words to practise</span>' : 'Kaçırılanlar'} (${missed.length})</h2><ol lang="en">${missed.map((it) => `<li>${it.type === 'vocab' ? `${it.pic ? `<img class="ks-revpic" src="${esc(it.pic)}" alt="">` : ''}${esc(it.say || it.term)}` : promptHtml(it.stem, it.options ? it.options[it.answer] : '')}</li>`).join('')}</ol></div>` : '';
    const scroll = first ? 0 : ($('.ks-end', root) || {}).scrollTop || 0;
    overlay().innerHTML = `<section class="cr-end ks-end${first ? '' : ' is-again'}" aria-label="Oyun sonu">${body}${review}</section>
      <div class="cr-endbar"><button class="cr-btn" data-act="undo">Geri al</button><button class="cr-btn cr-btn--go" data-act="newgame">Yeni oyun</button><button class="cr-btn" data-act="print">Yazdır</button></div>`;
    if (!first) { $('.ks-end', root).scrollTop = scroll; return; }
    sound.play('finale');
    if (m !== 'studio' && !reducedMotion()) confetti(root, s.teams.map((t) => t.hex));
  }

  function scoreEditor() {
    const s = store.state;
    const unit = s.profile.mode === 'studio' ? 50 : 1;
    const m = el(`<div class="cr-modal" role="dialog" aria-modal="true" aria-label="Puanı düzelt"><div class="cr-modal-box"><h2>Puanı düzelt (${CURRENCY[s.profile.mode].tr})</h2>
      <div class="cr-score-rows">${s.teams.map((t) => `<div class="cr-score-row"><span class="cr-badge" style="background:${t.hex};color:${t.ink || '#fff'}">${teamGlyph(t, s.profile.mode)}</span><span>${esc(t.name)} · <b data-sc="${esc(t.id)}">${t.cash}</b></span>
        <span class="cr-row"><button class="cr-mini" data-adj="${esc(t.id)}" data-d="${-unit}">−${unit}</button><button class="cr-mini" data-adj="${esc(t.id)}" data-d="${unit}">+${unit}</button></span></div>`).join('')}</div>
      <div style="text-align:right;margin-top:12px"><button class="cr-btn" data-close>Tamam</button></div></div></div>`);
    m.addEventListener('click', (ev) => {
      const adj = ev.target.closest('[data-adj]');
      if (adj) { store.dispatch({ type: 'ADJUST', teamId: adj.dataset.adj, delta: Number(adj.dataset.d) }); const t = store.state.teams.find((x) => x.id === adj.dataset.adj); const n = m.querySelector(`[data-sc="${CSS.escape(adj.dataset.adj)}"]`); if (n && t) n.textContent = String(t.cash); }
      if (ev.target === m || ev.target.closest('[data-close]')) m.remove();
    });
    root.appendChild(m);
    m.querySelector('[data-close]').focus();
  }

  function freeze() {
    const f = el('<div class="cr-freeze" role="dialog" aria-label="Ekran karartıldı. Devam etmek için dokunun."></div>');
    const was = ui.paused; ui.paused = true;
    const done = () => { f.remove(); ui.paused = was; window.removeEventListener('keydown', key, true); };
    const key = (ev) => { ev.stopPropagation(); ev.preventDefault(); done(); };
    f.addEventListener('click', done);
    setTimeout(() => window.addEventListener('keydown', key, { capture: true, once: true }), 50);
    root.appendChild(f);
  }

  // ---- input ---------------------------------------------------------------
  function act(name, v) {
    const s = store.state;
    const p = s.pending;
    const busy = !!ui.anim;
    switch (name) {
      case 'roll':
        if (!busy && !locked() && s.phase === 'roll') { lock(); sound.play('tap'); ui.tumble = true; store.dispatch({ type: 'ROLL' }); }
        break;
      case 'die':
        if (!busy && !locked() && s.phase === 'roll') { lock(); sound.play('tap'); store.dispatch({ type: 'ROLL', value: Number(v) }); }
        break;
      case 'talk': if (!locked()) { lock(); clearTimeout(ui.delay); ui.delay = null; store.dispatch({ type: 'STAGE', stage: 'talk', transient: true }); } break;
      case 'reveal':
        if (!locked()) {
          lock(); stopTimers(); sound.play('boardsUp');
          // Cancelled by an undo or a new question in the meantime (stopTimers).
          const key = ui.key;
          ui.revealT = setTimeout(() => { ui.revealT = null; if (store && ui.key === key) store.dispatch({ type: 'REVEAL' }); }, reducedMotion() ? 0 : 500);
        }
        break;
      case 'chip': store.dispatch({ type: 'TOGGLE', teamId: v }); break;
      case 'continue':
        if (!locked() && p && p.kind === 'question') {
          lock();
          if (p.purpose !== 'everyone' && !p.chips[s.teams[s.turn].id]) sound.play('miss');
          store.dispatch({ type: 'CONTINUE' });
        }
        break;
      case 'fixok': if (!locked()) { lock(); store.dispatch({ type: 'CONTINUE', ok: true }); } break;
      case 'fixno': if (!locked()) { lock(); sound.play('miss'); store.dispatch({ type: 'CONTINUE', ok: false }); } break;
      case 'replace': if (p && p.kind === 'question' && !locked()) { lock(); store.dispatch({ type: 'REPLACE' }); } break;
      case 'joker': if (!locked()) { lock(); sound.play('card'); store.dispatch({ type: 'JOKER', kind: v }); } break;
      case 'plus10': ui.left = Math.max(0, ui.left) + 10; ui.total = Math.max(ui.total, ui.left); if (!ui.talk) startTalk(s, true); drawRing(); break;
      case 'buy': if (!locked()) { lock(); store.dispatch({ type: 'BUY' }); } break;
      case 'pass': if (!locked()) { lock(); store.dispatch({ type: 'PASS' }); } break;
      case 'ok': if (!locked()) { lock(); store.dispatch({ type: 'CARD_OK' }); } break;
      case 'rate': if (!locked()) { lock(); if (v === 'try') sound.play('miss'); store.dispatch({ type: 'RATE', grade: v }); } break;
      case 'mictoggle': if (!locked() && p && p.kind === 'mic') { lock(); sound.play('tap'); toggleMic(); } break;
      case 'pick': if (!locked()) { lock(); sound.play('tap'); store.dispatch({ type: 'PICK', square: Number(v) }); } break;
      case 'fix': if (!locked()) { lock(); store.dispatch({ type: 'FIX_START' }); } break;
      case 'payout': if (!locked()) { lock(); store.dispatch({ type: 'PAY_OUT' }); } break;
      case 'wait': if (!locked()) { lock(); store.dispatch({ type: 'WAIT' }); } break;
      case 'lasttime': ui.lastTime = false; lock(); renderOverlay(s); break;
      case 'speak': {
        if (!p || p.kind !== 'question') break;
        const text = p.purpose === 'fix' ? (p.stage === 'revealed' ? (errorSentence(s, p.errorIdx) || {}).right : null) : promptText(s, p);
        if (text && !(voiceReady && speech.speak(text, { rate: s.profile.autoRead ? 0.8 : 0.95 }))) stageToast('İngilizce ses bulunamadı: lütfen siz okuyun.');
        break;
      }
      case 'undo': store.undo(); break;
      case 'scores': scoreEditor(); break;
      case 'mute': sound.setMuted(!sound.muted); renderDock(s); break;
      case 'full': requestFull(); break;
      case 'freeze': freeze(); break;
      case 'final': if (s.phase !== 'end' && !s.finalRound) { store.dispatch({ type: 'FINAL_ROUND' }); stageToast('Son tur başladı: sıra ilk takıma dönünce oyun biter.', 3200); } break;
      case 'finish': if (window.confirm('Oyun şimdi bitsin mi? Sonuçlar bu haliyle gösterilir.')) store.dispatch({ type: 'FINISH' }); break;
      case 'newgame':
        stopSpeech(); stopHops(); stopClock(); stopTimers(); store.clearSave();
        try { localStorage.removeItem(CLOCK_KEY); } catch { /* ignore */ }
        store = null; ui = freshUi(); setupUi.render();
        break;
      case 'print': window.print(); break;
      default: break;
    }
  }

  // The pick cursor goes to the nearest free square in the arrow's direction
  // on the board (not along the ring); with no key, to the first free square.
  function movePick(key) {
    const free = freePlaces(store.state);
    if (!free.length) return;
    let next = free[0];
    if (key && ui.pickAt != null) {
      const [r, c] = cellOf(ui.pickAt);
      const [dr, dc] = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[key] || [0, 1];
      let best = null;
      for (const i of free) {
        const [r2, c2] = cellOf(i);
        const along = (r2 - r) * dr + (c2 - c) * dc;
        if (along <= 0) continue;
        const cost = along + 2 * (Math.abs(r2 - r) * Math.abs(dc) + Math.abs(c2 - c) * Math.abs(dr));
        if (!best || cost < best.cost) best = { i, cost };
      }
      next = best ? best.i : ui.pickAt;
    }
    ui.pickAt = next;
    sound.play('tap');
    for (const b of $$('.ks-sq.is-pick', root)) b.classList.toggle('is-cursor', Number(b.dataset.v) === next);
  }

  function onKey(e) {
    if (!store) return;
    if (e.target.closest && e.target.closest('input, textarea')) return;
    if ($('.cr-modal', root)) { if (e.key === 'Escape') $('.cr-modal', root).remove(); return; }
    const s = store.state;
    const p = s.pending;
    const k = e.key; const lower = k.length === 1 ? k.toLowerCase() : k;
    const advance = k === ' ' || k === 'Enter' || k === 'PageDown';
    if ((e.ctrlKey || e.metaKey) && lower === 'z') { e.preventDefault(); store.undo(); return; }
    if (e.repeat) { if (advance) e.preventDefault(); return; }
    if (lower === 'u' || k === 'PageUp') { e.preventDefault(); store.undo(); return; }
    // While the token hops, only undo works.
    if (ui.anim) { if (advance) e.preventDefault(); return; }
    if (lower === 'm') { act('mute'); return; }
    if (lower === 'f') { requestFull(); return; }
    if (lower === 'b' || k === '.') { e.preventDefault(); freeze(); return; }
    if (lower === 'e') { scoreEditor(); return; }
    if (lower === 'n') { act('replace'); return; }
    const fixJudge = p && p.kind === 'question' && p.purpose === 'fix' && p.stage === 'revealed';
    if (/^[1-6]$/.test(k) && !ui.lastTime) {
      if (s.phase === 'roll') { act('die', k); return; }
      // Rating cards: 1 Great, 2 OK, 3 Try again. The Garage: 1 fixed it, 2 not yet.
      const rating = p && ((p.kind === 'chance-task' && s.profile.mode !== 'park') || p.kind === 'mic');
      if (rating && Number(k) <= 3) act('rate', GRADES[Number(k) - 1]);
      else if (fixJudge && Number(k) <= 2) act(k === '1' ? 'fixok' : 'fixno');
      return;
    }
    // Wormhole / Windy Corner: the arrows walk over the free squares.
    if (p && p.kind === 'pick' && !ui.lastTime && /^Arrow/.test(k)) { e.preventDefault(); movePick(k); return; }
    if (!advance) return;
    e.preventDefault();
    if (ui.lastTime) { act('lasttime'); return; }
    if (s.phase === 'roll') { act('roll'); return; }
    if (!p) return;
    if (p.kind === 'question') {
      if (p.stage === 'prompt') act('talk');
      else if (p.stage === 'talk') act('reveal');
      else act(fixJudge ? 'fixok' : 'continue'); // the speaker is preset right, as the chips are
      return;
    }
    if (p.kind === 'pick') {
      // A focused square (Tab) or the arrow cursor is picked; the first press
      // with neither only shows the cursor, so a clicker can still go on.
      const sq = e.target.closest && e.target.closest('[data-act="pick"]');
      if (sq) act('pick', sq.dataset.v);
      else if (ui.pickAt != null) act('pick', String(ui.pickAt));
      else movePick(null);
      return;
    }
    const main = $('[data-overlay] [data-main]:not([disabled])', root);
    if (main) act(main.dataset.act, main.dataset.v);
  }

  root.addEventListener('click', (e) => {
    if (!store) return;
    const b = e.target.closest('[data-act]');
    if (b && !b.disabled) act(b.dataset.act, b.dataset.v);
  });
  window.addEventListener('keydown', onKey);
  window.addEventListener('beforeunload', (e) => { if (store && store.state.pending && store.state.pending.kind === 'question') { e.preventDefault(); e.returnValue = ''; } });

  setupUi.render();
  setupUi.preload();
}
