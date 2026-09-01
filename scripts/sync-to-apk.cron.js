const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HOME = 'C:\\Users\\Samet Tıraşoğlu.DESKTOP-V1NEC06';
const SITE = path.join(HOME, 'synth-app', 'languago-platform');
const APK = path.join(HOME, 'synth-app', 'english-word-coach');
const ASSETS = path.join(APK, 'android', 'app', 'src', 'main', 'assets');
const JDK = path.join(HOME, 'synth-app', 'android-tools', 'jdk-17.0.20+8');
const SDK = path.join(HOME, 'synth-app', 'android-tools', 'sdk');
const GRADLE = path.join(HOME, 'synth-app', 'android-tools', 'gradle-8.7');
const LAST_SYNC_FILE = path.join(APK, '.cron', 'last_site_sync.txt');

const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1'];
const READING_SETS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2', 'ielts', 'toefl', 'yds', 'yokdil', 'gre'];

function loadJsObject(code, varName) {
    const clean = code.replace(/^export\s+const\s+/gm, 'const ').replace(/\s*;\s*$/, '').trim();
    const match = clean.match(new RegExp(varName + '\\s*=\\s*'));
    if (match) {
        return eval('(' + clean.substring(match.index + match[0].length) + ')');
    }
    return null;
}

function hasSiteChanged() {
    const lastCommit = execSync('git log -1 --format=%H -- src/data/', { cwd: SITE, encoding: 'utf8' }).trim();
    const lastSync = fs.existsSync(LAST_SYNC_FILE) ? fs.readFileSync(LAST_SYNC_FILE, 'utf8').trim() : '';
    if (lastCommit === lastSync) { console.log('[SILENT]'); return false; }
    const label = lastSync ? lastSync.substring(0, 7) : 'never';
    console.log('Site data changed: ' + label + ' -> ' + lastCommit.substring(0, 7));
    fs.mkdirSync(path.dirname(LAST_SYNC_FILE), { recursive: true });
    fs.writeFileSync(LAST_SYNC_FILE, lastCommit, 'utf8');
    return true;
}

function syncGrammar() {
    LEVELS.forEach(lvl => {
        const upper = lvl.toUpperCase();
        const siteFile = path.join(SITE, 'src', 'data', 'grammar_' + lvl + '.js');
        if (!fs.existsSync(siteFile)) return;
        let grammarObj = loadJsObject(fs.readFileSync(siteFile, 'utf8'), 'GRAMMAR_' + upper);
        let mcqObj = null;
        const siteMcq = path.join(SITE, 'src', 'data', 'grammar_mcq_' + lvl + '.js');
        if (fs.existsSync(siteMcq)) {
            mcqObj = loadJsObject(fs.readFileSync(siteMcq, 'utf8'), 'GRAMMAR_MCQ_' + upper);
            const mcqOut = 'window.GRAMMAR_MCQ_' + upper + ' = ' + JSON.stringify(mcqObj, null, 2) + ';';
            const apkMcq = path.join(ASSETS, 'grammar_mcq_' + lvl + '.js');
            if (!fs.existsSync(apkMcq) || fs.readFileSync(apkMcq, 'utf8') !== mcqOut) {
                fs.writeFileSync(apkMcq, mcqOut, 'utf8');
                console.log('  Updated: grammar_mcq_' + lvl + '.js');
            }
        }
        if (grammarObj && grammarObj.units && mcqObj) {
            grammarObj.units.forEach(u => {
                if ((!u.mcq || u.mcq.length === 0) && mcqObj[u.id]) u.mcq = mcqObj[u.id];
            });
        }
        const out = 'window.GRAMMAR_' + upper + ' = ' + JSON.stringify(grammarObj, null, 2) + ';';
        const apkFile = path.join(ASSETS, 'grammar_' + lvl + '.js');
        if (!fs.existsSync(apkFile) || fs.readFileSync(apkFile, 'utf8') !== out) {
            fs.writeFileSync(apkFile, out, 'utf8');
            console.log('  Updated: grammar_' + lvl + '.js (' + (grammarObj?.units?.length || 0) + ' units)');
        }
    });
}

function syncReadings() {
    READING_SETS.forEach(set => {
        const siteFile = path.join(SITE, 'src', 'data', 'readings_' + set + '.js');
        const apkFile = path.join(ASSETS, 'readings_' + set + '.js');
        if (!fs.existsSync(siteFile)) return;
        const obj = loadJsObject(fs.readFileSync(siteFile, 'utf8'), 'READINGS_' + set.toUpperCase());
        const out = 'window.READINGS_' + set.toUpperCase() + ' = ' + JSON.stringify(obj, null, 2) + ';';
        if (!fs.existsSync(apkFile) || fs.readFileSync(apkFile, 'utf8') !== out) {
            fs.writeFileSync(apkFile, out, 'utf8');
            console.log('  Updated: readings_' + set + '.js');
        }
    });
}

function syncWords() {
    const siteFile = path.join(SITE, 'src', 'data', 'words.js');
    const apkFile = path.join(ASSETS, 'words.js');
    if (!fs.existsSync(siteFile)) return;
    const obj = loadJsObject(fs.readFileSync(siteFile, 'utf8'), 'WORD_DATA');
    const out = 'window.WORD_DATA = ' + JSON.stringify(obj, null, 2) + ';';
    if (!fs.existsSync(apkFile) || fs.readFileSync(apkFile, 'utf8') !== out) {
        fs.writeFileSync(apkFile, out, 'utf8');
        console.log('  Updated: words.js');
    }
}

function syncAppConfig() {
    const indexPath = path.join(ASSETS, 'index.html');
    if (!fs.existsSync(indexPath)) return;
    let html = fs.readFileSync(indexPath, 'utf8');
    let changed = false;
    if (!html.includes('grammar_c1.js')) {
        html = html.replace('<script src="grammar_b2.js"></script>', '<script src="grammar_b2.js"></script>\n  <script src="grammar_c1.js"></script>');
        html = html.replace('<script src="grammar_mcq_b2.js"></script>', '<script src="grammar_mcq_b2.js"></script>\n  <script src="grammar_mcq_c1.js"></script>');
        fs.writeFileSync(indexPath, html, 'utf8');
        console.log('  Updated: index.html (added C1 scripts)');
    }
}

function runTests() {
    return execSync('node smoke.js', { cwd: path.join(APK, '.test'), encoding: 'utf8', timeout: 120000, stdio: 'pipe' });
}

// === Main ===
console.log('=== Site->APK Monitor (NOTIFICATION ONLY) ===');
if (!hasSiteChanged()) process.exit(0);

console.log('1. Syncing site data -> APK assets...');
syncGrammar();
syncReadings();
syncWords();
syncAppConfig();

console.log('2. Running smoke tests...');
const testOutput = runTests();
const passMatch = testOutput.match(/RESULT: (\d+) passed, (\d+) failed/);
if (!passMatch || parseInt(passMatch[2]) > 0) {
    console.log('TEST FAILURE:\n' + testOutput); process.exit(1);
}
console.log('  ' + passMatch[0]);

console.log('3. APK NOT auto-built — site data synced and verified.');
console.log('   Run sync-to-apk.cron.sh --build to build APK manually when ready.');
console.log('=== SYNC CHECK COMPLETE (no APK build) ===');
