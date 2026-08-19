/* English Word Coach — application logic (local-assets WebView SPA) */
(function () {
  "use strict";

  // ---------------------------------------------------------------- data
  var DATA = window.WORD_DATA;
  if (!DATA || !DATA.words || !DATA.sets) {
    document.getElementById("content").innerHTML =
      '<div class="card center muted" style="padding:40px 20px">Kelime verisi yüklenemedi.<br>Uygulamayı yeniden yükleyin.</div>';
    return;
  }

  var WORDS = DATA.words;
  var SETS = DATA.sets;
  var ALL_KEYS = Object.keys(WORDS).sort();

  var SET_META = {
    a1:     { badge: "A1", name: "A1 · Başlangıç",    desc: "Temel günlük kelimeler",          color: "#10B981", group: "CEFR Seviyeleri" },
    a2:     { badge: "A2", name: "A2 · Temel",        desc: "Günlük hayat kelimeleri",        color: "#22C55E", group: "CEFR Seviyeleri" },
    b1:     { badge: "B1", name: "B1 · Orta",         desc: "Orta seviye kelimeler",          color: "#3B82F6", group: "CEFR Seviyeleri" },
    b2:     { badge: "B2", name: "B2 · Orta Üstü",    desc: "Üst-orta seviye kelimeler",      color: "#2563EB", group: "CEFR Seviyeleri" },
    c1:     { badge: "C1", name: "C1 · İleri",        desc: "İleri düzey kelimeler",          color: "#7C3AED", group: "CEFR Seviyeleri" },
    c2:     { badge: "C2", name: "C2 · Ustalık",      desc: "En yüksek düzey kelimeler",      color: "#6D28D9", group: "CEFR Seviyeleri" },
    ielts:  { badge: "IELTS", name: "IELTS Akademik", desc: "Academic Word List (570 kelime)", color: "#0EA5E9", group: "Sınav Hazırlığı" },
    toefl:  { badge: "TOEFL", name: "TOEFL iBT",      desc: "Akademik kelime haznesi",        color: "#F59E0B", group: "Sınav Hazırlığı" },
    yds:    { badge: "YDS", name: "YDS",              desc: "İleri + akademik kelimeler",     color: "#EF4444", group: "Sınav Hazırlığı" },
    yokdil: { badge: "YÖKDİL", name: "YÖKDİL",        desc: "Akademik okuma kelimeleri",      color: "#14B8A6", group: "Sınav Hazırlığı" },
    gre:    { badge: "GRE", name: "GRE",              desc: "En zorlu kelimeler",             color: "#8B5CF6", group: "Sınav Hazırlığı" }
  };

  // ---------------------------------------------------------------- state
  var STORE_KEY = "ewc_progress_v1";
  var progress = loadProgress();
  var currentView = "home";
  var currentSet = null;
  var setReturnTo = "sets";
  var currentSetMode = "cards"; // cards | quiz | list
  var session = null; // active study session
  var quiz = null;    // active quiz
  var listOffset = 0;

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function yesterdayStr() {
    var d = new Date(Date.now() - 86400000);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveProgress() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch (e) {}
  }
  function level(key) { return progress.levels && progress.levels[key] ? progress.levels[key] : 0; }
  function isMastered(key) { return level(key) >= 4; }

  function setStats(name) {
    var keys = SETS[name] || [];
    var mastered = keys.filter(isMastered).length;
    return { total: keys.length, mastered: mastered, pct: keys.length ? Math.round(mastered / keys.length * 100) : 0 };
  }

  function touchStudy() {
    var today = todayStr();
    if (progress.lastStudy === today) return;
    var yest = yesterdayStr();
    progress.streak = (progress.lastStudy === yest) ? ((progress.streak || 0) + 1) : 1;
    progress.lastStudy = today;
    saveProgress();
  }

  function markKnown(key) {
    progress.levels = progress.levels || {};
    progress.levels[key] = Math.min(5, level(key) + 1);
    progress.lastSet = currentSet || progress.lastSet;
    touchStudy();
    saveProgress();
  }
  function markAgain(key) {
    progress.levels = progress.levels || {};
    progress.levels[key] = Math.max(1, level(key) - 1);
    progress.lastSet = currentSet || progress.lastSet;
    touchStudy();
    saveProgress();
  }

  function speak(text) {
    if (typeof window.AndroidBridge !== "undefined" && window.AndroidBridge.speak) {
      try { window.AndroidBridge.speak(text); } catch (e) {}
    }
  }

  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.classList.add("hidden"); }, 1800);
  }

  // ---------------------------------------------------------------- navigation
  function navigate(view) {
    currentView = view;
    listOffset = 0;
    $$(".view").forEach(function (v) { v.classList.remove("active"); });
    render(view);
    updateChrome();
    $("#content").scrollTop = 0;
  }

  function updateChrome() {
    var meta = null;
    if (currentView === "set" && currentSet) meta = SET_META[currentSet];
    $("#backBtn").classList.toggle("hidden", currentView !== "set");
    $("#titleText").textContent = meta ? (meta.badge + " · " + meta.name.split(" · ")[0]) : "English Word Coach";

    var tab = currentView === "set" ? "sets" : currentView;
    $$(".tab").forEach(function (t) { t.classList.toggle("active", t.getAttribute("data-tab") === tab); });
  }

  function openSet(name, returnTo) {
    currentSet = name;
    setReturnTo = returnTo || "sets";
    currentSetMode = "cards";
    session = null;
    quiz = null;
    listOffset = 0;
    navigate("set");
  }

  function goBack() {
    if (currentView === "set") {
      currentSet = null;
      session = null;
      quiz = null;
      navigate(setReturnTo);
    } else {
      navigate("home");
    }
  }
  window.__handleBack = function () {
    if (currentView !== "home") goBack();
    else if (typeof window.AndroidBridge !== "undefined" && window.AndroidBridge.exit) { try { window.AndroidBridge.exit(); } catch (e) {} }
  };

  // ---------------------------------------------------------------- render dispatch
  function render(view) {
    var c = $("#content");
    c.classList.toggle("searchable", view === "search");
    document.body.classList.toggle("searchable", view === "search");
    if (view === "home") renderHome(c);
    else if (view === "sets") renderSets(c);
    else if (view === "set") renderSet(c);
    else if (view === "search") renderSearch(c);
    else if (view === "stats") renderStats(c);
  }

  // ---------------------------------------------------------------- home
  function renderHome(c) {
    var hour = new Date().getHours();
    var greet = hour < 5 ? "İyi geceler" : hour < 12 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar";
    var totalMastered = ALL_KEYS.filter(isMastered).length;
    var wod = wordOfDay();

    var lastSetHtml = "";
    if (progress.lastSet && SET_META[progress.lastSet]) {
      var st = setStats(progress.lastSet);
      lastSetHtml =
        '<div class="set-card" data-open="' + progress.lastSet + '" data-ret="home">' +
        '  <div class="set-badge" style="background:' + SET_META[progress.lastSet].color + '">' + badgeHtml(progress.lastSet) + "</div>" +
        '  <div class="set-info"><div class="set-name">Devam et: ' + esc(SET_META[progress.lastSet].name) + "</div>" +
        '  <div class="set-count">%' + st.pct + " tamamlandı · " + st.mastered + "/" + st.total + " kelime</div>" +
        '  <div class="set-progress"><span style="width:' + st.pct + '%"></span></div></div>' +
        '  <div class="set-chevron">›</div></div>';
    }

    c.innerHTML =
      '<div class="hero">' +
      '  <div class="kicker">' + greet + "</div>" +
      "  <h2>Bugün kaç kelime öğreneceksin?</h2>" +
      "  <p>" + (progress.streak || 0) + " günlük seri 🔥 · " + totalMastered + " kelime öğrenildi</p>" +
      "</div>" +
      '<div class="card">' +
      '  <div class="kicker" style="color:#6B7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Günün Kelimesi</div>' +
      '  <div class="wod-word">' + esc(wod.w) + "</div>" +
      '  <div><span class="wod-pos">' + esc(wod.p || "word") + "</span>" + (wod.i ? '<span class="wod-ipa">' + esc(wod.i) + "</span>" : "") + "</div>" +
      (wod.d ? '<div class="wod-def">' + esc(wod.d) + "</div>" : "") +
      (wod.e ? '<div class="wod-ex">"' + esc(wod.e) + '"</div>' : "") +
      '  <button class="speaker" data-speak="' + esc(wod.w) + '">🔊 Dinle</button>' +
      "</div>" +
      lastSetHtml +
      '<div class="section-title">Kategoriler</div>' +
      '<div class="card" style="padding:6px 14px"><button class="btn btn-primary" style="margin:10px 0" data-goto="sets">Tüm kelime setlerine git ›</button></div>';
    bindDelegates(c);
  }

  function wordOfDay() {
    var dayNum = Math.floor(Date.now() / 86400000);
    return WORDS[ALL_KEYS[dayNum % ALL_KEYS.length]] || WORDS[ALL_KEYS[0]];
  }

  function badgeHtml(name) {
    var m = SET_META[name];
    var b = m.badge;
    var fs = b.length <= 2 ? 15 : b.length <= 4 ? 12 : 10;
    return '<span style="font-size:' + fs + 'px">' + esc(b) + "</span>";
  }

  // ---------------------------------------------------------------- sets list
  function renderSets(c) {
    var groups = { "CEFR Seviyeleri": [], "Sınav Hazırlığı": [] };
    Object.keys(SET_META).forEach(function (k) {
      var m = SET_META[k];
      if (SETS[k]) (groups[m.group] || (groups[m.group] = [])).push(k);
    });

    var html = "";
    Object.keys(groups).forEach(function (g) {
      var keys = groups[g];
      if (!keys || !keys.length) return;
      html += '<div class="section-title">' + esc(g) + "</div>";
      keys.forEach(function (k) {
        var m = SET_META[k];
        var st = setStats(k);
        html +=
          '<div class="set-card" data-open="' + k + '">' +
          '  <div class="set-badge" style="background:' + m.color + '">' + badgeHtml(k) + "</div>" +
          '  <div class="set-info"><div class="set-name">' + esc(m.name) + "</div>" +
          '    <div class="set-desc">' + esc(m.desc) + "</div>" +
          '    <div class="set-count">' + st.total + " kelime · %" + st.pct + " öğrenildi</div>" +
          '    <div class="set-progress"><span style="width:' + st.pct + '%"></span></div></div>' +
          '  <div class="set-chevron">›</div></div>';
      });
    });
    c.innerHTML = html;
    bindDelegates(c);
  }

  // ---------------------------------------------------------------- set detail
  function renderSet(c) {
    var m = SET_META[currentSet];
    var st = setStats(currentSet);

    var tabs =
      '<div class="mode-tabs">' +
      '<button class="mode-tab' + (currentSetMode === "cards" ? " active" : "") + '" data-tabmode="cards">Kartlar</button>' +
      '<button class="mode-tab' + (currentSetMode === "quiz" ? " active" : "") + '" data-tabmode="quiz">Test</button>' +
      '<button class="mode-tab' + (currentSetMode === "list" ? " active" : "") + '" data-tabmode="list">Liste</button>' +
      "</div>";

    c.innerHTML =
      '<div class="set-head"><div class="set-badge" style="background:' + m.color + '">' + badgeHtml(currentSet) + "</div>" +
      "<h2>" + esc(m.name) + "</h2>" +
      '<div class="sub">' + esc(m.desc) + " · " + st.total + " kelime · %" + st.pct + " öğrenildi</div></div>" +
      tabs +
      '<div id="modeBody"></div>';

    var body = $("#modeBody");
    if (currentSetMode === "cards") {
      if (session) renderFlashcard(body); else renderCardsMenu(body);
    } else if (currentSetMode === "quiz") {
      renderQuiz(body);
    } else {
      renderListBody(body);
    }
    bindDelegates(c);
  }

  function setMode(mode) {
    session = null;
    quiz = null;
    listOffset = 0;
    currentSetMode = mode;
    renderSet($("#content"));
  }

  function renderCardsMenu(el) {
    var st = setStats(currentSet);
    var remain = st.total - st.mastered;
    el.innerHTML =
      '<div class="card">' +
      '  <div class="center" style="padding:10px 0">' +
      '    <div style="background:var(--bg);border-radius:14px;padding:22px 16px">' +
      '      <div class="num" style="font-size:40px">' + st.mastered + '<span class="muted" style="font-size:20px">/' + st.total + "</span></div>" +
      '      <div class="lbl">kelime öğrenildi</div>' +
      "    </div>" +
      "  </div>" +
      '  <button class="btn btn-primary" style="margin-top:8px" id="startCards">Kartlarla Çalış' + (remain ? " (" + remain + " kalan)" : "") + "</button>" +
      "</div>";
    $("#startCards").addEventListener("click", startStudy);
  }

  // ----- flashcard -----
  function buildQueue() {
    var keys = SETS[currentSet].slice();
    var unseen = keys.filter(function (k) { return level(k) === 0; });
    var seen = keys.filter(function (k) { return level(k) > 0; });
    var queue = shuffle(unseen).concat(shuffle(seen));
    return queue.slice(0, 40);
  }

  function startStudy() {
    var q = buildQueue();
    if (!q.length) { toast("Bu sette kelime yok."); return; }
    session = { queue: q, index: 0, flipped: false };
    renderSet($("#content"));
  }

  function renderFlashcard(el) {
    var key = session.queue[session.index];
    var w = WORDS[key];
    var pos = session.index + 1;
    var total = session.queue.length;

    el.innerHTML =
      '<div class="stage-meta"><span>' + pos + " / " + total + "</span><span>" + esc(w.p || "word") + "</span></div>" +
      '<div class="stage">' +
      '  <div class="flashcard" id="fc">' +
      '    <div class="fc-face fc-front">' +
      '      <span class="fc-pos">' + esc(w.p || "word") + "</span>" +
      '      <div class="fc-word">' + esc(w.w) + "</div>" +
      (w.i ? '<div class="fc-ipa">' + esc(w.i) + "</div>" : "") +
      '      <button class="speaker" id="fcSpeak">🔊 Dinle</button>' +
      '      <div class="fc-hint">Kartı çevirmek için dokun</div>' +
      "    </div>" +
      '    <div class="fc-face fc-back">' +
      '      <div class="fc-def">' + esc(w.d || "—") + "</div>" +
      (w.e ? '<div class="fc-ex"><span class="lbl">Örnek</span>"' + esc(w.e) + '"</div>' : "") +
      "    </div>" +
      "  </div>" +
      "</div>" +
      '<div class="quiz-actions" id="fcActions" style="display:none">' +
      '  <button class="btn btn-again" id="fcAgain">Tekrar</button>' +
      '  <button class="btn btn-know" id="fcKnow">Biliyorum</button>' +
      "</div>";

    $("#fc").addEventListener("click", flipCard);
    $("#fcSpeak").addEventListener("click", function (e) { e.stopPropagation(); speak(w.w); });
    $("#fcAgain").addEventListener("click", function () { answerCard(false); });
    $("#fcKnow").addEventListener("click", function () { answerCard(true); });
  }

  function flipCard() {
    if (!session) return;
    session.flipped = !session.flipped;
    $("#fc").classList.toggle("flipped", session.flipped);
    $("#fcActions").style.display = session.flipped ? "flex" : "none";
  }

  function answerCard(know) {
    var key = session.queue[session.index];
    if (know) markKnown(key); else markAgain(key);
    session.flipped = false;
    session.index++;
    if (session.index >= session.queue.length) {
      session = null;
      toast("Harika! 👏 Bu tur bitti.");
      renderSet($("#content"));
      return;
    }
    renderFlashcard($("#modeBody"));
  }

  // ----- quiz -----
  function buildQuizSet() {
    var keys = SETS[currentSet].slice();
    var unseen = keys.filter(function (k) { return level(k) === 0; });
    var seen = keys.filter(function (k) { return level(k) > 0; });
    return shuffle(unseen).concat(shuffle(seen));
  }

  function startQuiz(len, dir) {
    var pool = buildQuizSet();
    if (pool.length < 4) { toast("Bu sette yeterli kelime yok."); return; }
    var n = Math.min(len, pool.length);
    quiz = {
      questions: pool.slice(0, n).map(function (key) { return makeQuestion(key, dir); }),
      index: 0, correct: 0, answered: false
    };
    renderSet($("#content"));
  }

  function makeQuestion(key, dir) {
    var word = WORDS[key];
    var distractors = pickDistractors(key, 3);
    if (dir === "w2d") {
      return {
        type: "w2d", key: key, prompt: word.w,
        options: shuffle([key].concat(distractors)), correctKey: key
      };
    }
    return {
      type: "d2w", key: key, prompt: word.d,
      options: shuffle([key].concat(distractors)), correctKey: key
    };
  }

  function pickDistractors(correctKey, n) {
    var sameSet = SETS[currentSet].filter(function (k) { return k !== correctKey; });
    var pool = shuffle(sameSet);
    if (pool.length < n) {
      var more = shuffle(ALL_KEYS.filter(function (k) { return k !== correctKey && pool.indexOf(k) < 0; }));
      pool = pool.concat(more);
    }
    return pool.slice(0, n);
  }

  function renderQuiz(el) {
    if (!quiz) {
      el.innerHTML = renderQuizConfig();
      bindQuizConfig();
      return;
    }
    var q = quiz.questions[quiz.index];
    var pos = quiz.index + 1;
    var total = quiz.questions.length;
    var optsHtml = q.options.map(function (key) {
      var w = WORDS[key];
      var label = q.type === "w2d" ? (w.d || "—") : w.w;
      return '<button class="option" data-key="' + esc(key) + '">' + esc(label) + "</button>";
    }).join("");

    el.innerHTML =
      '<div class="stage-meta"><span>' + pos + " / " + total + "</span><span>" + quiz.correct + " doğru</span></div>" +
      (q.type === "w2d"
        ? '<div class="quiz-q">' + esc(q.prompt) + '</div><div class="quiz-sub">Bu kelime ne anlama gelir?</div>'
        : '<div class="quiz-q" style="font-size:16px;font-weight:600">' + esc(q.prompt) + '</div><div class="quiz-sub">Hangi kelime?</div>') +
      '<div id="opts">' + optsHtml + "</div>" +
      '<div id="quizNext" style="display:none;margin-top:4px"><button class="btn btn-primary" id="nextBtn">Sonraki ›</button></div>';

    $$("#opts .option").forEach(function (btn) {
      btn.addEventListener("click", function () { answerQuiz(btn); });
    });
  }

  function renderQuizConfig() {
    return (
      '<div class="card"><div class="center" style="padding:6px 0 14px"><h3 style="margin:0 0 4px">Test Ayarları</h3>' +
      '<div class="muted" style="font-size:13px">Hazır olduğunda başla</div></div>' +
      '<div class="cfg-row"><span>Soru sayısı</span><div class="seg" id="cfgLen">' +
      '<button data-len="10">10</button><button data-len="20" class="active">20</button><button data-len="30">30</button></div></div>' +
      '<div class="cfg-row"><span>Soru yönü</span><div class="seg" id="cfgDir">' +
      '<button data-dir="w2d" class="active">Kelime → Anlam</button><button data-dir="d2w">Anlam → Kelime</button></div></div>' +
      '<button class="btn btn-primary" id="quizStart" style="margin-top:16px">Testi Başlat</button></div>'
    );
  }

  function bindQuizConfig() {
    var len = 20, dir = "w2d";
    $$("#cfgLen button").forEach(function (b) {
      b.addEventListener("click", function () {
        $$("#cfgLen button").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active"); len = parseInt(b.getAttribute("data-len"), 10);
      });
    });
    $$("#cfgDir button").forEach(function (b) {
      b.addEventListener("click", function () {
        $$("#cfgDir button").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active"); dir = b.getAttribute("data-dir");
      });
    });
    $("#quizStart").addEventListener("click", function () { startQuiz(len, dir); });
  }

  function answerQuiz(btn) {
    if (quiz.answered) return;
    quiz.answered = true;
    var key = btn.getAttribute("data-key");
    var q = quiz.questions[quiz.index];
    var correct = key === q.correctKey;
    if (correct) { quiz.correct++; btn.classList.add("correct"); markKnown(q.key); }
    else {
      btn.classList.add("wrong");
      $$("#opts .option").forEach(function (o) { if (o.getAttribute("data-key") === q.correctKey) o.classList.add("correct"); });
    }
    $$("#opts .option").forEach(function (o) { o.disabled = true; });
    $("#quizNext").style.display = "block";
    $("#nextBtn").addEventListener("click", nextQuiz);
  }

  function nextQuiz() {
    quiz.answered = false;
    quiz.index++;
    if (quiz.index >= quiz.questions.length) { finishQuiz(); return; }
    renderQuiz($("#modeBody"));
  }

  function finishQuiz() {
    var total = quiz.questions.length;
    var pct = Math.round(quiz.correct / total * 100);
    progress.quizBest = progress.quizBest || {};
    if (!progress.quizBest[currentSet] || pct > progress.quizBest[currentSet]) progress.quizBest[currentSet] = pct;
    progress.totalQuiz = (progress.totalQuiz || 0) + total;
    progress.totalQuizCorrect = (progress.totalQuizCorrect || 0) + quiz.correct;
    touchStudy();
    saveProgress();
    var msg = pct >= 90 ? "Mükemmel! 🏆" : pct >= 70 ? "Çok iyi! 👏" : pct >= 50 ? "Fena değil 👍" : "Tekrar deneyelim 💪";
    quiz = null;
    renderSet($("#content"));
    toast(msg + " %" + pct + " doğru");
  }

  // ----- word list -----
  function renderListBody(el) {
    var keys = SETS[currentSet].slice().sort(function (a, b) {
      return WORDS[a].w.localeCompare(WORDS[b].w, "en");
    });
    var chunk = keys.slice(0, listOffset + 150);
    var html = "";
    chunk.forEach(function (k) {
      var w = WORDS[k];
      var l = level(k);
      html +=
        '<div class="wl-row" data-word="' + esc(k) + '">' +
        '  <div class="wl-level lvl-' + l + '">' + (l || "•") + "</div>" +
        '  <div style="min-width:0;flex:1"><div class="wl-word">' + esc(w.w) + "</div>" +
        '    <div class="wl-def">' + esc(w.d || "") + "</div></div>" +
        "</div>";
    });
    if (chunk.length < keys.length) {
      html += '<div class="center" style="padding:14px"><button class="btn btn-ghost" id="loadMore">Daha fazla göster (' + (keys.length - chunk.length) + ")</button></div>";
    }
    el.innerHTML = '<div class="card">' + html + "</div>";
    var lm = $("#loadMore");
    if (lm) lm.addEventListener("click", function () { listOffset += 150; renderListBody(el); });
  }

  // ---------------------------------------------------------------- search
  function renderSearch(c) {
    c.innerHTML =
      '<div class="search-box"><span class="mag">⌕</span>' +
      '<input id="searchInput" type="search" placeholder="Kelime veya anlam ara…" autocomplete="off"></div>' +
      '<div id="searchResults"><div class="search-empty">Bir kelime yazmaya başlayın.</div></div>';

    var input = $("#searchInput");
    input.addEventListener("input", function () { runSearch(input.value.trim().toLowerCase()); });
    setTimeout(function () { input.focus(); }, 50);
  }

  function runSearch(q) {
    var box = $("#searchResults");
    if (!q) { box.innerHTML = '<div class="search-empty">Bir kelime yazmaya başlayın.</div>'; return; }
    var out = [];
    for (var i = 0; i < ALL_KEYS.length; i++) {
      var k = ALL_KEYS[i];
      var w = WORDS[k];
      if (w.w.toLowerCase().indexOf(q) === 0 || (w.d && w.d.toLowerCase().indexOf(q) >= 0)) {
        out.push(k);
        if (out.length >= 60) break;
      }
    }
    if (!out.length) { box.innerHTML = '<div class="search-empty">Sonuç bulunamadı.</div>'; return; }
    var html = '<div class="card" style="padding:4px 16px">';
    out.forEach(function (k) {
      var w = WORDS[k];
      var setOf = whichSets(k);
      var first = setOf[0];
      var badge = first ? SET_META[first].badge : "";
      var color = first ? SET_META[first].color : "#9CA3AF";
      html +=
        '<div class="wl-row" data-word="' + esc(k) + '">' +
        '  <div style="min-width:0;flex:1"><div class="wl-word">' + esc(w.w) + ' <span class="muted" style="font-size:11px;font-weight:600">' + esc(w.p || "") + "</span></div>" +
        '    <div class="wl-def">' + esc(w.d || "") + "</div></div>" +
        '  <span class="set-badge" style="width:auto;height:auto;padding:3px 7px;font-size:10px;border-radius:7px;background:' + color + '">' + esc(badge) + "</span>" +
        "</div>";
    });
    html += "</div>";
    box.innerHTML = html;
  }

  function whichSets(key) {
    var r = [];
    Object.keys(SETS).forEach(function (s) { if (SETS[s].indexOf(key) >= 0) r.push(s); });
    return r;
  }

  // ---------------------------------------------------------------- stats
  function renderStats(c) {
    var totalMastered = ALL_KEYS.filter(isMastered).length;
    var totalWords = ALL_KEYS.length;
    var acc = progress.totalQuiz ? Math.round(progress.totalQuizCorrect / progress.totalQuiz * 100) : 0;

    var rows = "";
    Object.keys(SET_META).forEach(function (k) {
      if (!SETS[k]) return;
      var st = setStats(k);
      var m = SET_META[k];
      rows +=
        '<div class="stat-row"><span><span class="set-badge" style="display:inline-flex;width:22px;height:22px;border-radius:6px;font-size:9px;background:' + m.color + ';vertical-align:middle;margin-right:8px">' + badgeHtml(k) + "</span>" + esc(m.name) + "</span>" +
        '<span class="v muted">' + st.mastered + "/" + st.total + "</span></div>";
    });

    c.innerHTML =
      '<div class="stat-grid">' +
      '  <div class="stat-box"><div class="num">' + totalMastered + '</div><div class="lbl">Öğrenilen kelime</div></div>' +
      '  <div class="stat-box"><div class="num">' + (progress.streak || 0) + '</div><div class="lbl">Günlük seri 🔥</div></div>' +
      '  <div class="stat-box"><div class="num">' + totalWords + '</div><div class="lbl">Toplam kelime</div></div>' +
      '  <div class="stat-box"><div class="num">%' + acc + '</div><div class="lbl">Test doğruluğu</div></div>' +
      "</div>" +
      '<div class="section-title">Set bazında ilerleme</div>' +
      '<div class="card" style="padding:4px 16px">' + rows + "</div>" +
      '<div class="center" style="margin-top:14px"><button class="btn btn-ghost" id="resetBtn" style="flex:none;padding:12px 18px">İlerlemeyi sıfırla</button></div>';

    $("#resetBtn").addEventListener("click", function () {
      confirmDialog("Tüm ilerlemen sıfırlansın mı? Bu işlem geri alınamaz.", function () {
        progress = {};
        saveProgress();
        renderStats(c);
        toast("İlerleme sıfırlandı.");
      });
    });
  }

  // ---------------------------------------------------------------- modal
  function openWordModal(key) {
    var w = WORDS[key];
    var l = level(key);
    var sets = whichSets(key).map(function (s) { return SET_META[s].badge; }).join(", ");
    var modal = $("#modal");
    modal.innerHTML =
      '<div class="modal-card">' +
      '  <div class="modal-word">' + esc(w.w) + "</div>" +
      '  <div style="margin:6px 0 2px"><span class="wod-pos">' + esc(w.p || "word") + "</span>" + (w.i ? '<span class="wod-ipa">' + esc(w.i) + "</span>" : "") + "</div>" +
      (w.d ? '<div class="wod-def">' + esc(w.d) + "</div>" : "") +
      (w.e ? '<div class="wod-ex">"' + esc(w.e) + '"</div>' : "") +
      '  <div class="muted" style="margin-top:12px;font-size:12px">Setler: ' + esc(sets) + " · Seviye: " + l + "/5</div>" +
      '  <button class="speaker" id="mSpeak">🔊 Dinle</button>' +
      '  <div class="quiz-actions" style="margin-top:16px">' +
      '    <button class="btn btn-again" id="mAgain">Tekrar</button>' +
      '    <button class="btn btn-know" id="mKnow">Biliyorum</button>' +
      "  </div>" +
      '  <button class="modal-close" id="mClose">Kapat</button>' +
      "</div>";
    modal.classList.remove("hidden");
    $("#mSpeak").addEventListener("click", function () { speak(w.w); });
    $("#mAgain").addEventListener("click", function () { markAgain(key); closeModal(); });
    $("#mKnow").addEventListener("click", function () { markKnown(key); closeModal(); });
    $("#mClose").addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
  }
  function closeModal() { var m = $("#modal"); m.classList.add("hidden"); m.innerHTML = ""; }

  function confirmDialog(msg, onYes) {
    var modal = $("#modal");
    modal.innerHTML =
      '<div class="modal-card">' +
      '  <div class="modal-word" style="font-size:19px">Emin misin?</div>' +
      '  <div class="muted" style="margin-top:8px;font-size:14px;line-height:1.5">' + esc(msg) + "</div>" +
      '  <div class="quiz-actions" style="margin-top:20px">' +
      '    <button class="btn btn-again" id="cfNo">Vazgeç</button>' +
      '    <button class="btn btn-know" id="cfYes">Evet</button>' +
      "  </div>" +
      "</div>";
    modal.classList.remove("hidden");
    $("#cfNo").addEventListener("click", closeModal);
    $("#cfYes").addEventListener("click", function () { closeModal(); onYes(); });
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
  }

  // ---------------------------------------------------------------- event delegation
  function bindDelegates(root) {
    $$("[data-open]", root).forEach(function (el) {
      el.addEventListener("click", function () {
        openSet(el.getAttribute("data-open"), el.getAttribute("data-ret") || "sets");
      });
    });
    $$("[data-goto]", root).forEach(function (el) {
      el.addEventListener("click", function () { navigate(el.getAttribute("data-goto")); });
    });
    $$("[data-speak]", root).forEach(function (el) {
      el.addEventListener("click", function () { speak(el.getAttribute("data-speak")); });
    });
    $$("[data-word]", root).forEach(function (el) {
      el.addEventListener("click", function () { openWordModal(el.getAttribute("data-word")); });
    });
    $$("[data-tabmode]", root).forEach(function (el) {
      el.addEventListener("click", function () { setMode(el.getAttribute("data-tabmode")); });
    });
  }

  // ---------------------------------------------------------------- boot
  $("#backBtn").addEventListener("click", goBack);
  $$(".tab").forEach(function (t) {
    t.addEventListener("click", function () {
      var v = t.getAttribute("data-tab");
      session = null; quiz = null; listOffset = 0; currentSetMode = "cards";
      if (v === "home") navigate("home");
      else if (v === "sets") navigate("sets");
      else if (v === "search") navigate("search");
      else if (v === "stats") navigate("stats");
    });
  });

  navigate("home");
})();
