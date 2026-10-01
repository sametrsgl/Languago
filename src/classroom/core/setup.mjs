// The shared setup screen for every classroom game (Turkish teacher chrome):
// 1 group + look, 2 content (built-in topics or own AI packs), 3 teams,
// 4 game-specific options. A game passes its own step 4 and a start handler.
import { GROUPS, MODES, audienceProfile, profileSummary, groupById, defaultModeFor } from './groups.mjs';
import { defaultTeams, glyph } from './teams.mjs';
import { makePack } from './pack.mjs';
import { readJson, writeJson } from './store.mjs';
import { esc, $, toast, ICONS } from './dom.mjs';

const SETUP_KEY = 'lg:classroom:setup';
const PACKS_KEY = 'lg:classroom:packs';
const AI_DRAFT_KEY = 'lg:classroom:ai-draft';
// The server stops at about 50 s; past this the request is given up on.
const AI_CLIENT_TIMEOUT_MS = 90_000;
const clampSeats = (n) => Math.max(1, Math.min(8, Math.round(Number(n)) || 1));

export function teamGlyph(t, modeId) {
  return modeId === 'arena' ? glyph('emblem', t.emblem) : glyph('shape', t.shape);
}

export function chip(label, act, v, on) {
  return `<button class="cr-chip" data-act="${act}" data-v="${esc(v)}" aria-pressed="${on}">${esc(label)}</button>`;
}

export function ago(ts) {
  const min = Math.round((Date.now() - Number(ts || 0)) / 60000);
  if (min < 1) return 'az önce';
  if (min < 60) return `${min} dk önce`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} saat önce`;
  return `${Math.round(h / 24)} gün önce`;
}

/**
 * @param {HTMLElement} root
 * @param {object} o
 *   gameId, title, lead, mascot, dataBase
 *   minTeams, maxTeams, defaultTeamCount
 *   isActive(): true while the setup screen is shown (the game is not running)
 *   onSkin(modeId): apply the look (sound skin etc.)
 *   beforeRender(): stop game timers/speech
 *   gameSection(ctx) -> html for step 4; ctx = { setup, opts, profile, modeId, chip, pack }
 *   gameDefaults(modeId) -> default options object for step 4
 *   onGameAct(act, v, ctx) -> true when step 4 handled a click
 *   resumeInfo() -> null | { title, code, savedAt, detail }
 *   onResume(), onDiscard()
 *   onStart({ profile, pack, teams, opts, setup })
 */
export function createSetup(root, o) {
  const saved = readJson(SETUP_KEY, {});
  const minTeams = o.minTeams ?? 2;
  const maxTeams = o.maxTeams ?? 8;
  const setup = {
    group: GROUPS.some((g) => g.id === saved.group) ? saved.group : 'a2g',
    mode: MODES[saved.mode] ? saved.mode : null,
    topicKey: typeof saved.topicKey === 'string' ? saved.topicKey : null,
    teamCount: Math.round(Number(saved.teamCount)) || o.defaultTeamCount || 4,
    names: Array.isArray(saved.names) ? saved.names.map((x) => (x && typeof x.name === 'string' && typeof x.mode === 'string' ? { mode: x.mode, name: x.name.slice(0, 28) } : null)) : [],
    seats: Array.isArray(saved.seats) ? saved.seats.map(clampSeats) : [],
    tab: saved.tab === 'ai' ? 'ai' : 'builtin',
    myPackId: typeof saved.myPackId === 'string' ? saved.myPackId : null,
    games: saved.games && typeof saved.games === 'object' ? saved.games : {},
    query: '',
  };
  // Legacy Kutu Avı options lived at the top level of the saved setup.
  if (o.gameId === 'kutu-avi' && !setup.games['kutu-avi'] && (saved.boardSize || Number.isInteger(saved.surprise))) {
    setup.games['kutu-avi'] = { boardSize: saved.boardSize ?? null, surprise: Number.isInteger(saved.surprise) ? saved.surprise : null };
  }
  // saved: a pack kept in memory when this browser refused to store it.
  // auth: undefined until asked, then true/false (null when the check failed).
  // The typed topic survives the trip to the sign-in page (sessionStorage).
  const ai = { prompt: '', count: 24, busy: false, started: 0, error: '', detail: '', needLogin: false, draft: null, removed: new Set(), tick: null, saved: null, auth: undefined, ctrl: null, cancelled: false };
  try {
    const kept = JSON.parse(sessionStorage.getItem(AI_DRAFT_KEY) || 'null');
    if (kept && typeof kept.prompt === 'string') ai.prompt = kept.prompt.slice(0, 300);
    if (kept && [12, 16, 24, 32].includes(kept.count)) ai.count = kept.count;
  } catch { /* storage blocked */ }
  const keepAiDraft = () => { try { sessionStorage.setItem(AI_DRAFT_KEY, JSON.stringify({ prompt: ai.prompt, count: ai.count })); } catch { /* storage blocked */ } };
  const levelData = {};
  const levelLoading = {};

  const modeId = () => setup.mode || defaultModeFor(setup.group);
  const teamCount = () => Math.max(minTeams, Math.min(maxTeams, setup.teamCount));
  const opts = () => ({ ...(o.gameDefaults ? o.gameDefaults(modeId(), setup.group) : {}), ...(setup.games[o.gameId] || {}) });
  const setOpt = (k, v) => { setup.games[o.gameId] = { ...(setup.games[o.gameId] || {}), [k]: v }; };

  // One request per level, however many renders ask for it while it loads.
  function loadLevel(level) {
    if (levelData[level]) return Promise.resolve(levelData[level]);
    if (!levelLoading[level]) {
      levelLoading[level] = fetch(`${o.dataBase || '/sinif-oyunlari/paket'}/${level}.json`)
        .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
        .then((d) => (levelData[level] = d))
        .finally(() => { delete levelLoading[level]; });
    }
    return levelLoading[level];
  }

  // Re-render after an async result without dropping the teacher's focus/caret.
  function renderKeepFocus() {
    const a = document.activeElement;
    const info = a && a !== document.body && root.contains(a) && a.dataset && a.dataset.act
      ? { act: a.dataset.act, i: a.dataset.i, v: a.dataset.v, start: a.selectionStart, end: a.selectionEnd } : null;
    render();
    if (!info) return;
    const q = (x) => (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(x) : String(x).replace(/["\\]/g, '\\$&'));
    const n = $(`[data-act="${q(info.act)}"]${info.i != null ? `[data-i="${q(info.i)}"]` : ''}${info.v != null ? `[data-v="${q(info.v)}"]` : ''}`, root);
    if (!n || n.disabled) return;
    n.focus();
    try { if (info.start != null && n.setSelectionRange) n.setSelectionRange(info.start, info.end); } catch { /* not a text field */ }
  }

  function render(error = '') {
    if (o.beforeRender) o.beforeRender();
    o.onSkin(modeId());
    const group = groupById(setup.group);
    const profile = audienceProfile(setup.group, { mode: modeId() });
    const resumable = o.resumeInfo ? o.resumeInfo() : null;
    const teams = setupTeams();
    const level = group.level;
    const data = levelData[level];
    const src = selectedSource();
    // Games that combine several topics (e.g. a category board) get the level's
    // topics and the teacher's own packs, keyed like sourceKey().
    const choices = [
      ...(data ? data.topics.map((t) => ({ key: `${level}:${t.id}`, title: t.title, kind: t.kind, count: t.items.length, pic: t.kind === 'picture' && t.items[0] ? t.items[0].pic : null })) : []),
      ...myPacks().filter(packFits).map((p) => ({ key: `mine:${p.id}`, title: p.title, kind: 'mine', count: p.items.length, pic: null })),
    ];
    const game = o.gameSection ? o.gameSection({ setup, opts: opts(), profile, modeId: modeId(), chip, source: src, sourceKey: sourceKey(), choices, loading: !data }) : '';

    root.innerHTML = `
    <div class="cr-setup">
      <div class="cr-top">
        <a class="cr-back" href="/sinif-oyunlari">${ICONS.back.replace('<svg', '<svg width="16" height="16" style="vertical-align:-3px"')} Sınıf oyunları</a>
      </div>
      <div style="display:flex;gap:16px;align-items:center;margin-bottom:18px">
        <img class="cr-logo" src="${esc(o.mascot)}" alt="" width="64" height="64" style="width:64px;height:64px">
        <div>
          <h1 class="cr-title">${esc(o.title)}</h1>
          <p class="cr-lead">${esc(o.lead)}</p>
        </div>
      </div>
      ${resumable ? `<div class="cr-resume" role="region" aria-label="Yarım kalan oyun">
        <strong>Yarım kalan oyun:</strong> <span>${esc(resumable.title)} · ${esc(resumable.code)} · ${esc(ago(resumable.savedAt))}${resumable.detail ? ` · ${esc(resumable.detail)}` : ''}</span>
        <span style="flex:1"></span>
        <button class="cr-btn cr-btn--go" style="min-width:0" data-act="resume">Devam et</button>
        <button class="cr-btn" data-act="discard">Sil</button>
      </div>` : ''}
      <div class="cr-grid">
        <div style="display:grid;gap:18px">
          <section class="cr-card" aria-labelledby="st1">
            <h2 class="cr-step" id="st1"><b>1</b> Hangi grup?</h2>
            <div class="cr-row"><span class="cr-row-label">Yetişkin</span>
              ${GROUPS.filter((g) => !g.young).map((g) => chip(g.label, 'group', g.id, g.id === setup.group)).join('')}</div>
            <div class="cr-row"><span class="cr-row-label">Genç · 7-14 yaş</span>
              ${GROUPS.filter((g) => g.young).map((g) => chip(g.label, 'group', g.id, g.id === setup.group)).join('')}</div>
            <div class="cr-skins" role="group" aria-label="Görünüm">
              ${Object.values(MODES).map((m) => skinCard(m, m.id === modeId(), m.id === defaultModeFor(setup.group))).join('')}
            </div>
            <p class="cr-summary"><span>${esc(profileSummary(profile))}</span><span>· ${profile.optionCount} seçenek</span><span>· ${profile.autoRead ? 'sesli okuma açık' : 'hoparlör düğmesi'}</span></p>
          </section>
          <section class="cr-card" aria-labelledby="st2">
            <h2 class="cr-step" id="st2"><b>2</b> İçerik</h2>
            <div class="cr-tabs" role="tablist">
              <button class="cr-tab" role="tab" aria-selected="${setup.tab === 'builtin'}" data-act="tab" data-v="builtin">Hazır konular</button>
              <button class="cr-tab" role="tab" aria-selected="${setup.tab === 'ai'}" data-act="tab" data-v="ai">Kendi içeriğiniz (yapay zekâ)</button>
            </div>
            ${setup.tab === 'builtin' ? `
              <input class="cr-search" type="search" placeholder="Konu ara (ör. past, can, some)" value="${esc(setup.query)}" data-act="query" aria-label="Konu ara">
              <div class="cr-topics" role="listbox" aria-label="${esc(level.toUpperCase())} konuları">
                ${data ? topicList(data, level) : `<p class="cr-note">Konular yükleniyor…</p>`}
              </div>` : aiPanel()}
          </section>
        </div>
        <div style="display:grid;gap:18px">
          <section class="cr-card" aria-labelledby="st3">
            <h2 class="cr-step" id="st3"><b>3</b> Takımlar</h2>
            <div class="cr-stepper" style="margin-bottom:12px">
              <button class="cr-mini" data-act="teams" data-v="-1" aria-label="Takım azalt" ${teams.length <= minTeams ? 'disabled' : ''}>−</button>
              <output aria-live="polite">${teams.length}</output>
              <button class="cr-mini" data-act="teams" data-v="1" aria-label="Takım ekle" ${teams.length >= maxTeams ? 'disabled' : ''}>+</button>
              <span class="cr-note" style="margin:0">${teams.length === 1 ? 'tek takım: bütün sınıf birlikte oynar' : 'takım · koltuk sayısı = bugün takımda kaç öğrenci var'}</span>
            </div>
            <div class="cr-teams">
              ${teams.map((t, i) => `
                <div class="cr-team-row">
                  <span class="cr-badge" style="background:${t.hex};color:#fff">${teamGlyph(t, modeId())}</span>
                  <input value="${esc(t.name)}" data-act="name" data-i="${i}" aria-label="Takım ${i + 1} adı" maxlength="28">
                  <span class="cr-seats"><button class="cr-mini" data-act="seat" data-i="${i}" data-v="-1" aria-label="Koltuk azalt">−</button><b style="min-width:1.4ch;text-align:center;color:var(--ink)">${t.seats}</b><button class="cr-mini" data-act="seat" data-i="${i}" data-v="1" aria-label="Koltuk ekle">+</button></span>
                </div>`).join('')}
            </div>
          </section>
          ${game}
        </div>
      </div>
      ${error ? `<p class="cr-err" role="alert">${esc(error)}</p>` : ''}
    </div>
    <div class="cr-start">
      <button class="cr-btn cr-btn--go" data-act="start" ${src ? '' : 'disabled'}>${src ? `Başlat · ${esc(src.title)}` : esc(startHint())}</button>
    </div>`;

    if (!data && setup.tab === 'builtin') {
      loadLevel(level).then(() => { if (o.isActive()) renderKeepFocus(); }).catch(() => {
        const box = $('.cr-topics', root);
        if (box) box.innerHTML = '<p class="cr-err">Konular yüklenemedi. İnternet bağlantısını kontrol edip sayfayı yenileyin.</p>';
      });
    }
  }

  function skinCard(m, on, recommended) {
    const sw = { park: ['#fff6e3', '#ff8a3d', '#b86b2e', '#2bb3a3'], arena: ['#0b1020', '#3df2ff', '#ff4fd8', '#151e3a'], studio: ['#f4efe4', '#1d2433', '#a24f32', '#314b4a'] }[m.id];
    return `<button class="cr-skin" data-act="mode" data-v="${m.id}" aria-pressed="${on}">
      <span class="cr-skin-swatch" style="background:${sw[0]}">${sw.slice(1).map((c) => `<i style="background:${c}"></i>`).join('')}<i style="background:${sw[1]};opacity:.45"></i></span>
      <span class="cr-skin-name">${esc(m.label)}${recommended ? ' · önerilen' : ''}<small>${esc(m.ages)} · ${esc(m.blurb)}</small></span>
    </button>`;
  }

  function topicList(data, level) {
    const q = setup.query.trim().toLowerCase();
    const list = data.topics.filter((t) => !q || `${t.title} ${t.short}`.toLowerCase().includes(q));
    if (!list.length) return '<p class="cr-note">Bu aramaya uyan konu yok.</p>';
    const button = (t) => {
      const key = `${level}:${t.id}`;
      const pic = t.kind === 'picture' && t.items[0] && t.items[0].pic ? `<img src="${esc(t.items[0].pic)}" alt="" style="width:26px;height:26px;float:right;margin-left:6px">` : '';
      return `<button class="cr-topic" role="option" data-act="topic" data-v="${esc(key)}" aria-pressed="${setup.topicKey === key}" aria-selected="${setup.topicKey === key}">
        ${pic}<strong>${esc(t.title)}</strong><small>${esc(t.short || '')}${t.kind === 'picture' ? '' : ` · ${t.items.length} soru`}</small></button>`;
    };
    const pics = list.filter((t) => t.kind === 'picture');
    const grammar = list.filter((t) => t.kind !== 'picture');
    const section = (title, items) => (items.length ? `<p class="cr-row-label" style="grid-column:1/-1;margin:6px 0 0">${title}</p>${items.map(button).join('')}` : '');
    return groupById(setup.group).young
      ? section('Resimli kelimeler', pics) + section('Dil bilgisi', grammar)
      : section('Dil bilgisi', grammar) + section('Resimli kelimeler', pics);
  }

  // ------------------------------------------------ own content (AI) ----
  function aiPanel() {
    const g = groupById(setup.group);
    const mine = myPacks();
    const secs = ai.busy ? Math.round((Date.now() - ai.started) / 1000) : 0;
    const draft = ai.draft;
    const kept = draft ? draft.pack.items.filter((it) => !ai.removed.has(it.id)) : [];
    const draftGroup = draft ? groupById(draft.group) : null;
    const signin = `/signin?next=${encodeURIComponent(location.pathname)}`;
    probeAuth();
    return `<div class="cr-ai">
      <label class="cr-row-label" for="ai-prompt" style="display:block;margin-bottom:6px">Ne çalışmak istiyorsunuz? (Türkçe ya da İngilizce)</label>
      <textarea id="ai-prompt" data-act="aiprompt" maxlength="300" placeholder="Örnek: 6. sınıf 3. ünite, yiyecekler, some/any · Past simple düzensiz fiiller, tatil · Otelde şikâyet etmek" ${ai.busy ? 'disabled' : ''}>${esc(ai.prompt)}</textarea>
      <div class="cr-row" style="margin-top:10px"><span class="cr-row-label">Soru sayısı</span>${[12, 16, 24, 32].map((n) => chip(String(n), 'aicount', n, n === ai.count)).join('')}</div>
      ${ai.auth === false && !ai.error ? `<p class="cr-note" style="margin:12px 0 0">Yapay zekâ ile paket hazırlamak için giriş yapmanız gerekiyor; yazdığınız konu kaybolmaz. <a href="${signin}">Giriş yapın</a></p>` : ''}
      <div class="cr-row" style="margin-top:12px">
        <button class="cr-btn cr-btn--go" style="min-width:0" data-act="aigo" ${ai.busy || ai.auth === false ? 'disabled' : ''}>${ai.busy ? `Hazırlanıyor… <span data-ai-secs>${secs}</span> sn` : 'Paketi hazırla'}</button>
        ${ai.busy ? '<button class="cr-btn" style="min-width:0" data-act="aicancel">Vazgeç</button>' : ''}
        <span class="cr-note" style="margin:0">Seviye: <b>${esc(g.long)}</b>. Yaklaşık 30–50 saniye sürer; her sorunun cevabı ayrıca kontrol edilir ve oynamadan önce hepsini görürsünüz.</span>
      </div>
      ${ai.error ? `<p class="cr-err" role="alert">${esc(ai.error)}${ai.needLogin ? ` <a href="${signin}">Giriş yapın</a>` : ''}</p>${ai.detail ? `<p class="cr-note" style="margin:4px 0 0">Elenen sorular: ${esc(ai.detail)}</p>` : ''}` : ''}
      ${draft ? `<div class="cr-preview" aria-label="Paket önizleme">
        <p style="margin:14px 0 6px;font-weight:800">${esc(draft.pack.title)} · ${esc(draftGroup.long || draftGroup.label)} · ${kept.length} soru seçili</p>
        ${draft.warnings && draft.warnings.length ? `<ul class="cr-note cr-warns">${draft.warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
        <ol class="cr-prevlist">${draft.pack.items.map((it) => `<li class="${ai.removed.has(it.id) ? 'is-off' : ''}">
          <div><b>${esc(it.stem)}</b>${it.stretch ? ' <span class="cr-tag">zorlayıcı kelime</span>' : ''}${it.unchecked ? ' <span class="cr-tag">anahtarı kontrol edin</span>' : ''}<br>
          <span class="cr-prevopts">${(it.options || []).map((opt, i) => (i === it.answer ? `<u>${esc(opt)}</u>` : esc(opt))).join(' · ')}</span>
          ${it.whyTr ? `<br><small>${esc(it.whyTr)}</small>` : ''}</div>
          <button class="cr-mini" style="width:auto;padding:0 10px" data-act="aitoggle" data-v="${esc(it.id)}">${ai.removed.has(it.id) ? 'Geri al' : 'Çıkar'}</button></li>`).join('')}</ol>
        <div class="cr-row"><button class="cr-btn cr-btn--go" style="min-width:0" data-act="aisave" ${kept.length >= 4 ? '' : 'disabled'}>Kaydet ve seç (${kept.length})</button><button class="cr-btn" data-act="aidiscard">Vazgeç</button></div>
      </div>` : ''}
      ${mine.length ? `<p class="cr-row-label" style="margin:16px 0 6px">Paketlerim (bu tarayıcıda)</p>
        <div class="cr-topics">${mine.map((p) => { const fits = packFits(p); return `<button class="cr-topic" data-act="mypack" data-v="${esc(p.id)}" aria-pressed="${fits && setup.myPackId === p.id}" ${fits ? '' : 'disabled aria-disabled="true"'}>
          <strong>${esc(p.title)}</strong><small>${esc(groupById(p.group).label)} · ${p.items.length} soru · ${esc(new Date(p.createdAt).toLocaleDateString('tr-TR'))}${p === ai.saved ? ' · kaydedilemedi, yalnızca bu oturumda' : ''}${fits ? '' : ' · Yetişkin grubu için hazırlandı'}</small></button>`; }).join('')}</div>` : ''}
    </div>`;
  }

  function loadPacks() {
    const list = readJson(PACKS_KEY, []);
    return Array.isArray(list) ? list.filter((p) => p && typeof p.id === 'string' && Array.isArray(p.items)) : [];
  }

  // Stored packs plus one this browser refused to store (playable this session).
  function myPacks() {
    const list = loadPacks();
    return ai.saved && !list.some((p) => p.id === ai.saved.id) ? [ai.saved, ...list] : list;
  }

  // Young groups only play packs made for young groups (safe topics, short stems).
  function packFits(p) {
    return !groupById(setup.group).young || !!(p && GROUPS.some((g) => g.id === p.group && g.young));
  }

  function savePack(pack) {
    const list = loadPacks().filter((p) => p.id !== pack.id);
    list.unshift(pack);
    writeJson(PACKS_KEY, list.slice(0, 30));
    return loadPacks().some((p) => p.id === pack.id);
  }

  // Asks once whether the teacher is signed in, so the AI tab can say so
  // before anyone types. If the check fails, the tab works as before.
  function probeAuth() {
    if (ai.auth !== undefined) return;
    ai.auth = null;
    fetch('/api/classroom/pack', { headers: { accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        ai.auth = body && typeof body.signedIn === 'boolean' ? body.signedIn : null;
        if (ai.auth === false && o.isActive() && setup.tab === 'ai') renderKeepFocus();
      })
      .catch(() => { ai.auth = null; });
  }

  async function generatePack() {
    const prompt = ai.prompt.trim();
    if (!prompt) { ai.error = 'Önce ne çalışmak istediğinizi yazın.'; render(); return; }
    const group = setup.group;
    const ctrl = new AbortController();
    ai.ctrl = ctrl; ai.cancelled = false;
    ai.busy = true; ai.error = ''; ai.detail = ''; ai.needLogin = false; ai.draft = null; ai.removed = new Set(); ai.started = Date.now();
    render();
    ai.tick = setInterval(() => { const n = $('[data-ai-secs]', root); if (n) n.textContent = String(Math.round((Date.now() - ai.started) / 1000)); }, 1000);
    const timer = setTimeout(() => ctrl.abort(), AI_CLIENT_TIMEOUT_MS);
    try {
      const res = await fetch('/api/classroom/pack', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt, group, count: ai.count }), signal: ctrl.signal });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        ai.error = body.error || `Paket hazırlanamadı (hata ${res.status}).`;
        ai.needLogin = res.status === 401;
        if (res.status === 401) ai.auth = false;
        if (typeof body.reasons === 'string' && body.reasons) ai.detail = body.reasons;
      } else if (!body.pack || !Array.isArray(body.pack.items) || !body.pack.items.length) {
        ai.error = 'Yapay zekâ kullanılabilir soru üretemedi. Konuyu biraz daha açık yazıp tekrar deneyin.';
      } else {
        // The pack belongs to the group it was generated for.
        ai.auth = true;
        ai.draft = { ...body, group };
      }
    } catch {
      if (ai.cancelled) ai.error = '';
      else if (ctrl.signal.aborted) ai.error = 'Yapay zekâ çok uzun sürdü ve istek durduruldu. Lütfen biraz sonra tekrar deneyin.';
      else ai.error = 'Bağlantı kurulamadı. İnternet bağlantısını kontrol edip tekrar deneyin.';
    } finally {
      clearTimeout(timer);
      clearInterval(ai.tick);
      ai.busy = false;
      ai.ctrl = null;
      if (o.isActive()) renderKeepFocus();
    }
  }

  function saveDraft() {
    const d = ai.draft;
    if (!d) return '';
    const items = d.pack.items.filter((it) => !ai.removed.has(it.id));
    const pack = { ...d.pack, id: d.pack.id || `ai:${Date.now()}`, group: d.group || setup.group, createdAt: Date.now(), items };
    const stored = savePack(pack);
    ai.saved = stored ? null : pack;
    setup.myPackId = pack.id;
    ai.draft = null;
    ai.removed = new Set();
    return stored ? 'Paket kaydedildi ve seçildi.' : 'Paket bu tarayıcıya kaydedilemedi; bu oturumda oynayabilirsiniz.';
  }

  // What the Başlat button will play: a built-in topic or one of "Paketlerim".
  function selectedSource() {
    if (setup.tab === 'ai') {
      const p = setup.myPackId ? myPacks().find((x) => x.id === setup.myPackId) : null;
      return p && packFits(p) ? { kind: 'mine', title: p.title, pack: p } : null;
    }
    const t = selectedTopic();
    return t ? { kind: 'topic', title: t.title, topic: t } : null;
  }

  function startHint() {
    if (setup.tab !== 'ai') return 'Önce bir konu seçin';
    const p = setup.myPackId ? myPacks().find((x) => x.id === setup.myPackId) : null;
    if (p && !packFits(p)) return 'Bu paket yetişkin grubu için hazırlandı';
    return 'Önce bir paket hazırlayın ya da seçin';
  }

  function selectedTopic() {
    if (!setup.topicKey) return null;
    const [level, id] = setup.topicKey.split(':');
    if (level !== groupById(setup.group).level) return null;
    const data = levelData[level];
    return data ? data.topics.find((t) => t.id === id) || null : null;
  }

  function setupTeams() {
    const teams = defaultTeams(teamCount(), modeId());
    teams.forEach((t, i) => {
      if (setup.names[i] && setup.names[i].mode === modeId()) t.name = setup.names[i].name;
      if (setup.seats[i]) t.seats = setup.seats[i];
    });
    return teams;
  }

  function save() {
    writeJson(SETUP_KEY, {
      ...readJson(SETUP_KEY, {}),
      group: setup.group, mode: setup.mode, topicKey: setup.topicKey, teamCount: setup.teamCount,
      names: setup.names, seats: setup.seats, tab: setup.tab, myPackId: setup.myPackId, games: setup.games,
    });
  }

  // The pack to play: built-in topic or saved pack, with young-unsafe items removed.
  // The key of the step-2 source, in the same form as the choices above.
  function sourceKey() {
    if (setup.tab === 'ai') return setup.myPackId ? `mine:${setup.myPackId}` : null;
    return selectedTopic() ? setup.topicKey : null;
  }

  // A pack from a choice key ("a2:a2-04" or "mine:<id>"), or null.
  function packFromKey(key, profile) {
    if (!key) return null;
    if (key.startsWith('mine:')) {
      const p = myPacks().find((x) => x.id === key.slice(5));
      return p && packFits(p) ? buildPack({ kind: 'mine', title: p.title, pack: p }, profile) : null;
    }
    const [level, id] = key.split(':');
    const data = levelData[level];
    const t = data ? data.topics.find((x) => x.id === id) : null;
    return t ? buildPack({ kind: 'topic', title: t.title, topic: t }, profile) : null;
  }

  function buildPack(src, profile) {
    const lvl = groupById(setup.group).level;
    const topic = src.topic;
    const pack = src.kind === 'mine'
      ? makePack({ id: src.pack.id, title: src.pack.title, level: src.pack.level || lvl.toUpperCase(), origin: 'ai', topic: src.pack.topic || null, items: src.pack.items })
      : makePack({ id: `builtin:${topic.kind || 'grammar'}:${topic.id}`, title: topic.title, level: lvl.toUpperCase(), origin: 'builtin', topic: { kind: topic.kind || 'grammar', unit: topic.id, short: topic.short || '' }, items: topic.items || [] });
    // Built-in units were written for adults: items flagged as not suitable for
    // young learners (rent, boss, smoking…) stay out of Genç games.
    if (profile.young) pack.items = pack.items.filter((it) => it.youngOk !== false);
    return pack;
  }

  function start() {
    const src = selectedSource();
    if (!src) { render(setup.tab === 'ai' ? 'Önce bir paket hazırlayın ya da Paketlerim’den seçin.' : 'Önce bir konu seçin.'); return; }
    const profile = audienceProfile(setup.group, { mode: modeId() });
    const pack = buildPack(src, profile);
    const teams = setupTeams().map((t) => ({ ...t, name: t.name.trim() || `Team ${t.index + 1}` }));
    o.onStart({ profile, pack, teams, opts: opts(), setup, sourceKey: sourceKey(), packFromKey: (k) => packFromKey(k, profile) });
  }

  function onClick(e) {
    if (!o.isActive()) return;
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act; const v = b.dataset.v;
    let msg = '';
    if (act === 'group') {
      setup.group = v; setup.mode = null;
      if (ai.draft && ai.draft.group !== v) { ai.draft = null; ai.removed = new Set(); }
    }
    else if (act === 'mode') { setup.mode = v === defaultModeFor(setup.group) ? null : v; }
    else if (act === 'tab') { setup.tab = v; }
    else if (act === 'topic') { setup.topicKey = v; }
    else if (act === 'aicount') { ai.count = Number(v); keepAiDraft(); }
    else if (act === 'aigo') { if (!ai.busy) generatePack(); return; }
    else if (act === 'aicancel') { if (ai.ctrl) { ai.cancelled = true; ai.ctrl.abort(); } return; }
    else if (act === 'aitoggle') {
      // Update in place so the preview list keeps its scroll position.
      if (ai.removed.has(v)) ai.removed.delete(v); else ai.removed.add(v);
      const off = ai.removed.has(v);
      b.closest('li')?.classList.toggle('is-off', off);
      b.textContent = off ? 'Geri al' : 'Çıkar';
      const kept = ai.draft ? ai.draft.pack.items.filter((it) => !ai.removed.has(it.id)).length : 0;
      const saveBtn = $('[data-act="aisave"]', root);
      if (saveBtn) { saveBtn.textContent = `Kaydet ve seç (${kept})`; saveBtn.disabled = kept < 4; }
      return;
    }
    else if (act === 'aisave') { msg = saveDraft(); }
    else if (act === 'aidiscard') { ai.draft = null; ai.removed = new Set(); }
    else if (act === 'mypack') { setup.myPackId = v; }
    else if (act === 'teams') { setup.teamCount = Math.max(minTeams, Math.min(maxTeams, teamCount() + Number(v))); }
    else if (act === 'seat') { const i = Number(b.dataset.i); const cur = setupTeams()[i].seats; setup.seats[i] = Math.max(1, Math.min(8, cur + Number(v))); }
    else if (act === 'start') { start(); return; }
    else if (act === 'resume') { if (o.onResume) o.onResume(); return; }
    else if (act === 'discard') {
      if (!window.confirm('Yarım kalan oyun silinsin mi? Bu geri alınamaz.')) return;
      if (o.onDiscard) o.onDiscard();
    }
    else if (o.onGameAct && o.onGameAct(act, v, { setup, opts: opts(), setOpt, modeId: modeId() })) { /* handled by the game */ }
    else return;
    save();
    render();
    if (msg) toast(root, msg, 3200);
  }

  function onInput(e) {
    if (!o.isActive()) return;
    const t = e.target;
    if (t.dataset.act === 'query') {
      setup.query = t.value;
      const level = groupById(setup.group).level;
      const data = levelData[level];
      const box = $('.cr-topics', root);
      if (data && box) box.innerHTML = topicList(data, level);
    } else if (t.dataset.act === 'aiprompt') {
      ai.prompt = t.value.slice(0, 300);
      keepAiDraft();
    } else if (t.dataset.act === 'name') {
      setup.names[Number(t.dataset.i)] = { mode: modeId(), name: t.value.slice(0, 28) };
      save();
    }
  }

  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);

  return {
    render,
    renderKeepFocus,
    loadLevel,
    get setup() { return setup; },
    modeId,
    preload() { return loadLevel(groupById(setup.group).level).then(() => { if (o.isActive()) renderKeepFocus(); }).catch(() => {}); },
  };
}
