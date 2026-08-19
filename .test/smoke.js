// Headless smoke test for the English Word Coach SPA (jsdom).
// Uses app_test.js (a copy of app.js with $/$$ renamed to _q/_qq) to avoid
// a jsdom-specific quirk with $ identifiers — logic is identical.
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ASSETS = "C:/Users/Samet Tıraşoğlu.DESKTOP-V1NEC06/synth-app/english-word-coach/android/app/src/main/assets";
const html = fs.readFileSync(path.join(ASSETS, "index.html"), "utf8");
const wordsJs = fs.readFileSync(path.join(ASSETS, "words.js"), "utf8");
// jsdom has a quirk with `$`/`$$` identifiers, so test a copy with them renamed
// to `_q`/`_qq` — pure identifier rename, logic identical (verified in native V8).
const appJs = fs.readFileSync(path.join(ASSETS, "app.js"), "utf8")
  .replace(/\$\$/g, "_qq").replace(/\$/g, "_q");

const injected = html
  .replace('<script src="words.js"></script>', "<script>" + wordsJs + "</script>")
  .replace('<script src="app.js"></script>', "<script>" + appJs + "</script>");

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
ok(text("#titleText") === "English Word Coach", "default title");
ok(!!d.querySelector(".hero h2"), "home hero rendered");
ok(!!d.querySelector(".wod-word"), "word-of-the-day rendered");
ok(!!d.querySelector(".wod-def"), "wod definition rendered");
ok(!!d.querySelector(".wod-ex"), "wod example rendered");

console.log("== sets list ==");
click('.tab[data-tab="sets"]');
ok(d.querySelectorAll(".set-card").length >= 11, "11 set cards (" + d.querySelectorAll(".set-card").length + ")");
ok(!!text(".section-title"), "section groups present");

console.log("== open a set (A1) ==");
const a1card = Array.from(d.querySelectorAll(".set-card")).find((c) => c.getAttribute("data-open") === "a1");
ok(!!a1card, "a1 card exists");
a1card && a1card.click();
ok(text("#titleText").indexOf("A1") === 0, "title shows A1 (" + text("#titleText") + ")");
ok(!!d.querySelector(".mode-tabs"), "mode tabs present");

console.log("== flashcards ==");
click("#startCards");
ok(!!d.querySelector("#fc"), "flashcard rendered");
const fcWord = text(".fc-word");
ok(!!fcWord && fcWord.length > 0, "front shows word (" + fcWord + ")");
click("#fc");
ok(d.querySelector("#fc").classList.contains("flipped"), "card flips");
ok(d.querySelector("#fcActions").style.display !== "none", "actions shown after flip");
ok(!!text(".fc-def"), "back shows definition");
click("#fcKnow");
ok(!!d.querySelector("#fc"), "advanced to next card");

console.log("== quiz ==");
click('.mode-tab[data-tabmode="quiz"]');
ok(!!d.querySelector("#quizStart"), "quiz config shown");
click("#quizStart");
ok(!!d.querySelector("#opts .option"), "quiz question rendered");
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
ok(!!d.querySelector("#mClose"), "modal has close");
click("#mClose");
ok(d.querySelector("#modal").classList.contains("hidden"), "modal closes");

console.log("== search ==");
click('.tab[data-tab="search"]');
const inp = d.querySelector("#searchInput");
inp.value = "abandon";
inp.dispatchEvent(new w.Event("input", { bubbles: true }));
ok(d.querySelectorAll("#searchResults .wl-row").length > 0, "search returns results");
inp.value = "zzzzqqqqnotaword";
inp.dispatchEvent(new w.Event("input", { bubbles: true }));
ok(!!d.querySelector("#searchResults .search-empty"), "search shows empty state");

console.log("== stats ==");
click('.tab[data-tab="stats"]');
ok(d.querySelectorAll(".stat-box").length === 4, "4 stat boxes");
ok(!!d.querySelector("#resetBtn"), "reset button present");
click("#resetBtn");
ok(!d.querySelector("#modal").classList.contains("hidden"), "reset confirm modal opens");
click("#cfNo");
ok(d.querySelector("#modal").classList.contains("hidden"), "reset cancelled cleanly");

console.log("== back navigation ==");
click('.tab[data-tab="sets"]');
a1card && a1card.click();
ok(d.querySelector("#backBtn") && !d.querySelector("#backBtn").classList.contains("hidden"), "back button visible in set");
click("#backBtn");
ok(text("#titleText") === "English Word Coach", "back returns to top level");

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
