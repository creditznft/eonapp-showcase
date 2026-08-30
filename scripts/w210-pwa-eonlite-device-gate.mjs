#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const mustExist = [
  'assets/js/local-ai/local-runtime-status.js',
  'assets/js/local-ai/local-ai-page.js',
  'assets/css/local-ai.css',
  'local-ai.html',
  'assets/js/device/eon-device-check.js',
  'assets/js/eon-pwa-manager.js',
  'tests/unit/w210-pwa-eonlite-device-readiness.test.mjs'
];
const missing = mustExist.filter((file) => !fs.existsSync(path.join(root, file)));
const localPage = read('assets/js/local-ai/local-ai-page.js');
const runtime = read('assets/js/local-ai/local-runtime-status.js');
const localHtml = read('local-ai.html');
const device = read('assets/js/device/eon-device-check.js');
const pwa = read('assets/js/eon-pwa-manager.js');
const sw = read('sw.js');
const precache = sw.match(/PRECACHE\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\);/)?.[1] || '';
const failures = [];
if (missing.length) failures.push(`missing: ${missing.join(', ')}`);
for (const [name, source, pattern] of [
  ['neutral local runtime schema', runtime, /eon\.local-ai\.runtime-status\.v1/],
  ['local-only self-test', runtime, /runLocalRuntimeSelfTest/],
  ['no background process truth', runtime, /never stores credentials,[\s\S]*?runs a background process/],
  ['runtime selection after self-test', localPage, /Run and pass the self-test before selecting a local runtime/],
  ['canonical local AI page', localHtml, /assets\/js\/local-ai\/local-ai-page\.js/],
  ['mobile browser truth', device, /does not install a native local model runtime/],
  ['PWA launch marker', pwa, /recordEonPwaLaunch/],
  ['device-ready W275 service worker', sw, /Service Worker v\d+[\s\S]*explicit-update bounded cache policy/i],
  ['release-scoped City runtime cache guard', sw, /CITY_RUNTIME_RELEASE_CACHE_PREFIXES/]
]) if (!pattern.test(source)) failures.push(`${name} missing`);
for (const forbidden of ['eon-lite/eon-lite-page.js', 'eon-lite/eon-lite-runtime.js', 'eon-lite/eon-lite-registry.js']) {
  if (sw.includes(forbidden)) failures.push(`service worker still precaches retired runtime: ${forbidden}`);
}
for (const forbidden of ['/assets/js/', '/assets/css/']) {
  if (precache.includes(forbidden)) failures.push(`service worker still precaches unhashed source path: ${forbidden}`);
}
const result = {
  ok: failures.length === 0,
  failures,
  checked: 'W210 Local AI, PWA, and device readiness source gate',
  externalProofStillRequired: ['physical Android/iPhone/desktop runs', 'Cloudflare Preview PWA install/update', 'real local runtime self-test with a user-installed runtime']
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
