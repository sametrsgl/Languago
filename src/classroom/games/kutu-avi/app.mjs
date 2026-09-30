// Kutu Avı 2.0: setup screen, board, question flow, cards and endings.
// Teacher chrome is Turkish; everything students read on the stage is English.
import { MODES } from '../../core/groups.mjs';
import { glyph } from '../../core/teams.mjs';
import { createStore, readSave } from '../../core/store.mjs';
import { createSetup } from '../../core/setup.mjs';
import { createSound } from '../../core/sound.mjs';
import { createSpeech } from '../../core/speech.mjs';
import { makeBoardCode, shuffleSeeded } from '../../core/rng.mjs';
import { esc, $, $$, el, toast, bestGrid, confetti, reducedMotion, blankParts, fillBlanks, langOf, ICONS, CHEST_SVG, OPEN_CHEST_SVG, OPTION_SHAPES, OPTION_LETTERS } from '../../core/dom.mjs';
import { createGame, reduce, presented, isGold, remainingTiles, tileValue, CARDS, GOLD_CARDS, BRAIN_BREAK_ACTIONS, endingTitles, ranking, hardestItem, nextHint } from './logic.mjs';

const SAVE_KEY = 'lg:kutu-avi:save';
const SURPRISE_LABELS = ['Yok', 'Sakin', 'Canlı', 'Kaos'];
// Topic-free chest stickers for A1 young classes (easy words to call out).
const CHEST_STICKERS = ['red-apple', 'banana', 'soccer-ball', 'automobile', 'fish', 'cat', 'sun', 'star', 'tulip', 'kite', 'bell', 'key', 'top-hat', 'closed-book', 'alarm-clock', 'deciduous-tree', 'sailboat', 'red-heart', 'drum', 'egg', 'balloon', 'rocket', 'teddy-bear', 'rainbow', 'pizza', 'bus', 'dog', 'frog', 'crown', 'umbrella'];

// Never promise more tiles than the topic has questions for.
function fitBoard(size, itemCount) {
  let n = size;
  const sizes = [24, 20, 16, 12, 9, 6];
  while (itemCount < n * 0.9 && sizes.some((x) => x < n)) n = sizes.find((x) => x < n);
  return n;
}
const BOARD_SIZES = [12, 16, 20, 24];
// A double tap on a smart board must not reach the control that replaces the
// one just pressed (Team talk -> Boards up!, Devam -> a tile, ✓/✗ -> shadow chips).
const STAGE_LOCK_MS = 450;
const LOCKED_ACTS = new Set(['skipdelay', 'boards', 'peek', 'judge', 'choose', 'shadow', 'next', 'apply', 'skipcard', 'target', 'replace']);

const finite = (n) => typeof n === 'number' && Number.isFinite(n);

// A save from this game and this state shape. Anything else (an older schema,
// a hand-edited value) is dropped instead of breaking the setup screen.
export function validSave(save) {
  const s = save && save.state;
  if (!s || s.v !== 1 || s.game !== 'kutu-avi' || !s.pack || typeof s.pack.title !== 'string' || !s.profile || !s.items || typeof s.items !== 'object') return false;
  if (!['board', 'question', 'card', 'end'].includes(s.phase)) return false;
  if (!finite(s.profile.huddle) || !Array.isArray(s.tiles) || !s.tiles.length || !Array.isArray(s.teams) || !s.teams.length) return false;
  if (!s.teams.every((t) => t && /^[\w-]{1,40}$/.test(String(t.id)) && typeof t.name === 'string' && /^#[0-9a-f]{6}$/i.test(String(t.hex)) && finite(t.score) && finite(t.seats))) return false;
  if (!s.tiles.every((t) => t && Number.isInteger(t.n))) return false;
  if (!Number.isInteger(s.turn) || s.turn < 0 || s.turn >= s.teams.length) return false;
  if (s.phase === 'question' && !(s.current && s.current.kind === 'question' && finite(s.current.seat) && Number.isInteger(s.current.tile))) return false;
  if (s.phase === 'card' && !(s.current && s.current.kind === 'card' && Number.isInteger(s.current.tile))) return false;
  return true;
}

export function mountKutuAvi(root, { dataBase = '/sinif-oyunlari/paket', mascot = '/logo/kommo-512.png' } = {}) {
  const sound = createSound('studio');
  const speech = createSpeech();
  let voiceReady = false;
  speech.probe().then((ok) => { voiceReady = ok; });

  let store = null;
  let ui = freshUi();

  function freshUi() {
    return { qKey: null, boardsKey: null, revealKey: null, cardKey: null, endShown: false, endKey: null, delay: null, huddle: null, huddleStarted: false, left: 0, total: 0, timerPaused: false, peek: false, hl: null, digits: '', digitTimer: null, shown: {}, lastScores: null, lockUntil: 0, lastStageKey: null, speakTimers: [] };
  }

  const applySkin = (m) => { root.dataset.skin = m; sound.setSkin(m); };

  // The resumable save, if any: an unfinished game, or one ended early with
  // "Bitir" (its remaining tiles were promised for the next lesson).
  function readResumable() {
    const save = readSave(SAVE_KEY);
    if (!save) return null;
    if (!validSave(save)) { try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ } return null; }
    const st = save.state;
    return st.phase !== 'end' || (st.finishedEarly && remainingTiles(st) > 0) ? save : null;
  }

  // ------------------------------------------------------------ setup ----
  const setupUi = createSetup(root, {
    gameId: 'kutu-avi',
    title: 'Kutu Avı',
    lead: 'Takımlar sırayla kutu seçer. Her soruda bütün takımlar cevap kartını aynı anda kaldırır, sonra seçilen öğrenci cevabı İngilizce söyler.',
    mascot,
    dataBase,
    minTeams: 2,
    maxTeams: 8,
    defaultTeamCount: 4,
    isActive: () => !store,
    onSkin: applySkin,
    beforeRender: () => { stopTimers(); stopSpeech(); },
    gameDefaults: () => ({ boardSize: null, surprise: null }),
    gameSection: ({ opts, profile, modeId, chip: c }) => {
      const size = BOARD_SIZES.includes(opts.boardSize) ? opts.boardSize : MODES[modeId].boardSize;
      const surprise = Number.isInteger(opts.surprise) && opts.surprise >= 0 && opts.surprise < SURPRISE_LABELS.length ? opts.surprise : MODES[modeId].surprise;
      const minutes = Math.round((size * profile.secsPerTile) / 60);
      return `<section class="cr-card" aria-labelledby="st4">
        <h2 class="cr-step" id="st4"><b>4</b> Tahta</h2>
        <div class="cr-row"><span class="cr-row-label">Kutu sayısı · yaklaşık ${minutes} dk</span>
          ${BOARD_SIZES.map((n) => c(String(n), 'size', n, n === size)).join('')}</div>
        <div class="cr-row"><span class="cr-row-label">Sürpriz kartlar</span>
          ${SURPRISE_LABELS.map((l, i) => (i === 3 && modeId !== 'studio') ? '' : c(l, 'surprise', i, i === surprise)).join('')}</div>
        <p class="cr-note">${modeId === 'park' ? 'Oyun Parkı: yalnızca iyi kartlar (hazine, gökkuşağı, hareket molası). Puan kimseden düşmez.' : modeId === 'arena' ? 'Arena: bonus, herkese puan ve çift puan kartları. Seri yapan takım çarpan kazanır.' : 'Stüdyo: hediye, çift puan; isterseniz çalma ve sıra değiştirme kartları.'}</p>
      </section>`;
    },
    onGameAct: (act, v, { setOpt }) => {
      if (act === 'size') { setOpt('boardSize', Number(v)); return true; }
      if (act === 'surprise') { setOpt('surprise', Number(v)); return true; }
      return false;
    },
    resumeInfo: () => {
      const save = readResumable();
      if (!save) return null;
      const st = save.state;
      return { title: st.pack.title, code: st.code, savedAt: save.savedAt, detail: `kalan ${remainingTiles(st)} kutu${st.phase === 'end' ? ' · erken bitirildi' : ''}` };
    },
    onResume: () => resumeGame(),
    onDiscard: () => { try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ } },
    onStart: ({ profile, pack, teams, opts }) => {
      const m = profile.mode;
      const size = BOARD_SIZES.includes(opts.boardSize) ? opts.boardSize : MODES[m].boardSize;
      const state = createGame({
        profile, pack, teams,
        boardSize: fitBoard(size, pack.items.length),
        surpriseLevel: Number.isInteger(opts.surprise) ? opts.surprise : MODES[m].surprise,
        code: makeBoardCode(`${Date.now()}:${Math.random()}`), now: Date.now(),
      });
      enterStage(state);
    },
  });
  const renderSetup = (error = '') => setupUi.render(error);

  function resumeGame() {
    const save = readResumable();
    if (!save) { renderSetup('Kayıt bulunamadı.'); return; }
    // A game ended early with "Bitir" goes back to its board with the tiles left.
    const state = save.state.phase === 'end' ? reduce(save.state, { type: 'RESUME_BOARD' }) : save.state;
    enterStage(state, true);
  }

  function enterStage(state, resumed = false) {
    sound.unlock();
    ui = freshUi();
    store = createStore(state, reduce, { saveKey: SAVE_KEY });
    applySkin(state.profile.mode);
    // lang="en" on everything students read: Arena's uppercase must not turn
    // "Animals" into "ANİMALS". Teacher controls inside keep lang="tr".
    root.innerHTML = `
      <div class="cr-stage">
        <div class="cr-teambar" data-teams lang="en"></div>
        <div class="cr-boardwrap" data-boardwrap lang="en"><div class="cr-board" data-board></div>
          ${state.profile.mascot ? `<img class="cr-mascot" src="${esc(mascot)}" alt="">` : ''}
          ${state.profile.mode === 'park' ? `<div class="cr-classmeter" aria-label="Sınıf yıldızları"><span>Class stars</span><span class="cr-meter"><i data-meter></i></span><b data-meter-n></b></div>` : ''}
          <div class="cr-caption" data-caption></div>
        </div>
        <div class="cr-dock" data-dock lang="tr"></div>
      </div>
      <div data-overlay lang="en"></div>`;
    store.subscribe(render);
    render(store.state, { action: { type: resumed ? 'RESUME' : 'START' } });
    requestFull();
    if (resumed) toast(root, 'Oyun kaldığı yerden devam ediyor.');
    else if (!voiceReady && state.profile.autoRead) toast(root, 'Bu cihazda İngilizce ses yok: soruları öğretmen okur.', 3600);
  }

  function requestFull() {
    const d = document.documentElement;
    if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen().catch(() => {});
    try { navigator.wakeLock?.request('screen').catch(() => {}); } catch { /* optional */ }
  }

  // ------------------------------------------------------------ render ----
  function render(s, meta = {}) {
    if (!store) return;
    const a = meta.action || {};
    // Leaving the end screen (undo, "Tahtaya dön"): drop it and forget the
    // question/card keys so the restored question or card is rebuilt.
    if (s.phase !== 'end' && ui.endShown) {
      ui.endShown = false; ui.endKey = null;
      ui.qKey = null; ui.cardKey = null; ui.revealKey = null; ui.boardsKey = null;
      const o = overlay(); if (o) o.innerHTML = '';
    }
    // Every stage change briefly locks the stage controls (double taps).
    const sk = `${s.phase}:${s.current ? `${s.current.tile}:${s.current.itemId || s.current.cardId || ''}:${s.current.tries || ''}:${s.current.stage || ''}` : ''}`;
    if (sk !== ui.lastStageKey) { ui.lastStageKey = sk; lockStage(); }
    if (a.type === 'UNDO' || a.type === 'REDO' || a.type === 'NEXT') stopSpeech();
    renderTeams(s);
    renderBoard(s);
    renderDock(s);
    renderCaption(s);
    if (s.phase === 'question') syncQuestion(s, a);
    else if (s.phase === 'card') syncCard(s);
    else if (s.phase === 'end') syncEnd(s);
    else clearOverlay();
    if (s.phase !== 'question') stopTimers();
  }

  function lockStage(ms = STAGE_LOCK_MS) { ui.lockUntil = performance.now() + ms; }
  function stageLocked() { return performance.now() < ui.lockUntil; }

  function teamGlyph(t, m) {
    return m === 'arena' ? glyph('emblem', t.emblem) : glyph('shape', t.shape);
  }

  // A team name in the language it is written in (Turkish names keep İ/ı casing).
  function teamName(name) {
    const l = langOf(name);
    return l === 'en' ? esc(name) : `<span lang="${l}">${esc(name)}</span>`;
  }

  function scoreText(s, t) {
    return s.profile.scoring === 'stars' ? `★ ${t.score}` : String(t.score);
  }

  function renderTeams(s) {
    const box = $('[data-teams]', root);
    if (!box) return;
    const lead = Math.max(...s.teams.map((t) => t.score));
    const prev = ui.lastScores || {};
    box.innerHTML = s.teams.map((t, i) => {
      const active = i === s.turn && s.phase !== 'end';
      const flag = s.profile.combo && t.streak >= 2 ? `<span class="cr-flag">${t.streak >= 3 ? 'x2' : 'x1.5'} streak</span>` : (t.double ? '<span class="cr-flag">x2 next</span>' : '');
      const crown = s.profile.mode !== 'park' && lead > 0 && t.score === lead ? ' ♛' : '';
      return `<div class="cr-team${active ? ' is-active' : ''}" style="--tc:${t.hex}" data-team="${t.id}">
        <span class="cr-team-ico">${teamGlyph(t, s.profile.mode)}</span>
        <span style="min-width:0"><span class="cr-team-name" style="display:block">${teamName(t.name)}${crown}</span>${active ? `<span class="cr-team-sub">${s.profile.mode === 'studio' ? 'to play' : 'your turn!'}</span>` : ''}</span>
        <span class="cr-team-score" data-score="${t.id}">${scoreText(s, { score: prev[t.id] ?? t.score })}</span>
        ${flag}
      </div>`;
    }).join('');
    for (const t of s.teams) {
      if (prev[t.id] != null && prev[t.id] !== t.score) countUp($(`[data-score="${t.id}"]`, box), prev[t.id], t.score, s);
    }
    ui.lastScores = Object.fromEntries(s.teams.map((t) => [t.id, t.score]));
    if (s.profile.mode === 'park') {
      const pct = Math.min(100, (s.classStars % 10) * 10);
      const bar = $('[data-meter]', root); if (bar) bar.style.width = `${pct || (s.classStars ? 100 : 0)}%`;
      const n = $('[data-meter-n]', root); if (n) n.textContent = `★ ${s.classStars}`;
    }
  }

  function countUp(node, from, to, s) {
    if (!node) return;
    if (reducedMotion()) { node.textContent = scoreText(s, { score: to }); return; }
    const t0 = performance.now(); const dur = 600;
    sound.play('point');
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      node.textContent = scoreText(s, { score: v });
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function renderBoard(s) {
    const board = $('[data-board]', root);
    const wrap = $('[data-boardwrap]', root);
    if (!board || !wrap) return;
    const r = wrap.getBoundingClientRect();
    const g = bestGrid(s.tiles.length, Math.max(200, r.width - 60), Math.max(150, r.height - 40), s.profile.mode === 'park' ? 1.25 : 1.35);
    board.style.gridTemplateColumns = `repeat(${g.cols}, minmax(0, 1fr))`;
    board.style.gridTemplateRows = `repeat(${g.rows}, minmax(0, 1fr))`;
    board.style.maxWidth = `${Math.round(g.size * g.cols * 1.06)}px`;
    const byId = Object.fromEntries(s.teams.map((t) => [t.id, t]));
    const park = s.profile.mode === 'park';
    const wasOpen = ui.openSet || null;
    ui.openSet = new Set(s.tiles.filter((t) => t.opened).map((t) => t.n));
    board.innerHTML = s.tiles.map((tile) => {
      const team = tile.by ? byId[tile.by] : null;
      const gold = isGold(s, tile);
      const fresh = wasOpen && tile.opened && !wasOpen.has(tile.n);
      const cls = ['cr-tile', tile.opened ? 'is-open' : '', gold ? 'is-gold' : '', fresh ? 'is-new' : '', ui.hl === tile.n && !tile.opened ? 'is-hl' : ''].filter(Boolean).join(' ');
      // A1 young classes call chests by a picture ("the apple chest!"): speaking practice too.
      const sticker = park && s.profile.level === 'a1' ? `<img class="cr-sticker" src="/pictures/${CHEST_STICKERS[(tile.n - 1) % CHEST_STICKERS.length]}.svg" alt="">` : '';
      const face = park ? `${CHEST_SVG}${sticker}<span class="cr-num">${tile.n}</span>` : `<span class="cr-num">${tile.n}</span>`;
      const tc = team ? team.hex : '#c9c2b0';
      let back = '';
      if (tile.kind === 'empty') back = '';
      else if (park) {
        // Oyun Parkı: an opened chest shows the team's gem; a miss is "still locked", never an X.
        const isCard = tile.result === 'card' || tile.result === 'skipped';
        const locked = tile.result === 'wrong';
        const badge = isCard ? ICONS.star : teamGlyph(team || s.teams[0], 'park');
        back = `${locked ? CHEST_SVG : OPEN_CHEST_SVG}<span class="cr-gem${locked ? ' is-locked' : ''}" style="--tc:${isCard ? '#f4b400' : tc}">${badge}</span>${locked ? '<span class="cr-back-mark cr-back-mark--park">not yet</span>' : ''}`;
      } else if (tile.result === 'card' || tile.result === 'skipped') back = `<span class="cr-back-ico" style="color:${team ? team.hex : '#f4b400'}">${ICONS.star}</span>`;
      else if (team) back = `<span class="cr-back-ico">${teamGlyph(team, s.profile.mode)}</span><span class="cr-back-mark">${tile.result === 'right' ? '✓' : '–'}</span>`;
      const dim = !park && tile.result === 'wrong' ? 'opacity:.55;' : '';
      return `<button class="${cls}" data-tile="${tile.n}" ${tile.opened ? 'disabled aria-disabled="true"' : ''} aria-label="${tile.opened ? `Kutu ${tile.n}, açıldı` : `Kutu ${tile.n}`}" style="--tc:${tc}">
        <span class="cr-tile-inner"><span class="cr-face">${face}</span><span class="cr-back" style="${dim}">${back}</span></span></button>`;
    }).join('');
  }

  function renderCaption(s) {
    const cap = $('[data-caption]', root);
    if (!cap) return;
    const left = remainingTiles(s);
    const title = stageTitle(s.pack);
    const t = `<span lang="${langOf(title)}">${esc(title)}</span>`;
    let text = '';
    if (s.profile.mode === 'studio') text = `${t} · ${left} left`;
    else if (s.profile.mode === 'arena') text = left <= 3 && left > 0 ? 'Final tiles · double points' : t;
    else text = left <= 3 && left > 0 ? 'Golden chests!' : '';
    cap.innerHTML = text;
    cap.hidden = !text;
  }

  // The pack title as students see it. Built-in picture topics are
  // "Hayvanlar · Animals": the stage shows the English half only.
  function stageTitle(pack) {
    let title = String(pack.title || '');
    const replay = pack.origin === 'replay';
    if (replay) title = title.replace(/ · tekrar$/, '');
    if (String(pack.id || '').startsWith('builtin:')) title = title.split(' · ').pop();
    return replay ? `${title} · review` : title;
  }

  function renderDock(s) {
    const dock = $('[data-dock]', root);
    if (!dock) return;
    const left = remainingTiles(s);
    dock.innerHTML = `
      <div class="cr-dock-group"><span class="cr-dock-info">Kutu Avı · ${esc(s.pack.title)} · kalan ${left} · kod <b>${esc(s.code)}</b></span></div>
      <div class="cr-dock-group">
        <button class="cr-dbtn" data-act="undo" ${store.canUndo() ? '' : 'disabled'} title="Geri al (U)">${ICONS.undo}<span>Geri al</span></button>
        <button class="cr-dbtn" data-act="scores" title="Puanı düzelt (E)">${ICONS.score}<span>Puan</span></button>
        <button class="cr-dbtn" data-act="mute" aria-pressed="${sound.muted}" aria-label="Sesi kapat" title="Ses (M)">${sound.muted ? ICONS.mute : ICONS.sound}</button>
        <button class="cr-dbtn" data-act="full" aria-label="Tam ekran" title="Tam ekran (F)">${ICONS.full}</button>
        <button class="cr-dbtn" data-act="freeze" aria-label="Ekranı karart" title="Ekranı karart (. veya B)">${ICONS.freeze}<span>Karart</span></button>
        <button class="cr-dbtn" data-act="pause" title="Ara (P)">${ICONS.pause}<span>Ara</span></button>
        <button class="cr-dbtn cr-dbtn--warn" data-act="finish" title="Oyunu bitir">${ICONS.flag}<span>Bitir</span></button>
        <button class="cr-dbtn" data-act="help" aria-label="Kısayollar" title="Kısayollar (?)">${ICONS.help}</button>
      </div>`;
  }

  // The dock is under the question overlay, so the question keeps its own
  // small teacher strip: undo a mis-tapped card, break, blackout, scores.
  function qtoolsHtml() {
    return `<button class="cr-dbtn" data-act="undo" ${store.canUndo() ? '' : 'disabled'} title="Geri al (U)">${ICONS.undo}<span>Geri al</span></button>
      <button class="cr-dbtn" data-act="scores" aria-label="Puanı düzelt" title="Puanı düzelt (E)">${ICONS.score}<span>Puan</span></button>
      <button class="cr-dbtn" data-act="pause" aria-label="Ara" title="Ara (P)">${ICONS.pause}<span>Ara</span></button>
      <button class="cr-dbtn" data-act="freeze" aria-label="Ekranı karart" title="Ekranı karart (. veya B)">${ICONS.freeze}<span>Karart</span></button>`;
  }

  // --------------------------------------------------------- question ----
  function overlay() { return $('[data-overlay]', root); }
  function clearOverlay() {
    const o = overlay(); if (o && o.innerHTML) o.innerHTML = '';
    ui.qKey = null; ui.cardKey = null;
    if (store && store.state.phase !== 'end') ui.endShown = false;
  }

  function stopTimers() {
    clearTimeout(ui.delay); clearInterval(ui.huddle);
    ui.delay = null; ui.huddle = null;
  }

  // Pending read-alouds (auto-read, Park echoes) and the voice itself.
  function stopSpeech() {
    ui.speakTimers.forEach(clearTimeout);
    ui.speakTimers = [];
    speech.stop();
  }
  function speakLater(text, rate, ms) {
    ui.speakTimers.push(setTimeout(() => speak(text, rate), ms));
  }

  // Each blank gets its own part of the key ("were ... doing" -> were / doing).
  function promptHtml(stem, fill = null) {
    const parts = esc(stem).split(/_{2,}/);
    if (parts.length === 1) return parts[0];
    const fills = fill ? (blankParts(stem, fill) || [String(fill)]) : [];
    return parts.map((p, i) => (i < parts.length - 1 ? `${p}<span class="cr-blank${fills[i] != null ? ' is-filled' : ''}">${fills[i] != null ? esc(fills[i]) : '&nbsp;'}</span>` : p)).join('');
  }

  // The sentence echoed at the reveal, or null when there is no clean one to
  // say (a stem without a blank whose key is not a sentence, a key that does
  // not split over several blanks).
  function fullSentence(stem, answer) {
    const s = String(stem);
    if (!/_{2,}/.test(s)) return /[.!?]["')]?$/.test(String(answer).trim()) ? String(answer).trim() : null;
    const filled = fillBlanks(s, answer);
    return /_{2,}/.test(filled) ? null : filled;
  }

  // The words on screen for the current question (MCQ stem or picture prompt).
  function stemOf(s) {
    const cur = s.current;
    if (!cur || !cur.itemId) return '';
    const pres = presented(s, cur.itemId, cur.tries > 1 ? ':retry' : '');
    if (pres && pres.stem) return pres.stem;
    return String(s.items[cur.itemId]?.stem || '');
  }

  // One line for review lists: the answer in a full sentence.
  function answerLine(it) {
    if (!it) return '';
    if (it.type === 'vocab') return `${it.pic ? `<img src="${esc(it.pic)}" alt="" style="width:1.4em;height:1.4em;vertical-align:-.3em;margin-right:.3em">` : ''}${esc(it.say || it.term)}${it.tr ? ` <small style="color:var(--muted)">(${esc(it.tr)})</small>` : ''}`;
    return promptHtml(it.stem, it.options ? it.options[it.answer] : '');
  }

  function seatWord(s) {
    return s.profile.mode === 'park' ? 'Player' : s.profile.mode === 'arena' ? 'Speaker' : 'Speaker';
  }

  function valueLabel(s, cur) {
    const v = tileValue(s, cur);
    if (s.profile.scoring === 'stars') return `${'★'.repeat(Math.max(1, v))}${cur.gold ? ' gold' : ''}`;
    return `${v} pts${cur.gold ? ' · x2' : ''}`;
  }

  function syncQuestion(s, a) {
    const cur = s.current;
    const key = `${cur.tile}:${cur.itemId}:${cur.tries}`;
    if (ui.qKey !== key) buildQuestion(s, key);
    updateQuestion(s, a);
  }

  function buildQuestion(s, key) {
    stopTimers();
    stopSpeech();
    ui.qKey = key; ui.peek = false; ui.boardsKey = null; ui.revealKey = null; ui.timerPaused = false; ui.huddleStarted = false;
    const cur = s.current;
    const team = s.teams[s.turn];
    const pres = presented(s, cur.itemId, cur.tries > 1 ? ':retry' : '');
    const o = overlay();
    const park = s.profile.mode === 'park';
    const picOpts = !!pres.optionImgs;
    o.innerHTML = `
      <section class="cr-q${pres.img ? ' has-pic' : ''}" role="dialog" aria-modal="true" aria-label="Soru ${cur.tile}" style="--tc:${team.hex}">
        <div class="cr-qhead">
          <div class="cr-qteam" style="--tc:${team.hex}"><span class="cr-team-ico">${teamGlyph(team, s.profile.mode)}</span><span>${teamName(team.name)}</span></div>
          <div class="cr-seat is-spin" aria-label="${seatWord(s)} ${cur.seat}"><span>${seatWord(s)}</span><b>${cur.seat}</b></div>
          <div class="cr-tileval" data-val>${valueLabel(s, cur)}</div>
        </div>
        <div class="cr-qbody">
          <div class="cr-prompt">
            ${park ? `<div class="cr-host"><img src="${esc(mascot)}" alt=""><span class="cr-bubble" data-bubble>${cur.tries > 1 ? 'One more try!' : 'Listen!'}</span></div>` : '<span aria-hidden="true"></span>'}
            <div class="cr-prompt-main">
              ${pres.img ? `<img class="cr-qpic" src="${esc(pres.img)}" alt="">` : ''}
              <div class="cr-prompt-text" data-prompt>${promptHtml(pres.stem ?? stemOf(s))}</div>
            </div>
            <button class="cr-speak" data-act="speak" aria-label="Soruyu sesli oku">${ICONS.speak}</button>
          </div>
          <div class="cr-options${pres.options.length === 3 ? ' is-three' : ''}${picOpts ? ' is-pics' : ''}" data-options hidden>
            ${pres.options.map((opt, i) => `<button class="cr-opt" data-k="${i}" data-act="choose" data-v="${i}" aria-label="${OPTION_LETTERS[i]}: ${esc(opt.text)}">
              <span class="cr-optmark">${OPTION_SHAPES[i]}<b>${OPTION_LETTERS[i]}</b></span>${picOpts && opt.img ? `<img class="cr-optpic" src="${esc(opt.img)}" alt="">` : `<span class="cr-opttext">${esc(opt.text)}</span>`}</button>`).join('')}
          </div>
        </div>
        <div class="cr-qfoot">
          <div class="cr-ring" data-ring style="--tc:${team.hex}"><svg viewBox="0 0 44 44"><circle class="cr-ring-track" cx="22" cy="22" r="19" fill="none" stroke-width="5"/><circle class="cr-ring-bar" cx="22" cy="22" r="19" fill="none" stroke-width="5" stroke-linecap="round" stroke-dasharray="119.4" stroke-dashoffset="0" data-ringbar/></svg><b data-ringn>${s.profile.huddle}</b><small>Team talk</small></div>
          <div class="cr-stagebar" data-stagebar></div>
          <div class="cr-hints" data-hints lang="tr"></div>
          <div class="cr-qtools" data-qtools lang="tr" role="group" aria-label="Öğretmen">${qtoolsHtml()}</div>
        </div>
      </section>`;
    sound.play('flip');
    if (s.profile.autoRead) speakLater(stemOf(s), 0.8, 350);
    if (cur.stage === 'prompt' || cur.stage === 'retry') {
      ui.delay = setTimeout(afterDelay, s.profile.optionsDelay * 1000);
    } else {
      showOptions(false);
    }
  }

  // The options appear a moment after the prompt, then Team talk starts.
  function afterDelay() {
    ui.delay = null;
    if (!store) return;
    showOptions();
    const cur = store.state.current;
    if (store.state.phase === 'question' && cur && (cur.stage === 'prompt' || cur.stage === 'retry')) store.dispatch({ type: 'STAGE', stage: 'huddle', transient: true });
  }

  function showOptions(animate = true) {
    const box = $('[data-options]', root);
    if (!box || !box.hidden) return;
    if (!animate) $$('.cr-opt', box).forEach((b) => { b.style.animation = 'none'; });
    box.hidden = false;
  }

  // Team talk countdown. It is set up once per question: coming back to the
  // huddle (undo, a hint or score edit re-rendering it) continues from where it
  // was, and after time-up it stays at 0 until "+10".
  function startHuddle(s) {
    if (ui.huddle) return;
    if (!ui.huddleStarted) {
      const extra = Math.max(0, Math.ceil((stemOf(s).split(/\s+/).length - 20) / 5));
      ui.total = s.profile.huddle + extra;
      ui.left = ui.total;
      ui.huddleStarted = true;
    }
    drawRing();
    if (ui.left > 0) runHuddle();
  }

  function runHuddle() {
    if (ui.huddle) return;
    ui.huddle = setInterval(() => {
      if (ui.timerPaused) return;
      ui.left -= 1;
      if (ui.left <= 3 && ui.left > 0) sound.play('tick');
      drawRing();
      if (ui.left <= 0) {
        clearInterval(ui.huddle); ui.huddle = null;
        const st = store.state;
        if (st.phase === 'question' && st.current.stage === 'huddle') {
          if (st.profile.timerOn) boardsUp();
          else { sound.play('timeUp'); const b = $('[data-act="boards"]', root); if (b) b.classList.add('is-pulse'); }
        }
      }
    }, 1000);
  }

  function plus10() {
    const st = store.state;
    if (st.phase !== 'question' || st.current.stage !== 'huddle') return;
    ui.left = Math.max(0, ui.left) + 10;
    ui.total = Math.max(ui.total, ui.left);
    ui.huddleStarted = true;
    runHuddle();
    const b = $('[data-act="boards"]', root); if (b) b.classList.remove('is-pulse');
    drawRing();
  }

  function drawRing() {
    const bar = $('[data-ringbar]', root); const n = $('[data-ringn]', root); const ring = $('[data-ring]', root);
    if (!bar || !n) return;
    const k = ui.total ? Math.max(0, ui.left) / ui.total : 0;
    bar.style.strokeDashoffset = String(119.4 * (1 - k));
    n.textContent = String(Math.max(0, ui.left));
    ring.classList.toggle('is-late', ui.left <= 0);
  }

  function boardsUp() {
    const st = store.state;
    if (st.phase !== 'question' || st.current.stage === 'revealed') return;
    clearInterval(ui.huddle); ui.huddle = null;
    showOptions(false);
    if (st.current.stage !== 'locked') store.dispatch({ type: 'STAGE', stage: 'locked', transient: true });
  }

  function updateQuestion(s, a) {
    const cur = s.current;
    const stage = cur.stage;
    const bar = $('[data-stagebar]', root);
    const hints = $('[data-hints]', root);
    const ring = $('[data-ring]', root);
    if (!bar) return;
    const pres = presented(s, cur.itemId, cur.tries > 1 ? ':retry' : '');
    // An undone reveal: put the question back as it was (blank, prompt, bubble)
    // so the answer is not left on the projector, and let the next reveal play.
    if (stage !== 'revealed' && ui.revealKey && ui.revealKey === ui.qKey) {
      ui.revealKey = null;
      const p = $('[data-prompt]', root); if (p) p.innerHTML = promptHtml(pres.stem ?? stemOf(s));
      const bub = $('[data-bubble]', root); if (bub) bub.textContent = cur.tries > 1 ? 'One more try!' : 'Listen!';
      stopSpeech();
    }
    // Whatever led to the reveal (a card, C/W, ✓/✗), no countdown ticks over it.
    if (stage === 'revealed') { stopTimers(); showOptions(false); }
    if (stage === 'huddle') { showOptions(false); startHuddle(s); }
    if (stage === 'locked' && ui.boardsKey !== ui.qKey) {
      ui.boardsKey = ui.qKey;
      sound.play('boardsUp');
      const splash = el(`<div class="cr-boards" aria-hidden="true" lang="en"><span>${s.profile.mode === 'studio' ? 'Cards up' : 'Boards up!'}</span></div>`);
      root.appendChild(splash); setTimeout(() => splash.remove(), 1200);
    }
    if (ring) ring.style.visibility = stage === 'revealed' ? 'hidden' : 'visible';
    const qsec = $('.cr-q', root); if (qsec) qsec.classList.toggle('is-revealed', stage === 'revealed');
    const undoBtn = $('[data-qtools] [data-act="undo"]', root); if (undoBtn) undoBtn.disabled = !store.canUndo();

    const opts = $$('.cr-opt', root);
    const gone = new Set();
    for (const h of cur.hints) if (h.kind === 'fifty' && h.removed) h.removed.forEach((i) => gone.add(i));
    opts.forEach((b, i) => {
      b.classList.toggle('is-gone', gone.has(i) && stage !== 'revealed');
      b.classList.toggle('is-key', (stage === 'revealed' || ui.peek) && i === pres.answer);
      b.classList.toggle('is-dim', (stage === 'revealed' || ui.peek) && i !== pres.answer);
      const chosen = stage === 'revealed' && cur.chosen === i && i !== pres.answer;
      b.classList.toggle('is-chosen', chosen);
      if (chosen) b.dataset.chosen = s.teams[s.turn].name; else delete b.dataset.chosen;
    });

    hints.innerHTML = stage === 'revealed' ? '' : `
      ${cur.hints.filter((h) => h.text).map((h) => `<span class="cr-hint">${esc(h.text)}</span>`).join('')}
      <button class="cr-dbtn" data-act="hint" ${nextHint(s) ? '' : 'disabled'} title="İpucu (H)">${ICONS.bulb}<span>İpucu</span></button>
      <button class="cr-dbtn" data-act="replace" ${s.reserve.length ? '' : 'disabled'} aria-label="Soruyu değiştir" title="Soruyu değiştir (N)">${ICONS.swap}<span>Değiştir</span></button>`;

    if (stage === 'prompt' || stage === 'retry') {
      bar.innerHTML = `<button class="cr-bigbtn" data-act="skipdelay">Team talk ▶</button>`;
    } else if (stage === 'huddle') {
      const late = ui.huddleStarted && ui.left <= 0 && !ui.huddle;
      bar.innerHTML = `<button class="cr-bigbtn${late ? ' is-pulse' : ''}" data-act="boards">${s.profile.mode === 'studio' ? 'Cards up' : 'Boards up!'}</button>
        <button class="cr-dbtn" data-act="timer" lang="tr" aria-label="${ui.timerPaused ? 'Süreyi başlat' : 'Süreyi durdur'}" title="Süreyi durdur (T)">${ui.timerPaused ? '▶' : '❚❚'}</button>
        <button class="cr-dbtn" data-act="plus10" lang="tr" aria-label="10 saniye ekle" title="+10 sn (+)">+10</button>`;
    } else if (stage === 'locked') {
      bar.innerHTML = ui.peek
        ? `<span class="cr-dock-info" lang="tr" style="font-size:calc(var(--u)*1.4)">Aktif takım doğru muydu?</span>
           <span class="cr-judge" lang="tr"><button class="cr-dbtn cr-yes" data-act="judge" data-v="1">✓ Doğru</button><button class="cr-dbtn cr-no" data-act="judge" data-v="0">✗ Yanlış</button></span>`
        : `<span class="cr-dock-info" lang="tr" style="font-size:calc(var(--u)*1.4)">${esc(s.teams[s.turn].name)} kartına dokunun</span>
           <span class="cr-judge" lang="tr"><button class="cr-dbtn" data-act="peek" title="Cevabı göster (R)">${ICONS.eye}<span>Cevabı göster</span></button></span>`;
    } else if (stage === 'revealed') {
      if (ui.revealKey !== ui.qKey) {
        ui.revealKey = ui.qKey;
        onReveal(s, pres);
      }
      bar.innerHTML = revealPanel(s, pres);
    }
  }

  function onReveal(s, pres) {
    const cur = s.current;
    const item = s.items[cur.itemId];
    const key = pres.options[pres.answer].text;
    const promptEl = $('[data-prompt]', root);
    // Picture words are echoed as a full sentence ("It's an apple."); MCQs fill
    // the blank(s). Cues like "(small)" stay on screen; speech never reads them.
    const sentence = pres.kind === 'vocab' ? pres.say : fullSentence(item.stem, key);
    if (promptEl) promptEl.innerHTML = pres.kind === 'vocab' ? `<span class="cr-blank is-filled">${esc(pres.say)}</span>` : promptHtml(item.stem, key);
    if (cur.activeRight) { sound.play('correct'); flyPoints(s, cur.points); }
    else sound.play('miss');
    const bubble = $('[data-bubble]', root);
    if (bubble) bubble.textContent = cur.activeRight ? 'Great!' : 'Say it with me!';
    if (s.profile.mode === 'park' && sentence) {
      speakLater(sentence, 0.8, 500);
      if (!cur.activeRight) speakLater(sentence, 0.8, 3400);
    }
  }

  function revealPanel(s, pres) {
    const cur = s.current;
    const item = s.items[cur.itemId];
    const keyOpt = pres.options[pres.answer];
    const chosenOpt = Number.isInteger(cur.chosen) ? pres.options[cur.chosen] : null;
    let why = '';
    if (chosenOpt && !chosenOpt.correct && chosenOpt.why) why = chosenOpt.why;
    else if (keyOpt.why) why = keyOpt.why;
    else if (item.whyTr) why = item.whyTr;
    else if (item.type === 'vocab' && item.tr && s.profile.trGloss) why = `${item.term} = ${item.tr}`;
    const rule = item.rule ? `Kural: ${item.rule}` : '';
    const park = s.profile.mode === 'park';
    const pts = cur.activeRight
      ? `<span class="cr-points">${s.profile.scoring === 'stars' ? `+${'★'.repeat(cur.points)}` : `+${cur.points}`}</span>`
      : `<span class="cr-points is-miss">${park ? 'Not yet · we say it together' : s.profile.mode === 'arena' ? 'Missed · streak reset' : 'Not this time'}</span>`;
    const shadow = s.profile.shadowScoring === 'teams' ? `
      <div class="cr-shadow"><span class="cr-shadow-label" lang="tr">Doğru kartı kaldıran takımlar${!cur.activeRight && s.profile.rebound ? ' · ilk doğru takım yarı puanı alır' : ' · +5'} (yanlış olanlara dokunun)</span>
        ${s.teams.filter((t, i) => i !== s.turn).map((t) => `<button class="cr-schip" style="--tc:${t.hex}" data-act="shadow" data-v="${t.id}" aria-pressed="${!!cur.shadow[t.id]}">${teamGlyph(t, s.profile.mode).replace('<svg', '<svg width="18" height="18"')}${teamName(t.name)}</button>`).join('')}
      </div>` : '';
    return `<div class="cr-reveal">
      ${pts}
      ${park ? `<span class="cr-echo">Say it with me! ×2</span>` : ''}
      ${why || rule ? `<div class="cr-why" lang="tr">${why ? esc(why) : ''}${why && rule ? '<br>' : ''}${rule ? `<small>${esc(rule)}</small>` : ''}</div>` : ''}
      ${shadow}
      <button class="cr-bigbtn" data-act="next" lang="tr">Devam ▶</button>
    </div>`;
  }

  function flyPoints(s, points) {
    if (!points || reducedMotion()) return;
    const target = $(`[data-team="${s.teams[s.turn].id}"]`, root);
    if (!target) return;
    const r = target.getBoundingClientRect();
    const chip = el(`<div style="position:fixed;z-index:80;left:50%;top:55%;transform:translate(-50%,-50%);font:800 calc(var(--u)*4) var(--font-display);color:#fff;background:${s.teams[s.turn].hex};padding:.1em .5em;border-radius:999px;transition:all .8s cubic-bezier(.5,0,.2,1)">+${s.profile.scoring === 'stars' ? '★'.repeat(points) : points}</div>`);
    root.appendChild(chip);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      chip.style.left = `${r.left + r.width / 2}px`; chip.style.top = `${r.top + r.height / 2}px`; chip.style.transform = 'translate(-50%,-50%) scale(.4)'; chip.style.opacity = '0.2';
    }));
    setTimeout(() => chip.remove(), 900);
  }

  function speak(text, rate = 1) {
    if (!voiceReady) return false;
    return speech.speak(text, { rate });
  }

  // ------------------------------------------------------------- cards ----
  function syncCard(s) {
    const cur = s.current;
    const key = `${cur.tile}:${cur.cardId}`;
    const card = CARDS[cur.cardId];
    const m = s.profile.mode;
    const team = s.teams[s.turn];
    const o = overlay();
    const fresh = ui.cardKey !== key;
    if (fresh) { ui.cardKey = key; sound.play('card'); }
    const actions = cur.cardId === 'brainbreak' && m !== 'studio' ? shuffleSeeded(BRAIN_BREAK_ACTIONS, `${s.code}:bb:${cur.tile}`).slice(0, 3) : [];
    const targets = card.target ? s.teams.filter((t) => t.id !== team.id) : [];
    o.innerHTML = `<div class="cr-cardov" role="dialog" aria-modal="true" aria-label="Sürpriz kart">
      <div class="cr-bigcard" style="--tc:${team.hex}">
        <span class="cr-cardico" style="color:${m === 'arena' ? '#3df2ff' : '#f4b400'}">${m === 'park' ? ICONS.gift : ICONS.star}</span>
        <h2>${esc(card.names[m] || cur.cardId)}</h2>
        <p>${esc(card.say[m] || '')}${cur.gold && GOLD_CARDS.has(cur.cardId) ? ' <b>(gold: x2)</b>' : ''}</p>
        ${actions.length ? `<div class="cr-actions">${actions.map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
        ${targets.length ? `<div class="cr-shadow"><span class="cr-shadow-label" lang="tr">${esc(team.name)} hangi takımı seçiyor?</span>${targets.map((t) => `<button class="cr-schip" style="--tc:${t.hex}" data-act="target" data-v="${t.id}" aria-pressed="${cur.target === t.id}">${teamName(t.name)}</button>`).join('')}</div>` : ''}
        <div class="cr-actions" lang="tr">
          <button class="cr-bigbtn" data-act="apply" ${card.target && !cur.target ? 'disabled' : ''}>Tamam ▶</button>
          <button class="cr-dbtn" data-act="skipcard">Pas geç</button>
        </div>
      </div></div>`;
    if (fresh && m === 'park' && voiceReady) speak(card.names.park, 0.9);
  }

  // --------------------------------------------------------------- end ----
  function syncEnd(s) {
    // Rebuilt when a score is corrected on the end screen (E); the fanfare and
    // confetti play only the first time.
    const endKey = s.teams.map((t) => t.score).join(',');
    if (ui.endShown && ui.endKey === endKey) return;
    const first = !ui.endShown;
    ui.endShown = true; ui.endKey = endKey;
    // An undo from here must rebuild the question or card it returns to.
    ui.qKey = null; ui.cardKey = null; ui.revealKey = null; ui.boardsKey = null;
    stopTimers();
    const o = overlay();
    const m = s.profile.mode;
    const titles = endingTitles(s);
    const titleOf = Object.fromEntries(titles.map((t) => [t.teamId, t.title]));
    const rank = ranking(s);
    const hard = hardestItem(s);
    const missed = s.missed.map((id) => s.items[id]).filter(Boolean);
    let body = '';
    if (m === 'park') {
      body = `<h1>Well done, everyone!</h1>
        <div style="text-align:center;margin-bottom:calc(var(--u)*2)"><img src="${esc(mascot)}" alt="" style="width:calc(var(--u)*14);animation:cr-bob 1.2s ease-in-out infinite"></div>
        <div class="cr-awards">${s.teams.map((t, i) => `<div class="cr-award" style="--tc:${t.hex};animation-delay:${i * 0.12}s"><span class="cr-team-ico">${teamGlyph(t, m)}</span><h3>${teamName(t.name)}</h3><div class="cr-award-title">${esc(titleOf[t.id] || 'Super Team')}</div><div class="cr-award-score">★ ${t.score}</div></div>`).join('')}</div>
        <p style="text-align:center;font-size:calc(var(--u)*2);font-weight:800;margin-top:calc(var(--u)*2)">Class stars today: ★ ${s.classStars}</p>`;
    } else if (m === 'arena') {
      const top = rank.slice(0, 3);
      const order = [top[1], top[0], top[2]].filter(Boolean);
      const heights = { 0: 16, 1: 11, 2: 8 };
      body = `<h1>Match over</h1>
        <div class="cr-podium">${order.map((t) => { const place = Math.min(2, t.place ?? rank.indexOf(t)); return `<div class="cr-pod" style="--tc:${t.hex}"><h3>${teamName(t.name)}</h3><div class="cr-pod-block" style="height:calc(var(--u)*${heights[place]})">${place + 1}</div><div style="font-weight:800;font-size:calc(var(--u)*2)">${t.score}</div></div>`; }).join('')}</div>
        <div class="cr-awards">${s.teams.map((t, i) => `<div class="cr-award" style="--tc:${t.hex};animation-delay:${i * 0.1}s"><span class="cr-team-ico">${teamGlyph(t, m)}</span><h3>${teamName(t.name)}</h3><div class="cr-award-title">${esc(titleOf[t.id] || 'Team spirit')}</div><div class="cr-award-score">${t.score} pts · best streak ${t.bestStreak}</div></div>`).join('')}</div>`;
    } else {
      body = `<h1>Final scores</h1>
        <table class="cr-table"><tbody>${rank.map((t, i) => `<tr><td style="width:3ch;font-family:var(--font-display)">${(t.place ?? i) + 1}.</td><td><span class="cr-badge" style="display:inline-grid;vertical-align:middle;margin-right:10px;background:${t.hex};color:#fff">${teamGlyph(t, m)}</span>${teamName(t.name)}</td><td>${t.score}</td></tr>`).join('')}</tbody></table>
        ${hard && hard.item ? `<div class="cr-review"><h2>Hardest question of the day</h2><p style="font-size:calc(var(--u)*1.8);margin:0">${answerLine(hard.item)}</p></div>` : ''}`;
    }
    const review = missed.length ? `<div class="cr-review"><h2${m === 'park' ? '' : ' lang="tr"'}>${m === 'park' ? 'Words to practise' : 'Kaçırılanlar'} (${missed.length})</h2><ol>${missed.map((it) => `<li>${answerLine(it)}</li>`).join('')}</ol></div>` : '';
    o.innerHTML = `<section class="cr-end" aria-label="Oyun sonu">${body}${review}</section>
      <div class="cr-endbar" lang="tr">
        ${missed.length >= 2 ? `<button class="cr-btn cr-btn--go" data-act="replaymissed">Kaçırılanları oyna (${missed.length})</button>` : ''}
        <button class="cr-btn" data-act="newgame">Yeni oyun</button>
        <button class="cr-btn" data-act="print">Yazdır</button>
        <button class="cr-btn" data-act="undo" ${store.canUndo() ? '' : 'disabled'}>${ICONS.undo.replace('<svg', '<svg width="18" height="18" style="vertical-align:-3px"')} Geri al</button>
        ${s.finishedEarly && remainingTiles(s) > 0 ? '<button class="cr-btn" data-act="backtoboard">Tahtaya dön</button>' : ''}
      </div>`;
    if (!first) return;
    sound.play('finale');
    if (m !== 'studio') confetti(root, s.teams.map((t) => t.hex));
  }

  function replayMissed() {
    const s = store.state;
    const items = s.missed.map((id) => s.items[id]).filter(Boolean);
    if (items.length < 2) return;
    const pack = { schema: 'lg.pack/1', id: `${s.pack.id}:missed`, title: `${String(s.pack.title).replace(/ · tekrar$/, '')} · tekrar`, level: s.pack.level, origin: 'replay', items };
    const teams = s.teams.map((t) => ({ id: t.id, index: t.index, name: t.name, color: t.color, hex: t.hex, ink: t.ink, shape: t.shape, emblem: t.emblem, animal: t.animal, seats: t.seats, motto: t.motto }));
    // One tile per missed item (no padding with empty tiles). The whole game's
    // items go along as a pool: picture distractors and the Park second try
    // come from it (createGame's `pool` option).
    const size = Math.min(24, items.length);
    const state = createGame({ profile: s.profile, pack, teams, boardSize: size, surpriseLevel: 0, code: makeBoardCode(`${Date.now()}`), now: Date.now(), pool: Object.values(s.items) });
    enterStage(state);
  }

  // ------------------------------------------------------ interactions ----
  function onStageClick(e) {
    const tileBtn = e.target.closest('[data-tile]');
    if (tileBtn && store.state.phase === 'board') { if (!stageLocked()) openTile(Number(tileBtn.dataset.tile)); return; }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act; const v = b.dataset.v;
    // The second tap of a double tap lands on the control that replaced this one.
    if (LOCKED_ACTS.has(act) && stageLocked()) return;
    const s = store.state;
    switch (act) {
      case 'undo': store.undo(); break;
      case 'scores': scoreEditor(); break;
      case 'mute': sound.setMuted(!sound.muted); renderDock(s); break;
      case 'full': requestFull(); break;
      case 'freeze': freeze(); break;
      case 'pause': pause(); break;
      case 'finish': if (confirmFinish()) store.dispatch({ type: 'FINISH' }); break;
      case 'help': help(); break;
      case 'speak': speakCurrent(); break;
      case 'skipdelay': skipDelay(); break;
      case 'boards': boardsUp(); break;
      case 'timer': ui.timerPaused = !ui.timerPaused; updateQuestion(store.state, {}); break;
      case 'plus10': plus10(); break;
      case 'choose': choose(Number(v)); break;
      case 'peek': peek(); break;
      case 'judge': store.dispatch({ type: 'ANSWER', right: v === '1', choice: null }); break;
      case 'hint': doHint(); break;
      case 'replace': store.dispatch({ type: 'REPLACE' }); break;
      case 'shadow': store.dispatch({ type: 'SHADOW', teamId: v }); break;
      case 'next': store.dispatch({ type: 'NEXT' }); break;
      case 'target': store.dispatch({ type: 'CARD_TARGET', teamId: v }); break;
      case 'apply': if (s.phase === 'card' && store.dispatch({ type: 'CARD_APPLY' })) sound.play('correct'); break;
      case 'skipcard': if (s.phase === 'card') store.dispatch({ type: 'CARD_SKIP' }); break;
      case 'replaymissed': replayMissed(); break;
      case 'newgame': stopSpeech(); store.clearSave(); store = null; ui = freshUi(); renderSetup(); break;
      case 'print': window.print(); break;
      case 'backtoboard': store.dispatch({ type: 'RESUME_BOARD' }); break;
      default: break;
    }
  }

  function openTile(n) {
    const s = store.state;
    const tile = s.tiles.find((t) => t.n === n);
    if (!tile || tile.opened) return;
    sound.play('tap');
    ui.hl = null;
    store.dispatch({ type: 'OPEN', n });
  }

  function choose(i) {
    const s = store.state;
    if (s.phase !== 'question') return;
    const stage = s.current.stage;
    if (stage === 'revealed') return;
    const box = $('[data-options]', root);
    if (box && box.hidden) return;
    // "4" in a 3-option class is not a card anyone can raise.
    const pres = presented(s, s.current.itemId, s.current.tries > 1 ? ':retry' : '');
    if (!pres || !(i >= 0 && i < pres.options.length)) return;
    clearInterval(ui.huddle); ui.huddle = null;
    store.dispatch({ type: 'ANSWER', choice: i });
  }

  function skipDelay() {
    const st = store.state;
    if (st.phase !== 'question' || !(st.current.stage === 'prompt' || st.current.stage === 'retry')) return;
    clearTimeout(ui.delay); ui.delay = null;
    showOptions(false);
    store.dispatch({ type: 'STAGE', stage: 'huddle', transient: true });
  }

  // "Cevabı göster": the key lights up and ✓/✗ replace this button (locked
  // briefly, since the stage itself may not change).
  function peek() {
    const st = store.state;
    if (st.phase !== 'question' || st.current.stage === 'revealed' || ui.peek) return;
    ui.peek = true;
    lockStage();
    showOptions(false);
    clearInterval(ui.huddle); ui.huddle = null;
    if (st.current.stage !== 'locked') store.dispatch({ type: 'STAGE', stage: 'locked', transient: true });
    else updateQuestion(st, {});
  }

  function doHint() {
    const before = store.state.current?.hints.length || 0;
    store.dispatch({ type: 'HINT' });
    const cur = store.state.current;
    if (!cur || cur.hints.length === before) return;
    const h = cur.hints[cur.hints.length - 1];
    if (h.kind === 'listen') speakCurrent(0.7);
    sound.play('tap');
    const val = $('[data-val]', root); if (val) val.textContent = valueLabel(store.state, cur);
  }

  function speakCurrent(rate) {
    const s = store.state;
    if (!s.current || !s.current.itemId) return;
    const ok = speak(stemOf(s), rate || (s.profile.autoRead ? 0.8 : 0.95));
    if (!ok) toast(root, 'İngilizce ses bulunamadı: lütfen soruyu siz okuyun.');
  }

  function confirmFinish() {
    const left = remainingTiles(store.state);
    return left === 0 || window.confirm(`Oyunu şimdi bitirelim mi? ${left} kutu açılmadı. Kalan kutular kaydedilir, bir sonraki derste devam edebilirsiniz.`);
  }

  // Freeze and break hold everything behind them: the Team talk countdown and
  // the options delay wait, and a timer the teacher stopped with T stays stopped.
  function holdTimers() {
    const u = ui;
    const prev = u.timerPaused;
    u.timerPaused = true;
    const hadDelay = !!u.delay;
    if (hadDelay) { clearTimeout(u.delay); u.delay = null; }
    return () => {
      if (ui !== u || !store) return;
      u.timerPaused = prev;
      const st = store.state;
      if (st.phase !== 'question') return;
      if (hadDelay && !u.delay && (st.current.stage === 'prompt' || st.current.stage === 'retry')) u.delay = setTimeout(afterDelay, 1000);
      updateQuestion(st, {});
    };
  }

  // A full-screen layer that any tap or key dismisses (the key is swallowed).
  function blocker(node) {
    const release = holdTimers();
    let closed = false;
    const key = (ev) => { ev.stopPropagation(); ev.preventDefault(); done(); };
    const done = () => {
      if (closed) return;
      closed = true;
      node.remove();
      window.removeEventListener('keydown', key, true);
      release();
    };
    node.addEventListener('click', done);
    setTimeout(() => { if (!closed) window.addEventListener('keydown', key, { capture: true, once: true }); }, 50);
    root.appendChild(node);
  }

  function freeze() {
    blocker(el('<div class="cr-freeze" role="dialog" aria-label="Ekran karartıldı. Devam etmek için bir tuşa basın."></div>'));
  }

  function pause() {
    const m = store.state.profile.mode;
    const inner = m === 'park' ? `<div><img src="${esc(mascot)}" alt=""><h2>Zzz… Break time</h2></div>`
      : m === 'arena' ? '<h2>Paused</h2>' : `<div><h2>Break</h2><p style="font-size:calc(var(--u)*2);color:var(--muted)">${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p></div>`;
    blocker(el(`<div class="cr-pause" role="dialog" lang="en" aria-label="Ara. Devam etmek için dokunun.">${inner}</div>`));
  }

  function help() {
    if ($('.cr-modal', root)) return;
    const m = el(`<div class="cr-modal" role="dialog" aria-modal="true" aria-label="Kısayollar"><div class="cr-modal-box">
      <h2>Kısayollar</h2>
      <div class="cr-keys">
        <kbd>1–30 + Enter</kbd><span>Kutuyu aç (tahtada da dokunabilirsiniz)</span>
        <kbd>← →</kbd><span>Sırayı elle değiştir</span>
        <kbd>PageDown / PageUp, ↓ / ↑</kbd><span>Tahtada kutuyu işaretle, Enter ile aç</span>
        <kbd>Boşluk, Enter, PageDown</kbd><span>Soruda ilerle: Team talk → Boards up! → Cevabı göster; karardan sonra Devam</span>
        <kbd>1–4</kbd><span>Aktif takımın kartı (A–D)</span>
        <kbd>C / W</kbd><span>Aktif takım doğru / yanlış</span>
        <kbd>R</kbd><span>Cevabı göster</span>
        <kbd>H</kbd><span>İpucu</span><kbd>N</kbd><span>Soruyu değiştir</span>
        <kbd>T</kbd><span>Süreyi durdur / devam</span><kbd>+</kbd><span>+10 saniye</span>
        <kbd>U, Ctrl+Z</kbd><span>Geri al (soruda, kartta ve oyun sonunda PageUp da)</span>
        <kbd>E</kbd><span>Puanı düzelt</span>
        <kbd>. veya B</kbd><span>Ekranı karart ("Eyes on me")</span>
        <kbd>P</kbd><span>Ara</span><kbd>M</kbd><span>Ses aç/kapat</span><kbd>F</kbd><span>Tam ekran</span>
      </div>
      <p class="cr-note">Sunum kumandası: tahtada PageDown ve PageUp kutuları sırayla işaretler; kutuyu dokunarak ya da Enter ile açın. Soruda PageDown aşamaları ilerletir (Team talk → Boards up! → Cevabı göster). Doğru/yanlış kararını dokunarak ya da C/W ile verin, sonra PageDown ile devam edin. Soruda PageUp geri alır. Siyah ekran tuşu ekranı karartır.</p>
      <div style="text-align:right;margin-top:12px"><button class="cr-btn" data-close>Kapat</button></div>
    </div></div>`);
    m.addEventListener('click', (ev) => { if (ev.target === m || ev.target.closest('[data-close]')) m.remove(); });
    root.appendChild(m);
    $('[data-close]', m).focus();
  }

  function scoreEditor() {
    if ($('.cr-modal', root)) return;
    const s = store.state;
    const unit = s.profile.scoring === 'stars' ? 1 : 5;
    const m = el(`<div class="cr-modal" role="dialog" aria-modal="true" aria-label="Puanı düzelt"><div class="cr-modal-box">
      <h2>Puanı düzelt</h2>
      <div class="cr-score-rows">${s.teams.map((t) => `<div class="cr-score-row"><span class="cr-badge" style="background:${t.hex};color:#fff">${teamGlyph(t, s.profile.mode)}</span><span>${esc(t.name)} · <b data-sc="${t.id}">${t.score}</b></span>
        <span class="cr-row"><button class="cr-mini" data-adj="${t.id}" data-d="${-unit}">−${unit}</button><button class="cr-mini" data-adj="${t.id}" data-d="${unit}">+${unit}</button></span></div>`).join('')}</div>
      <div style="text-align:right;margin-top:12px"><button class="cr-btn" data-close>Tamam</button></div></div></div>`);
    m.addEventListener('click', (ev) => {
      const adj = ev.target.closest('[data-adj]');
      if (adj) { store.dispatch({ type: 'ADJUST', teamId: adj.dataset.adj, delta: Number(adj.dataset.d) }); const n = $(`[data-sc="${adj.dataset.adj}"]`, m); const t = store.state.teams.find((x) => x.id === adj.dataset.adj); if (n && t) n.textContent = t.score; }
      if (ev.target === m || ev.target.closest('[data-close]')) m.remove();
    });
    root.appendChild(m);
    $('[data-close]', m).focus();
  }

  // Keep Tab inside an open dialog.
  function trapTab(e, modal) {
    const list = $$('button, [href], input, [tabindex]:not([tabindex="-1"])', modal).filter((x) => !x.disabled);
    e.preventDefault();
    if (!list.length) return;
    const i = list.indexOf(document.activeElement);
    const n = e.shiftKey ? (i <= 0 ? list.length - 1 : i - 1) : (i < 0 || i === list.length - 1 ? 0 : i + 1);
    list[n].focus();
  }

  function onKey(e) {
    if (!store) return;
    if (e.target.closest && e.target.closest('input, textarea')) return;
    const k = e.key;
    const lower = k.length === 1 ? k.toLowerCase() : k;
    const modal = $('.cr-modal', root);
    if (modal) {
      if (k === 'Escape') { modal.remove(); return; }
      if (k === 'Tab') { trapTab(e, modal); return; }
      // Enter/Space must not press a control hidden behind the dialog.
      if ((k === 'Enter' || k === ' ') && !(e.target.closest && e.target.closest('.cr-modal'))) e.preventDefault();
      return;
    }
    // A held key or an auto-repeating clicker must not run through the stages.
    if (e.repeat && (k === ' ' || k === 'Enter' || k === 'PageDown' || k === 'PageUp' || lower === 'u' || lower === 'z' || /^[0-9]$/.test(k))) { e.preventDefault(); return; }
    const s = store.state;
    const advance = k === ' ' || k === 'PageDown' || k === 'Enter';
    if ((e.ctrlKey || e.metaKey) && lower === 'z') { e.preventDefault(); store.undo(); return; }
    // On the board a clicker's PageUp steps the highlight back; elsewhere it undoes.
    if (k === 'PageUp' && s.phase === 'board') { e.preventDefault(); moveHl(s, -1); return; }
    if (lower === 'u' || k === 'PageUp') { e.preventDefault(); store.undo(); return; }
    if (lower === 'm') { sound.setMuted(!sound.muted); renderDock(s); return; }
    if (lower === 'f') { requestFull(); return; }
    if (lower === 'p') { pause(); return; }
    if (lower === 'b' || k === '.') { e.preventDefault(); freeze(); return; }
    if (k === '?') { help(); return; }
    if (lower === 'e') { scoreEditor(); return; }

    if (s.phase === 'board') {
      if (/^[0-9]$/.test(k)) {
        ui.digits = (ui.digits + k).slice(-2);
        clearTimeout(ui.digitTimer); ui.digitTimer = setTimeout(() => { ui.digits = ''; }, 2500);
        ui.hl = Number(ui.digits); renderBoard(s); return;
      }
      if (k === 'Enter' || k === ' ') {
        e.preventDefault();
        if (stageLocked()) return;
        const n = ui.hl; ui.digits = '';
        if (n) openTile(n);
        return;
      }
      if (k === 'PageDown' || k === 'ArrowDown') { e.preventDefault(); moveHl(s, 1); return; }
      if (k === 'ArrowUp') { e.preventDefault(); moveHl(s, -1); return; }
      if (k === 'ArrowRight' || k === 'ArrowLeft') { store.dispatch({ type: 'SET_TURN', index: (s.turn + (k === 'ArrowRight' ? 1 : s.teams.length - 1)) % s.teams.length }); return; }
      return;
    }
    if (s.phase === 'question') {
      const stage = s.current.stage;
      if ((advance || /^[1-4]$/.test(k)) && stageLocked()) { e.preventDefault(); return; }
      if (/^[1-4]$/.test(k)) { choose(Number(k) - 1); return; }
      if (lower === 'c' || lower === 'w') { if (stage !== 'revealed') store.dispatch({ type: 'ANSWER', right: lower === 'c', choice: null }); return; }
      if (lower === 'h') { doHint(); return; }
      if (lower === 'n') { store.dispatch({ type: 'REPLACE' }); return; }
      if (lower === 'r') { peek(); return; }
      if (lower === 't') { ui.timerPaused = !ui.timerPaused; updateQuestion(s, {}); return; }
      if (k === '+') { plus10(); return; }
      if (advance) {
        e.preventDefault();
        if (stage === 'prompt' || stage === 'retry') skipDelay();
        else if (stage === 'huddle') boardsUp();
        else if (stage === 'locked' && !ui.peek) peek();
        else if (stage === 'revealed') store.dispatch({ type: 'NEXT' });
      }
      return;
    }
    if (s.phase === 'card') {
      if (advance) { e.preventDefault(); if (!stageLocked() && store.dispatch({ type: 'CARD_APPLY' })) sound.play('correct'); }
    }
  }

  function moveHl(s, dir) {
    const open = s.tiles.filter((t) => !t.opened).map((t) => t.n);
    if (!open.length) return;
    const i = open.indexOf(ui.hl);
    ui.hl = open[(i + dir + open.length) % open.length] ?? open[0];
    renderBoard(s);
  }

  // Tiles and stage controls ignore the second tap of a double tap (lockStage).
  root.addEventListener('click', (e) => { if (store) onStageClick(e); });
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', () => { if (store) renderBoard(store.state); });
  window.addEventListener('beforeunload', (e) => {
    if (store && store.state.phase !== 'end' && store.state.phase !== 'board') { e.preventDefault(); e.returnValue = ''; }
  });

  renderSetup();
  setupUi.preload();
}
