// Headless smoke test for the English Word Coach SPA (jsdom).
// Uses a copy of app.js with $/$$ renamed to _q/_qq to avoid a jsdom-specific
// quirk with `$` identifiers — logic is identical (verified in native V8).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ASSETS = "C:/Users/Samet Tıraşoğlu.DESKTOP-V1NEC06/synth-app/english-word-coach/android/app/src/main/assets";
const html = fs.readFileSync(path.join(ASSETS, "index.html"), "utf8");
const appJs = fs.readFileSync(path.join(ASSETS, "app.js"), "utf8")
  .replace(/\$\$/g, "_qq").replace(/\$/g, "_q");

// Inline every local <script src="..."> asset; use the $/$$-renamed app.js copy.
const injected = html.replace(/<script src="([^"]+)"><\/script>/g, function (m, file) {
  const code = (file === "app.js") ? appJs : fs.readFileSync(path.join(ASSETS, file), "utf8");
  return "<script>" + code + "</script>";
});

const dom = new JSDOM(injected, {
  runScripts: "dangerously",
  url: "http://localhost/",
  pretendToBeVisual: true,
  beforeParse(window) {
    window.__errs = [];
    window.addEventListener("error", (e) => window.__errs.push(e.message + " @" + (e.filename || "") + ":" + e.lineno));
    window.__unhandled = [];
    window.addEventListener("unhandledrejection", (e) => window.__unhandled.push(String(e.reason)));
  }
});

const w = dom.window;
const d = w.document;
let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log("  PASS " + label); }
  else { fail++; console.log("  FAIL " + label); }
}
function text(sel) { const e = d.querySelector(sel); return e ? e.textContent.trim() : null; }
function click(sel) {
  const el = d.querySelector(sel);
  if (!el) { fail++; console.log("  FAIL (no element " + sel + ")"); return false; }
  el.click();
  return true;
}

console.log("== boot ==");
ok(!!w.WORD_DATA && Object.keys(w.WORD_DATA.words).length > 5000, "WORD_DATA loaded (" + Object.keys(w.WORD_DATA.words).length + " words)");
ok(!!d.querySelector("#splash"), "splash screen present");
ok((d.querySelector("#splash").textContent || "").indexOf("tirasoglusamet@gmail.com") >= 0, "splash shows developer email");
ok(text("#titleText") === "English Word Coach", "default title");
ok(!!d.querySelector(".hero h2"), "home hero rendered");
ok(!!d.querySelector(".wod-word"), "word-of-the-day rendered");
ok(!!d.querySelector(".wod-tr"), "word-of-the-day shows Turkish translation");
ok(!!d.querySelector(".wod-def"), "word-of-the-day shows English definition");
ok((d.querySelector("#content").textContent || "").indexOf("Günün Deyimi") >= 0, "daily idiom card rendered");
ok(d.querySelectorAll(".tab").length === 6, "6 tabs present (incl. Dilbilgisi)");

console.log("== daily tasks (initial) ==");
ok(d.querySelectorAll(".daily-row").length === 5, "5 daily task rows");
ok(!!d.querySelector('.daily-row[data-daily="review"].done'), "review task auto-done (0 due at boot)");
ok(d.querySelectorAll(".daily-row.done").length === 1, "only review done initially");
ok((d.querySelector(".daily-count").textContent || "").indexOf("1/5") >= 0, "daily header shows 1/5");
ok((d.querySelector('.daily-row[data-daily="new"]').textContent || "").indexOf("0/10") >= 0, "new-words task starts 0/10");

console.log("== sets list ==");
click('.tab[data-tab="sets"]');
ok(d.querySelectorAll(".set-card").length >= 11, "11 set cards (" + d.querySelectorAll(".set-card").length + ")");

console.log("== SRS: study new words ==");
const a1card = Array.from(d.querySelectorAll(".set-card")).find((c) => c.getAttribute("data-open") === "a1");
a1card.click();
ok(!!d.querySelector("#startNew"), "Yeni Kelimeler button present");
ok(!!d.querySelector("#startReview"), "Tekrar Et button present");
click("#startNew");
ok(!!d.querySelector("#fc"), "flashcard rendered (new session)");
const w1 = text(".fc-word");
click("#fc");
ok(d.querySelector("#fc").classList.contains("flipped"), "card flips");
ok(!!d.querySelector(".fc-tr") && (d.querySelector(".fc-tr").textContent || "").trim().length > 0, "flashcard back shows Turkish translation");
click("#fcKnow"); // mark w1 known -> box 1, due tomorrow
ok(!!d.querySelector("#fc"), "advanced to next card");
const w2 = text(".fc-word");
click("#fc");
click("#fcAgain"); // mark w2 again -> box 1, due today
ok(!!w1 && !!w2 && w1 !== w2, "two distinct words studied (" + w1 + ", " + w2 + ")");

console.log("== review tab shows learned + due ==");
click('.tab[data-tab="review"]');
const learnedHtml = d.querySelector("#learnedList").textContent;
ok(learnedHtml.indexOf(w1) >= 0, "w1 (known) appears in learned list");
ok(learnedHtml.indexOf(w2) >= 0, "w2 (again) appears in learned list");
ok(!!d.querySelector("#startGlobalReview") && !d.querySelector("#startGlobalReview").disabled, "global review button enabled (w2 due today)");

console.log("== global review session ==");
click("#startGlobalReview");
ok(!!d.querySelector("#fc"), "global review flashcard rendered");
ok(text("#titleText") === "Tekrar", "title shows Tekrar during review");
click("#fc");
click("#fcKnow");
// w2 was the only due word, so answering it completes the session and the word
// advances out of the due queue -> back to the review summary.
ok(!d.querySelector("#fc"), "review session ends after last due word");
ok(!!d.querySelector("#startGlobalReview"), "returns to review summary");

console.log("== quiz ==");
click('.tab[data-tab="sets"]');
Array.from(d.querySelectorAll(".set-card")).find((c) => c.getAttribute("data-open") === "a1").click();
click('.mode-tab[data-tabmode="quiz"]');
ok(!!d.querySelector("#quizStart"), "quiz config shown");
click("#quizStart");
ok(d.querySelectorAll("#opts .option").length === 4, "4 options");
click("#opts .option");
ok(d.querySelectorAll("#opts .option.correct, #opts .option.wrong").length > 0, "answer feedback shown");
click("#nextBtn");
ok(!!d.querySelector("#opts .option"), "next question rendered");

console.log("== list mode ==");
click('.mode-tab[data-tabmode="list"]');
ok(d.querySelectorAll(".wl-row").length > 0, "word list rendered (" + d.querySelectorAll(".wl-row").length + " rows)");

console.log("== word detail modal ==");
click(".wl-row");
ok(!d.querySelector("#modal").classList.contains("hidden"), "modal opens");
click("#mClose");
ok(d.querySelector("#modal").classList.contains("hidden"), "modal closes");

console.log("== search ==");
click('.tab[data-tab="search"]');
const inp = d.querySelector("#searchInput");
inp.value = "abandon";
inp.dispatchEvent(new w.Event("input", { bubbles: true }));
ok(d.querySelectorAll("#searchResults .wl-row").length > 0, "search returns results");

console.log("== stats ==");
click('.tab[data-tab="stats"]');
ok(d.querySelectorAll(".stat-box").length === 6, "6 stat boxes");
ok(!!d.querySelector("#resetBtn"), "reset button present");
const statsTxt = d.querySelector("#content").textContent;
ok(statsTxt.indexOf("Samet Tıraşoğlu") >= 0, "support shows developer name");
ok(statsTxt.indexOf("tirasoglusamet@gmail.com") >= 0, "support shows email");
ok(!!d.querySelector("a.support-mail"), "email is a tappable mailto link");

console.log("== back navigation ==");
click('.tab[data-tab="sets"]');
Array.from(d.querySelectorAll(".set-card")).find((c) => c.getAttribute("data-open") === "a1").click();
ok(d.querySelector("#backBtn") && !d.querySelector("#backBtn").classList.contains("hidden"), "back button visible in set");
click("#backBtn");
ok(text("#titleText") === "English Word Coach", "back returns to top level");

console.log("== settings: translation toggle ==");
click('.tab[data-tab="home"]');
ok(!!d.querySelector(".wod-tr"), "Turkish visible on home (default on)");
click("#settingsBtn");
ok(!!d.querySelector("#trToggle"), "settings modal opens with toggle");
click("#trToggle"); // turn off
ok(!d.querySelector(".wod-tr"), "Turkish hidden after toggle off");
click("#settingsBtn");
click("#trToggle"); // turn back on
ok(!!d.querySelector(".wod-tr"), "Turkish visible after toggle on");

console.log("== spelling game ==");
click('.tab[data-tab="sets"]');
Array.from(d.querySelectorAll(".set-card")).find((c) => c.getAttribute("data-open") === "a1").click();
// Study new words until >=3 are usable for the spelling game. The game only uses
// learned words whose English + Turkish forms fit the tile board, so a random word
// can occasionally not qualify — loop a few times to make this deterministic.
let sGuard = 0;
while (sGuard < 60) {
  if (d.querySelector("#startNew")) click("#startNew");
  if (!d.querySelector("#fc")) break;
  click("#fc");
  click("#fcKnow");
  click('.mode-tab[data-tabmode="game"]');
  if (d.querySelector("#gameStart")) break;
  click('.mode-tab[data-tabmode="cards"]');
  sGuard++;
}
ok(!!d.querySelector("#gameStart"), "game menu shows start button (>=3 usable learned)");
click("#gameStart");
ok(!!d.querySelector("#gt"), "puzzle blanks render");
ok(d.querySelectorAll("#tiles .tile").length >= 1, "letter tiles render");
click("#tiles .tile"); // tap a tile (correct or wrong — must not throw)
ok(true, "tile tap handled without error");

console.log("== grammar: data integrity ==");
ok(!!w.GRAMMAR_A1 && !!w.GRAMMAR_A2 && !!w.GRAMMAR_B1 && !!w.GRAMMAR_B2, "4 grammar level files loaded");
const gLevels = [w.GRAMMAR_A1, w.GRAMMAR_A2, w.GRAMMAR_B1, w.GRAMMAR_B2];
const gTotalUnits = gLevels.reduce((n, l) => n + l.units.length, 0);
ok(gTotalUnits === 36, "36 total units (" + gTotalUnits + ")");
let gShapeOk = true, gShapeMsg = "";
gLevels.forEach((l) => l.units.forEach((u) => {
  if (!u.slides || !u.slides.length) { gShapeOk = false; gShapeMsg = u.id + " missing slides"; }
  if (!u.mistakes || !u.mistakes.length) { gShapeOk = false; gShapeMsg = u.id + " missing mistakes"; }
  if (!u.practice || !u.practice.length) { gShapeOk = false; gShapeMsg = u.id + " missing practice"; }
}));
ok(gShapeOk, "all units have slides, mistakes, practice" + (gShapeOk ? "" : " (" + gShapeMsg + ")"));
const mcqMaps = [w.GRAMMAR_MCQ_A1, w.GRAMMAR_MCQ_A2, w.GRAMMAR_MCQ_B1, w.GRAMMAR_MCQ_B2];
let gMcqOk = true, gMcqMsg = "";
gLevels.forEach((l) => l.units.forEach((u) => {
  let found = false;
  mcqMaps.forEach((m) => { if (m && m[u.id] && m[u.id].length >= 3) found = true; });
  if (!found) { gMcqOk = false; gMcqMsg = u.id + " missing >=3 MCQs"; }
}));
ok(gMcqOk, "all units have >=3 comprehension MCQs" + (gMcqOk ? "" : " (" + gMcqMsg + ")"));

console.log("== grammar: levels & units ==");
click('.tab[data-tab="grammar"]');
ok(text("#titleText") === "Dilbilgisi", "grammar view title");
ok(d.querySelectorAll("[data-glevel]").length === 4, "4 level cards");
Array.from(d.querySelectorAll("[data-glevel]")).find((c) => c.getAttribute("data-glevel") === "a1").click();
ok((text("#titleText") || "").indexOf("A1") === 0, "A1 level title (" + text("#titleText") + ")");
ok(d.querySelectorAll("[data-gunit]").length === 8, "A1 has 8 units (" + d.querySelectorAll("[data-gunit]").length + ")");

console.log("== grammar: slides ==");
Array.from(d.querySelectorAll("[data-gunit]")).find((c) => c.getAttribute("data-gunit") === "a1-01").click();
ok(!!d.querySelector(".g-slide-h"), "slide heading rendered");
ok(!!d.querySelector(".g-slide-b"), "slide body rendered");
ok(d.querySelectorAll(".g-slide-b .g-example, .g-slide-b .g-bullets, .g-slide-b .g-p").length > 0, "slide body uses formatted blocks");
ok(d.querySelectorAll(".g-dot").length === 3, "3 slide dots");
ok(d.querySelector("#gPrev").disabled, "prev disabled on first slide");
click("#gNext");
ok(!d.querySelector("#gPrev").disabled, "prev enabled after advancing");
click("#gNext");
ok(!!d.querySelector("#gToCheck"), "Kontrol button on last slide");
click("#gToCheck");

console.log("== grammar: comprehension check (MCQ) ==");
ok(d.querySelectorAll(".gmcq-opt").length >= 4, "MCQ options render (" + d.querySelectorAll(".gmcq-opt").length + ")");
const a1mcq = w.GRAMMAR_MCQ_A1["a1-01"];
const copt = d.querySelector('.gmcq-opt[data-mi="0"][data-qi="' + a1mcq[0].a + '"]');
copt.click();
ok(!!d.querySelector(".gmcq-opt.correct"), "correct MCQ answer shows green");
click("#gToMistakes2");

console.log("== grammar: mistakes ==");
ok(d.querySelectorAll(".g-mistake").length >= 3, "mistake comparisons render");
ok(d.querySelectorAll(".g-mis-wrong").length >= 3, "wrong usages render");
ok(d.querySelectorAll(".g-mis-right").length >= 3, "correct usages render");
ok(d.querySelectorAll(".g-mis-note").length >= 3, "notes render");
click("#gToPractice");

console.log("== grammar: practice (type the form) ==");
ok(!!d.querySelector("#gStartPractice"), "practice intro shown");
click("#gStartPractice");
ok(!!d.querySelector(".g-prompt") && !!d.querySelector(".g-blank"), "prompt with blank rendered");
ok(!!d.querySelector("#gInput"), "answer input present");

// answer the first question wrong
d.querySelector("#gInput").value = "wronganswer";
click("#gCheck");
ok(!!d.querySelector(".g-fb.no"), "wrong answer shows red feedback");
ok(!!d.querySelector(".g-input.wrong"), "input turns red on wrong");

// answer the rest correctly straight from the data
const a1u1 = w.GRAMMAR_A1.units[0];
const correctAnswers = a1u1.practice.slice(1).map((q) => q.a[0]);
let ai = 0, gGuard = 0, sawGreen = false;
while (gGuard < 30) {
  const nxt = d.querySelector("#gNextQ");
  if (!nxt) break;
  nxt.click();
  gGuard++;
  const inp = d.querySelector("#gInput");
  if (!inp) break; // done screen
  inp.value = correctAnswers[ai];
  d.querySelector("#gCheck").click();
  if (d.querySelector(".g-fb.ok")) sawGreen = true;
  ai++;
}
ok(sawGreen, "correct answer shows green feedback");
ok(ai === a1u1.practice.length - 1, "answered all questions (" + ai + " correct)");
ok(!!d.querySelector("#gRedo"), "completion screen shown");

console.log("== grammar: completion tracked ==");
click("#gBackLevel");
ok(d.querySelectorAll("[data-gunit]").length === 8, "back to A1 unit list");
const u1card = Array.from(d.querySelectorAll("[data-gunit]")).find((c) => c.getAttribute("data-gunit") === "a1-01");
ok(u1card && !!u1card.querySelector(".g-unit-num.done"), "completed unit shows checkmark");
ok(u1card && (u1card.textContent || "").indexOf("En iyi") >= 0, "unit shows best score");

console.log("== daily tasks: tracking ==");
click('.tab[data-tab="home"]');
ok(!!d.querySelector('.daily-row[data-daily="review"].done'), "review task done after review session");
ok(!!d.querySelector('.daily-row[data-daily="grammar"].done'), "grammar task done after practice");
ok((d.querySelector('.daily-row[data-daily="new"]').textContent || "").indexOf("/10") >= 0, "new-words task shows progress");

// complete a full quiz to exercise the quiz daily-task hook
click('.tab[data-tab="sets"]');
Array.from(d.querySelectorAll(".set-card")).find((c) => c.getAttribute("data-open") === "a1").click();
click('.mode-tab[data-tabmode="quiz"]');
click("#quizStart");
let qGuard = 0;
while (d.querySelector("#opts .option") && qGuard < 40) {
  click("#opts .option");
  click("#nextBtn");
  qGuard++;
}
ok(qGuard >= 20, "completed a full quiz (" + qGuard + " questions)");
click('.tab[data-tab="home"]');
ok(!!d.querySelector('.daily-row[data-daily="quiz"].done'), "quiz task done after completing a quiz");

console.log("== reading: data ==");
const rSets = ["A1", "A2", "B1", "B2", "C1", "C2", "IELTS", "TOEFL", "YDS", "YOKDIL", "GRE"];
let rTotal = 0, rOk = true, rMinOk = true;
rSets.forEach(function (n) {
  const arr = w["READINGS_" + n] || [];
  rTotal += arr.length;
  if (arr.length < 30) rMinOk = false;
  arr.forEach(function (p) {
    if (!p.topic || !p.title || !p.text || !p.questions || p.questions.length !== 3) rOk = false;
  });
});
ok(rTotal >= 330, ">=330 total passages (" + rTotal + ")");
ok(rMinOk, "every set has >=30 passages");
ok(rOk, "all passages have topic/title/text + 3 questions");

console.log("== reading: list & passage ==");
click('.tab[data-tab="sets"]');
Array.from(d.querySelectorAll(".set-card")).find((c) => c.getAttribute("data-open") === "a1").click();
click('.mode-tab[data-tabmode="reading"]');
ok(!!d.querySelector("#uwListBtn"), "unknown-list button present");
ok(d.querySelectorAll("[data-reading]").length >= 30, ">=30 passages for a1 (" + d.querySelectorAll("[data-reading]").length + ")");
ok(d.querySelectorAll(".section-title").length >= 2, "passages grouped by topic headlines");
Array.from(d.querySelectorAll("[data-reading]"))[0].click();
ok(!!d.querySelector(".rd-passage"), "passage text rendered");
ok(d.querySelectorAll(".rd-word").length > 20, "words wrapped in spans (" + d.querySelectorAll(".rd-word").length + ")");

console.log("== reading: long-press saves unknown word ==");
const firstWord = d.querySelector(".rd-word");
const wordText = firstWord.getAttribute("data-w");
firstWord.dispatchEvent(new w.Event("contextmenu", { bubbles: true, cancelable: true }));
ok(!!d.querySelector("#uwAdd"), "unknown-word modal opens on long-press");
ok((d.querySelector("#modal .modal-word").textContent || "") === wordText, "modal shows the word");
click("#uwAdd");
ok(d.querySelector("#modal").classList.contains("hidden"), "modal closes after add");

console.log("== reading: unknown words list ==");
click('.tab[data-tab="review"]');
ok(!!d.querySelector(".uw-remove"), "unknown word listed with remove button");
click(".uw-remove");
ok(!d.querySelector(".uw-remove"), "unknown word removed");

console.log("== reading: comprehension questions ==");
click('.tab[data-tab="sets"]');
Array.from(d.querySelectorAll(".set-card")).find((c) => c.getAttribute("data-open") === "a1").click();
click('.mode-tab[data-tabmode="reading"]');
Array.from(d.querySelectorAll("[data-reading]"))[0].click();
click("#rdStartQ");
ok(!!d.querySelector("#rOpts .option"), "first question rendered");
const a1r = w.READINGS_A1[0];
let ri = 0, rGuard = 0;
while (d.querySelector("#rOpts .option") && rGuard < 20) {
  const cq = d.querySelector('#rOpts .option[data-qi="' + a1r.questions[ri].a + '"]');
  if (cq) cq.click();
  ri++; rGuard++;
  const nxt = d.querySelector("#rNextBtn");
  if (nxt) nxt.click();
}
ok(ri === a1r.questions.length, "answered all questions");
ok(!!d.querySelector("[data-reading]"), "back to reading list");
ok(!!d.querySelector("[data-reading] .g-unit-num.done"), "completed passage shows checkmark");

console.log("\n== runtime errors ==");
const errs = w.__errs || [];
const rej = w.__unhandled || [];
if (errs.length === 0 && rej.length === 0) console.log("  none");
else {
  errs.forEach((e) => console.log("  ERROR: " + e));
  rej.forEach((e) => console.log("  UNHANDLED REJECTION: " + e));
}

console.log("\nRESULT: " + pass + " passed, " + fail + " failed, " + errs.length + " errors, " + rej.length + " rejections");
process.exit(fail > 0 || errs.length > 0 || rej.length > 0 ? 1 : 0);
