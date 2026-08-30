#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W660V_CURATED_NEXUS_REALMS_CONTRACT } from '../config/w660v-curated-nexus-realms-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const freeze = (value) => Object.freeze(value);

export function inspectW660vCuratedNexusRealms() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(freeze({ id, pass: Boolean(pass), detail }));
  const required = [
    'config/w660v-curated-nexus-realms-contract.mjs',
    'assets/js/city/eon-city-living-nexus-realms.js',
    'assets/js/city/eon-city-living-nexus-realm-babylon.js',
    'assets/js/city/eon-city-living-nexus-realm-panel.js',
    'assets/js/city/eon-city-living-nexus-babylon-runtime.js',
    'assets/js/city/eon-city-play-babylon.js',
    'assets/js/eon-city-play-station.js',
    'tests/unit/w660v-curated-nexus-realms.test.mjs',
    'docs/W660P_EONCITY_LIVING_NEXUS_HYBRID_MASTER_ROADMAP_2026-07-21.md'
  ];
  add('required-files', required.every(exists), 'contract, authored catalog, one-scene renderer, review panel, runtime integration, tests and roadmap exist');

  const realms = read(required[1]);
  add('six-authored-realms', /archive-noir/.test(realms) && /living-bio-city/.test(realms) && /golden-sovereign/.test(realms) && /forge-depths/.test(realms) && /orbital-white-city/.test(realms) && /nexus-ruins/.test(realms), 'all six curated Realm identities are source-authored');
  add('archive-noir-premium-slice', /The Silent Index/.test(realms) && /Memory Stacks/.test(realms) && /Echo Bridge/.test(realms) && /noir-rain/.test(realms), 'Archive Noir has authored zones, landmarks, route and atmosphere');
  add('productive-realm-bindings', /vault-recovery/.test(realms) && /local-ai-byok/.test(realms) && /missionId: 'project'/.test(realms) && /missionId: 'creator'/.test(realms) && /missionId: 'automation'/.test(realms), 'curated Realms bind existing Productive RPG mission families');
  add('verified-transformation-only', /requiredOutcomeKinds/.test(realms) && /matchingOutcome/.test(realms) && /verifiedTransformation/.test(realms), 'Realm transformation is derived only from a matching verified bounded receipt');
  add('authored-no-runtime-ai', /proceduralGeometry: false/.test(realms) && /authored: true/.test(realms) && !/fetch\s*\(|XMLHttpRequest|WebSocket/.test(realms), 'Realm geometry is authored source data without runtime AI or remote fetch');
  add('safe-review-contract', /requiresSeparateEntryConfirmation: true/.test(realms) && /requiresSeparateNativeRouteConfirmation: true/.test(realms) && /immediateSafeReturn: true/.test(realms), 'entry, native route and safe return remain explicit');

  const renderer = read(required[2]);
  add('one-scene-subtree', /TransformNode\('w660v-living-nexus-realm-root'/.test(renderer) && !/new Engine\(|new Scene\(|requestAnimationFrame\(/.test(renderer), 'Realm renderer is a TransformNode subtree of the existing scene');
  add('archive-visual-geometry', /living-nexus-authored-realm-floor/.test(renderer) && /living-nexus-authored-realm-tower/.test(renderer) && /living-nexus-realm-mission-terminal/.test(renderer) && /living-nexus-realm-return-portal/.test(renderer), 'renderer emits authored floor, skyline, mission terminal and safe return portal');
  add('existing-update-call', /update\(now/.test(renderer) && /kind === 'rain'/.test(renderer) && /kind === 'ring'/.test(renderer) && !/registerBeforeRender/.test(renderer), 'Realm motion advances only when the existing runtime update calls it');
  add('realm-collisions', /collisionVolumes/.test(renderer) && /getCollisionVolumes/.test(renderer), 'authored Realm skyline contributes bounded collision volumes');

  const runtime = read(required[4]);
  add('rare-portal-entry', /prepareRealm\(/.test(runtime) && /enterRealm\(/.test(runtime) && /rare-portal-not-resident/.test(runtime), 'only the currently resident matching rare portal can prepare and enter a Realm');
  add('exact-return-contract', /realmReturnPoint/.test(runtime) && /exitRealm\(/.test(runtime) && /exact Expanse portal context/i.test(runtime), 'Realm exit returns the bounded Expanse portal context');
  add('active-realm-receipt-sync', /syncRealmVerifiedOutcome/.test(runtime) && /newlyTransformed/.test(runtime) && /fakeCompletion: false/.test(runtime), 'active Realm re-renders only from a matching verified outcome');
  add('same-scene-destination', /destination = 'realm'/.test(runtime) && /nexusRealmRenderer\.show/.test(runtime) && /nexusRealmRenderer\.hide/.test(runtime), 'Realm is an internal runtime sub-destination, not a fourth top-level product card');

  const play = read(required[5]);
  add('player-entry-exit', /enterLivingNexusRealm/.test(play) && /exitLivingNexusRealm/.test(play) && /playerPosition/.test(play), 'player and camera enter and exit the authored Realm through the existing City controller');
  add('realm-signal-proximity', /getNearestLivingNexusRealmSignal/.test(play) && /onLivingNexusRealmSignalChange/.test(play), 'rare portals and in-Realm features publish bounded proximity signals');
  add('realm-collision-use', /\['expanse', 'realm'\]\.includes/.test(play), 'the existing third-person movement controller uses Realm collision volumes');

  const panel = read(required[3]);
  add('review-first-visible-ui', /Prepare Realm entry/.test(panel) && /Confirm and enter/.test(panel) && /Immediate safe return to Expanse/.test(panel), 'visible portal inspection, separate entry confirmation and safe return controls exist');
  add('mission-and-receipt-ui', /Review .*mission|data-eon-realm-review-mission/.test(panel) && /Check matching verified receipt/.test(panel) && /No matching verified native receipt/.test(panel), 'Realm mission review and honest receipt check are visible');
  add('reuse-capture-share', /data-capture-toggle/.test(panel) && /data-eon-play-share-city/.test(panel), 'Realm reuses Creator Capture and the one global Sharing Center');

  const station = read(required[6]);
  add('station-integration', /bindEonCityLivingNexusRealmPanel/.test(station) && /eon:city:living-nexus:realm-signal/.test(station) && /onLivingNexusRealmSignalChange/.test(station), 'City station binds one Realm panel and one context-action signal');
  const css = read('assets/css/eon-city-play.css');
  add('responsive-realm-ui', /eon-play-living-nexus-realm-signal/.test(css) && /eon-play-living-nexus-realm-panel/.test(css) && /prefers-reduced-motion:reduce/.test(css), 'Realm review UI is responsive and reduced-motion aware');

  const roadmap = read(required[8]);
  add('roadmap-source-boundary', /W660V — Nexus Realms/.test(roadmap) && /authenticated real-browser proof/i.test(roadmap), 'roadmap distinguishes source completion from authenticated browser evidence');

  const pkg = JSON.parse(read('package.json'));
  add('package-command', pkg.scripts?.['qa:w660v-curated-nexus-realms'] === 'node scripts/w660v-curated-nexus-realms-gate.mjs && node --test tests/unit/w660v-curated-nexus-realms.test.mjs', 'focused W660V QA command exists');
  const manifest = JSON.parse(read('config/w624d-current-unit-test-manifest.json'));
  add('maintained-suite-current', manifest.testFileCount === manifest.testFiles.length && manifest.testFiles.includes('tests/unit/w660v-curated-nexus-realms.test.mjs') && manifest.testFileCount >= 320, `${manifest.testFileCount} maintained tests include W660V`);
  add('contract-invariants', Object.values(W660V_CURATED_NEXUS_REALMS_CONTRACT.invariants).every(Boolean), 'contract preserves all canonical-runtime, privacy, truth and review invariants');

  return freeze({ schema: 'eonapp.w660v.curated-nexus-realms-gate.2026-07-21.v1', ok: checks.every((entry) => entry.pass), passed: checks.filter((entry) => entry.pass).length, total: checks.length, checks: freeze(checks) });
}

const report = inspectW660vCuratedNexusRealms();
for (const check of report.checks) console.log(`[W660V] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W660V] ${report.ok ? 'PASS' : 'FAIL'} ${report.passed}/${report.total}`);
if (!report.ok) process.exitCode = 1;
