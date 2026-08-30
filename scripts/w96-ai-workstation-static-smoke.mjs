import fs from 'node:fs';

const checks = [];
function read(path) { return fs.readFileSync(path, 'utf8'); }
function assert(name, ok, detail = '') { checks.push({ name, ok: Boolean(ok), detail }); }
function hasId(html, id) { return new RegExp(`id=["']${id}["']`).test(html); }

const browserHtml = read('eon-browser.html');
const codeHtml = read('code-maker.html');
const js = read('assets/js/eon-workstation-page.js');
const css = read('assets/css/eon-workstation.css');

for (const id of ['ew-command-deck','ew-command-input','ew-open-command','ew-read-command','ew-external-command','ew-workstation-stage','browser-source','browser-output']) {
  assert(`EON Workstation DOM has #${id}`, hasId(browserHtml, id));
}
for (const id of ['eon-notif-btn','eon-accounts-btn','eon-models-btn','eon-agent-btn']) {
  assert(`legacy service control available behind drawer #${id}`, hasId(browserHtml, id));
}
assert('Code Maker route exists and loads its controller', codeHtml.includes('/assets/js/code-maker-page.js'));
assert('internal Code Maker command resolves to native studio', /if \(app\?\.id === 'code-maker'\) return openCodeMakerNative\(\)/.test(js));
assert('external sites never use the legacy frame', js.includes('showExternalHandoff') && !/showExternalHandoff[\s\S]{0,1600}browser-frame/.test(js));
assert('reader is text-only and has a bounded source length', js.includes('fetchReadableIntoSource') && js.includes('MAX_READER_CHARS'));
assert('drawers proxy model, account, notification and activity services', ['eon-models-btn','eon-accounts-btn','eon-notif-btn','eon-agent-btn'].every((id) => js.includes(id)));
assert('legacy browser chrome is hidden under v3', ['.browser-tab-bar','.browser-nav-bar','.browser-workspace-bar','#browser-frame-host'].every((selector) => css.includes(selector)));
assert('initial HTML omits heavyweight legacy runtime scripts', !browserHtml.includes('src="/assets/js/eon-browser-page.js"') && !browserHtml.includes('src="/assets/js/main.js"'));
assert('runtime module and stylesheet loaders exist', js.includes('ensureRuntimeGroups') && js.includes('ensureRuntimeStyles') && js.includes('RUNTIME_STYLE_GROUPS'));
assert('workstation-specific CSS is present', browserHtml.includes('/assets/css/eon-workstation.css') && fs.existsSync('assets/css/eon-workstation.css'));
assert('responsive command deck protects mobile width', css.includes('.eon-workstation-v3 .ew-command-input') && css.includes('grid-template-columns: 1fr'));
assert('native Code Maker preview and editor selectors exist', ['ew-code-html','ew-code-css','ew-code-js','ew-code-preview'].every((id) => js.includes(id)));
assert('Monaco worker exists for full IDE route', fs.existsSync('monaco-worker.js'));

const failed = checks.filter((check) => !check.ok);
const report = {
  schema: 'eon.w96.ai-workstation.static-smoke.v3',
  ok: failed.length === 0,
  score: Math.round((checks.length - failed.length) / checks.length * 100),
  checks,
  failed
};
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
