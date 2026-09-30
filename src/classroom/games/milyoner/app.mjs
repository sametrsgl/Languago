// Milyoner Merdiveni: stage for the ladder game (shared setup + own flow).
// Teacher chrome is Turkish; everything students read on the stage is English.
import { createStore, readSave } from '../../core/store.mjs';
import { createSound } from '../../core/sound.mjs';
import { createSpeech } from '../../core/speech.mjs';
import { makeBoardCode } from '../../core/rng.mjs';
import { createSetup, teamGlyph } from '../../core/setup.mjs';
import { esc, $, $$, el, toast, confetti, reducedMotion, promptHtml, fullSentence, langOf, ICONS, OPTION_SHAPES, OPTION_LETTERS } from '../../core/dom.mjs';
import { createGame, reduce, presented, ladderFor, rankName, rungValue, standings, endingTitles, LIFELINES } from './logic.mjs';

const SAVE_KEY = 'lg:milyoner:save';
const LENGTHS = [6, 8, 10, 12];
const LOCK_MS = 450;
const POLL_LABELS = ['–', 'Az', 'Orta', 'Çok'];
const LIFE = {
  fifty: { park: 'Magic wand', other: '50:50', tr: 'Yarı yarıya', key: '5' },
  poll: { park: 'Megaphone', other: 'Ask the class', tr: 'Sınıfa sor', key: 's' },
  friend: { park: 'High five', other: 'Ask a friend', tr: 'Arkadaşa danış', key: 'a' },
};
const LIFE_ICON = {
  fifty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 20 20 4"/><circle cx="7" cy="7" r="3"/><circle cx="17" cy="17" r="3"/></svg>',
  poll: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>',
  friend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="8" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.8"/><path d="M2 20c0-3.5 2.7-6 6-6s6 2.5 6 6M14 20c.4-2.8 2-4.6 4.5-4.6S22 17.4 22 20"/></svg>',
};

export function validSave(save) {
  const s = save && save.state;
  return !!(s && s.v === 1 && s.game === 'milyoner' && s.pack && s.profile && s.ladder && Array.isArray(s.teams) && s.teams.length && ['ladder', 'question', 'end'].includes(s.phase));
}

export function mountMilyoner(root, { dataBase = '/sinif-oyunlari/paket', mascot = '/logo/kommo-512.png' } = {}) {
  const sound = createSound('studio');
  const speech = createSpeech();
  let voiceReady = false;
  speech.probe().then((ok) => { voiceReady = ok; });
  let store = null;
  let ui = freshUi();

  function freshUi() {
    return { key: null, optsKey: null, delay: null, talk: null, left: 0, total: 0, paused: false, suspense: null, lockUntil: 0, revealKey: null, endShown: false, lastRungs: null, speakTimers: [] };
  }

  const applySkin = (m) => { root.dataset.skin = m; sound.setSkin(m); };

  function readResumable() {
    const save = readSave(SAVE_KEY);
    if (!save) return null;
    if (!validSave(save)) { try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ } return null; }
    return save.state.phase !== 'end' ? save : null;
  }

  // ------------------------------------------------------------ setup ----
  const setupUi = createSetup(root, {
    gameId: 'milyoner',
    title: 'Milyoner Merdiveni',
    lead: 'Her takım kendi merdivenini tırmanır. Alt basamaklar hep birlikte, sonra sırayla: takım konuşur, cevabı kilitler, öğretmen “Göster” der.',
    mascot,
    dataBase,
    minTeams: 1,
    maxTeams: 4,
    defaultTeamCount: 3,
    isActive: () => !store,
    onSkin: applySkin,
    beforeRender: () => stopTimers(),
    gameDefaults: () => ({ length: null, together: true }),
    gameSection: ({ opts, profile, modeId, chip }) => {
      const auto = ladderFor(profile).length;
      const len = LENGTHS.includes(opts.length) ? opts.length : auto;
      const lad = ladderFor(profile, len);
      const perTurn = modeId === 'park' ? 90 : modeId === 'arena' ? 70 : 75;
      const teams = Math.max(1, setupUi ? setupUi.setup.teamCount : 3);
      const minutes = Math.round((len * Math.min(4, teams) * perTurn * 0.8) / 60);
      return `<section class="cr-card" aria-labelledby="st4">
        <h2 class="cr-step" id="st4"><b>4</b> Merdiven</h2>
        <div class="cr-row"><span class="cr-row-label">Basamak sayısı · güvenli basamaklar ${lad.safe.join(' ve ')} · yaklaşık ${minutes} dk</span>
          ${LENGTHS.map((n) => chip(n === auto ? `${n} · önerilen` : String(n), 'ladlen', n, n === len)).join('')}</div>
        <div class="cr-row"><span class="cr-row-label">Alt basamaklar hep birlikte</span>
          ${chip('Açık', 'together', 1, opts.together !== false)}${chip('Kapalı', 'together', 0, opts.together === false)}</div>
        <p class="cr-note">${modeId === 'park' ? 'Oyun Parkı: roketler Ay’a uçar. Kimse düşmez; yanlışta Kommo cevabı söyler, takım tekrar edince roket yine yükselir.' : modeId === 'arena' ? 'Arena: Bronze’dan Legend’a. Yanlışta takım yerinde kalır; doğru kart gösteren takımlar +5 XP ve kıvılcım alır.' : 'Stüdyo: klasik kural, yanlışta son güvenli basamağa düşülür. Doğru kart gösteren takımlar kıvılcım toplar; 3 kıvılcım bir jokeri geri verir.'}</p>
      </section>`;
    },
    onGameAct: (act, v, { setOpt }) => {
      if (act === 'ladlen') { setOpt('length', Number(v)); return true; }
      if (act === 'together') { setOpt('together', v === '1'); return true; }
      return false;
    },
    resumeInfo: () => {
      const save = readResumable();
      if (!save) return null;
      const st = save.state;
      const top = Math.max(...st.teams.map((t) => t.rung));
      return { title: st.pack.title, code: st.code, savedAt: save.savedAt, detail: `en yüksek basamak ${top}/${st.ladder.length}` };
    },
    onResume: () => { const s = readResumable(); if (s) enterStage(s.state, true); else setupUi.render('Kayıt bulunamadı.'); },
    onDiscard: () => { try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ } },
    onStart: ({ profile, pack, teams, opts }) => {
      if (pack.items.length < 8) { setupUi.render('Bu konuda merdiven için yeterli soru yok. Başka bir konu seçin.'); return; }
      const state = createGame({ profile, pack, teams, ladderLength: opts.length, together: opts.together !== false, code: makeBoardCode(`${Date.now()}:${Math.random()}`), now: Date.now() });
      enterStage(state);
    },
  });

  // ------------------------------------------------------------ stage ----
  function enterStage(state, resumed = false) {
    sound.unlock();
    ui = freshUi();
    store = createStore(state, reduce, { saveKey: SAVE_KEY });
    applySkin(state.profile.mode);
    root.innerHTML = `
      <div class="cr-stage ml-stage">
        <main class="ml-main" data-main></main>
        <aside class="ml-rail" data-rail aria-label="Merdivenler"></aside>
        <div class="cr-dock ml-dock" data-dock></div>
      </div>
      <div data-overlay></div>`;
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

  function render(s, meta = {}) {
    if (!store) return;
    const type = meta.action && meta.action.type;
    if (type === 'UNDO' || type === 'REDO' || type === 'CONTINUE' || type === 'NEXT_QUESTION') stopSpeech();
    renderRail(s, type);
    renderDock(s);
    if (s.phase === 'end') { renderEnd(s); return; }
    ui.endShown = false;
    const o = $('[data-overlay]', root); if (o && o.innerHTML && !$('.cr-modal', o)) o.innerHTML = '';
    if (s.phase === 'ladder') { stopTimers(); renderTurnCard(s, type); }
    else renderQuestion(s, type);
  }

  // Short-lived lock: a double tap never reaches the control that replaced the one pressed.
  const lock = (ms = LOCK_MS) => { ui.lockUntil = performance.now() + ms; };
  const locked = () => performance.now() < ui.lockUntil;

  function teamLabel(s, t) {
    return `<span class="cr-qteam" style="--tc:${t.hex}"><span class="cr-team-ico">${teamGlyph(t, s.profile.mode)}</span><span lang="${langOf(t.name)}">${esc(t.name)}</span></span>`;
  }

  function rungLabel(s, rung) {
    const L = s.ladder.length;
    if (s.profile.mode === 'arena') return rankName(rung, L);
    if (s.profile.mode === 'studio') return rung ? rungValue(rung, L).toLocaleString('en-GB') : 'Start';
    return rung >= L ? 'The Moon' : `Planet ${rung}`;
  }

  // ---- ladders rail ---------------------------------------------------
  function renderRail(s, type) {
    const rail = $('[data-rail]', root);
    if (!rail) return;
    const L = s.ladder.length;
    const cur = s.current;
    const prev = ui.lastRungs || {};
    const activeId = s.phase === 'question' && cur && cur.kind === 'relay' ? s.teams[s.turn].id : (s.phase === 'ladder' && s.togetherLeft === 0 ? s.teams[s.turn].id : null);
    const labels = Array.from({ length: L }, (_, i) => L - i);
    rail.innerHTML = `
      <div class="ml-labels" aria-hidden="true" lang="en">${labels.map((r) => `<span class="${s.ladder.safe.includes(r) ? 'is-safe' : ''}${r === L ? ' is-top' : ''}">${esc(rungLabel(s, r))}</span>`).join('')}</div>
      ${s.teams.map((t) => {
        const moved = prev[t.id] != null && prev[t.id] !== t.rung;
        return `<div class="ml-ladder${t.id === activeId ? ' is-active' : ''}${t.rung >= L ? ' is-top' : ''}" style="--tc:${t.hex};--rungs:${L};--at:${t.rung}" aria-label="${esc(t.name)}: ${t.rung}/${L}">
          <div class="ml-rungs">${labels.map((r) => `<i class="${s.ladder.safe.includes(r) ? 'is-safe' : ''}${r <= t.rung ? ' is-done' : ''}${r === L ? ' is-top' : ''}"></i>`).join('')}<span class="ml-token${moved ? ' is-moving' : ''}">${s.profile.mode === 'park' ? ROCKET_SVG : teamGlyph(t, s.profile.mode)}</span></div>
          <span class="ml-name" lang="${langOf(t.name)}">${esc(t.name)}</span>
          ${s.profile.mode === 'park' ? `<span class="ml-meta">★ ${t.stars}</span>` : s.profile.mode === 'arena' ? `<span class="ml-meta">${t.xp} XP${t.sparks ? ` · ✦${t.sparks}` : ''}</span>` : `<span class="ml-meta">${t.sparks ? `✦ ${t.sparks}` : '&nbsp;'}</span>`}
          <span class="ml-lives" aria-label="Jokerler">${LIFELINES.map((k) => (t.lifelines[k] === null ? '' : `<b class="${t.lifelines[k] ? '' : 'is-used'}" title="${LIFE[k].tr}">${LIFE_ICON[k]}</b>`)).join('')}</span>
        </div>`;
      }).join('')}`;
    // A climb plays the rung's note of the scale; a Stüdyo fall a low note.
    if (ui.lastRungs && type !== 'UNDO' && type !== 'REDO') {
      const up = s.teams.find((t) => (prev[t.id] ?? t.rung) < t.rung);
      const down = s.teams.find((t) => (prev[t.id] ?? t.rung) > t.rung);
      if (up) { sound.note(up.rung - 1); if (s.ladder.safe.includes(up.rung)) setTimeout(() => sound.play('card'), 380); }
      else if (down) sound.play('miss');
    }
    ui.lastRungs = Object.fromEntries(s.teams.map((t) => [t.id, t.rung]));
  }

  // ---- between questions: whose turn it is -----------------------------
  function renderTurnCard(s, type) {
    const main = $('[data-main]', root);
    const together = s.togetherLeft > 0;
    const t = s.teams[s.turn];
    const last = s.last;
    let caption = '';
    if (last && type === 'CONTINUE') {
      if (last.kind === 'together') caption = last.climbed.length ? `${last.climbed.length} team${last.climbed.length > 1 ? 's' : ''} climbed!` : 'Nobody climbed this time.';
      else {
        const lt = s.teams.find((x) => x.id === last.team);
        caption = lt ? (last.moved ? `${lt.name}: ${rungLabel(s, lt.rung)}` : `${lt.name} stays on ${rungLabel(s, lt.rung)}`) : '';
      }
    }
    main.innerHTML = `
      <div class="ml-turn">
        ${s.profile.mascot ? `<img class="ml-turn-host" src="${esc(mascot)}" alt="">` : ''}
        ${caption ? `<p class="ml-caption" lang="${langOf(caption)}">${esc(caption)}</p>` : ''}
        <h1 class="ml-turn-title" lang="en">${together ? (s.profile.mode === 'studio' ? 'Everyone plays' : 'Everybody plays!') : `${s.profile.mode === 'studio' ? 'Next up' : 'Your turn'}`}</h1>
        ${together ? `<p class="ml-turn-sub" lang="en">Every team answers. Right cards climb one rung. · ${s.togetherLeft} left</p>` : `<div class="ml-turn-team">${teamLabel(s, t)}</div><p class="ml-turn-sub" lang="en">${esc(rungLabel(s, t.rung))} → ${esc(rungLabel(s, Math.min(s.ladder.length, t.rung + 1)))}${s.finishing ? ' · last round!' : ''}</p>`}
        <button class="cr-bigbtn is-pulse" data-act="nextq" lang="en">${s.profile.mode === 'studio' ? 'Next question' : 'Question!'} ▶</button>
      </div>`;
  }

  // ---- question ---------------------------------------------------------
  function renderQuestion(s, type) {
    const main = $('[data-main]', root);
    const cur = s.current;
    const key = `${s.turnCount}:${s.togetherLeft}:${cur.itemId}`;
    const fresh = ui.key !== key;
    if (fresh) { stopTimers(); ui.key = key; ui.revealKey = null; ui.paused = false; }
    const pres = presented(s, cur.itemId, cur.salt);
    const item = s.items[cur.itemId];
    const team = cur.kind === 'relay' ? s.teams[s.turn] : null;
    const park = s.profile.mode === 'park';
    const stage = cur.stage;
    const revealed = stage === 'revealed';
    const stem = pres.stem ?? item.stem;
    const picOpts = !!pres.optionImgs;
    const removed = new Set(cur.removed || []);
    const showOpts = stage !== 'prompt';
    // Options slide in the first time they appear for this question, not on every re-render.
    const animateOpts = showOpts && ui.optsKey !== key;
    if (showOpts) ui.optsKey = key;
    const sentence = revealed ? (pres.kind === 'vocab' ? pres.say : fullSentence(item.stem, pres.options[pres.answer].text)) : null;
    const head = cur.kind === 'relay'
      ? `${teamLabel(s, team)}<span class="cr-seat"><span>${park ? 'Player' : 'Speaker'}</span><b>${cur.seat}</b></span><span class="cr-tileval" lang="en">${esc(rungLabel(s, Math.min(s.ladder.length, team.rung + (revealed && cur.activeRight ? 0 : 1))))}</span>`
      : `<span class="cr-qteam" style="--tc:var(--accent)"><span>${park ? 'Everybody!' : 'All teams'}</span></span><span></span><span class="cr-tileval" lang="en">+1 rung</span>`;
    let optionsHtml = pres.options.map((opt, i) => {
      const cls = ['cr-opt'];
      if (removed.has(i)) cls.push('is-gone');
      if (!revealed && cur.lock === i) cls.push('is-locked');
      if (revealed) {
        if (i === pres.answer) cls.push('is-key');
        else if (cur.lock === i) cls.push(park ? 'is-soft-wrong' : 'is-wrong');
        else cls.push('is-dim');
      }
      const poll = cur.poll ? `<span class="ml-poll" style="--p:${cur.poll[i] / 3}" aria-label="Sınıf: ${POLL_LABELS[cur.poll[i]]}"><i></i></span>` : '';
      return `<button class="${cls.join(' ')}" data-k="${i}" data-act="lock" data-v="${i}" aria-label="${OPTION_LETTERS[i]}: ${esc(opt.text)}"${animateOpts ? '' : ' style="animation:none"'}>
        <span class="cr-optmark">${OPTION_SHAPES[i]}<b>${OPTION_LETTERS[i]}</b></span>${picOpts && opt.img ? `<img class="cr-optpic" src="${esc(opt.img)}" alt="">` : `<span class="cr-opttext">${esc(opt.text)}</span>`}${poll}</button>`;
    }).join('');
    const pollControls = cur.poll && !revealed ? `<div class="ml-pollbar"><span class="cr-shadow-label">Sınıfa sor: her seçenek için kaç kart kalktı?</span>${pres.options.map((o, i) => (removed.has(i) ? '' : `<span class="ml-pollset"><b>${OPTION_LETTERS[i]}</b>${[1, 2, 3].map((lv) => `<button class="cr-mini${cur.poll[i] === lv ? ' is-on' : ''}" data-act="poll" data-v="${i}:${lv}">${POLL_LABELS[lv]}</button>`).join('')}</span>`)).join('')}</div>` : '';
    const friend = cur.friend ? s.teams.find((t) => t.id === cur.friend) : null;
    main.innerHTML = `
      <section class="ml-q${revealed ? ' is-revealed' : ''}${pres.img ? ' has-pic' : ''}" style="--tc:${team ? team.hex : 'var(--accent)'}">
        <div class="cr-qhead ml-qhead">${head}</div>
        <div class="ml-prompt">
          ${park ? `<div class="cr-host"><img src="${esc(mascot)}" alt=""><span class="cr-bubble">${revealed ? (cur.kind === 'relay' && !cur.activeRight ? 'Say it with me!' : 'Great!') : stage === 'locked' ? 'Final answer?' : 'Listen!'}</span></div>` : ''}
          ${pres.img ? `<img class="cr-qpic" src="${esc(pres.img)}" alt="">` : ''}
          <div class="cr-prompt-text" data-prompt>${revealed ? (pres.kind === 'vocab' ? `<span class="cr-blank is-filled">${esc(pres.say)}</span>` : promptHtml(item.stem, pres.options[pres.answer].text)) : promptHtml(stem)}</div>
          <button class="cr-speak" data-act="speak" aria-label="Soruyu sesli oku">${ICONS.speak}</button>
        </div>
        ${friend && !revealed ? `<p class="ml-friend" style="--tc:${friend.hex}">${esc(friend.name)} is helping: 20 seconds!</p>` : ''}
        <div class="cr-options ml-options${pres.options.length === 3 ? ' is-three' : ''}${picOpts ? ' is-pics' : ''}" ${showOpts ? '' : 'hidden'} data-options>${optionsHtml}</div>
        ${pollControls}
        <div class="cr-qfoot ml-foot">
          <div class="cr-ring" data-ring style="--tc:${team ? team.hex : 'var(--accent)'};${stage === 'talk' || stage === 'prompt' ? '' : 'visibility:hidden'}"><svg viewBox="0 0 44 44"><circle class="cr-ring-track" cx="22" cy="22" r="19" fill="none" stroke-width="5"/><circle class="cr-ring-bar" cx="22" cy="22" r="19" fill="none" stroke-width="5" stroke-linecap="round" stroke-dasharray="119.4" stroke-dashoffset="0" data-ringbar/></svg><b data-ringn>${s.profile.huddle}</b><small>Team talk</small></div>
          <div class="cr-stagebar" data-stagebar>${stageBar(s, pres, sentence)}</div>
          <div class="cr-hints">${lifelineButtons(s)}</div>
        </div>
      </section>`;

    if (fresh && (stage === 'prompt')) {
      sound.play('flip');
      if (s.profile.autoRead) speakLater(stem, 0.8, 350);
      ui.delay = setTimeout(() => {
        const st = store && store.state;
        if (st && st.phase === 'question' && st.current.stage === 'prompt') store.dispatch({ type: 'STAGE', stage: 'talk', transient: true });
      }, s.profile.optionsDelay * 1000);
    }
    if (stage === 'talk') { startTalk(s); drawRing(); }
    if (revealed && ui.revealKey !== key) {
      ui.revealKey = key;
      onReveal(s, pres, sentence);
    }
  }

  function stageBar(s, pres, sentence) {
    const cur = s.current;
    const park = s.profile.mode === 'park';
    if (cur.stage === 'prompt') return `<button class="cr-bigbtn" data-act="talk" lang="en">Team talk ▶</button>`;
    if (cur.stage === 'talk') {
      if (cur.kind === 'together') return `<span class="cr-dock-info ml-hint">Bütün takımlar kartını kaldırsın, sonra:</span><button class="cr-bigbtn" data-act="reveal" lang="en">${s.profile.mode === 'studio' ? 'Show answer' : 'Cards up! Show!'}</button>`;
      return `<span class="cr-dock-info ml-hint">${esc(s.teams[s.turn].name)} cevabını söylesin, seçeneğe dokunup kilitleyin</span><button class="cr-dbtn" data-act="timer">${ui.paused ? '▶' : '❚❚'}</button><button class="cr-dbtn" data-act="plus10">+10</button>`;
    }
    if (cur.stage === 'locked') return `<span class="cr-dock-info ml-hint">${park ? 'Final answer?' : 'Final answer?'} Diğer takımlar kartlarını kaldırsın.</span><button class="cr-bigbtn is-pulse" data-act="reveal">Göster ▶</button><button class="cr-dbtn" data-act="unlock">Kilidi aç</button>`;
    // revealed
    const item = s.items[cur.itemId];
    const keyOpt = pres.options[pres.answer];
    const why = item.whyTr || (keyOpt.why || '') || (item.type === 'vocab' && item.tr && s.profile.trGloss ? `${item.term} = ${item.tr}` : '');
    const rule = item.rule ? `Kural: ${item.rule}` : '';
    let result = '';
    if (cur.kind === 'relay') {
      const t = s.teams[s.turn];
      if (cur.activeRight) result = `<span class="cr-points" lang="en">${park ? '+★ · up we go!' : s.profile.mode === 'arena' ? `+${cur.gained} XP · ${esc(rankName(t.rung, s.ladder.length))}` : `Correct! ${esc(rungLabel(s, t.rung))}`}</span>`;
      else if (s.profile.mode === 'studio') result = `<span class="cr-points is-miss" lang="en">${cur.fell ? `Back to ${esc(rungLabel(s, t.rung))}` : 'Not this time'}</span>`;
      else if (park) result = `<span class="cr-points is-miss" lang="en">Not yet · say it together</span>${cur.said ? '<span class="cr-echo">Climbed! ✓</span>' : `<button class="cr-dbtn cr-yes" data-act="said">Söylediler ✓ roket yükselsin</button>`}`;
      else result = `<span class="cr-points is-miss" lang="en">Missed · stay on ${esc(rankName(t.rung, s.ladder.length))}</span>`;
    }
    const chipTeams = s.teams.filter((t) => t.id in cur.chips);
    const chipsLabel = cur.kind === 'together' ? 'Doğru kart gösteren takımlar tırmanır (yanlışlara dokunun)' : (park ? 'Doğru kart gösteren takımlar (yanlışlara dokunun)' : 'Doğru kart gösteren takımlar kıvılcım alır' + (s.profile.mode === 'arena' ? ' ve +5 XP' : '') + ' (yanlışlara dokunun)');
    const chips = chipTeams.length ? `<div class="cr-shadow"><span class="cr-shadow-label">${chipsLabel}</span>${chipTeams.map((t) => `<button class="cr-schip" style="--tc:${t.hex}" data-act="chip" data-v="${esc(t.id)}" aria-pressed="${!!cur.chips[t.id]}">${esc(t.name)}</button>`).join('')}</div>` : '';
    return `<div class="cr-reveal">
      ${result}
      ${sentence && (park || cur.kind === 'together') ? `<span class="cr-echo">Say it: “${esc(sentence)}”</span>` : ''}
      ${why || rule ? `<div class="cr-why">${why ? esc(why) : ''}${why && rule ? '<br>' : ''}${rule ? `<small>${esc(rule)}</small>` : ''}</div>` : ''}
      ${chips}
      <button class="cr-bigbtn" data-act="continue">Devam ▶</button>
    </div>`;
  }

  function lifelineButtons(s) {
    const cur = s.current;
    if (cur.kind !== 'relay' || cur.stage === 'revealed' || cur.stage === 'locked') return '';
    const t = s.teams[s.turn];
    const park = s.profile.mode === 'park';
    return LIFELINES.map((k) => (t.lifelines[k] === null ? '' : `<button class="cr-dbtn ml-life" data-act="life" data-v="${k}" ${t.lifelines[k] ? '' : 'disabled'} title="${LIFE[k].tr} (${LIFE[k].key.toUpperCase()})">${LIFE_ICON[k]}<span>${park ? LIFE[k].park : LIFE[k].other}</span></button>`)).join('')
      + `<button class="cr-dbtn" data-act="replace" title="Soruyu değiştir (N)">${ICONS.swap}</button>`;
  }

  function onReveal(s, pres, sentence) {
    const cur = s.current;
    const right = cur.kind === 'together' ? true : cur.activeRight;
    if (right) sound.play('correct'); else sound.play('miss');
    if (sentence) {
      if (s.profile.mode === 'park') { speakLater(sentence, 0.8, 500); if (cur.kind === 'relay' && !cur.activeRight) speakLater(sentence, 0.8, 3400); }
    }
    if (cur.kind === 'relay' && cur.activeRight && s.teams[s.turn].rung >= s.ladder.length && !reducedMotion()) confetti(root, [s.teams[s.turn].hex, '#ffd34d', '#ffffff'], { ms: 1800 });
  }

  // ---- timers -------------------------------------------------------------
  function startTalk(s) {
    if (ui.talk) return;
    ui.total = s.profile.huddle + (s.current.friend ? 20 : 0);
    ui.left = ui.total;
    drawRing();
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

  function stopTimers() {
    clearTimeout(ui.delay); clearInterval(ui.talk); clearTimeout(ui.suspense);
    ui.delay = null; ui.talk = null; ui.suspense = null;
  }

  function stopSpeech() {
    for (const t of ui.speakTimers) clearTimeout(t);
    ui.speakTimers = [];
    speech.stop();
  }

  function speakLater(text, rate, ms) {
    ui.speakTimers.push(setTimeout(() => { if (voiceReady) speech.speak(text, { rate }); }, ms));
  }

  // "Göster": everyone raises cards, a short suspense that grows with the rung, then the reveal.
  function showAnswer() {
    const s = store.state;
    const cur = s.current;
    if (!cur || (cur.kind === 'relay' && cur.stage !== 'locked') || cur.stage === 'revealed' || ui.suspense) return;
    stopTimers();
    const height = cur.kind === 'relay' ? (s.teams[s.turn].rung + 1) / s.ladder.length : 0;
    const cap = s.profile.mode === 'park' ? 2000 : s.profile.mode === 'arena' ? 1200 : 3000;
    const ms = reducedMotion() ? 200 : Math.round(500 + (cap - 500) * height);
    sound.play(ms > 900 ? 'drumroll' : 'boardsUp');
    const opts = $('[data-options]', root);
    if (opts) { opts.classList.add('is-sweep'); opts.style.setProperty('--sweep', `${ms}ms`); }
    ui.suspense = setTimeout(() => { ui.suspense = null; store.dispatch({ type: 'REVEAL' }); }, ms);
  }

  // ---- dock, end, modals ------------------------------------------------
  function renderDock(s) {
    const dock = $('[data-dock]', root);
    if (!dock) return;
    dock.innerHTML = `
      <div class="cr-dock-group"><span class="cr-dock-info">Milyoner Merdiveni · ${esc(s.pack.title)} · kod <b>${esc(s.code)}</b>${s.queue.length < 6 ? ` · kalan soru ${s.queue.length}` : ''}</span></div>
      <div class="cr-dock-group">
        <button class="cr-dbtn" data-act="undo" ${store.canUndo() ? '' : 'disabled'} title="Geri al (U)">${ICONS.undo}<span>Geri al</span></button>
        <button class="cr-dbtn" data-act="rungs" title="Basamağı düzelt (E)">${ICONS.score}<span>Basamak</span></button>
        <button class="cr-dbtn" data-act="mute" aria-pressed="${sound.muted}" aria-label="Ses" title="Ses (M)">${sound.muted ? ICONS.mute : ICONS.sound}</button>
        <button class="cr-dbtn" data-act="full" aria-label="Tam ekran" title="Tam ekran (F)">${ICONS.full}</button>
        <button class="cr-dbtn" data-act="freeze" aria-label="Ekranı karart" title="Ekranı karart (. veya B)">${ICONS.freeze}</button>
        <button class="cr-dbtn cr-dbtn--warn" data-act="finish" title="Oyunu bitir">${ICONS.flag}<span>Bitir</span></button>
      </div>`;
  }

  function renderEnd(s) {
    stopTimers();
    if (ui.endShown) return;
    ui.endShown = true;
    const o = $('[data-overlay]', root);
    const m = s.profile.mode;
    const titles = Object.fromEntries(endingTitles(s).map((t) => [t.teamId, t.title]));
    const table = standings(s);
    const missed = s.missed.map((id) => s.items[id]).filter(Boolean);
    let body = '';
    if (m === 'park') {
      body = `<h1>Everybody landed on the Moon!</h1>
        <div class="ml-moon" aria-hidden="true"><span class="ml-moon-disc"></span>${s.teams.map((t, i) => `<span class="ml-moon-rocket" style="--tc:${t.hex};--i:${i}">${ROCKET_SVG}</span>`).join('')}<img src="${esc(mascot)}" alt="" class="ml-moon-host"></div>
        <div class="cr-awards">${s.teams.map((t, i) => `<div class="cr-award" style="--tc:${t.hex};animation-delay:${i * 0.12}s"><span class="cr-team-ico">${teamGlyph(t, m)}</span><h3 lang="${langOf(t.name)}">${esc(t.name)}</h3><div class="cr-award-title">${esc(titles[t.id] || 'Space Heroes')}</div><div class="cr-award-score">★ ${t.stars} · ${esc(rungLabel(s, t.rung))}</div></div>`).join('')}</div>`;
    } else if (m === 'arena') {
      body = `<h1>Match over</h1>
        <div class="cr-awards">${table.map((t, i) => `<div class="cr-award" style="--tc:${t.hex};animation-delay:${i * 0.1}s"><span class="cr-team-ico">${teamGlyph(t, m)}</span><h3 lang="${langOf(t.name)}">${t.place + 1}. ${esc(t.name)}</h3><div class="cr-award-title">${esc(rankName(t.rung, s.ladder.length))}</div><div class="cr-award-score">${t.xp} XP · ${esc(titles[t.id] || '')}</div></div>`).join('')}</div>`;
    } else {
      body = `<h1>Final ladder</h1>
        <table class="cr-table"><tbody>${table.map((t) => `<tr><td style="width:3ch;font-family:var(--font-display)">${t.place + 1}.</td><td><span class="cr-badge" style="display:inline-grid;vertical-align:middle;margin-right:10px;background:${t.hex};color:#fff">${teamGlyph(t, m)}</span><span lang="${langOf(t.name)}">${esc(t.name)}</span></td><td>${esc(rungLabel(s, t.rung))}</td></tr>`).join('')}</tbody></table>`;
    }
    const review = missed.length ? `<div class="cr-review"><h2>${m === 'park' ? 'Words to practise' : 'Kaçırılanlar'} (${missed.length})</h2><ol>${missed.map((it) => `<li>${it.type === 'vocab' ? esc(it.say || it.term) : promptHtml(it.stem, it.options ? it.options[it.answer] : '')}</li>`).join('')}</ol></div>` : '';
    o.innerHTML = `<section class="cr-end" aria-label="Oyun sonu">${s.outOfQuestions ? '<p class="cr-note" style="text-align:center">Bu konudaki sorular bitti.</p>' : ''}${body}${review}</section>
      <div class="cr-endbar">
        <button class="cr-btn" data-act="undo">Geri al</button>
        <button class="cr-btn cr-btn--go" data-act="newgame">Yeni oyun</button>
        <button class="cr-btn" data-act="print">Yazdır</button>
      </div>`;
    sound.play('finale');
    if (m !== 'studio') confetti(root, s.teams.map((t) => t.hex));
  }

  function rungEditor() {
    const s = store.state;
    const m = el(`<div class="cr-modal" role="dialog" aria-modal="true" aria-label="Basamağı düzelt"><div class="cr-modal-box">
      <h2>Basamağı düzelt</h2>
      <div class="cr-score-rows">${s.teams.map((t) => `<div class="cr-score-row"><span class="cr-badge" style="background:${t.hex};color:#fff">${teamGlyph(t, s.profile.mode)}</span><span>${esc(t.name)} · <b data-r="${esc(t.id)}">${t.rung}</b>/${s.ladder.length}</span>
        <span class="cr-row"><button class="cr-mini" data-adj="${esc(t.id)}" data-d="-1" aria-label="Bir basamak aşağı">−</button><button class="cr-mini" data-adj="${esc(t.id)}" data-d="1" aria-label="Bir basamak yukarı">+</button></span></div>`).join('')}</div>
      <div style="text-align:right;margin-top:12px"><button class="cr-btn" data-close>Tamam</button></div></div></div>`);
    m.addEventListener('click', (ev) => {
      const adj = ev.target.closest('[data-adj]');
      if (adj) {
        store.dispatch({ type: 'ADJUST_RUNG', teamId: adj.dataset.adj, delta: Number(adj.dataset.d) });
        const t = store.state.teams.find((x) => x.id === adj.dataset.adj);
        const n = m.querySelector(`[data-r="${CSS.escape(adj.dataset.adj)}"]`); if (n && t) n.textContent = String(t.rung);
      }
      if (ev.target === m || ev.target.closest('[data-close]')) m.remove();
    });
    root.appendChild(m);
    m.querySelector('[data-close]').focus();
  }

  function freeze() {
    const f = el('<div class="cr-freeze" role="dialog" aria-label="Ekran karartıldı. Devam etmek için dokunun."></div>');
    const wasPaused = ui.paused;
    ui.paused = true;
    const done = () => { f.remove(); ui.paused = wasPaused; window.removeEventListener('keydown', key, true); };
    const key = (ev) => { ev.stopPropagation(); ev.preventDefault(); done(); };
    f.addEventListener('click', done);
    setTimeout(() => window.addEventListener('keydown', key, { capture: true, once: true }), 50);
    root.appendChild(f);
  }

  // ---- input ------------------------------------------------------------
  function act(name, v) {
    const s = store.state;
    const cur = s.current;
    switch (name) {
      case 'nextq': if (!locked()) { lock(); store.dispatch({ type: 'NEXT_QUESTION' }); } break;
      case 'talk': if (!locked() && cur && cur.stage === 'prompt') { lock(); clearTimeout(ui.delay); store.dispatch({ type: 'STAGE', stage: 'talk', transient: true }); } break;
      case 'lock':
        if (!cur || cur.kind !== 'relay' || cur.stage === 'revealed' || locked()) break;
        if (cur.stage === 'prompt') { clearTimeout(ui.delay); }
        lock(); sound.play('tap'); store.dispatch({ type: 'LOCK', choice: Number(v) }); break;
      case 'unlock': store.dispatch({ type: 'UNLOCK' }); break;
      case 'reveal': if (!locked()) { lock(); showAnswer(); } break;
      case 'chip': store.dispatch({ type: 'TOGGLE', teamId: v }); break;
      case 'said': store.dispatch({ type: 'SAID' }); break;
      case 'continue': if (!locked()) { lock(); stopSpeech(); store.dispatch({ type: 'CONTINUE' }); } break;
      case 'life': lifeline(v); break;
      case 'poll': { const [i, lv] = String(v).split(':').map(Number); store.dispatch({ type: 'POLL', option: i, level: lv, transient: false }); break; }
      case 'replace': store.dispatch({ type: 'REPLACE' }); break;
      case 'speak': if (cur) { const p = presented(s, cur.itemId, cur.salt); if (!(voiceReady && speech.speak(p.stem ?? s.items[cur.itemId].stem, { rate: s.profile.autoRead ? 0.8 : 0.95 }))) toast(root, 'İngilizce ses bulunamadı: lütfen soruyu siz okuyun.'); } break;
      case 'timer': ui.paused = !ui.paused; render(store.state, {}); break;
      case 'plus10': ui.left += 10; ui.total = Math.max(ui.total, ui.left); if (!ui.talk) startTalk(s); drawRing(); break;
      case 'undo': store.undo(); break;
      case 'rungs': rungEditor(); break;
      case 'mute': sound.setMuted(!sound.muted); renderDock(s); break;
      case 'full': requestFull(); break;
      case 'freeze': freeze(); break;
      case 'finish': if (window.confirm('Oyun şimdi bitsin mi? Sonuçlar bu haliyle gösterilir.')) store.dispatch({ type: 'FINISH' }); break;
      case 'newgame': stopSpeech(); store.clearSave(); store = null; ui = freshUi(); setupUi.render(); break;
      case 'print': window.print(); break;
      default: break;
    }
  }

  function lifeline(name) {
    const s = store.state;
    if (!s.current || s.current.kind !== 'relay') return;
    if (name === 'friend') {
      const others = s.teams.filter((_, i) => i !== s.turn);
      if (others.length === 1) { store.dispatch({ type: 'LIFELINE', name, teamId: others[0].id }); return; }
      const m = el(`<div class="cr-modal" role="dialog" aria-modal="true" aria-label="Arkadaşa danış"><div class="cr-modal-box"><h2>Hangi takıma danışılsın?</h2>
        <div class="cr-shadow">${others.map((t) => `<button class="cr-schip" style="--tc:${t.hex}" data-friend="${esc(t.id)}">${esc(t.name)}</button>`).join('')}</div>
        <div style="text-align:right;margin-top:12px"><button class="cr-btn" data-close>Vazgeç</button></div></div></div>`);
      m.addEventListener('click', (ev) => {
        const f = ev.target.closest('[data-friend]');
        if (f) { m.remove(); store.dispatch({ type: 'LIFELINE', name, teamId: f.dataset.friend }); sound.play('card'); return; }
        if (ev.target === m || ev.target.closest('[data-close]')) m.remove();
      });
      root.appendChild(m);
      return;
    }
    store.dispatch({ type: 'LIFELINE', name });
    sound.play('card');
  }

  function onKey(e) {
    if (!store) return;
    if (e.target.closest && e.target.closest('input, textarea')) return;
    if ($('.cr-modal', root)) { if (e.key === 'Escape') $('.cr-modal', root).remove(); return; }
    const s = store.state;
    const k = e.key;
    const lower = k.length === 1 ? k.toLowerCase() : k;
    if ((e.ctrlKey || e.metaKey) && lower === 'z') { e.preventDefault(); store.undo(); return; }
    if (e.repeat) return;
    if (lower === 'u' || k === 'PageUp') { e.preventDefault(); store.undo(); return; }
    if (lower === 'm') { act('mute'); return; }
    if (lower === 'f') { requestFull(); return; }
    if (lower === 'b' || k === '.') { e.preventDefault(); freeze(); return; }
    if (lower === 'e') { rungEditor(); return; }
    if (s.phase === 'ladder' && (k === ' ' || k === 'Enter' || k === 'PageDown')) { e.preventDefault(); act('nextq'); return; }
    if (s.phase !== 'question') return;
    const cur = s.current;
    const pres = presented(s, cur.itemId, cur.salt);
    if (/^[1-4]$/.test(k) && Number(k) <= pres.options.length) { act('lock', String(Number(k) - 1)); return; }
    if (lower === '5') { act('life', 'fifty'); return; }
    if (lower === 's') { act('life', 'poll'); return; }
    if (lower === 'a') { act('life', 'friend'); return; }
    if (lower === 'n') { act('replace'); return; }
    if (lower === 't') { act('timer'); return; }
    if (k === '+') { act('plus10'); return; }
    if (k === ' ' || k === 'Enter' || k === 'PageDown') {
      e.preventDefault();
      if (cur.stage === 'prompt') act('talk');
      else if (cur.stage === 'talk' && cur.kind === 'together') act('reveal');
      else if (cur.stage === 'locked') act('reveal');
      else if (cur.stage === 'revealed') act('continue');
    }
  }

  root.addEventListener('click', (e) => {
    if (!store) return;
    const b = e.target.closest('[data-act]');
    if (b && !b.disabled) act(b.dataset.act, b.dataset.v);
  });
  window.addEventListener('keydown', onKey);
  window.addEventListener('beforeunload', (e) => {
    if (store && store.state.phase === 'question') { e.preventDefault(); e.returnValue = ''; }
  });

  setupUi.render();
  setupUi.preload();
}

// A small flat rocket (team colour via currentColor on the body stripe).
const ROCKET_SVG = `<svg viewBox="0 0 40 56" aria-hidden="true"><path d="M20 2c9 7 12 18 11 30l-4 8H13l-4-8C8 20 11 9 20 2z" fill="#fff" stroke="#2d2a4a" stroke-width="2"/><path d="M10 32c-4 3-6 8-6 13l7-3M30 32c4 3 6 8 6 13l-7-3" fill="var(--tc,#ff8a3d)" stroke="#2d2a4a" stroke-width="2" stroke-linejoin="round"/><circle cx="20" cy="20" r="5" fill="#bfe9f3" stroke="#2d2a4a" stroke-width="2"/><path d="M13 40h14" stroke="var(--tc,#ff8a3d)" stroke-width="4"/><path d="M16 44c1 5 2 8 4 10 2-2 3-5 4-10z" fill="#ffb13d"/></svg>`;
