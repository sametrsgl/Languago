const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// === Config ===
const HOME = process.env.HOME || 'C:\\Users\\Samet Tıraşoğlu.DESKTOP-V1NEC06';
const SITE = path.join(HOME, 'synth-app', 'languago-platform');
const APK = path.join(HOME, 'synth-app', 'english-word-coach');
const ASSETS = path.join(APK, 'android', 'app', 'src', 'main', 'assets');
const JDK = path.join(HOME, 'synth-app', 'android-tools', 'jdk-17.0.20+8');
const SDK = path.join(HOME, 'synth-app', 'android-tools', 'sdk');
const GRADLE = path.join(HOME, 'synth-app', 'android-tools', 'gradle-8.7');

const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1'];
const READING_SETS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2', 'ielts', 'toefl', 'yds', 'yokdil', 'gre'];

// --- Sync functions ---

function syncGrammar() {
    let changed = false;
    LEVELS.forEach(lvl => {
        const upper = lvl.toUpperCase();
        const siteFile = path.join(SITE, 'src', 'data', 'grammar_' + lvl + '.js');
        const siteMcq = path.join(SITE, 'src', 'data', 'grammar_mcq_' + lvl + '.js');
        const apkFile = path.join(ASSETS, 'grammar_' + lvl + '.js');
        const apkMcq = path.join(ASSETS, 'grammar_mcq_' + lvl + '.js');

        if (!fs.existsSync(siteFile)) return;

        const siteCode = fs.readFileSync(siteFile, 'utf8');
        let grammarObj = loadJsObject(siteCode, 'GRAMMAR_' + upper);
        let mcqObj = null;
        if (fs.existsSync(siteMcq)) {
            const mcqCode = fs.readFileSync(siteMcq, 'utf8');
            mcqObj = loadJsObject(mcqCode, 'GRAMMAR_MCQ_' + upper);
            const mcqOut = 'window.GRAMMAR_MCQ_' + upper + ' = ' + JSON.stringify(mcqObj, null, 2) + ';';
            if (!fs.existsSync(apkMcq) || fs.readFileSync(apkMcq, 'utf8') !== mcqOut) {
                fs.writeFileSync(apkMcq, mcqOut, 'utf8');
                changed = true;
                console.log('  Updated: grammar_mcq_' + lvl + '.js');
            }
        }
        if (grammarObj && grammarObj.units) {
            grammarObj.units.forEach(u => {
                if (!u.mcq || u.mcq.length === 0) {
                    if (mcqObj && mcqObj[u.id]) u.mcq = mcqObj[u.id];
                }
            });
        }
        const out = 'window.GRAMMAR_' + upper + ' = ' + JSON.stringify(grammarObj, null, 2) + ';';
        if (!fs.existsSync(apkFile) || fs.readFileSync(apkFile, 'utf8') !== out) {
            fs.writeFileSync(apkFile, out, 'utf8');
            changed = true;
            console.log('  Updated: grammar_' + lvl + '.js (' + (grammarObj?.units?.length || 0) + ' units)');
        }
    });
    return changed;
}

function syncReadings() {
    let changed = false;
    READING_SETS.forEach(set => {
        const siteFile = path.join(SITE, 'src', 'data', 'readings_' + set + '.js');
        const apkFile = path.join(ASSETS, 'readings_' + set + '.js');
        if (!fs.existsSync(siteFile)) return;
        const obj = loadJsObject(fs.readFileSync(siteFile, 'utf8'), 'READINGS_' + set.toUpperCase());
        const out = 'window.READINGS_' + set.toUpperCase() + ' = ' + JSON.stringify(obj, null, 2) + ';';
        if (!fs.existsSync(apkFile) || fs.readFileSync(apkFile, 'utf8') !== out) {
            fs.writeFileSync(apkFile, out, 'utf8');
            changed = true;
            console.log('  Updated: readings_' + set + '.js (' + (obj?.length || 0) + ' passages)');
        }
    });
    return changed;
}

function loadJsObject(code, varName) {
    let clean = code.replace(/^export\s+const\s+/gm, 'const ').replace(/\s*;\s*$/, '').trim();
    try { return eval(clean); } catch(e) {
        const match = clean.match(new RegExp(varName + '\\s*=\\s*'));
        if (match) {
            const idx = match.index + match[0].length;
            return eval('(' + clean.substring(idx) + ')');
        }
    }
}

function syncWords() {
    const siteFile = path.join(SITE, 'src', 'data', 'words.js');
    const apkFile = path.join(ASSETS, 'words.js');
    if (!fs.existsSync(siteFile)) return false;
    const obj = loadJsObject(fs.readFileSync(siteFile, 'utf8'), 'WORD_DATA');
    const out = 'window.WORD_DATA = ' + JSON.stringify(obj, null, 2) + ';';
    if (!fs.existsSync(apkFile) || fs.readFileSync(apkFile, 'utf8') !== out) {
        fs.writeFileSync(apkFile, out, 'utf8');
        console.log('  Updated: words.js');
        return true;
    }
    return false;
}

function syncIndexHtml() {
    // Sync index.html from site to APK (minus Baamboozle references)
    const siteIndex = path.join(SITE, 'public', 'index.html');
    const apkIndex = path.join(ASSETS, 'index.html');
    if (fs.existsSync(siteIndex)) {
        let html = fs.readFileSync(siteIndex, 'utf8');
        html = html.replace(/Baamboozle[^<]*/gi, 'takım temelli');
        if (!fs.existsSync(apkIndex) || fs.readFileSync(apkIndex, 'utf8') !== html) {
            fs.writeFileSync(apkIndex, html, 'utf8');
            console.log('  Updated: index.html');
            return true;
        }
    }
    return false;
}

function getCurrentVersion() {
    const gp = path.join(APK, 'android', 'app', 'build.gradle');
    const gc = fs.readFileSync(gp, 'utf8');
    const vc = parseInt(gc.match(/versionCode\s+(\d+)/)[1]);
    const vn = gc.match(/versionName\s+"([^"]+)"/)[1];
    return { versionCode: vc, versionName: vn };
}

function bumpVersion() {
    const gp = path.join(APK, 'android', 'app', 'build.gradle');
    let gc = fs.readFileSync(gp, 'utf8');
    const vc = parseInt(gc.match(/versionCode\s+(\d+)/)[1]);
    const vn = gc.match(/versionName\s+"([^"]+)"/)[1];
    const parts = vn.match(/(\d+)\.(\d+)\.(\d+)/);
    let nv = vc + 1, nn;
    if (parts) nn = parts[1] + '.' + parts[2] + '.' + (parseInt(parts[3]) + 1);
    else nn = '1.0.' + nv;
    gc = gc.replace(/versionCode\s+\d+/, 'versionCode ' + nv);
    gc = gc.replace(/versionName\s+"[^"]*"/, 'versionName "' + nn + '"');
    fs.writeFileSync(gp, gc, 'utf8');
    return { versionCode: nv, versionName: nn };
}

function runTests() {
    return execSync('node smoke.js', {
        cwd: path.join(APK, '.test'),
        encoding: 'utf8', timeout: 120000, stdio: 'pipe'
    });
}

function buildApk() {
    const env = Object.assign({}, process.env, {
        JAVA_HOME: JDK, ANDROID_HOME: SDK, ANDROID_SDK_ROOT: SDK
    });
    return execSync('"' + GRADLE + '/bin/gradle" assembleRelease --console=plain', {
        cwd: path.join(APK, 'android'), env: env,
        encoding: 'utf8', timeout: 300000, stdio: 'pipe'
    });
}

function gitOps(tag, message) {
    execSync('git add -A', { cwd: APK, encoding: 'utf8' });
    execSync('git commit -q -m "' + message + '"', { cwd: APK, encoding: 'utf8' });
    execSync('git tag v' + tag, { cwd: APK, encoding: 'utf8' });
    execSync('git push --follow-tags', { cwd: APK, encoding: 'utf8' });
}

// === Main ===
console.log('=== Languago Site→APK Sync Pipeline ===\n');

try {
    console.log('1. Syncing site data → APK assets...');
    const gChanged = syncGrammar();
    const rChanged = syncReadings();
    const wChanged = syncWords();
    const iChanged = syncIndexHtml();
    const dataChanged = gChanged || rChanged || wChanged || iChanged;
    console.log(dataChanged ? '  Data changed!' : '  No data changes detected.');

    console.log('\n2. Running smoke tests...');
    const testResult = runTests().stdout;
    const passMatch = testResult.match(/RESULT: (\d+) passed, (\d+) failed/);
    if (!passMatch || parseInt(passMatch[2]) > 0) {
        console.log('TEST FAILURE:\n' + testResult);
        process.exit(1);
    }
    console.log('  ' + passMatch[0]);

    console.log('\n3. Building APK...');
    const version = bumpVersion();
    console.log('  v' + version.versionCode + ' = ' + version.versionName);
    const buildResult = buildApk().stdout;
    if (buildResult.includes('BUILD FAILED')) {
        console.log('BUILD FAILED:\n' + buildResult);
        process.exit(1);
    }
    console.log('  BUILD SUCCESS');

    console.log('\n4. Copying APK...');
    const apkOut = path.join(APK, 'Languago-v' + version.versionName + '.apk');
    fs.copyFileSync(path.join(APK, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'), apkOut);
    console.log('  ' + apkOut + ' (' + (fs.statSync(apkOut).size / 1024).toFixed(1) + ' KB)');

    console.log('\n5. Git commit + tag + push...');
    gitOps(version.versionName, 'v' + version.versionName + ' — auto-sync from site');

    console.log('\n=== SYNC COMPLETE ===');
    console.log('APK: ' + apkOut);
} catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
}
