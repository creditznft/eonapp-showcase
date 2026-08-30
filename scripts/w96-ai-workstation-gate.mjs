import fs from 'node:fs';
import childProcess from 'node:child_process';

function read(path) { return fs.readFileSync(path, 'utf8'); }
function assert(name, ok, detail = '') { checks.push({ name, ok: Boolean(ok), detail }); }
function nodeCheck(path) {
  try { childProcess.execFileSync(process.execPath, ['--check', path], { stdio: 'pipe' }); return true; }
  catch { return false; }
}

const checks = [];
const browserHtml = read('eon-browser.html');
const workstationJs = read('assets/js/eon-workstation-page.js');
const browserCss = read('assets/css/eon-browser.css');
const workstationCss = read('assets/css/eon-workstation.css');
const codeMakerHtml = read('code-maker.html');
const codeMakerJs = read('assets/js/code-maker-page.js');
const codeMakerCss = read('assets/css/code-maker.css');
const browserSpec = read('tests/e2e/w96-ai-workstation.spec.ts');

assert('browser title reframed as EON Workstation', /<title>EON Workstation \| EONAPP\.ch<\/title>/.test(browserHtml));
assert('browser loads W96 workstation module', browserHtml.includes('/assets/js/eon-workstation-page.js'));
assert('heavy legacy modules are not loaded on initial paint', !browserHtml.includes('src="/assets/js/eon-browser-page.js"') && !browserHtml.includes('src="/assets/js/main.js"') && workstationJs.includes('ensureRuntimeGroups'));
assert('critical workstation CSS is isolated from legacy browser CSS', browserHtml.includes('/assets/css/eon-workstation.css') && !browserHtml.includes('rel="stylesheet" href="/assets/css/eon-browser.css"') && workstationCss.includes('EON Workstation v3 critical'));
assert('static command deck is present before JavaScript boot', browserHtml.includes('id="ew-command-deck"') && browserHtml.includes('id="ew-workstation-stage"'));
assert('contextual feature gate is disabled for flagship route', browserHtml.includes('data-disable-contextual-feature-gates="1"'));
assert('browser footer mojibake removed', !/[Â]|âš¡/.test(browserHtml));
assert('workstation v3 controller exported', workstationJs.includes("version: '3.0.0'") && workstationJs.includes('window.EONWorkstation'));
assert('legacy iframe and new-tab surfaces are explicitly hidden', workstationJs.includes('hideLegacyViewport') && workstationCss.includes('#eon-newtab-page') && workstationCss.includes('#browser-frame-host'));
assert('integrity observer cannot self-loop on attributes', workstationJs.includes("observer.observe(target, { childList: true, subtree: false });") && !workstationJs.includes('subtree: false, attributes: true'));
assert('native Code Maker has three editors and sandbox preview', ['ew-code-html','ew-code-css','ew-code-js','ew-code-preview'].every((id) => workstationJs.includes(id)) && workstationJs.includes('sandbox="allow-scripts"'));
assert('native Code Maker supports run, autosave, reset, copy and download', ['ew-code-run','ew-code-reset','ew-code-copy','ew-code-download'].every((id) => workstationJs.includes(id)) && workstationJs.includes('CODE_STORAGE_KEY'));
assert('external navigation uses a real-tab handoff', workstationJs.includes('showExternalHandoff') && workstationJs.includes('Open external tab') && workstationJs.includes('Read with EON source reader'));
assert('unsafe URL protocols are rejected', workstationJs.includes('javascript|data|vbscript|file'));
assert('drawers are accessible modal dialogs', workstationJs.includes("setAttribute('role', 'dialog')") && workstationJs.includes("setAttribute('aria-modal', 'true')") && workstationJs.includes('lastFocusedElement'));
assert('mobile Workstation removes duplicate top navigation', workstationCss.includes('.eon-workstation-v3 .site-header .nav') && workstationCss.includes('display: none !important'));
assert('command label cannot consume a grid cell', workstationCss.includes('.ew-command-row > .sr-only') && workstationCss.includes('clip: rect(0, 0, 0, 0)'));
assert('desktop and mobile overflow protection exists', workstationCss.includes('@media (max-width: 1180px)') && workstationCss.includes('@media (max-width: 620px)') && workstationCss.includes('min-width: 0'));
assert('browser interaction spec covers Code Maker, external handoff, drawers and mobile', ['Verified Code Maker','google.com','aria-modal','mobile viewport'].every((token) => browserSpec.includes(token)));
assert('browser interaction spec verifies lazy services, accounts and activity panels', ['lazy-loads model services','Open connected accounts','Open activity monitor'].every((token) => browserSpec.includes(token)));
assert('runtime services are loaded on demand and legacy controls have direct fallbacks', workstationJs.includes('RUNTIME_MODULE_GROUPS') && workstationJs.includes('activateLegacyControl') && workstationJs.includes('ew-legacy-ready'));
assert('workstation JavaScript syntax clean', nodeCheck('assets/js/eon-workstation-page.js'));
assert('Code Maker fallback editor remains available', codeMakerJs.includes('initFallbackEditor') && codeMakerJs.includes('Monaco CDN timed out or was blocked'));
assert('Code Maker JavaScript syntax clean', nodeCheck('assets/js/code-maker-page.js'));
assert('Code Maker HTML mojibake removed and feature gate disabled', !/[Â]|âš¡/.test(codeMakerHtml) && codeMakerHtml.includes('data-disable-contextual-feature-gates="1"'));
assert('fallback editor CSS included', codeMakerCss.includes('.cm-fallback-editor'));
assert('self-hosted Monaco worker bootstrap included', fs.existsSync('monaco-worker.js') && read('monaco-worker.js').includes('MonacoEnvironment'));

const failed = checks.filter((item) => !item.ok);
const report = {
  schema: 'eon.w96.ai-workstation-gate.v3',
  ok: failed.length === 0,
  score: Math.round((checks.length - failed.length) / checks.length * 100),
  checks,
  failed: failed.map((item) => item.name)
};
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
