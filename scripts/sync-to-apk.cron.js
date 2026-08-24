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

function bumpVersion() {
    const gp = path.join(APK, 'android', 'app', 'build.gradle');
    let gc = fs.readFileSync(gp, 'utf8');
    const vc = parseInt(gc.match(/versionCode\s+(\d+)/)[1]) + 1;
    const vn = gc.match(/versionName\s+"([^"]+)"/)[1];
    const parts = vn.match(/(\d+)\.(\d+)\.(\d+)/);
    const nn = parts ? parts[1] + '.' + parts[2] + '.' + (parseInt(parts[3]) + 1) : '1.0.' + vc;
    gc = gc.replace(/versionCode\s+\d+/, 'versionCode ' + vc);
    gc = gc.replace(/versionName\s+"[^"]*"/, 'versionName "' + nn + '"');
    fs.writeFileSync(gp, gc, 'utf8');
    return { versionCode: vc, versionName: nn };
}

function runTests() {
    return execSync('node smoke.js', { cwd: path.join(APK, '.test'), encoding: 'utf8', timeout: 120000, stdio: 'pipe' });
}

function buildApk() {
    const env = Object.assign({}, process.env, { JAVA_HOME: JDK, ANDROID_HOME: SDK, ANDROID_SDK_ROOT: SDK });
    return execSync('"' + GRADLE + '/bin/gradle" assembleRelease --console=plain', {
        cwd: path.join(APK, 'android'), env: env, encoding: 'utf8', timeout: 300000, stdio: 'pipe'
    });
}

function gitCommitAndTag(tag, message) {
    execSync('git add -A', { cwd: APK, encoding: 'utf8' });
    execSync('git commit -q -m "' + message + '"', { cwd: APK, encoding: 'utf8' });
    execSync('git tag v' + tag, { cwd: APK, encoding: 'utf8' });
    try { execSync('git remote get-url origin', { cwd: APK, encoding: 'utf8' }); }
    catch { execSync('git remote add origin https://github.com/sametrsgl/Languago.git', { cwd: APK, encoding: 'utf8' }); }
    try { execSync('git push --follow-tags', { cwd: APK, encoding: 'utf8' }); }
    catch { execSync('git push --set-upstream origin master --follow-tags', { cwd: APK, encoding: 'utf8' }); }
}

function createGitHubRelease(tag, versionName, apkPath) {
    console.log('  APK size: ' + (fs.statSync(apkPath).size / 1024 / 1024).toFixed(2) + ' MB');
    console.log('  Creating GitHub release via gh CLI...');
    try {
        execSync('gh release create v' + tag + ' "' + apkPath + '" --title "Languago v' + versionName + '" --notes "Auto-synced from site content." --repo sametrsgl/Languago', { encoding: 'utf8', timeout: 120000, stdio: 'pipe' });
        console.log('  GitHub release created: v' + tag);
    } catch {
        try {
            execSync('gh release upload v' + tag + ' "' + apkPath + '" --repo sametrsgl/Languago', { encoding: 'utf8', timeout: 120000, stdio: 'pipe' });
            console.log('  APK uploaded to existing release: v' + tag);
        } catch(e2) {
            console.log('  WARNING: Release failed: ' + e2.message.substring(0, 80));
        }
    }
}

// === Main ===
console.log('=== Site->APK Auto-Sync Check ===');
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

console.log('3. Building APK...');
const version = bumpVersion();
console.log('  versionCode: ' + version.versionCode + '  versionName: ' + version.versionName);
const buildOutput = buildApk();
if (buildOutput.includes('BUILD FAILED')) {
    console.log('BUILD FAILED:\n' + buildOutput); process.exit(1);
}
console.log('  BUILD SUCCESS');

console.log('4. Copying APK...');
const apkOut = path.join(APK, 'Languago-v' + version.versionName + '.apk');
fs.copyFileSync(path.join(APK, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'), apkOut);
console.log('  ' + apkOut + ' (' + (fs.statSync(apkOut).size / 1024).toFixed(1) + ' KB)');

console.log('5. Committing APK repo...');
gitCommitAndTag(version.versionName, 'v' + version.versionName + ' - auto-sync from site');

console.log('6. Creating GitHub release...');
createGitHubRelease(version.versionName, version.versionName, apkOut);

console.log('=== SYNC COMPLETE ===');
console.log('APK: ' + apkOut);
console.log('Release: https://github.com/sametrsgl/Languago/releases/tag/v' + version.versionName);
