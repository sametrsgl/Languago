// Kategori Kapışması: stage for the category board (shared setup + own flow).
// Teacher chrome is Turkish; everything students read on the stage is English.
import { createStore, readSave } from '../../core/store.mjs';
import { createSound } from '../../core/sound.mjs';
import { createSpeech } from '../../core/speech.mjs';
import { makeBoardCode } from '../../core/rng.mjs';
import { createSetup, teamGlyph } from '../../core/setup.mjs';
import { esc, $, el, toast, confetti, reducedMotion, promptHtml, fullSentence, langOf, ICONS, OPTION_SHAPES, OPTION_LETTERS } from '../../core/dom.mjs';
import { createGame, reduce, presented, valuesFor, cellValue, supportValue, remainingCells, ranking, endingTitles, MAX_CATS } from './logic.mjs';

const SAVE_KEY = 'lg:kategori:save';
const LOCK_MS = 450;

export function validSave(save) {
  const s = save && save.state;
  return !!(s && s.v === 1 && s.game === 'kategori' && s.profile && Array.isArray(s.cats) && Array.isArray(s.cells) && Array.isArray(s.teams) && s.teams.length && ['board', 'question', 'final', 'end'].includes(s.phase));
}

export function mountKategori(root, { dataBase = '/sinif-oyunlari/paket', mascot = '/logo/kommo-512.png' } = {}) {
  const sound = createSound('studio');
  const speech = createSpeech();
  let voiceReady = false;
  speech.probe().then((ok) => { voiceReady = ok; });
  let store = null;
  let ui = freshUi();

  function freshUi() {
    return { key: null, optsKey: null, delay: null, talk: null, left: 0, total: 0, paused: false, lockUntil: 0, revealKey: null, doubleKey: null, endShown: false, lastScores: null, speakTimers: [] };
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
    gameId: 'kategori',
    title: 'Kategori Kapışması',
    lead: 'Kategoriler ve puanlar tahtada. Seçen takım tam puan, doğru kart gösteren diğer takımlar yarım puan alır. Sonunda gizli bahisli final.',
    mascot,
    dataBase,
    minTeams: 2,
    maxTeams: 6,
    defaultTeamCount: 3,
    isActive: () => !store,
    onSkin: applySkin,
    beforeRender: () => stopTimers(),
    gameDefaults: () => ({ extra: [], rows: null, final: true }),
    gameSection: ({ opts, profile, modeId, chip, sourceKey, choices, loading }) => {
      const extra = (opts.extra || []).filter((k) => k !== sourceKey && choices.some((c) => c.key === k));
      const selected = [sourceKey, ...extra].filter(Boolean);
      const main = choices.find((c) => c.key === sourceKey);
      const values = valuesFor(profile, opts.rows);
      const rowsOpts = modeId === 'park' ? [2, 3, 4] : [3, 4, 5];
      const cells = selected.length * values.length;
      const perCell = modeId === 'park' ? 75 : modeId === 'arena' ? 60 : 60;
      const minutes = Math.round((cells * perCell) / 60) + 4;
      const full = selected.length >= MAX_CATS;
      return `<section class="cr-card" aria-labelledby="st4">
        <h2 class="cr-step" id="st4"><b>4</b> Kategoriler</h2>
        <p class="cr-note" style="margin-top:0">${main ? `1. kategori: <b>${esc(main.title)}</b> (2. adımda seçtiğiniz). ` : '2. adımda bir konu seçin; o ilk kategori olur. '}En az 2, en fazla ${MAX_CATS} kategori · şu an ${selected.length}.</p>
        ${extra.length ? `<div class="cr-row">${extra.map((k) => { const c = choices.find((x) => x.key === k); return `<button class="cr-chip" data-act="catadd" data-v="${esc(k)}" aria-pressed="true" title="Çıkar">${esc(c ? c.title : k)} ✕</button>`; }).join('')}</div>` : ''}
        <div class="kg-pick" role="group" aria-label="Kategori ekle">
          ${loading ? '<p class="cr-note">Konular yükleniyor…</p>' : choices.filter((c) => c.key !== sourceKey && !extra.includes(c.key)).map((c) => `<button class="cr-topic kg-add" data-act="catadd" data-v="${esc(c.key)}" ${full ? 'disabled' : ''}>${c.pic ? `<img src="${esc(c.pic)}" alt="" style="width:22px;height:22px;float:right">` : ''}<strong>+ ${esc(c.title)}</strong><small>${c.kind === 'picture' ? 'resimli kelimeler' : c.kind === 'mine' ? 'Paketlerim' : 'dil bilgisi'}</small></button>`).join('')}
        </div>
        <div class="cr-row" style="margin-top:12px"><span class="cr-row-label">Satır sayısı (${modeId === 'park' ? 'yıldız' : 'puan'}) · yaklaşık ${minutes} dk</span>
          ${rowsOpts.map((n) => chip(String(n), 'rows', n, n === values.length)).join('')}</div>
        <div class="cr-row"><span class="cr-row-label">${modeId === 'park' ? 'Büyük Hazine (bütün sınıfa son soru)' : 'Final (gizli bahis, mini tahtaya yazılır)'}</span>
          ${chip('Açık', 'final', 1, opts.final !== false)}${chip('Kapalı', 'final', 0, opts.final === false)}</div>
      </section>`;
    },
    onGameAct: (act, v, { opts, setOpt }) => {
      if (act === 'catadd') {
        const extra = (opts.extra || []).slice();
        const i = extra.indexOf(v);
        if (i >= 0) extra.splice(i, 1); else if (extra.length < MAX_CATS - 1) extra.push(v);
        setOpt('extra', extra);
        return true;
      }
      if (act === 'rows') { setOpt('rows', Number(v)); return true; }
      if (act === 'final') { setOpt('final', v === '1'); return true; }
      return false;
    },
    resumeInfo: () => {
      const save = readResumable();
      if (!save) return null;
      const st = save.state;
      return { title: st.pack.title, code: st.code, savedAt: save.savedAt, detail: `kalan ${remainingCells(st)} kutu` };
    },
    onResume: () => { const s = readResumable(); if (s) enterStage(s.state, true); else setupUi.render('Kayıt bulunamadı.'); },
    onDiscard: () => { try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ } },
    onStart: ({ profile, pack, teams, opts, sourceKey, packFromKey }) => {
      const rows = valuesFor(profile, opts.rows).length;
      const extra = (opts.extra || []).filter((k) => k !== sourceKey);
      const cats = [{ title: pack.title, pack }, ...extra.map((k) => { const p = packFromKey(k); return p ? { title: p.title, pack: p } : null; })]
        .filter((c) => c && c.pack.items.length >= rows);
      if (cats.length < 2) { setupUi.render(`En az 2 kategori gerekli (her birinde en az ${rows} soru). 4. adımdan kategori ekleyin.`); return; }
      const state = createGame({ profile, cats, teams, rows, final: opts.final !== false, code: makeBoardCode(`${Date.now()}:${Math.random()}`), now: Date.now() });
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
      <div class="cr-stage">
        <div class="cr-teambar" data-teams></div>
        <div class="cr-boardwrap kg-wrap"><div class="kg-board" data-board></div>
          ${state.profile.mascot ? `<img class="cr-mascot" src="${esc(mascot)}" alt="">` : ''}
        </div>
        <div class="cr-dock" data-dock></div>
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

  const lock = (ms = LOCK_MS) => { ui.lockUntil = performance.now() + ms; };
  const locked = () => performance.now() < ui.lockUntil;
  const overlay = () => $('[data-overlay]', root);
  // Students see English: built-in picture topics are "Türkçe · English".
  const catLabel = (title) => String(title || '').split(' · ').pop();
  const valueText = (s, v) => (s.profile.mode === 'park' ? '★'.repeat(v) : String(v));

  function render(s, meta = {}) {
    if (!store) return;
    const type = meta.action && meta.action.type;
    if (type === 'UNDO' || type === 'REDO' || type === 'CONTINUE' || type === 'FINAL_APPLY') stopSpeech();
    renderTeams(s);
    renderBoard(s);
    renderDock(s);
    if (s.phase === 'end') { renderEnd(s); return; }
    ui.endShown = false;
    if (s.phase === 'question') renderQuestion(s);
    else if (s.phase === 'final') renderFinal(s);
    else { stopTimers(); const o = overlay(); if (o && !$('.cr-modal', o)) o.innerHTML = ''; ui.key = null; }
  }

  function renderTeams(s) {
    const box = $('[data-teams]', root);
    if (!box) return;
    const prev = ui.lastScores || {};
    box.innerHTML = s.teams.map((t, i) => {
      const active = i === s.turn && (s.phase === 'board' || s.phase === 'question');
      return `<div class="cr-team${active ? ' is-active' : ''}" style="--tc:${t.hex}" data-team="${esc(t.id)}">
        <span class="cr-team-ico">${teamGlyph(t, s.profile.mode)}</span>
        <span style="min-width:0"><span class="cr-team-name" style="display:block" lang="${langOf(t.name)}">${esc(t.name)}</span>${active ? `<span class="cr-team-sub" lang="en">${s.phase === 'board' ? (s.profile.mode === 'park' ? 'pick a chest!' : 'pick a cell') : 'picking'}</span>` : ''}</span>
        <span class="cr-team-score">${s.profile.mode === 'park' ? `★ ${t.score}` : t.score}</span>
      </div>`;
    }).join('');
    if (ui.lastScores && s.teams.some((t) => prev[t.id] != null && prev[t.id] < t.score)) sound.play('point');
    ui.lastScores = Object.fromEntries(s.teams.map((t) => [t.id, t.score]));
  }

  function renderBoard(s) {
    const board = $('[data-board]', root);
    if (!board) return;
    const byId = Object.fromEntries(s.teams.map((t) => [t.id, t]));
    board.style.gridTemplateColumns = `repeat(${s.cats.length}, minmax(0, 1fr))`;
    board.style.gridTemplateRows = `auto repeat(${s.values.length}, minmax(0, 1fr))`;
    const heads = s.cats.map((c) => `<div class="kg-head" lang="${langOf(catLabel(c.title))}">${esc(catLabel(c.title))}</div>`).join('');
    const cells = [];
    for (let row = 0; row < s.values.length; row++) {
      for (let col = 0; col < s.cats.length; col++) {
        const cell = s.cells.find((c) => c.col === col && c.row === row);
        if (!cell) { cells.push('<span class="kg-cell is-empty"></span>'); continue; }
        const team = cell.by ? byId[cell.by] : null;
        if (cell.opened) {
          cells.push(`<span class="kg-cell is-open${cell.result === 'wrong' ? ' is-miss' : ''}" style="--tc:${team ? team.hex : '#999'}" aria-label="${esc(s.cats[col].title)} ${s.values[row]}: açıldı">${team ? teamGlyph(team, s.profile.mode) : ''}</span>`);
        } else {
          cells.push(`<button class="kg-cell" data-act="open" data-v="${esc(cell.id)}" aria-label="${esc(s.cats[col].title)} ${s.values[row]}"><span class="kg-val">${valueText(s, s.values[row])}</span></button>`);
        }
      }
    }
    board.innerHTML = heads + cells.join('');
  }

  function renderDock(s) {
    const dock = $('[data-dock]', root);
    if (!dock) return;
    dock.innerHTML = `
      <div class="cr-dock-group"><span class="cr-dock-info">Kategori Kapışması · kalan ${remainingCells(s)} · kod <b>${esc(s.code)}</b></span></div>
      <div class="cr-dock-group">
        <button class="cr-dbtn" data-act="undo" ${store.canUndo() ? '' : 'disabled'} title="Geri al (U)">${ICONS.undo}<span>Geri al</span></button>
        <button class="cr-dbtn" data-act="scores" title="Puanı düzelt (E)">${ICONS.score}<span>Puan</span></button>
        <button class="cr-dbtn" data-act="mute" aria-pressed="${sound.muted}" aria-label="Ses" title="Ses (M)">${sound.muted ? ICONS.mute : ICONS.sound}</button>
        <button class="cr-dbtn" data-act="full" aria-label="Tam ekran" title="Tam ekran (F)">${ICONS.full}</button>
        <button class="cr-dbtn" data-act="freeze" aria-label="Ekranı karart" title="Ekranı karart (. veya B)">${ICONS.freeze}</button>
        ${s.finalOn && s.phase === 'board' ? `<button class="cr-dbtn" data-act="tofinal" title="Kalan kutuları bırakıp finale geç">${ICONS.flag}<span>${s.profile.mode === 'park' ? 'Büyük Hazine' : 'Finale geç'}</span></button>` : ''}
        <button class="cr-dbtn cr-dbtn--warn" data-act="finish" title="Oyunu bitir">${ICONS.flag}<span>Bitir</span></button>
      </div>`;
  }

  // ---- question overlay ------------------------------------------------
  function questionHtml(s, { itemId, stage, chips, head, extraBar = '', hideOptions = false }) {
    const pres = presented(s, itemId, '');
    const item = s.items[itemId];
    const park = s.profile.mode === 'park';
    const revealed = stage === 'revealed';
    const showOpts = stage !== 'prompt' && !hideOptions;
    const key = `${s.phase}:${itemId}`;
    const animate = showOpts && ui.optsKey !== key;
    if (showOpts) ui.optsKey = key;
    const stem = pres.stem ?? item.stem;
    const sentence = revealed ? (pres.kind === 'vocab' ? pres.say : fullSentence(item.stem, pres.options[pres.answer].text)) : null;
    const opts = pres.options.map((opt, i) => {
      const cls = ['cr-opt'];
      if (revealed) cls.push(i === pres.answer ? 'is-key' : 'is-dim');
      return `<button class="${cls.join(' ')}" data-k="${i}" aria-label="${OPTION_LETTERS[i]}: ${esc(opt.text)}"${animate ? '' : ' style="animation:none"'} tabindex="-1">
        <span class="cr-optmark">${OPTION_SHAPES[i]}<b>${OPTION_LETTERS[i]}</b></span>${pres.optionImgs && opt.img ? `<img class="cr-optpic" src="${esc(opt.img)}" alt="">` : `<span class="cr-opttext">${esc(opt.text)}</span>`}</button>`;
    }).join('');
    let bar = '';
    if (stage === 'prompt') bar = `<button class="cr-bigbtn" data-act="talk" lang="en">Team talk ▶</button>`;
    else if (stage === 'talk') bar = `<span class="cr-dock-info" style="font-size:calc(var(--u)*1.4)">Bütün takımlar kartını hazırlasın, sonra:</span><button class="cr-bigbtn is-pulse" data-act="reveal" lang="en">${park ? '1, 2, 3… Show me!' : 'Show me!'}</button><button class="cr-dbtn" data-act="plus10">+10</button>`;
    else {
      const keyOpt = pres.options[pres.answer];
      const why = item.whyTr || keyOpt.why || (item.type === 'vocab' && item.tr && s.profile.trGloss ? `${item.term} = ${item.tr}` : '');
      bar = `<div class="cr-reveal">
        ${sentence ? `<span class="cr-echo" lang="en">Everyone says it: “${esc(sentence)}”</span>` : ''}
        ${why ? `<div class="cr-why">${esc(why)}${item.rule ? `<small>Kural: ${esc(item.rule)}</small>` : ''}</div>` : ''}
        ${extraBar}
      </div>`;
    }
    return `<section class="cr-q${revealed ? ' is-revealed' : ''}${pres.img ? ' has-pic' : ''}" role="dialog" aria-modal="true" aria-label="Soru">
      <div class="cr-qhead">${head}</div>
      <div class="cr-qbody">
        <div class="cr-prompt">
          ${park ? `<div class="cr-host"><img src="${esc(mascot)}" alt=""><span class="cr-bubble">${revealed ? 'Say it with me!' : 'Listen!'}</span></div>` : '<span aria-hidden="true"></span>'}
          <div class="cr-prompt-main">
            ${pres.img ? `<img class="cr-qpic" src="${esc(pres.img)}" alt="">` : ''}
            <div class="cr-prompt-text">${revealed ? (pres.kind === 'vocab' ? `<span class="cr-blank is-filled">${esc(pres.say)}</span>` : promptHtml(item.stem, pres.options[pres.answer].text)) : promptHtml(stem)}</div>
          </div>
          <button class="cr-speak" data-act="speak" aria-label="Soruyu sesli oku">${ICONS.speak}</button>
        </div>
        <div class="cr-options${pres.options.length === 3 ? ' is-three' : ''}${pres.optionImgs ? ' is-pics' : ''}" ${showOpts ? '' : 'hidden'}>${opts}</div>
      </div>
      <div class="cr-qfoot">
        <div class="cr-ring" style="${stage === 'talk' || stage === 'prompt' ? '' : 'visibility:hidden'}"><svg viewBox="0 0 44 44"><circle class="cr-ring-track" cx="22" cy="22" r="19" fill="none" stroke-width="5"/><circle class="cr-ring-bar" cx="22" cy="22" r="19" fill="none" stroke-width="5" stroke-linecap="round" stroke-dasharray="119.4" stroke-dashoffset="0" data-ringbar/></svg><b data-ringn>${s.profile.huddle}</b><small>Team talk</small></div>
        <div class="cr-stagebar">${bar}</div>
        <div class="cr-hints">${stage !== 'revealed' && s.phase === 'question' ? `<button class="cr-dbtn" data-act="replace" title="Soruyu değiştir (N)">${ICONS.swap}</button>` : ''}</div>
      </div>
    </section>`;
  }

  function afterQuestionRender(s, stage, itemId, key) {
    if (ui.key !== key) {
      stopTimers(); ui.key = key; ui.revealKey = null;
      if (stage === 'prompt') {
        sound.play('flip');
        const pres = presented(s, itemId, '');
        if (s.profile.autoRead) speakLater(pres.stem ?? s.items[itemId].stem, 0.8, 350);
        ui.delay = setTimeout(() => {
          const st = store && store.state;
          const cur = st && (st.phase === 'final' ? st.final : st.current);
          if (cur && cur.stage === 'prompt') store.dispatch({ type: 'STAGE', stage: 'talk', transient: true });
        }, s.profile.optionsDelay * 1000);
      }
    }
    if (stage === 'talk') { startTalk(s); drawRing(); }
    if (stage === 'revealed' && ui.revealKey !== key) {
      ui.revealKey = key;
      sound.play('correct');
      const pres = presented(s, itemId, '');
      const item = s.items[itemId];
      const sentence = pres.kind === 'vocab' ? pres.say : fullSentence(item.stem, pres.options[pres.answer].text);
      if (sentence) { speakLater(sentence, s.profile.autoRead ? 0.8 : 0.95, 500); if (s.profile.mode === 'park') speakLater(sentence, 0.8, 3400); }
    }
  }

  function renderQuestion(s) {
    const cur = s.current;
    const cell = s.cells.find((c) => c.id === cur.cell);
    const team = s.teams[s.turn];
    const park = s.profile.mode === 'park';
    const v = cellValue(s, cell);
    const key = `q:${cur.cell}:${cur.itemId}`;
    if (cell.double && ui.doubleKey !== cur.cell && cur.stage === 'prompt') {
      ui.doubleKey = cur.cell;
      sound.play('card');
      const splash = el(`<div class="cr-boards" aria-hidden="true"><span lang="en">${park ? 'Double treasure!' : 'Double!'}</span></div>`);
      root.appendChild(splash); setTimeout(() => splash.remove(), 1200);
    }
    const head = `<span class="cr-qteam" style="--tc:${team.hex}"><span class="cr-team-ico">${teamGlyph(team, s.profile.mode)}</span><span lang="${langOf(team.name)}">${esc(team.name)}</span></span>
      <span class="cr-seat"><span lang="en">${park ? 'Player' : 'Speaker'}</span><b>${cur.seat}</b></span>
      <span class="cr-tileval" lang="en">${esc(catLabel(s.cats[cell.col].title))} · ${valueText(s, v)}${cell.double ? ' · x2' : ''}</span>`;
    const extraBar = cur.stage === 'revealed' ? `<div class="cr-shadow"><span class="cr-shadow-label">Doğru kart gösteren takımlar · ${esc(team.name)} ${valueText(s, v)}, diğerleri ${valueText(s, supportValue(s, cell))} (yanlışlara dokunun)</span>
        ${s.teams.map((t) => `<button class="cr-schip" style="--tc:${t.hex}" data-act="chip" data-v="${esc(t.id)}" aria-pressed="${!!cur.chips[t.id]}">${esc(t.name)}</button>`).join('')}</div>
        <button class="cr-bigbtn" data-act="continue">Devam ▶</button>` : '';
    overlay().innerHTML = questionHtml(s, { itemId: cur.itemId, stage: cur.stage, chips: cur.chips, head, extraBar });
    afterQuestionRender(s, cur.stage, cur.itemId, key);
  }

  function renderFinal(s) {
    const f = s.final;
    const park = s.profile.mode === 'park';
    const key = `f:${f.itemId}`;
    if (f.stage === 'wager') {
      stopTimers();
      ui.key = null;
      overlay().innerHTML = `<div class="cr-cardov" role="dialog" aria-modal="true" aria-label="Final"><div class="cr-bigcard">
        <h2 lang="en">Final round</h2>
        <p lang="en">Each team writes a secret wager on its board: from 0 up to its score. Turn the board over!</p>
        <p class="cr-note">Takımlar bahislerini mini tahtaya yazıp ters çevirsin. Soru açıldıktan sonra bahisleri gireceksiniz.</p>
        <div class="cr-actions"><button class="cr-bigbtn" data-act="wagerdone">Bahisler yazıldı ▶</button></div>
      </div></div>`;
      return;
    }
    const head = `<span class="cr-qteam" style="--tc:var(--accent)"><span lang="en">${park ? 'Big Treasure · everybody!' : 'Final round'}</span></span><span></span><span class="cr-tileval" lang="en">${park ? '+★★★' : 'Wager'}</span>`;
    let extraBar = '';
    if (f.stage === 'revealed') {
      const wagerRows = park ? '' : s.teams.map((t) => {
        const w = f.wagers[t.id] || 0;
        const presets = [0, 0.25, 0.5, 1].map((p) => Math.round(t.score * p));
        return `<div class="kg-wager" style="--tc:${t.hex}"><b lang="${langOf(t.name)}">${esc(t.name)}</b><span>bahis: <output>${w}</output></span>${[...new Set(presets)].map((a) => `<button class="cr-mini${a === w ? ' is-on' : ''}" data-act="wager" data-v="${esc(t.id)}:${a}">${a}</button>`).join('')}<button class="cr-mini" data-act="wager" data-v="${esc(t.id)}:${Math.max(0, w - 50)}">−50</button><button class="cr-mini" data-act="wager" data-v="${esc(t.id)}:${w + 50}">+50</button></div>`;
      }).join('');
      extraBar = `<div class="cr-shadow"><span class="cr-shadow-label">${park ? 'Doğru kart gösteren takımlar üç yıldız alır (yanlışlara dokunun)' : 'Doğru cevaplayan takımlar (yanlışlara dokunun); sonra bahisleri girin'}</span>
        ${s.teams.map((t) => `<button class="cr-schip" style="--tc:${t.hex}" data-act="chip" data-v="${esc(t.id)}" aria-pressed="${!!f.chips[t.id]}">${esc(t.name)}</button>`).join('')}</div>
        ${wagerRows ? `<div class="kg-wagers">${wagerRows}</div>` : ''}
        <button class="cr-bigbtn" data-act="finalapply">${park ? 'Hazineyi aç ▶' : 'Sonuçları uygula ▶'}</button>`;
    }
    // The final reveal carries wagers: the filled sentence is enough, the options step aside.
    overlay().innerHTML = questionHtml(s, { itemId: f.itemId, stage: f.stage, chips: f.chips, head, extraBar, hideOptions: f.stage === 'revealed' });
    afterQuestionRender(s, f.stage, f.itemId, key);
  }

  // ---- timers ------------------------------------------------------------
  function startTalk(s) {
    if (ui.talk) return;
    ui.total = s.profile.huddle; ui.left = ui.total;
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
  function stopTimers() { clearTimeout(ui.delay); clearInterval(ui.talk); ui.delay = null; ui.talk = null; }
  function stopSpeech() { for (const t of ui.speakTimers) clearTimeout(t); ui.speakTimers = []; speech.stop(); }
  function speakLater(text, rate, ms) { ui.speakTimers.push(setTimeout(() => { if (voiceReady) speech.speak(text, { rate }); }, ms)); }

  // ---- end -----------------------------------------------------------------
  function renderEnd(s) {
    stopTimers();
    if (ui.endShown) return;
    ui.endShown = true;
    const m = s.profile.mode;
    const titles = Object.fromEntries(endingTitles(s).map((t) => [t.teamId, t.title]));
    const table = ranking(s);
    const missed = s.missed.map((id) => s.items[id]).filter(Boolean);
    let body;
    if (m === 'studio') {
      body = `<h1>Final scores</h1><table class="cr-table"><tbody>${table.map((t) => `<tr><td style="width:3ch;font-family:var(--font-display)">${t.place + 1}.</td><td><span class="cr-badge" style="display:inline-grid;vertical-align:middle;margin-right:10px;background:${t.hex};color:#fff">${teamGlyph(t, m)}</span><span lang="${langOf(t.name)}">${esc(t.name)}</span></td><td>${t.score}</td></tr>`).join('')}</tbody></table>`;
    } else {
      body = `<h1 lang="en">${m === 'park' ? 'Well done, everyone!' : 'Match over'}</h1>
        <div class="cr-awards">${table.map((t, i) => `<div class="cr-award" style="--tc:${t.hex};animation-delay:${i * 0.1}s"><span class="cr-team-ico">${teamGlyph(t, m)}</span><h3 lang="${langOf(t.name)}">${m === 'arena' ? `${t.place + 1}. ` : ''}${esc(t.name)}</h3><div class="cr-award-title" lang="en">${esc(titles[t.id] || 'Team spirit')}</div><div class="cr-award-score">${m === 'park' ? `★ ${t.score}` : `${t.score} pts`}</div></div>`).join('')}</div>`;
    }
    const review = missed.length ? `<div class="cr-review"><h2>${m === 'park' ? 'Words to practise' : 'Kaçırılanlar'} (${missed.length})</h2><ol>${missed.map((it) => `<li>${it.type === 'vocab' ? esc(it.say || it.term) : promptHtml(it.stem, it.options ? it.options[it.answer] : '')}</li>`).join('')}</ol></div>` : '';
    overlay().innerHTML = `<section class="cr-end" aria-label="Oyun sonu">${body}${review}</section>
      <div class="cr-endbar"><button class="cr-btn" data-act="undo">Geri al</button><button class="cr-btn cr-btn--go" data-act="newgame">Yeni oyun</button><button class="cr-btn" data-act="print">Yazdır</button></div>`;
    sound.play('finale');
    if (m !== 'studio' && !reducedMotion()) confetti(root, s.teams.map((t) => t.hex));
  }

  function scoreEditor() {
    const s = store.state;
    const unit = s.profile.mode === 'park' ? 1 : 50;
    const m = el(`<div class="cr-modal" role="dialog" aria-modal="true" aria-label="Puanı düzelt"><div class="cr-modal-box"><h2>Puanı düzelt</h2>
      <div class="cr-score-rows">${s.teams.map((t) => `<div class="cr-score-row"><span class="cr-badge" style="background:${t.hex};color:#fff">${teamGlyph(t, s.profile.mode)}</span><span>${esc(t.name)} · <b data-sc="${esc(t.id)}">${t.score}</b></span>
        <span class="cr-row"><button class="cr-mini" data-adj="${esc(t.id)}" data-d="${-unit}">−${unit}</button><button class="cr-mini" data-adj="${esc(t.id)}" data-d="${unit}">+${unit}</button></span></div>`).join('')}</div>
      <div style="text-align:right;margin-top:12px"><button class="cr-btn" data-close>Tamam</button></div></div></div>`);
    m.addEventListener('click', (ev) => {
      const adj = ev.target.closest('[data-adj]');
      if (adj) { store.dispatch({ type: 'ADJUST', teamId: adj.dataset.adj, delta: Number(adj.dataset.d) }); const t = store.state.teams.find((x) => x.id === adj.dataset.adj); const n = m.querySelector(`[data-sc="${CSS.escape(adj.dataset.adj)}"]`); if (n && t) n.textContent = String(t.score); }
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
    switch (name) {
      case 'open': if (!locked()) { lock(); sound.play('tap'); store.dispatch({ type: 'OPEN', cellId: v }); } break;
      case 'talk': if (!locked()) { lock(); clearTimeout(ui.delay); store.dispatch({ type: 'STAGE', stage: 'talk', transient: true }); } break;
      case 'reveal': if (!locked()) { lock(); stopTimers(); sound.play('boardsUp'); setTimeout(() => store.dispatch({ type: 'REVEAL' }), reducedMotion() ? 0 : 500); } break;
      case 'chip': store.dispatch({ type: 'TOGGLE', teamId: v }); break;
      case 'continue': if (!locked()) { lock(); store.dispatch({ type: 'CONTINUE' }); } break;
      case 'replace': store.dispatch({ type: 'REPLACE' }); break;
      case 'plus10': ui.left += 10; ui.total = Math.max(ui.total, ui.left); if (!ui.talk) startTalk(s); drawRing(); break;
      case 'wagerdone': if (!locked()) { lock(); store.dispatch({ type: 'WAGER_DONE' }); } break;
      case 'wager': { const [id, amount] = String(v).split(':'); store.dispatch({ type: 'WAGER', teamId: id, amount: Number(amount) }); break; }
      case 'finalapply': if (!locked()) { lock(); store.dispatch({ type: 'FINAL_APPLY' }); } break;
      case 'tofinal': if (window.confirm('Kalan kutular bırakılıp finale geçilsin mi?')) store.dispatch({ type: 'TO_FINAL' }); break;
      case 'speak': {
        const cur = s.phase === 'final' ? s.final : s.current;
        if (cur) { const p = presented(s, cur.itemId, ''); if (!(voiceReady && speech.speak(p.stem ?? s.items[cur.itemId].stem, { rate: s.profile.autoRead ? 0.8 : 0.95 }))) toast(root, 'İngilizce ses bulunamadı: lütfen soruyu siz okuyun.'); }
        break;
      }
      case 'undo': store.undo(); break;
      case 'scores': scoreEditor(); break;
      case 'mute': sound.setMuted(!sound.muted); renderDock(s); break;
      case 'full': requestFull(); break;
      case 'freeze': freeze(); break;
      case 'finish': if (window.confirm('Oyun şimdi bitsin mi? Sonuçlar bu haliyle gösterilir.')) store.dispatch({ type: 'FINISH' }); break;
      case 'newgame': stopSpeech(); store.clearSave(); store = null; ui = freshUi(); setupUi.render(); break;
      case 'print': window.print(); break;
      default: break;
    }
  }

  function onKey(e) {
    if (!store) return;
    if (e.target.closest && e.target.closest('input, textarea')) return;
    if ($('.cr-modal', root)) { if (e.key === 'Escape') $('.cr-modal', root).remove(); return; }
    const s = store.state;
    const k = e.key; const lower = k.length === 1 ? k.toLowerCase() : k;
    if ((e.ctrlKey || e.metaKey) && lower === 'z') { e.preventDefault(); store.undo(); return; }
    if (e.repeat) return;
    if (lower === 'u' || k === 'PageUp') { e.preventDefault(); store.undo(); return; }
    if (lower === 'm') { act('mute'); return; }
    if (lower === 'f') { requestFull(); return; }
    if (lower === 'b' || k === '.') { e.preventDefault(); freeze(); return; }
    if (lower === 'e') { scoreEditor(); return; }
    if (lower === 'n') { act('replace'); return; }
    if (k === ' ' || k === 'Enter' || k === 'PageDown') {
      const cur = s.phase === 'final' ? s.final : s.current;
      if (!cur) return;
      e.preventDefault();
      if (cur.stage === 'wager') act('wagerdone');
      else if (cur.stage === 'prompt') act('talk');
      else if (cur.stage === 'talk') act('reveal');
      else if (cur.stage === 'revealed') act(s.phase === 'final' ? 'finalapply' : 'continue');
    }
  }

  root.addEventListener('click', (e) => {
    if (!store) return;
    const b = e.target.closest('[data-act]');
    if (b && !b.disabled) act(b.dataset.act, b.dataset.v);
  });
  window.addEventListener('keydown', onKey);
  window.addEventListener('beforeunload', (e) => { if (store && (store.state.phase === 'question' || store.state.phase === 'final')) { e.preventDefault(); e.returnValue = ''; } });

  setupUi.render();
  setupUi.preload();
}
