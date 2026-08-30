#!/usr/bin/env node
/** W259 — opt-in local City Preview evidence gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const REQUIRE_DIST = process.argv.includes('--require-dist');
const errors = [];
const assert = (value, message) => { if (!value) errors.push(message); };
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const walk = (directory) => {
  if (!fs.existsSync(directory)) return [];
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const next = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...walk(next));
    else result.push(next);
  }
  return result;
};

const evidence = read('assets/js/city/city-preview-evidence.js');
const station = read('assets/js/eon-city-play-station.js');
const css = read('assets/css/eon-city-play.css');
const page = read('eoncity-play.html');
const imports = auditActiveSurfaceImports({ root: ROOT });

assert(/new URLSearchParams\(search\)\.get\('preview'\) === '1'/.test(evidence), 'W259 must require the exact ?preview=1 opt-in.');
assert(/CITY_PREVIEW_TASKS/.test(evidence) && /CITY_PREVIEW_EVENTS/.test(evidence), 'W259 needs finite task and event vocabularies.');
assert(/localOnly: true/.test(evidence) && /remoteTelemetry: false/.test(evidence), 'W259 evidence must be explicitly local-only.');
assert(/slice\(0, 6\)/.test(evidence), 'W259 must bound locally retained preview sessions.');
assert(/downloadCityPreviewEvidence/.test(evidence) && /createObjectURL/.test(evidence), 'W259 export must be user-tapped local file generation only.');
assert(!/navigator\.userAgent|navigator\.platform|screen\.colorDepth|clipboard|geolocation/i.test(evidence), 'W259 must not fingerprint, read clipboard, or capture location.');
assert(!/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(/.test(`${evidence}\n${station}`), 'W259 must not introduce remote transport.');
assert(!/eth_(?:sendTransaction|sign|requestAccounts)|wallet_(?:request|switch)/i.test(`${evidence}\n${station}`), 'W259 must not introduce wallet or transaction behavior.');
assert(/isCityPreviewEvidenceMode/.test(station) && /data-eon-play-preview-panel/.test(station), 'W259 drawer must exist only in City Play.');
assert(/previewController = createPreviewEvidenceController/.test(station), 'W259 controller must be initialized after runtime mount.');
assert(/let previewController = Object\.freeze/.test(station), 'W259 callbacks need an inert controller before renderer mount.');
assert(/eon-play-preview-panel/.test(css) && /eon-play-preview-tasks/.test(css), 'W259 preview panel needs authored responsive styles.');
assert(/name="robots" content="noindex, nofollow"/.test(page), 'W259 must retain the noindex City Play preview route.');
assert(imports.ok, `Active graph crosses a fenced boundary: ${[...imports.legacyPrefixHits, ...imports.legacyValueHits, ...imports.forbiddenLiteralHits, ...imports.evmAddressLiteralHits].join(', ')}`);

const output = { previewMarkerChunks: [], normalRouteHtmlHits: [] };
if (REQUIRE_DIST) {
  assert(fs.existsSync(DIST), 'dist/ is missing; run npm run build before W259 output proof.');
  const primaryHtml = ['index.html', 'chat/index.html', 'projects/index.html', 'workspace/index.html', 'eoncity/index.html', 'eoncity/3d/index.html'];
  for (const relative of primaryHtml) {
    const absolute = path.join(DIST, relative);
    if (!fs.existsSync(absolute)) continue;
    const text = fs.readFileSync(absolute, 'utf8');
    if (/preview=1|local preview evidence|city-preview-evidence/i.test(text)) output.normalRouteHtmlHits.push(relative);
  }
  assert(output.normalRouteHtmlHits.length === 0, `W259 preview tooling leaked into normal route HTML: ${output.normalRouteHtmlHits.join(', ')}`);
  const builtPlay = path.join(DIST, 'eoncity', 'play', 'index.html');
  assert(fs.existsSync(builtPlay), 'Built /eoncity/play route is missing.');
  const assetFiles = walk(path.join(DIST, 'assets')).filter((file) => /\.js$/i.test(file));
  output.previewMarkerChunks = assetFiles.filter((file) => fs.readFileSync(file, 'utf8').includes('eon.city.preview-evidence.w259.v1')).map((file) => path.relative(DIST, file));
  assert(output.previewMarkerChunks.length >= 1, 'Built output is missing the W259 preview evidence marker.');
  assert(output.previewMarkerChunks.length <= 2, `W259 preview evidence fragmented into too many chunks: ${output.previewMarkerChunks.join(', ')}`);
}

const report = {
  schema: 'eonapp.w259.city-preview-evidence-gate.v1',
  ok: errors.length === 0,
  generatedAt: new Date().toISOString(),
  requireDist: REQUIRE_DIST,
  activeSurface: { routeEntryCount: imports.routeEntryCount, moduleCount: imports.moduleCount },
  output,
  limitations: [
    'This is a local evidence kit, not Android, iPhone, desktop, installed-PWA, thermal, accessibility, screenshot/video or human acceptance proof.',
    'W259 remains externally blocked until a tester performs the finite task matrix and exports/redacts evidence deliberately.',
    'No telemetry, account data, Chat/Vault content, wallet, provider, chain, signing, transaction, reward, loot, referral or commercial runtime is activated.'
  ],
  errors
};
fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts', 'W259_CITY_PREVIEW_EVIDENCE_REPORT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(`W259 City Preview evidence gate: PASS (${REQUIRE_DIST ? `${output.previewMarkerChunks.length} emitted marker chunk(s)` : 'source boundary'}).`);
}
