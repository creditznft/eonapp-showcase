#!/usr/bin/env node
/**
 * W249 — Babylon City Play technical proof gate.
 *
 * Proves the deliberately narrow renderer boundary for direct EON City entry
 * and its manual Play compatibility route. This is not a gameplay, art-final,
 * wallet, commercial, or release-certification gate.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRIMARY_APP_ROUTES } from '../config/route-contract.mjs';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const REQUIRE_DIST = process.argv.includes('--require-dist');
const BABYLON_PROOF_MAX_BYTES = 1_500_000;
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const walk = (directory) => {
  if (!fs.existsSync(directory)) return [];
  const output = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const next = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...walk(next));
    else output.push(next);
  }
  return output;
};

const playRoute = PRIMARY_APP_ROUTES.find((route) => route.from === '/eoncity/play');
assert(playRoute?.file === 'eoncity-play.html', 'Route contract must own /eoncity/play -> eoncity-play.html.');
assert(playRoute?.lifecycle === 'immersive-work-mode', 'Immersive Work Mode must remain explicitly marked in the route contract.');

const page = read('eoncity-play.html');
const directCityPage = read('eoncity.html');
const station = read('assets/js/eon-city-play-station.js');
const scene = read('assets/js/city/eon-city-play-babylon.js');
const css = read('assets/css/eon-city-play.css');
const cityLiteRuntime = read('assets/js/eon-operator-map.js');
const visualTour = read('eoncity-3d.html');
const imports = auditActiveSurfaceImports({ root: ROOT });

assert(/data-eon-city-play-root/.test(page), 'City Play compatibility page needs its isolated root.');
assert(/eon-city-play-station\.js/.test(page), 'City Play compatibility page must mount the dedicated station.');
assert(/data-eon-city-direct-entry/.test(directCityPage) && /eon-city-play-station\.js/.test(directCityPage), 'Canonical EON City must mount the direct local Babylon entry.');
assert(!/<script[^>]+eon-city-portal\.js/.test(directCityPage), 'Canonical EON City must not mount the retired portal runtime.');
assert(!/data-eon-app-shell|eon-app-shell\.js/.test(page), 'City Play must not load the normal application shell.');
assert(/name="robots" content="noindex, nofollow"/.test(page), 'W249 proof route must not be indexed as a finished game surface.');
assert(/import\('\.\/city\/eon-city-play-babylon\.js'\)/.test(station), 'Babylon scene must remain dynamically loaded from the City station.');
assert(!/from\s+['"]@babylonjs\//.test(station), 'City Play station must not eagerly import Babylon.');
assert(/from\s+['"]@babylonjs\/core\//.test(scene), 'Babylon proof scene must use scoped Babylon modules.');
assert(/requestFullscreen/.test(station) && /requestFullscreen: false/.test(station) && /data-eon-play-enter-fullscreen/.test(station), 'Direct City must leave fullscreen behind a visible in-world user action.');
assert(/orientation\?\.lock\?\.\('landscape'\)/.test(station), 'City Play must attempt landscape only as a best-effort user-initiated request.');
assert(/pagehide/.test(station) && /destroy\?\./.test(station), 'City Play must dispose the runtime on page exit.');
assert(/webglcontextlost/.test(scene) && /onFallback/.test(scene), 'Babylon scene must expose a context-loss fallback.');
assert(/env\(safe-area-inset-top\)/.test(css) && /orientation:portrait/.test(css), 'City Play CSS must honor safe areas and portrait guidance.');
assert(/data-play-move/.test(station) && /pointerdown/.test(station), 'City Play must expose touch movement controls.');
assert(/min-height:3\.5rem/.test(css), 'City Play touch targets must retain a 56px-equivalent minimum control size.');
assert(/ensureCityWorldState/.test(station) && /getCityWorldPublicSummary/.test(station), 'City Play must consume only the safe CityWorldState summary.');
assert(!/location\.assign|window\.location/.test(station), 'W249 Play must not execute app navigation or deep-link actions.');
assert(/Prepared route · review required/.test(station) && /prepareCityPlayAction/.test(station) && /confirmPreparedCityAction/.test(station), 'City Play must retain W250 prepare-review-confirm route safety.');
assert(!/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/.test(`${station}\n${scene}`), 'W249 proof must not create remote I/O.');
assert(!/from\s+['"][^'"]*(?:wallet|payment|reward|loot|contract|referral)[^'"]*['"]/.test(`${station}\n${scene}`), 'W249 proof must not import a value-bearing runtime module.');
assert(/Enter Immersive Work Mode/.test(cityLiteRuntime) && /Immersive Work Mode/.test(visualTour), 'City Map and the isolated Three.js preview retain a deliberate compatibility transition to Immersive Work Mode.');
assert(imports.ok, `Active source graph crosses a fenced legacy boundary: ${[
  ...imports.legacyPrefixHits,
  ...imports.legacyValueHits,
  ...imports.forbiddenLiteralHits,
  ...imports.evmAddressLiteralHits
].join(', ')}`);

const output = {
  playHtml: false,
  cleanRouteHtml: false,
  normalShellInPlay: false,
  nonPlayHtmlReferenceHits: [],
  directCityHtml: false,
  babylonChunkCount: 0,
  babylonChunkBytes: 0,
  babylonProofBudgetBytes: BABYLON_PROOF_MAX_BYTES
};
if (REQUIRE_DIST) {
  assert(fs.existsSync(DIST), 'dist/ is missing; run npm run build before W249 output proof.');
  const playHtml = path.join(DIST, 'eoncity-play.html');
  const cleanRouteHtml = path.join(DIST, 'eoncity', 'play', 'index.html');
  const directCityHtml = path.join(DIST, 'eoncity', 'index.html');
  output.playHtml = fs.existsSync(playHtml);
  output.cleanRouteHtml = fs.existsSync(cleanRouteHtml);
  output.directCityHtml = fs.existsSync(directCityHtml);
  assert(output.playHtml, 'Built eoncity-play.html is missing.');
  assert(output.cleanRouteHtml, 'Built /eoncity/play/index.html is missing.');
  assert(output.directCityHtml, 'Built /eoncity/index.html is missing.');
  if (output.playHtml) {
    const builtPlay = fs.readFileSync(playHtml, 'utf8');
    output.normalShellInPlay = /data-eon-app-shell|eon-app-shell/.test(builtPlay);
    assert(!output.normalShellInPlay, 'Built City Play still contains the normal application shell.');
  }
  for (const candidate of ['chat', 'projects', 'workspace', 'eoncity/lite', 'eoncity/tour', 'eoncity/3d']) {
    const relative = `${candidate}/index.html`;
    const absolute = path.join(DIST, relative);
    if (!fs.existsSync(absolute)) continue;
    const text = fs.readFileSync(absolute, 'utf8');
    if (/eon-city-play-station|eon-city-play-babylon/.test(text)) output.nonPlayHtmlReferenceHits.push(relative);
  }
  assert(output.nonPlayHtmlReferenceHits.length === 0, `Non-Play HTML eagerly references a City Play entry: ${output.nonPlayHtmlReferenceHits.join(', ')}`);
  const babylonChunks = walk(path.join(DIST, 'assets')).filter((file) => /eon-city-play-babylon/i.test(path.basename(file)));
  output.babylonChunkCount = babylonChunks.length;
  output.babylonChunkBytes = babylonChunks.reduce((total, file) => total + fs.statSync(file).size, 0);
  assert(output.babylonChunkCount >= 1, 'Built output does not contain the dynamic Babylon City Play chunk.');
  assert(output.babylonChunkBytes <= BABYLON_PROOF_MAX_BYTES, `Babylon City Play proof chunk exceeds the ${BABYLON_PROOF_MAX_BYTES}-byte W249 cap: ${output.babylonChunkBytes}.`);
}

const report = {
  schema: 'eonapp.w249.babylon-play-proof-spike-report.v1',
  ok: errors.length === 0,
  generatedAt: new Date().toISOString(),
  requireDist: REQUIRE_DIST,
  route: playRoute || null,
  activeSurface: { routeEntryCount: imports.routeEntryCount, moduleCount: imports.moduleCount },
  output,
  limitations: [
    'This gate does not prove final game art, mobile device performance, combat, mission outcomes, or launch readiness.',
    'W241 external Preview/device/PWA/rollback/Git-history proof and W245/W246 remain open.',
    'W250 proves only allowlisted prepare-review-confirm route handoff; it does not perform app work, transfer data, or activate commercial/chain flows.'
  ],
  errors
};
const artifacts = path.join(ROOT, 'artifacts');
fs.mkdirSync(artifacts, { recursive: true });
fs.writeFileSync(path.join(artifacts, 'W249_BABYLON_PLAY_PROOF_SPIKE_REPORT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (errors.length) {
  console.error('[W249] Babylon Play proof spike gate failed:');
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}
console.log(`[W249] PASS: isolated Babylon proof route; ${imports.moduleCount} reachable modules; ${REQUIRE_DIST ? `${output.babylonChunkCount} dynamic Babylon output chunk(s), ${output.babylonChunkBytes} bytes` : 'source boundary only'}.`);
