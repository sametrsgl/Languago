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

  // Grammar curriculum (A1–B2), loaded from grammar_*.js
  var GRAMMAR = [window.GRAMMAR_A1, window.GRAMMAR_A2, window.GRAMMAR_B1, window.GRAMMAR_B2].filter(Boolean);
  var GRAMMAR_BY_ID = {};
  GRAMMAR.forEach(function (g) { GRAMMAR_BY_ID[g.id] = g; });

  // Reading passages (per level/exam), loaded from readings_*.js
  var READINGS = {};
  ["a1", "a2", "b1", "b2", "c1", "c2", "ielts", "toefl", "yds", "yokdil", "gre"].forEach(function (s) {
    var g = window["READINGS_" + s.toUpperCase()];
    if (g) READINGS[s] = g;
  });
  [window.READINGS_CEFR, window.READINGS_EXAMS].forEach(function (g) {
    if (g) Object.keys(g).forEach(function (k) {
      if (!READINGS[k] || !READINGS[k].length) READINGS[k] = g[k];
    });
  });
  // Grammar comprehension-check MCQs, keyed by unit id, merged into units below.
  [window.GRAMMAR_MCQ_A1, window.GRAMMAR_MCQ_A2, window.GRAMMAR_MCQ_B1, window.GRAMMAR_MCQ_B2].forEach(function (m) {
    if (!m) return;
    GRAMMAR.forEach(function (lvl) {
      lvl.units.forEach(function (u) { if (m[u.id]) u.mcq = m[u.id]; });
    });
  });
  var IDIOMS = window.IDIOMS || [];

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

  // Ordered daily routine — the app's "plan" for every day (done top-to-bottom).
  var DAILY_TASKS = [
    { id: "review",  icon: "🔁", title: "Tekrar",         desc: "Tekrarı gereken kelimeleri çalış", nav: "review",  goal: 1 },
    { id: "new",     icon: "🆕", title: "Yeni Kelimeler", desc: "10 yeni kelime öğren",             nav: "sets",    goal: 10 },
    { id: "grammar", icon: "📖", title: "Gramer",         desc: "1 ünite pratiği tamamla",          nav: "grammar", goal: 1 },
    { id: "quiz",    icon: "✅", title: "Test",            desc: "1 test çöz",                       nav: "sets",    goal: 1 },
    { id: "game",    icon: "🎮", title: "Oyun",            desc: "Kelime tamamlama oyunu oyna",      nav: "sets",    goal: 1 }
  ];

  // ---------------------------------------------------------------- branding
  var APP_VERSION = "1.7.0";
  var DEV_NAME = "Samet Tıraşoğlu";
  var DEV_EMAIL = "tirasoglusamet@gmail.com";

  // ---------------------------------------------------------------- SRS (Leitner-style)
  // box 1..6 with growing review intervals in days. A word is "learned" once it
  // has an srs entry; it becomes "due" when its review date arrives.
  var INTERVALS = [1, 2, 4, 7, 15, 30]; // days for box 1..6
  var MAX_BOX = 6;

  // ---------------------------------------------------------------- state
  var STORE_KEY = "ewc_progress_v2";
  var progress = loadProgress();
  migrate();
  applyTheme();
  var currentView = "home";
  var currentSet = null;
  var setReturnTo = "sets";
  var currentSetMode = "cards"; // cards | quiz | list
  var session = null; // active study/review session
  var quiz = null;    // active quiz
  var game = null;    // active spelling game
  var listOffset = 0;
  var currentGrammarLevel = null;   // grammar level id (a1/a2/b1/b2)
  var currentGrammarUnit = null;    // active grammar unit object
  var grammarStep = "slides";       // slides | mistakes | practice | done
  var grammarSlide = 0;             // slide index within a unit
  var grammarSlideDir = null;       // "right" | "left" | null — slide-in animation direction
  var gPractice = null;             // { unitId, index, correct, answered }
  var readingState = null;          // { passage, step: "text"|"questions", qIndex, correct, answered }

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
  function pad(n) { return String(n).padStart(2, "0"); }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function yesterdayStr() {
    var d = new Date(Date.now() - 86400000);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function addDays(dateStr, n) {
    var d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + n);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function fmtDate(dateStr) {
    var parts = dateStr.split("-");
    return parts[2] + "." + parts[1] + "." + parts[0];
  }

  // ---- persistence: Android SharedPreferences (reliable) + localStorage fallback ----
  function loadProgress() {
    try {
      if (typeof window.AndroidBridge !== "undefined" && window.AndroidBridge.loadProgress) {
        var s = window.AndroidBridge.loadProgress();
        if (s) return JSON.parse(s);
      }
    } catch (e) {}
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveProgress() {
    var json = JSON.stringify(progress);
    try {
      if (typeof window.AndroidBridge !== "undefined" && window.AndroidBridge.saveProgress) {
        window.AndroidBridge.saveProgress(json);
      }
    } catch (e) {}
    try { localStorage.setItem(STORE_KEY, json); } catch (e) {}
  }
  function migrate() {
    if (progress.levels && !progress.srs) {
      progress.srs = {};
      Object.keys(progress.levels).forEach(function (k) {
        var l = progress.levels[k];
        progress.srs[k] = { box: Math.max(1, Math.min(5, l)), reps: l || 1, due: todayStr() };
      });
      delete progress.levels;
      saveProgress();
    }
  }

  // ---- SRS accessors ----
  function srsEntry(key) { return progress.srs && progress.srs[key] ? progress.srs[key] : null; }
  function srsBox(key) { var e = srsEntry(key); return e ? e.box : 0; }
  function isLearned(key) { return srsBox(key) >= 1; }
  function isMastered(key) { return srsBox(key) >= 5; }
  function isDue(key) { var e = srsEntry(key); return !!e && e.due <= todayStr(); }

  function markKnown(key) {
    var wasNew = srsBox(key) === 0;
    var e = srsEntry(key) || { box: 0, reps: 0 };
    e.box = Math.min(MAX_BOX, e.box + 1);
    e.reps++;
    e.due = addDays(todayStr(), INTERVALS[e.box - 1]);
    progress.srs = progress.srs || {};
    progress.srs[key] = e;
    if (currentSet) progress.lastSet = currentSet;
    touchStudy();
    if (wasNew) bumpDaily("new", 1);
    saveProgress();
  }
  function markAgain(key) {
    var e = srsEntry(key) || { box: 0, reps: 0 };
    e.box = 1;
    e.reps++;
    e.due = todayStr(); // comes back for review today
    progress.srs = progress.srs || {};
    progress.srs[key] = e;
    if (currentSet) progress.lastSet = currentSet;
    touchStudy();
    saveProgress();
  }

  function newWords(setName) { return (SETS[setName] || []).filter(function (k) { return srsBox(k) === 0; }); }
  function dueWords(setName) { return (SETS[setName] || []).filter(isDue); }
  function learnedWords(setName) { return (SETS[setName] || []).filter(isLearned); }

  function setStats(name) {
    var keys = SETS[name] || [];
    var learned = keys.filter(isLearned).length;
    var due = keys.filter(isDue).length;
    return {
      total: keys.length, learned: learned, due: due,
      newn: keys.length - learned,
      pct: keys.length ? Math.round(learned / keys.length * 100) : 0
    };
  }

  function touchStudy() {
    var today = todayStr();
    if (progress.lastStudy === today) return;
    var yest = yesterdayStr();
    progress.streak = (progress.lastStudy === yest) ? ((progress.streak || 0) + 1) : 1;
    progress.lastStudy = today;
    saveProgress();
  }

  // ---- daily tasks (per-day counters, auto-reset on date change) ----
  function dailyToday() {
    var t = todayStr();
    if (!progress.daily || progress.daily.date !== t) {
      progress.daily = { date: t, review: 0, new: 0, grammar: 0, quiz: 0, game: 0 };
    }
    return progress.daily;
  }
  function bumpDaily(field, n) {
    var d = dailyToday();
    d[field] = (d[field] || 0) + (n || 1);
    saveProgress();
  }
  function dailyTaskDone(id, daily, totalDue) {
    if (id === "review") return daily.review >= 1 || totalDue === 0;
    if (id === "new") return daily.new >= 10;
    return daily[id] >= 1;
  }

  // ---- settings: show/hide Turkish translations ----
  function showTr() { return !progress.settings || progress.settings.showTranslations !== false; }
  function trText(w) { return showTr() ? (w.t || "") : ""; }

  // ---- settings: dark mode ----
  function darkMode() {
    if (progress.settings && typeof progress.settings.darkMode === "boolean") return progress.settings.darkMode;
    if (typeof window.matchMedia === "function") {
      try { return window.matchMedia("(prefers-color-scheme: dark)").matches; } catch (e) {}
    }
    return false;
  }
  function applyTheme() {
    var dark = darkMode();
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#0E1016" : "#4338CA");
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
    var c = $("#content");
    c.scrollTop = 0;
    c.classList.remove("view-anim");
    void c.offsetWidth;
    c.classList.add("view-anim");
  }

  function updateChrome() {
    var meta = null;
    if (currentView === "set" && currentSet) meta = SET_META[currentSet];
    var showBack = currentView === "set"
      || (session && currentView === "review")
      || currentView === "glevel"
      || currentView === "gunit";
    $("#backBtn").classList.toggle("hidden", !showBack);

    var title = "English Word Coach";
    if (meta) title = meta.name;
    else if (currentView === "review") title = "Tekrar";
    else if (currentView === "grammar") title = "Dilbilgisi";
    else if (currentView === "glevel" && currentGrammarLevel && GRAMMAR_BY_ID[currentGrammarLevel]) title = GRAMMAR_BY_ID[currentGrammarLevel].title;
    else if (currentView === "gunit" && currentGrammarUnit) title = currentGrammarUnit.title;
    $("#titleText").textContent = title;

    var tab = currentView === "set" ? "sets" : currentView;
    if (currentView === "glevel" || currentView === "gunit") tab = "grammar";
    $$(".tab").forEach(function (t) { t.classList.toggle("active", t.getAttribute("data-tab") === tab); });
  }

  function openSet(name, returnTo) {
    currentSet = name;
    setReturnTo = returnTo || "sets";
    currentSetMode = "cards";
    session = null;
    quiz = null;
    game = null;
    readingState = null;
    listOffset = 0;
    navigate("set");
  }

  function goBack() {
    if (currentView === "set") {
      currentSet = null;
      session = null;
      quiz = null;
      game = null;
      readingState = null;
      navigate(setReturnTo);
    } else if (currentView === "gunit") {
      currentGrammarUnit = null;
      grammarStep = "slides";
      grammarSlide = 0;
      gPractice = null;
      navigate("glevel");
    } else if (currentView === "glevel") {
      currentGrammarLevel = null;
      navigate("grammar");
    } else if (currentView === "review" && session) {
      session = null;
      render("review");
      updateChrome();
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
    else if (view === "review") renderReview(c);
    else if (view === "search") renderSearch(c);
    else if (view === "stats") renderStats(c);
    else if (view === "grammar") renderGrammar(c);
    else if (view === "glevel") renderGrammarLevel(c);
    else if (view === "gunit") renderGrammarUnit(c);
  }

  // ---------------------------------------------------------------- daily tasks
  function dailyTasksHtml() {
    var daily = dailyToday();
    var totalDue = ALL_KEYS.filter(isDue).length;
    var doneCount = 0;
    var rows = DAILY_TASKS.map(function (t) {
      var done = dailyTaskDone(t.id, daily, totalDue);
      if (done) doneCount++;
      var prog = "";
      if (t.id === "new") prog = " · " + Math.min(daily.new, t.goal) + "/" + t.goal;
      return '<div class="daily-row' + (done ? " done" : "") + '" data-daily="' + t.id + '" data-goto="' + t.nav + '">' +
        '  <span class="daily-check">' + (done ? "✓" : "") + "</span>" +
        '  <span class="daily-ico">' + t.icon + "</span>" +
        '  <div class="daily-info"><div class="daily-title">' + t.title + "</div>" +
        '    <div class="daily-desc">' + t.desc + prog + "</div></div>" +
        '  <span class="daily-chevron">›</span></div>';
    }).join("");
    var pct = Math.round(doneCount / DAILY_TASKS.length * 100);
    return '<div class="card daily-card">' +
      '<div class="daily-head"><span class="daily-title-big">📅 Günlük Görevler</span>' +
      '<span class="daily-count">' + doneCount + "/" + DAILY_TASKS.length + "</span></div>" +
      '<div class="daily-hint">Her gün sırayla tamamla 👇</div>' +
      '<div class="daily-bar"><span style="width:' + pct + '%"></span></div>' +
      rows +
      "</div>";
  }

  // ---------------------------------------------------------------- home
  function renderHome(c) {
    var hour = new Date().getHours();
    var greet = hour < 5 ? "İyi geceler" : hour < 12 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar";
    var totalLearned = ALL_KEYS.filter(isLearned).length;
    var totalDue = ALL_KEYS.filter(isDue).length;
    var wod = wordOfDay();
    var idiom = dailyIdiom();
    var idiomHtml = idiom
      ? '<div class="card">' +
        '  <div class="kicker" style="color:var(--muted);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Günün Deyimi</div>' +
        '  <div class="wod-word" style="font-size:24px">' + esc(idiom.w) + "</div>" +
        (showTr() && idiom.t ? '<div class="wod-tr">' + esc(idiom.t) + "</div>" : "") +
        (idiom.ex ? '<div class="wod-ex">"' + esc(idiom.ex) + '"</div>' : "") +
        (showTr() && idiom.lit ? '<div class="muted" style="margin-top:8px;font-size:12px">Kelimesi kelimesine: ' + esc(idiom.lit) + "</div>" : "") +
        "</div>"
      : "";

    var dueCard = "";
    if (totalDue > 0) {
      dueCard =
        '<div class="set-card" data-goto="review" style="border:1px solid var(--primary-soft)">' +
        '  <div class="set-badge" style="background:var(--primary)">🔁</div>' +
        '  <div class="set-info"><div class="set-name">Tekrar zamanı</div>' +
        '  <div class="set-count">' + totalDue + " kelime tekrar bekliyor</div></div>" +
        '  <div class="set-chevron">›</div></div>';
    }

    var lastSetHtml = "";
    if (progress.lastSet && SET_META[progress.lastSet]) {
      var st = setStats(progress.lastSet);
      lastSetHtml =
        '<div class="set-card" data-open="' + progress.lastSet + '" data-ret="home">' +
        '  <div class="set-badge" style="background:' + SET_META[progress.lastSet].color + '">' + badgeHtml(progress.lastSet) + "</div>" +
        '  <div class="set-info"><div class="set-name">Devam et: ' + esc(SET_META[progress.lastSet].name) + "</div>" +
        '  <div class="set-count">%' + st.pct + " tamamlandı · " + st.learned + "/" + st.total + " kelime</div>" +
        '  <div class="set-progress"><span style="width:' + st.pct + '%"></span></div></div>' +
        '  <div class="set-chevron">›</div></div>';
    }

    c.innerHTML =
      '<div class="hero">' +
      '  <div class="kicker">' + greet + "</div>" +
      "  <h2>Bugün kaç kelime öğreneceksin?</h2>" +
      "  <p>" + (progress.streak || 0) + " günlük seri 🔥 · " + totalLearned + " kelime öğrenildi</p>" +
      "</div>" +
      dailyTasksHtml() +
      dueCard +
      '<div class="card">' +
      '  <div class="kicker" style="color:var(--muted);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Günün Kelimesi</div>' +
      '  <div class="wod-word">' + esc(wod.w) + "</div>" +
      '  <div><span class="wod-pos">' + esc(wod.p || "word") + "</span>" + (wod.i ? '<span class="wod-ipa">' + esc(wod.i) + "</span>" : "") + "</div>" +
      (trText(wod) ? '<div class="wod-tr">' + esc(trText(wod)) + "</div>" : "") +
      (wod.d ? '<div class="wod-def">' + esc(wod.d) + "</div>" : "") +
      (wod.e ? '<div class="wod-ex">"' + esc(wod.e) + '"</div>' : "") +
      '  <button class="speaker" data-speak="' + esc(wod.w) + '">🔊 Dinle</button>' +
      "</div>" +
      idiomHtml +
      lastSetHtml +
      '<div class="set-card" data-goto="grammar" style="margin-top:14px">' +
      '  <div class="set-badge" style="background:#7C3AED">📖</div>' +
      '  <div class="set-info"><div class="set-name">Dilbilgisi Koçu</div>' +
      '  <div class="set-count">A1–B2 · 36 ünite · anlatım, hata ve pratik</div></div>' +
      '  <div class="set-chevron">›</div></div>' +
      '<div class="section-title">Kategoriler</div>' +
      '<div class="card" style="padding:6px 14px"><button class="btn btn-primary" style="margin:10px 0" data-goto="sets">Tüm kelime setlerine git ›</button></div>';
    bindDelegates(c);
  }

  function wordOfDay() {
    var dayNum = Math.floor(Date.now() / 86400000);
    return WORDS[ALL_KEYS[dayNum % ALL_KEYS.length]] || WORDS[ALL_KEYS[0]];
  }
  function dailyIdiom() {
    if (!IDIOMS.length) return null;
    var dayNum = Math.floor(Date.now() / 86400000);
    return IDIOMS[dayNum % IDIOMS.length];
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
          '    <div class="set-count">' + st.total + " kelime · " + st.learned + " öğrenildi" + (st.due ? " · " + st.due + " tekrar" : "") + "</div>" +
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
      '<button class="mode-tab' + (currentSetMode === "game" ? " active" : "") + '" data-tabmode="game">Oyun</button>' +
      '<button class="mode-tab' + (currentSetMode === "reading" ? " active" : "") + '" data-tabmode="reading">Okuma</button>' +
      "</div>";

    c.innerHTML =
      '<div class="set-head"><div class="set-badge" style="background:' + m.color + '">' + badgeHtml(currentSet) + "</div>" +
      "<h2>" + esc(m.name) + "</h2>" +
      '<div class="sub">' + esc(m.desc) + " · " + st.total + " kelime · " + st.learned + " öğrenildi</div></div>" +
      tabs +
      '<div id="modeBody"></div>';

    var body = $("#modeBody");
    if (currentSetMode === "cards") {
      if (session) renderFlashcard(body); else renderCardsMenu(body);
    } else if (currentSetMode === "quiz") {
      renderQuiz(body);
    } else if (currentSetMode === "game") {
      renderGame(body);
    } else if (currentSetMode === "reading") {
      renderReading(body);
    } else {
      renderListBody(body);
    }
    bindDelegates(c);
  }

  function setMode(mode) {
    session = null;
    quiz = null;
    game = null;
    readingState = null;
    listOffset = 0;
    currentSetMode = mode;
    renderSet($("#content"));
  }

  function renderCardsMenu(el) {
    var st = setStats(currentSet);
    var due = dueWords(currentSet).length;
    el.innerHTML =
      '<div class="card">' +
      '  <div class="center" style="padding:10px 0">' +
      '    <div style="background:var(--bg);border-radius:14px;padding:22px 16px">' +
      '      <div class="num" style="font-size:40px">' + st.learned + '<span class="muted" style="font-size:20px">/' + st.total + "</span></div>" +
      '      <div class="lbl">kelime öğrenildi · ' + st.due + " tekrar bekliyor</div>" +
      "    </div>" +
      "  </div>" +
      '  <button class="btn btn-primary" style="margin-top:8px" id="startNew"' + (st.newn ? "" : " disabled") + ">Yeni Kelimeler (" + st.newn + ")</button>" +
      '  <button class="btn btn-ghost" style="margin-top:10px" id="startReview"' + (due ? "" : " disabled") + ">Tekrar Et (" + due + ")</button>" +
      "</div>";
    var nb = $("#startNew");
    var rb = $("#startReview");
    if (nb) nb.addEventListener("click", function () { startStudy("new"); });
    if (rb) rb.addEventListener("click", function () { startStudy("review"); });
  }

  // ----- flashcard -----
  function startStudy(kind) {
    var keys = kind === "review" ? dueWords(currentSet) : newWords(currentSet);
    var queue = shuffle(keys).slice(0, 40);
    if (!queue.length) {
      toast(kind === "review" ? "Tekrar edilecek kelime yok 🎉" : "Bu setteki tüm kelimeleri öğrendin 🎉");
      return;
    }
    session = { kind: kind, global: false, queue: queue, index: 0, flipped: false };
    renderSet($("#content"));
  }

  function renderFlashcard(el) {
    var key = session.queue[session.index];
    var w = WORDS[key];
    var pos = session.index + 1;
    var total = session.queue.length;
    var box = srsBox(key);

    el.innerHTML =
      '<div class="stage-meta"><span>' + pos + " / " + total + "</span><span>" + (session.kind === "review" ? "Tekrar" : "Yeni") + (box ? " · kutu " + box : "") + "</span></div>" +
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
      (trText(w) ? '<div class="fc-tr">' + esc(trText(w)) + "</div>" : "") +
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
    if (session.kind === "review") bumpDaily("review", 1);
    if (know) markKnown(key); else markAgain(key);
    session.flipped = false;
    session.index++;
    if (session.index >= session.queue.length) {
      session = null;
      toast("Harika! 👏 Bu tur bitti.");
      if (currentView === "review") { render("review"); updateChrome(); }
      else renderSet($("#content"));
      return;
    }
    renderFlashcard($("#modeBody"));
  }

  // ----- quiz -----
  function buildQuizSet() {
    var keys = SETS[currentSet].slice();
    var unseen = keys.filter(function (k) { return srsBox(k) === 0; });
    var seen = keys.filter(function (k) { return srsBox(k) > 0; });
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
      return { type: "w2d", key: key, prompt: word.w, options: shuffle([key].concat(distractors)), correctKey: key };
    }
    return { type: "d2w", key: key, prompt: word.d, options: shuffle([key].concat(distractors)), correctKey: key };
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
    bumpDaily("quiz", 1);
    saveProgress();
    var msg = pct >= 90 ? "Mükemmel! 🏆" : pct >= 70 ? "Çok iyi! 👏" : pct >= 50 ? "Fena değil 👍" : "Tekrar deneyelim 💪";
    quiz = null;
    renderSet($("#content"));
    toast(msg + " %" + pct + " doğru");
  }

  // ----- spelling game (missing letters, EN <-> TR) -----
  function firstTr(w) { return (w.t || "").split(",")[0].trim(); }

  function usableGameWords(keys) {
    return keys.filter(function (k) {
      var w = WORDS[k];
      var tr = firstTr(w);
      return tr && tr.length >= 3 && tr.length <= 24 && w.w.length <= 20;
    });
  }

  function renderGame(el) {
    if (!game) {
      var usable = usableGameWords(learnedWords(currentSet));
      el.innerHTML = renderGameMenu(usable.length);
      var btn = $("#gameStart");
      if (btn) btn.addEventListener("click", startGame);
      return;
    }
    renderPuzzle(el);
  }

  function renderGameMenu(count) {
    if (count < 3) {
      return '<div class="card center" style="padding:30px 16px">' +
        '<div style="font-size:44px">🎮</div>' +
        '<div class="muted" style="margin-top:10px;font-size:14px;line-height:1.7">Oyun için önce bu setten birkaç kelime öğrenmelisin.<br>Kartlarla çalış, sonra buraya dön.</div>' +
        "</div>";
    }
    return '<div class="card">' +
      '<div class="center" style="padding:6px 0 14px">' +
      '  <div style="font-size:44px">🎮</div>' +
      '  <h3 style="margin:8px 0 4px">Kelime Tamamlama</h3>' +
      '  <div class="muted" style="font-size:13px">Eksik harfleri bul — İngilizce ↔ Türkçe karışık</div>' +
      "</div>" +
      '<div class="cfg-row"><span>Öğrenilen kelime</span><span class="v">' + count + "</span></div>" +
      '<button class="btn btn-primary" id="gameStart" style="margin-top:16px">Oyuna Başla</button>' +
      "</div>";
  }

  function startGame() {
    var usable = shuffle(usableGameWords(learnedWords(currentSet)));
    var n = Math.min(10, usable.length);
    if (n < 1) { toast("Önce kelime öğren"); return; }
    game = { pool: usable.slice(0, n), index: 0, score: 0 };
    renderSet($("#content"));
  }

  function makePuzzle(target) {
    var chars = target.split("");
    var idx = [];
    for (var i = 0; i < chars.length; i++) if (chars[i] !== " ") idx.push(i);
    var nHide = Math.max(1, Math.min(idx.length - 1, Math.round(idx.length * 0.4)));
    var hidden = shuffle(idx).slice(0, nHide).sort(function (a, b) { return a - b; });
    var letters = hidden.map(function (i) { return chars[i]; });
    var alphabet = "abcçdefgğhıijklmnoöprsştuüvyz";
    var used = {};
    target.toLowerCase().split("").forEach(function (c) { used[c] = 1; });
    var dist = shuffle(alphabet.split("").filter(function (c) { return !used[c]; })).slice(0, 2);
    var tiles = shuffle(letters.concat(dist)).map(function (l) { return { letter: l, used: false }; });
    return { chars: chars, hidden: hidden, tiles: tiles };
  }

  function renderPuzzle(el) {
    var key = game.pool[game.index];
    var w = WORDS[key];
    var dir = Math.random() < 0.5 ? "en2tr" : "tr2en";
    var clue = dir === "en2tr" ? w.w : firstTr(w);
    var target = dir === "en2tr" ? firstTr(w) : w.w;
    var puzzle = makePuzzle(target);
    game.current = { dir: dir, clue: clue, target: target, puzzle: puzzle, filled: [], blankIdx: 0 };

    el.innerHTML =
      '<div class="stage-meta"><span>' + (game.index + 1) + " / " + game.pool.length + "</span><span>" + game.score + " doğru</span></div>" +
      '<div class="game-clue">' + (dir === "en2tr" ? "Bu kelimenin Türkçesi:" : "Bu kelimenin İngilizcesi:") +
      '  <span class="big">' + esc(clue) + "</span></div>" +
      '<div class="game-target" id="gt">' + renderBlanks(game.current) + "</div>" +
      '<div class="tiles" id="tiles">' + renderTiles(game.current) + "</div>" +
      '<div id="gameNext" style="display:none;margin-top:14px"><button class="btn btn-primary" id="gNextBtn">Sonraki ›</button></div>';

    $("#tiles").addEventListener("click", onTileClick);
  }

  function renderBlanks(cur) {
    var p = cur.puzzle;
    var html = "";
    for (var i = 0; i < p.chars.length; i++) {
      var c = p.chars[i];
      var hidx = p.hidden.indexOf(i);
      if (c === " ") { html += '<span class="gt-space">&nbsp;</span>'; continue; }
      if (hidx >= 0) {
        var f = cur.filled[hidx];
        html += '<span class="blank' + (f ? " filled" : "") + '">' + (f ? esc(f) : "_") + "</span>";
      } else {
        html += '<span class="gt-letter">' + esc(c) + "</span>";
      }
    }
    return html;
  }

  function renderTiles(cur) {
    return cur.puzzle.tiles.map(function (t, i) {
      return '<button class="tile' + (t.used ? " used" : "") + '" data-ti="' + i + '">' + esc(t.letter) + "</button>";
    }).join("");
  }

  function onTileClick(e) {
    var btn = e.target;
    if (btn && btn.classList && !btn.classList.contains("tile")) btn = btn.closest(".tile");
    if (!btn || btn.classList.contains("used")) return;
    var i = parseInt(btn.getAttribute("data-ti"), 10);
    var cur = game.current;
    var t = cur.puzzle.tiles[i];
    var blankPos = cur.puzzle.hidden[cur.blankIdx];
    if (t.letter === cur.puzzle.chars[blankPos]) {
      t.used = true;
      cur.filled.push(t.letter);
      cur.blankIdx++;
      if (cur.blankIdx >= cur.puzzle.hidden.length) {
        game.score++;
        $("#gt").innerHTML = renderBlanks(cur);
        $("#tiles").innerHTML = "";
        $("#gameNext").style.display = "block";
        $("#gNextBtn").addEventListener("click", nextGame);
      } else {
        $("#gt").innerHTML = renderBlanks(cur);
        $("#tiles").innerHTML = renderTiles(cur);
      }
    } else {
      btn.classList.add("wrong");
      setTimeout(function () { btn.classList.remove("wrong"); }, 300);
    }
  }

  function nextGame() {
    game.index++;
    if (game.index >= game.pool.length) { finishGame(); return; }
    renderPuzzle($("#modeBody"));
  }

  function finishGame() {
    var total = game.pool.length;
    var pct = Math.round(game.score / total * 100);
    touchStudy();
    bumpDaily("game", 1);
    saveProgress();
    var msg = pct >= 80 ? "Harika! 🎯" : pct >= 50 ? "Güzel! 👍" : "Tekrar dene 💪";
    game = null;
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
      var box = srsBox(k);
      html +=
        '<div class="wl-row" data-word="' + esc(k) + '">' +
        '  <div class="wl-level lvl-' + Math.min(box, 6) + '">' + (box || "•") + "</div>" +
        '  <div style="min-width:0;flex:1"><div class="wl-word">' + esc(w.w) + "</div>" +
        '    <div class="wl-def">' + esc(trText(w) || w.d || "") + "</div></div>" +
        "</div>";
    });
    if (chunk.length < keys.length) {
      html += '<div class="center" style="padding:14px"><button class="btn btn-ghost" id="loadMore">Daha fazla göster (' + (keys.length - chunk.length) + ")</button></div>";
    }
    el.innerHTML = '<div class="card">' + html + "</div>";
    var lm = $("#loadMore");
    if (lm) lm.addEventListener("click", function () { listOffset += 150; renderListBody(el); });
  }

  // ---------------------------------------------------------------- review tab
  function renderReview(c) {
    if (session && session.global) {
      c.innerHTML = '<div id="modeBody"></div>';
      renderFlashcard($("#modeBody"));
      bindDelegates(c);
      return;
    }
    var due = shuffle(ALL_KEYS.filter(isDue));
    var learned = ALL_KEYS.filter(isLearned);

    c.innerHTML =
      '<div class="card"><div class="center" style="padding:8px 0">' +
      '  <div class="num" style="font-size:42px">' + due.length + "</div>" +
      '  <div class="lbl">bugün tekrar edilecek kelime</div>' +
      '  <button class="btn btn-primary" style="margin-top:16px" id="startGlobalReview"' + (due.length ? "" : " disabled") + ">Tekrara Başla</button>" +
      "</div></div>" +
      '<div class="section-title">Öğrenilen kelimeler (' + learned.length + ")</div>" +
      '<div class="card" id="learnedList" style="padding:4px 16px"></div>' +
      '<div class="section-title">📕 Bilinmeyen Kelimeler (' + Object.keys(progress.unknown || {}).length + ")</div>" +
      '<div class="card" style="padding:4px 16px">' + unknownListHtml() + "</div>";

    renderLearnedList($("#learnedList"), learned);
    var gb = $("#startGlobalReview");
    if (gb) gb.addEventListener("click", startGlobalReview);
    bindDelegates(c);
  }

  function startGlobalReview() {
    var due = shuffle(ALL_KEYS.filter(isDue));
    if (!due.length) { toast("Tekrar edilecek kelime yok 🎉"); return; }
    session = { kind: "review", global: true, queue: due.slice(0, 40), index: 0, flipped: false };
    render("review");
    updateChrome();
  }

  function renderLearnedList(el, keys) {
    keys = keys.slice().sort(function (a, b) {
      var ea = srsEntry(a), eb = srsEntry(b);
      return (eb.due || "").localeCompare(ea.due || "");
    });
    var chunk = keys.slice(0, listOffset + 150);
    var html = "";
    chunk.forEach(function (k) {
      var w = WORDS[k];
      var box = srsBox(k);
      var e = srsEntry(k);
      html +=
        '<div class="wl-row" data-word="' + esc(k) + '">' +
        '  <div class="wl-level lvl-' + Math.min(box, 6) + '">' + box + "</div>" +
        '  <div style="min-width:0;flex:1"><div class="wl-word">' + esc(w.w) + "</div>" +
        '    <div class="wl-def">' + esc(trText(w) || "") + (e ? (" · tekrar " + fmtDate(e.due)) : "") + "</div></div>" +
        "</div>";
    });
    if (!chunk.length) html = '<div class="search-empty" style="padding:24px">Henüz öğrenilmiş kelime yok.<br>Bir setten kartlarla çalışmaya başla 👇</div>';
    if (chunk.length < keys.length) {
      html += '<div class="center" style="padding:14px"><button class="btn btn-ghost" id="loadMoreLearned">Daha fazla (' + (keys.length - chunk.length) + ")</button></div>";
    }
    el.innerHTML = html;
    var lm = $("#loadMoreLearned");
    if (lm) lm.addEventListener("click", function () { listOffset += 150; renderLearnedList(el, keys); });
  }

  // ---------------------------------------------------------------- search
  function renderSearch(c) {
    c.innerHTML =
      '<div class="search-box"><span class="mag">🔍</span>' +
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
        '    <div class="wl-def">' + esc(trText(w) || w.d || "") + "</div></div>" +
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
    var totalLearned = ALL_KEYS.filter(isLearned).length;
    var totalDue = ALL_KEYS.filter(isDue).length;
    var totalNew = ALL_KEYS.length - totalLearned;
    var acc = progress.totalQuiz ? Math.round(progress.totalQuizCorrect / progress.totalQuiz * 100) : 0;

    var rows = "";
    Object.keys(SET_META).forEach(function (k) {
      if (!SETS[k]) return;
      var st = setStats(k);
      var m = SET_META[k];
      rows +=
        '<div class="stat-row"><span><span class="set-badge" style="display:inline-flex;width:22px;height:22px;border-radius:6px;font-size:9px;background:' + m.color + ';vertical-align:middle;margin-right:8px">' + badgeHtml(k) + "</span>" + esc(m.name) + "</span>" +
        '<span class="v muted">' + st.learned + "/" + st.total + "</span></div>";
    });

    c.innerHTML =
      '<div class="stat-grid">' +
      '  <div class="stat-box"><div class="num">' + totalLearned + '</div><div class="lbl">Öğrenilen kelime</div></div>' +
      '  <div class="stat-box"><div class="num">' + totalDue + '</div><div class="lbl">Tekrar bekleyen</div></div>' +
      '  <div class="stat-box"><div class="num">' + totalNew + '</div><div class="lbl">Yeni kelime</div></div>' +
      '  <div class="stat-box"><div class="num">' + (progress.streak || 0) + '</div><div class="lbl">Günlük seri 🔥</div></div>' +
      '  <div class="stat-box"><div class="num">' + ALL_KEYS.length + '</div><div class="lbl">Toplam kelime</div></div>' +
      '  <div class="stat-box"><div class="num">%' + acc + '</div><div class="lbl">Test doğruluğu</div></div>' +
      "</div>" +
      '<div class="section-title">Set bazında ilerleme</div>' +
      '<div class="card" style="padding:4px 16px">' + rows + "</div>" +
      '<div class="section-title">Destek / Hakkında</div>' +
      '<div class="card" style="padding:4px 16px">' +
      '  <div class="stat-row"><span>Geliştirici</span><span class="v">' + esc(DEV_NAME) + "</span></div>" +
      '  <div class="stat-row"><span>E-posta</span><span class="v"><a class="support-mail" href="mailto:' + esc(DEV_EMAIL) + '">' + esc(DEV_EMAIL) + "</a></span></div>" +
      '  <div class="stat-row"><span>Sürüm</span><span class="v">' + esc(APP_VERSION) + "</span></div>" +
      "</div>" +
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

  // ---------------------------------------------------------------- grammar (A1–B2)
  function grammarUnitDone(id) {
    return !!(progress.grammar && progress.grammar[id] && progress.grammar[id] >= 60);
  }
  function grammarBest(id) {
    return (progress.grammar && progress.grammar[id]) ? progress.grammar[id] : 0;
  }
  function grammarLevelStats(level) {
    var done = level.units.filter(function (u) { return grammarUnitDone(u.id); }).length;
    return { total: level.units.length, done: done, pct: level.units.length ? Math.round(done / level.units.length * 100) : 0 };
  }
  function grammarTotal() {
    var total = 0, done = 0;
    GRAMMAR.forEach(function (l) { l.units.forEach(function (u) { total++; if (grammarUnitDone(u.id)) done++; }); });
    return { total: total, done: done };
  }

  function openGrammarLevel(id) {
    currentGrammarLevel = id;
    currentGrammarUnit = null;
    grammarStep = "slides";
    grammarSlide = 0;
    grammarSlideDir = null;
    gPractice = null;
    navigate("glevel");
  }
  function openGrammarUnit(id) {
    var l = GRAMMAR_BY_ID[currentGrammarLevel];
    var unit = null;
    if (l) { l.units.forEach(function (u) { if (u.id === id) unit = u; }); }
    if (!unit) return;
    currentGrammarUnit = unit;
    grammarStep = "slides";
    grammarSlide = 0;
    grammarSlideDir = null;
    gPractice = null;
    navigate("gunit");
  }

  function renderGrammar(c) {
    var t = grammarTotal();
    var html =
      '<div class="hero" style="background:linear-gradient(135deg,#7C3AED,#2563EB)">' +
      '  <div class="kicker">Dilbilgisi</div>' +
      '  <h2>Dilbilgisi Koçu</h2>' +
      '  <p>' + t.done + ' / ' + t.total + ' ünite tamamlandı · 4 seviye (A1–B2)</p>' +
      '</div>';
    GRAMMAR.forEach(function (l) {
      var st = grammarLevelStats(l);
      html +=
        '<div class="set-card" data-glevel="' + l.id + '">' +
        '  <div class="set-badge" style="background:' + l.color + '">' + esc(l.id.toUpperCase()) + '</div>' +
        '  <div class="set-info"><div class="set-name">' + esc(l.title) + '</div>' +
        '    <div class="set-desc">' + esc(l.subtitle) + '</div>' +
        '    <div class="set-count">' + st.total + ' ünite · ' + st.done + ' tamamlandı</div>' +
        '    <div class="set-progress"><span style="width:' + st.pct + '%"></span></div></div>' +
        '  <div class="set-chevron">›</div></div>';
    });
    c.innerHTML = html;
    bindDelegates(c);
  }

  function renderGrammarLevel(c) {
    var l = GRAMMAR_BY_ID[currentGrammarLevel];
    if (!l) { navigate("grammar"); return; }
    var st = grammarLevelStats(l);
    var html =
      '<div class="set-head"><div class="set-badge" style="background:' + l.color + '">' + esc(l.id.toUpperCase()) + '</div>' +
      '<h2>' + esc(l.title) + '</h2>' +
      '<div class="sub">' + esc(l.subtitle) + ' · ' + st.done + '/' + st.total + ' ünite tamamlandı</div></div>';
    l.units.forEach(function (u) {
      var done = grammarUnitDone(u.id);
      var num = (u.id.split("-")[1] || "·");
      html +=
        '<div class="set-card" data-gunit="' + u.id + '">' +
        '  <div class="g-unit-num' + (done ? ' done' : '') + '">' + (done ? '✓' : esc(num)) + '</div>' +
        '  <div class="set-info"><div class="set-name">' + esc(u.title) + '</div>' +
        '    <div class="set-desc">' + esc(u.short) + '</div>' +
        '    <div class="set-count">' + (done ? ('En iyi: %' + grammarBest(u.id)) : 'Başlanmadı') + '</div></div>' +
        '  <div class="set-chevron">›</div></div>';
    });
    c.innerHTML = html;
    bindDelegates(c);
  }

  function renderGrammarUnit(c) {
    var u = currentGrammarUnit;
    if (!u) { navigate("glevel"); return; }
    var l = GRAMMAR_BY_ID[currentGrammarLevel];
    var color = l ? l.color : "#4338CA";
    var html =
      '<div class="set-head"><div class="set-badge" style="background:' + color + '">' + esc(l ? l.id.toUpperCase() : "") + '</div>' +
      '<h2>' + esc(u.title) + '</h2><div class="sub">' + esc(u.short) + '</div></div>';

    if (grammarStep === "slides") html += renderGrammarSlides(u);
    else if (grammarStep === "check") html += renderGrammarCheck(u);
    else if (grammarStep === "mistakes") html += renderGrammarMistakes(u);
    else if (grammarStep === "practice") html += renderGrammarPractice(u);
    else html += renderGrammarDone(u);

    c.innerHTML = html;
    bindDelegates(c);
    bindGrammar(c, u);
  }

  function stepBar(activeStep) {
    var steps = ["Anlatım", "Kontrol", "Hatalar", "Pratik"];
    var order = { slides: 0, check: 1, mistakes: 2, practice: 3, done: 3 };
    var cur = order[activeStep];
    return '<div class="g-stepbar">' + steps.map(function (s, i) {
      return '<span class="g-step' + (i <= cur ? ' on' : '') + '">' + s + '</span>';
    }).join("") + '</div>';
  }

  function renderGrammarSlides(u) {
    var s = u.slides[grammarSlide];
    var total = u.slides.length;
    var dir = grammarSlideDir;
    grammarSlideDir = null;
    var anim = dir ? " slide-in-" + dir : "";
    var dots = "";
    for (var i = 0; i < total; i++) dots += '<span class="g-dot' + (i === grammarSlide ? ' on' : '') + '" data-dot="' + i + '"></span>';
    var html =
      stepBar("slides") +
      '<div class="card g-slide' + anim + '">' +
      '  <div class="g-slide-h">' + esc(s.h) + '</div>' +
      '  <div class="g-slide-b">' + renderSlideBody(s.b) + '</div>' +
      '  <div class="g-dots">' + dots + '</div>' +
      '</div>' +
      '<div class="g-nav">' +
      '  <button class="btn btn-ghost" id="gPrev"' + (grammarSlide === 0 ? ' disabled' : '') + '>‹ Geri</button>' +
      (grammarSlide < total - 1
        ? '<button class="btn btn-primary" id="gNext">İleri ›</button>'
        : '<button class="btn btn-primary" id="gToCheck">Kontrol ›</button>') +
      '</div>';
    return html;
  }

  function renderGrammarCheck(u) {
    var mcqs = (u.mcq || []).map(function (m, mi) {
      var opts = m.options.map(function (o, i) {
        return '<button class="option gmcq-opt" data-mi="' + mi + '" data-qi="' + i + '">' + esc(o) + "</button>";
      }).join("");
      return '<div class="g-mcq"><div class="g-mcq-q">' + (mi + 1) + ". " + esc(m.q) + '</div><div class="g-mcq-opts">' + opts + "</div></div>";
    }).join("");
    var html =
      stepBar("check") +
      '<div class="card">' +
      '  <div class="g-slide-h">Anlama Kontrolü</div>' +
      '  <div class="muted" style="font-size:13px;margin-bottom:14px">Doğru cevabı seç, hemen kontrol et.</div>' +
      (mcqs || '<div class="muted">Bu ünite için kontrol sorusu yok.</div>') +
      "</div>" +
      '<div class="g-nav">' +
      '  <button class="btn btn-ghost" id="gBackSlides2">‹ Anlatım</button>' +
      '  <button class="btn btn-primary" id="gToMistakes2">Hatalar ›</button>' +
      "</div>";
    return html;
  }

  function renderGrammarMistakes(u) {
    var pairs = u.mistakes.map(function (m) {
      return '<div class="g-mistake">' +
        '<div class="g-mis-wrong"><span class="g-mis-tag">✗</span><div>' + esc(m.w) + '</div></div>' +
        '<div class="g-mis-right"><span class="g-mis-tag">✓</span><div>' + esc(m.r) + '</div></div>' +
        '<div class="g-mis-note">' + esc(m.n) + '</div>' +
        '</div>';
    }).join("");
    var html =
      stepBar("mistakes") +
      '<div class="card">' +
      '  <div class="g-slide-h">Sık Yapılan Hatalar</div>' +
      '  <div class="muted" style="font-size:13px;margin-bottom:14px">Yanlış kullanım ile doğrusunu karşılaştır.</div>' +
      pairs +
      '</div>' +
      '<div class="g-nav">' +
      '  <button class="btn btn-ghost" id="gBackCheck">‹ Kontrol</button>' +
      '  <button class="btn btn-primary" id="gToPractice">Pratik ›</button>' +
      '</div>';
    return html;
  }

  function renderGrammarPractice(u) {
    if (!gPractice || gPractice.unitId !== u.id) return renderGrammarPracticeIntro(u);
    var q = u.practice[gPractice.index];
    var pos = gPractice.index + 1;
    var total = u.practice.length;
    var promptHtml = esc(q.q).replace(/___/g, '<span class="g-blank">___</span>');
    return stepBar("practice") +
      '<div class="stage-meta"><span>' + pos + ' / ' + total + '</span><span>' + gPractice.correct + ' doğru</span></div>' +
      '<div class="card">' +
      '  <div class="g-prompt">' + promptHtml + '</div>' +
      (q.hint ? '<div class="g-hint">İpucu: ' + esc(q.hint) + '</div>' : '') +
      '  <div class="g-input-wrap"><input id="gInput" class="g-input" type="text" placeholder="Cevabını yaz…" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"></div>' +
      '  <div id="gFeedback"></div>' +
      '  <button class="btn btn-primary" id="gCheck" style="margin-top:10px">Kontrol Et</button>' +
      '  <button class="btn btn-primary" id="gNextQ" style="margin-top:10px;display:none">Sonraki ›</button>' +
      '</div>';
  }

  function renderGrammarPracticeIntro(u) {
    return stepBar("practice") +
      '<div class="card center" style="padding:26px 18px">' +
      '  <div style="font-size:44px">✍️</div>' +
      '  <h3 style="margin:8px 0 4px">Pratik Zamanı</h3>' +
      '  <div class="muted" style="font-size:13.5px;line-height:1.6">' + u.practice.length + ' soru. Boşluğa doğru formu yaz.</div>' +
      '  <button class="btn btn-primary" id="gStartPractice" style="margin-top:18px">Başla</button>' +
      '</div>' +
      '<button class="btn btn-ghost" id="gBackMistakes" style="margin-top:4px">‹ Hatalar</button>';
  }

  function renderGrammarDone(u) {
    var best = grammarBest(u.id);
    var done = best >= 60;
    return stepBar("done") +
      '<div class="card center" style="padding:26px 18px">' +
      '  <div style="font-size:44px">' + (done ? '🎉' : '💪') + '</div>' +
      '  <h3 style="margin:8px 0 4px">' + (done ? 'Ünite Tamamlandı!' : 'Ünite Tekrarı') + '</h3>' +
      '  <div class="muted" style="font-size:14px">En iyi skor: %' + best + '</div>' +
      '  <button class="btn btn-primary" id="gRedo" style="margin-top:16px">Tekrar Çalış</button>' +
      '</div>' +
      '<button class="btn btn-ghost" id="gBackLevel" style="margin-top:4px">‹ Ünite listesi</button>';
  }

  // ---- slide body micro-format: "\n\n" blocks; "- " bullets; "> " examples; "! " tips
  function renderSlideBody(b) {
    var lines = String(b || "").split("\n");
    var html = "";
    var i = 0;
    while (i < lines.length) {
      var line = lines[i];
      if (line.trim() === "") { i++; continue; }
      if (line.indexOf("- ") === 0) {
        var items = [];
        while (i < lines.length && lines[i].indexOf("- ") === 0) { items.push(esc(lines[i].slice(2))); i++; }
        html += '<ul class="g-bullets">' + items.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>";
      } else if (line.indexOf("> ") === 0) {
        var ex = [];
        while (i < lines.length && lines[i].indexOf("> ") === 0) { ex.push(renderExampleLine(lines[i].slice(2))); i++; }
        html += '<div class="g-example">' + ex.join("") + "</div>";
      } else if (line.indexOf("! ") === 0) {
        var tips = [];
        while (i < lines.length && lines[i].indexOf("! ") === 0) { tips.push(esc(lines[i].slice(2))); i++; }
        html += '<div class="g-tip">' + tips.join("<br>") + "</div>";
      } else {
        var para = [];
        while (i < lines.length && lines[i].trim() !== "" && lines[i].indexOf("- ") !== 0 && lines[i].indexOf("> ") !== 0 && lines[i].indexOf("! ") !== 0) { para.push(lines[i]); i++; }
        html += '<p class="g-p">' + para.map(esc).join("<br>") + "</p>";
      }
    }
    return html;
  }
  function renderExampleLine(s) {
    var idx = s.indexOf("→");
    if (idx >= 0) {
      return '<div class="g-ex-line"><span class="g-ex-en">' + esc(s.slice(0, idx).trim()) + '</span><span class="g-ex-tr">' + esc(s.slice(idx + 1).trim()) + "</span></div>";
    }
    return '<div class="g-ex-line"><span class="g-ex-en">' + esc(s.trim()) + "</span></div>";
  }

  // ---- practice: type the correct form
  function normalizeAnswer(s) {
    return String(s == null ? "" : s).toLowerCase().replace(/[’‘`´]/g, "'").replace(/\s+/g, " ").trim();
  }
  function checkPracticeAnswer() {
    if (!gPractice || gPractice.answered) return;
    var u = currentGrammarUnit;
    var q = u.practice[gPractice.index];
    var input = $("#gInput");
    if (!input) return;
    var val = normalizeAnswer(input.value);
    if (!val) { input.focus(); return; }
    gPractice.answered = true;
    var correct = q.a.some(function (a) { return normalizeAnswer(a) === val; });
    var fb = $("#gFeedback");
    if (correct) {
      gPractice.correct++;
      input.classList.add("correct");
      if (fb) fb.innerHTML = '<div class="g-fb ok">Doğru! ✓</div>';
    } else {
      input.classList.add("wrong");
      if (fb) fb.innerHTML = '<div class="g-fb no">Yanlış. Doğrusu: <b>' + esc(q.a[0]) + '</b></div>';
    }
    input.disabled = true;
    var check = $("#gCheck"); if (check) check.style.display = "none";
    var next = $("#gNextQ"); if (next) next.style.display = "block";
  }
  function nextPracticeQ() {
    gPractice.answered = false;
    gPractice.index++;
    if (gPractice.index >= currentGrammarUnit.practice.length) { finishPractice(); return; }
    renderGrammarUnit($("#content"));
  }
  function finishPractice() {
    var u = currentGrammarUnit;
    var total = u.practice.length;
    var pct = total ? Math.round(gPractice.correct / total * 100) : 0;
    progress.grammar = progress.grammar || {};
    if (!progress.grammar[u.id] || pct > progress.grammar[u.id]) progress.grammar[u.id] = pct;
    touchStudy();
    bumpDaily("grammar", 1);
    saveProgress();
    var done = pct >= 60;
    grammarStep = "done";
    gPractice = null;
    renderGrammarUnit($("#content"));
    toast((done ? "Tebrikler! 🎉 " : "Tekrar dene 💪 ") + "%" + pct + " doğru");
  }

  function goGrammarPrev(u) {
    grammarSlideDir = "left";
    grammarSlide = Math.max(0, grammarSlide - 1);
    renderGrammarUnit($("#content"));
  }
  function goGrammarNext(u) {
    grammarSlideDir = "right";
    grammarSlide = Math.min(u.slides.length - 1, grammarSlide + 1);
    renderGrammarUnit($("#content"));
  }
  function bindSlideSwipe(u) {
    var slide = $(".g-slide");
    if (!slide) return;
    var startX = null, startY = null, tracking = false;
    slide.addEventListener("touchstart", function (e) {
      if (e.target && e.target.closest && e.target.closest(".g-dot, button, a, .speaker")) return;
      var t = e.touches && e.touches[0];
      if (!t) return;
      startX = t.clientX; startY = t.clientY; tracking = true;
    }, { passive: true });
    slide.addEventListener("touchmove", function (e) {
      if (!tracking) return;
      var t = e.touches && e.touches[0];
      if (t && Math.abs(t.clientY - startY) > Math.abs(t.clientX - startX)) tracking = false;
    }, { passive: true });
    slide.addEventListener("touchend", function (e) {
      if (!tracking) { tracking = false; return; }
      tracking = false;
      var t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      var dx = t.clientX - startX;
      if (Math.abs(dx) >= 40) {
        if (dx < 0) goGrammarNext(u);
        else goGrammarPrev(u);
      }
    });
  }

  function bindGrammar(c, u) {
    $$(".g-dot").forEach(function (d) {
      d.addEventListener("click", function () {
        var target = parseInt(d.getAttribute("data-dot"), 10);
        grammarSlideDir = target > grammarSlide ? "right" : "left";
        grammarSlide = target;
        renderGrammarUnit($("#content"));
      });
    });
    var prev = $("#gPrev"); if (prev) prev.addEventListener("click", function () { goGrammarPrev(u); });
    var next = $("#gNext"); if (next) next.addEventListener("click", function () { goGrammarNext(u); });
    var toCheck = $("#gToCheck"); if (toCheck) toCheck.addEventListener("click", function () { grammarStep = "check"; renderGrammarUnit($("#content")); });
    var toM2 = $("#gToMistakes2"); if (toM2) toM2.addEventListener("click", function () { grammarStep = "mistakes"; renderGrammarUnit($("#content")); });
    var toP = $("#gToPractice"); if (toP) toP.addEventListener("click", function () { grammarStep = "practice"; gPractice = null; renderGrammarUnit($("#content")); });
    var backSlides2 = $("#gBackSlides2"); if (backSlides2) backSlides2.addEventListener("click", function () { grammarStep = "slides"; renderGrammarUnit($("#content")); });
    var backCheck = $("#gBackCheck"); if (backCheck) backCheck.addEventListener("click", function () { grammarStep = "check"; renderGrammarUnit($("#content")); });
    bindSlideSwipe(u);
    $$(".gmcq-opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var mi = parseInt(btn.getAttribute("data-mi"), 10);
        var qi = parseInt(btn.getAttribute("data-qi"), 10);
        var m = (u.mcq || [])[mi];
        if (!m) return;
        $$('[data-mi="' + mi + '"]').forEach(function (o) {
          o.disabled = true;
          var oqi = parseInt(o.getAttribute("data-qi"), 10);
          if (oqi === m.a) o.classList.add("correct");
          else if (oqi === qi) o.classList.add("wrong");
        });
      });
    });
    var backMistakes = $("#gBackMistakes"); if (backMistakes) backMistakes.addEventListener("click", function () { grammarStep = "mistakes"; renderGrammarUnit($("#content")); });
    var startP = $("#gStartPractice"); if (startP) startP.addEventListener("click", function () { gPractice = { unitId: u.id, index: 0, correct: 0, answered: false }; renderGrammarUnit($("#content")); });
    var check = $("#gCheck"); if (check) check.addEventListener("click", checkPracticeAnswer);
    var input = $("#gInput");
    if (input) {
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") checkPracticeAnswer(); });
      setTimeout(function () { try { input.focus(); } catch (e) {} }, 60);
    }
    var nextQ = $("#gNextQ"); if (nextQ) nextQ.addEventListener("click", nextPracticeQ);
    var redo = $("#gRedo"); if (redo) redo.addEventListener("click", function () { grammarSlideDir = null; grammarStep = "slides"; grammarSlide = 0; gPractice = null; renderGrammarUnit($("#content")); });
    var backLevel = $("#gBackLevel"); if (backLevel) backLevel.addEventListener("click", function () { goBack(); });
  }

  // ---------------------------------------------------------------- reading
  function readingList(name) { return READINGS[name] || []; }
  function readingDone(id) { return !!(progress.readings && progress.readings[id] && progress.readings[id] >= 60); }

  function renderReading(el) {
    if (!readingState) { renderReadingList(el); return; }
    if (readingState.step === "text") renderPassage(el);
    else renderReadingQuestion(el);
  }

  function renderReadingList(el) {
    var passages = readingList(currentSet);
    var unknownCount = Object.keys(progress.unknown || {}).length;
    var html =
      '<div class="card">' +
      '  <div style="display:flex;align-items:center;gap:12px">' +
      '    <div style="flex:1;min-width:0"><div class="set-name">Okuma Alıştırmaları</div>' +
      '    <div class="muted" style="font-size:12.5px">Paragrafı oku, soruları cevapla</div></div>' +
      '    <button class="btn btn-ghost" id="uwListBtn" style="flex:none;padding:11px 14px">📕 ' + unknownCount + "</button>" +
      "  </div>" +
      "</div>";
    if (!passages.length) {
      html += '<div class="card center" style="padding:30px 16px"><div style="font-size:40px">📖</div>' +
        '<div class="muted" style="margin-top:8px;font-size:13.5px">Bu set için okuma parçası eklenmedi.</div></div>';
    } else {
      var byTopic = {};
      passages.forEach(function (p) {
        var t = p.topic || "Genel Okuma";
        (byTopic[t] = byTopic[t] || []).push(p);
      });
      Object.keys(byTopic).forEach(function (t) {
        var list = byTopic[t];
        html += '<div class="section-title">' + esc(t) + ' <span class="muted" style="text-transform:none;font-weight:600;letter-spacing:0">(' + list.length + ")</span></div>";
        list.forEach(function (p) {
          var done = readingDone(p.id);
          var wc = (p.text || "").split(/\s+/).length;
          html +=
            '<div class="set-card" data-reading="' + p.id + '">' +
            '  <div class="g-unit-num' + (done ? ' done' : '') + '">' + (done ? '✓' : '📖') + '</div>' +
            '  <div class="set-info"><div class="set-name">' + esc(p.title) + '</div>' +
            '    <div class="set-count">' + wc + ' kelime · ' + (p.questions || []).length + ' soru</div></div>' +
            '  <div class="set-chevron">›</div></div>';
        });
      });
    }
    el.innerHTML = html;
    bindDelegates(el);
    var ub = $("#uwListBtn");
    if (ub) ub.addEventListener("click", openUnknownListModal);
  }

  function openReading(id) {
    var p = null;
    readingList(currentSet).forEach(function (x) { if (x.id === id) p = x; });
    if (!p) return;
    readingState = { passage: p, step: "text", qIndex: 0, correct: 0, answered: false };
    renderSet($("#content"));
  }

  function renderPassage(el) {
    var p = readingState.passage;
    el.innerHTML =
      '<div class="rd-title">' + esc(p.title) + "</div>" +
      '<div class="card rd-passage" id="rdPassage">' + renderPassageText(p.text) + "</div>" +
      '<div class="muted center" style="font-size:12px;margin:-4px 0 12px">Bir kelimeye basılı tut → bilinmeyenlere ekle</div>' +
      '<div class="g-nav">' +
      '  <button class="btn btn-ghost" id="rdBack">‹ Liste</button>' +
      '  <button class="btn btn-primary" id="rdStartQ">Sorulara Geç ›</button>' +
      "</div>";
    $("#rdBack").addEventListener("click", function () { readingState = null; renderSet($("#content")); });
    $("#rdStartQ").addEventListener("click", function () { readingState.step = "questions"; readingState.qIndex = 0; readingState.correct = 0; readingState.answered = false; renderSet($("#content")); });
    bindPassageInteraction($("#rdPassage"));
  }

  function renderPassageText(text) {
    return String(text || "").split(/\n\n+/).map(function (para) {
      if (!para.trim()) return "";
      var parts = para.split(/(\s+)/);
      var html = parts.map(function (tok) {
        if (!tok) return "";
        if (/^\s+$/.test(tok)) return tok;
        var clean = tok.replace(/^[^A-Za-zÀ-ÖØ-öø-ÿ0-9]+|[^A-Za-zÀ-ÖØ-öø-ÿ0-9]+$/g, "");
        if (!clean) return esc(tok);
        return '<span class="rd-word" data-w="' + esc(clean) + '">' + esc(tok) + "</span>";
      }).join("");
      return "<p>" + html + "</p>";
    }).join("");
  }

  function bindPassageInteraction(container) {
    if (!container) return;
    var timer = null;
    container.addEventListener("touchstart", function (e) {
      var w = e.target && e.target.closest ? e.target.closest(".rd-word") : null;
      if (!w) return;
      var word = w.getAttribute("data-w");
      clearTimeout(timer);
      timer = setTimeout(function () { openUnknownWordModal(word); }, 480);
    });
    container.addEventListener("touchend", function () { clearTimeout(timer); });
    container.addEventListener("touchmove", function () { clearTimeout(timer); });
    container.addEventListener("contextmenu", function (e) {
      var w = e.target && e.target.closest ? e.target.closest(".rd-word") : null;
      if (!w) return;
      e.preventDefault();
      openUnknownWordModal(w.getAttribute("data-w"));
    });
  }

  function renderReadingQuestion(el) {
    var rs = readingState;
    var p = rs.passage;
    var q = p.questions[rs.qIndex];
    var pos = rs.qIndex + 1;
    var total = p.questions.length;
    var opts = q.options.map(function (o, i) {
      return '<button class="option" data-qi="' + i + '">' + esc(o) + "</button>";
    }).join("");
    el.innerHTML =
      '<div class="stage-meta"><span>Soru ' + pos + " / " + total + "</span><span>" + rs.correct + " doğru</span></div>" +
      '<div class="quiz-q" style="font-size:16px;text-align:left;font-weight:700">' + esc(q.q) + "</div>" +
      '<div id="rOpts">' + opts + "</div>" +
      '<div id="rNext" style="display:none"><button class="btn btn-primary" id="rNextBtn">Sonraki ›</button></div>';
    $$("#rOpts .option").forEach(function (btn) {
      btn.addEventListener("click", function () { answerReading(btn); });
    });
  }

  function answerReading(btn) {
    if (readingState.answered) return;
    readingState.answered = true;
    var q = readingState.passage.questions[readingState.qIndex];
    var i = parseInt(btn.getAttribute("data-qi"), 10);
    if (i === q.a) {
      readingState.correct++;
      btn.classList.add("correct");
    } else {
      btn.classList.add("wrong");
      $$("#rOpts .option").forEach(function (o) { if (parseInt(o.getAttribute("data-qi"), 10) === q.a) o.classList.add("correct"); });
    }
    $$("#rOpts .option").forEach(function (o) { o.disabled = true; });
    $("#rNext").style.display = "block";
    $("#rNextBtn").addEventListener("click", nextReadingQ);
  }

  function nextReadingQ() {
    readingState.answered = false;
    readingState.qIndex++;
    if (readingState.qIndex >= readingState.passage.questions.length) { finishReading(); return; }
    renderSet($("#content"));
  }

  function finishReading() {
    var p = readingState.passage;
    var total = p.questions.length;
    var pct = total ? Math.round(readingState.correct / total * 100) : 0;
    progress.readings = progress.readings || {};
    if (!progress.readings[p.id] || pct > progress.readings[p.id]) progress.readings[p.id] = pct;
    touchStudy();
    saveProgress();
    var done = pct >= 60;
    readingState = null;
    renderSet($("#content"));
    toast((done ? "Harika! 📖 " : "Tekrar dene 💪 ") + "%" + pct + " doğru");
  }

  // ---- unknown words (long-press in a passage) ----
  function openUnknownWordModal(rawWord) {
    var key = String(rawWord || "").toLowerCase();
    var entry = WORDS[key];
    var meaning = entry ? (entry.t || entry.d || "") : "";
    var pos = entry ? (entry.p || "") : "";
    var isSaved = !!(progress.unknown && progress.unknown[key]);
    var modal = $("#modal");
    modal.innerHTML =
      '<div class="modal-card">' +
      '  <div class="modal-word">' + esc(rawWord) + "</div>" +
      (pos ? '<div style="margin:6px 0 2px"><span class="wod-pos">' + esc(pos) + "</span></div>" : "") +
      (meaning ? '<div class="wod-tr">' + esc(meaning) + "</div>" : '<div class="muted" style="margin-top:10px;font-size:14px">Bu kelime sözlükte yok — yine de listene ekleyebilirsin.</div>') +
      '  <div class="quiz-actions" style="margin-top:16px">' +
      '    <button class="btn btn-ghost" id="uwSpeak">🔊</button>' +
      '    <button class="btn ' + (isSaved ? "btn-again" : "btn-know") + '" id="uwAdd">' + (isSaved ? "✓ Eklendi" : "➕ Bilinmeyenlere Ekle") + "</button>" +
      "  </div>" +
      '  <button class="modal-close" id="uwClose">Kapat</button>' +
      "</div>";
    modal.classList.remove("hidden");
    $("#uwSpeak").addEventListener("click", function () { speak(rawWord); });
    $("#uwAdd").addEventListener("click", function () { toggleUnknown(key, rawWord, meaning); });
    $("#uwClose").addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
  }

  function toggleUnknown(key, rawWord, meaning) {
    progress.unknown = progress.unknown || {};
    if (progress.unknown[key]) {
      delete progress.unknown[key];
      toast("Listeden çıkarıldı");
    } else {
      progress.unknown[key] = { w: rawWord, t: meaning, d: todayStr() };
      toast("Bilinmeyenlere eklendi ✓");
    }
    saveProgress();
    closeModal();
    refreshUnknownLists();
  }

  function unknownListHtml() {
    var keys = Object.keys(progress.unknown || {}).sort();
    if (!keys.length) return '<div class="search-empty" style="padding:24px 12px">Henüz bilinmeyen kelime yok.<br>Okuma sırasında bir kelimeye basılı tut.</div>';
    return keys.map(function (k) {
      var u = progress.unknown[k];
      return '<div class="wl-row" style="cursor:default">' +
        '  <div style="min-width:0;flex:1"><div class="wl-word">' + esc(u.w || k) + '</div>' +
        '    <div class="wl-def">' + esc(u.t || "") + '</div></div>' +
        '  <button class="uw-remove" data-unknown-del="' + esc(k) + '" aria-label="Kaldır">✕</button>' +
        "</div>";
    }).join("");
  }

  function removeUnknown(k) {
    if (progress.unknown) delete progress.unknown[k];
    saveProgress();
    refreshUnknownLists();
    toast("Çıkarıldı");
  }

  function refreshUnknownLists() {
    var m = $("#unknownModalList");
    if (m) {
      m.innerHTML = unknownListHtml();
      bindUnknownRemove(m);
    }
    if (currentView === "review") render("review");
  }

  function bindUnknownRemove(root) {
    $$("[data-unknown-del]", root).forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        removeUnknown(btn.getAttribute("data-unknown-del"));
      });
    });
  }

  function openUnknownListModal() {
    var modal = $("#modal");
    modal.innerHTML =
      '<div class="modal-card">' +
      '  <div class="modal-word" style="font-size:20px">📕 Bilinmeyen Kelimeler</div>' +
      '  <div class="muted" style="font-size:12.5px;margin-top:4px">' + Object.keys(progress.unknown || {}).length + " kelime</div>" +
      '  <div id="unknownModalList" class="card" style="padding:4px 16px;margin-top:14px;box-shadow:none;border:1px solid var(--line)">' + unknownListHtml() + "</div>" +
      '  <button class="modal-close" id="uwListClose">Kapat</button>' +
      "</div>";
    modal.classList.remove("hidden");
    $("#uwListClose").addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
    bindUnknownRemove($("#unknownModalList"));
  }

  // ---------------------------------------------------------------- modal
  function openWordModal(key) {
    var w = WORDS[key];
    var box = srsBox(key);
    var e = srsEntry(key);
    var sets = whichSets(key).map(function (s) { return SET_META[s].badge; }).join(", ");
    var srsTxt = box ? ("Kutu " + box + "/" + MAX_BOX + " · sonraki tekrar " + fmtDate(e.due)) : "Henüz çalışılmadı";
    var modal = $("#modal");
    modal.innerHTML =
      '<div class="modal-card">' +
      '  <div class="modal-word">' + esc(w.w) + "</div>" +
      '  <div style="margin:6px 0 2px"><span class="wod-pos">' + esc(w.p || "word") + "</span>" + (w.i ? '<span class="wod-ipa">' + esc(w.i) + "</span>" : "") + "</div>" +
      (trText(w) ? '<div class="wod-tr">' + esc(trText(w)) + "</div>" : "") +
      (w.d ? '<div class="wod-def">' + esc(w.d) + "</div>" : "") +
      (w.e ? '<div class="wod-ex">"' + esc(w.e) + '"</div>' : "") +
      '  <div class="muted" style="margin-top:12px;font-size:12px">Setler: ' + esc(sets) + " · " + esc(srsTxt) + "</div>" +
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

  function openSettings() {
    var on = showTr();
    var dark = darkMode();
    var modal = $("#modal");
    modal.innerHTML =
      '<div class="modal-card">' +
      '  <div class="modal-word" style="font-size:20px">Ayarlar</div>' +
      '  <div class="toggle' + (on ? " on" : "") + '" id="trToggle">' +
      '    <div class="track"><div class="thumb"></div></div>' +
      '    <span style="flex:1;font-size:15px;font-weight:600">Türkçe çevirileri göster</span>' +
      "  </div>" +
      '  <div class="muted" style="font-size:12.5px;margin-top:6px;line-height:1.5">Kart, liste ve arama sonuçlarında Türkçe karşılıkların görünmesini açıp kapatır.</div>' +
      '  <div class="toggle' + (dark ? " on" : "") + '" id="darkToggle">' +
      '    <div class="track"><div class="thumb"></div></div>' +
      '    <span style="flex:1;font-size:15px;font-weight:600">Karanlık Mod</span>' +
      "  </div>" +
      '  <div class="muted" style="font-size:12.5px;margin-top:6px;line-height:1.5">Uygulamayı koyu temada göster.</div>' +
      '  <button class="modal-close" id="mClose">Kapat</button>' +
      "</div>";
    modal.classList.remove("hidden");
    $("#trToggle").addEventListener("click", function () {
      progress.settings = progress.settings || {};
      progress.settings.showTranslations = !showTr();
      saveProgress();
      closeModal();
      render(currentView);
    });
    $("#darkToggle").addEventListener("click", function () {
      progress.settings = progress.settings || {};
      progress.settings.darkMode = !darkMode();
      saveProgress();
      applyTheme();
      render(currentView);
    });
    $("#mClose").addEventListener("click", closeModal);
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
    $$("[data-glevel]", root).forEach(function (el) {
      el.addEventListener("click", function () { openGrammarLevel(el.getAttribute("data-glevel")); });
    });
    $$("[data-gunit]", root).forEach(function (el) {
      el.addEventListener("click", function () { openGrammarUnit(el.getAttribute("data-gunit")); });
    });
    $$("[data-reading]", root).forEach(function (el) {
      el.addEventListener("click", function () { openReading(el.getAttribute("data-reading")); });
    });
    $$("[data-unknown-del]", root).forEach(function (el) {
      el.addEventListener("click", function (e) { e.stopPropagation(); removeUnknown(el.getAttribute("data-unknown-del")); });
    });
  }

  // ---------------------------------------------------------------- boot
  $("#backBtn").addEventListener("click", goBack);
  $("#settingsBtn").addEventListener("click", openSettings);
  $$(".tab").forEach(function (t) {
    t.addEventListener("click", function () {
      var v = t.getAttribute("data-tab");
      session = null; quiz = null; game = null; listOffset = 0; currentSetMode = "cards"; readingState = null;
      currentGrammarLevel = null; currentGrammarUnit = null; grammarStep = "slides"; grammarSlide = 0; grammarSlideDir = null; gPractice = null;
      if (v === "home") navigate("home");
      else if (v === "sets") navigate("sets");
      else if (v === "grammar") navigate("grammar");
      else if (v === "review") navigate("review");
      else if (v === "search") navigate("search");
      else if (v === "stats") navigate("stats");
    });
  });

  // splash screen: auto-dismiss after a moment, or tap to skip
  var splash = $("#splash");
  function hideSplash() {
    if (!splash) return;
    splash.classList.add("gone");
    setTimeout(function () { if (splash.parentNode) splash.parentNode.removeChild(splash); }, 450);
  }
  if (splash) {
    splash.addEventListener("click", hideSplash);
    setTimeout(hideSplash, 2200);
  }

  // follow system light/dark changes unless the user has explicitly chosen
  if (typeof window.matchMedia === "function") {
    try {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var mqHandler = function () {
        if (!(progress.settings && typeof progress.settings.darkMode === "boolean")) applyTheme();
      };
      if (mq.addEventListener) mq.addEventListener("change", mqHandler);
      else if (mq.addListener) mq.addListener(mqHandler);
    } catch (e) {}
  }

  navigate("home");
})();
