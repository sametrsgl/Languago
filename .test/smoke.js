// Headless smoke test for the English Word Coach SPA (jsdom).
// Uses a copy of app.js with $/$$ renamed to _q/_qq to avoid a jsdom-specific
// quirk with `$` identifiers — logic is identical (verified in native V8).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ASSETS = "C:/Users/Samet Tıraşoğlu.DESKTOP-V1NEC06/synth-app/english-word-coach/android/app/src/main/assets";
const html = fs.readFileSync(path.join(ASSETS, "index.html"), "utf8");
const wordsJs = fs.readFileSync(path.join(ASSETS, "words.js"), "utf8");
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
ok(!!d.querySelector("#splash"), "splash screen present");
ok((d.querySelector("#splash").textContent || "").indexOf("tirasoglusamet@gmail.com") >= 0, "splash shows developer email");
ok(text("#titleText") === "English Word Coach", "default title");
ok(!!d.querySelector(".hero h2"), "home hero rendered");
ok(!!d.querySelector(".wod-word"), "word-of-the-day rendered");
ok(!!d.querySelector(".wod-tr"), "word-of-the-day shows Turkish translation");
ok(!!d.querySelector(".wod-def"), "word-of-the-day shows English definition");
ok(d.querySelectorAll(".tab").length === 5, "5 tabs present (incl. Tekrar)");

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
