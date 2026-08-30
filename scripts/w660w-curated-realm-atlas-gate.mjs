#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W660W_CURATED_REALM_ATLAS_CONTRACT } from '../config/w660w-curated-realm-atlas-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const freeze = (value) => Object.freeze(value);

export function inspectW660wCuratedRealmAtlas() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(freeze({ id, pass: Boolean(pass), detail }));
  const required = [
    'config/w660w-curated-realm-atlas-contract.mjs',
    'assets/js/city/eon-city-living-nexus-hybrid.js',
    'assets/js/city/eon-city-living-nexus-panel.js',
    'assets/js/city/eon-city-living-nexus-realm-panel.js',
    'tests/unit/w660w-curated-realm-atlas.test.mjs',
    'docs/W660P_EONCITY_LIVING_NEXUS_HYBRID_MASTER_ROADMAP_2026-07-21.md'
  ];
  add('required-files', required.every(exists), 'contract, canonical store, both Realm panels, tests and roadmap exist');

  const hybrid = read(required[1]);
  add('same-canonical-store', /EON_CITY_LIVING_NEXUS_STORAGE_KEY/.test(hybrid) && /realmDiscoveries/.test(hybrid) && /realmVisits/.test(hybrid) && !/REALM_ATLAS_STORAGE_KEY/.test(hybrid), 'Realm memory extends the existing Living Nexus store');
  add('bounded-realm-memory', /MAX_REALM_DISCOVERIES = 24/.test(hybrid) && /MAX_REALM_VISITS = 12/.test(hybrid), 'Realm discoveries and visits have strict caps');
  add('explicit-record-methods', /recordRealmVisit\(realmId, portalId/.test(hybrid) && /recordRealmDiscovery\(realmId, discovery/.test(hybrid) && /explicit-user-action-required/.test(hybrid), 'visit and discovery writes require explicit user action');
  add('public-safe-fields', W660W_CURATED_REALM_ATLAS_CONTRACT.atlas.visitFields.every((field) => hybrid.includes(field)) && W660W_CURATED_REALM_ATLAS_CONTRACT.atlas.discoveryFields.every((field) => hybrid.includes(field)), 'only authored public-safe Realm ids, labels and times are stored');
  add('private-by-construction', /sharePermission: 'private'/.test(hybrid) && /privateContentStored: false/.test(hybrid), 'stored Realm memory remains private and contains no work content');
  add('validation-covers-realm-memory', /realm-discovery-count-invalid/.test(hybrid) && /realm-visit-count-invalid/.test(hybrid) && /realm-discovery-invalid/.test(hybrid) && /realm-visit-invalid/.test(hybrid), 'snapshot validation rejects malformed Realm memory');
  add('no-network-value-system', !/fetch\s*\(|XMLHttpRequest|WebSocket|indexedDB\.open/.test(hybrid) && /rewardIssued: false/.test(hybrid) && /paymentClaimed: false/.test(hybrid), 'Realm Atlas adds no network, database, reward, payment or entitlement system');

  const mainPanel = read(required[2]);
  add('main-atlas-visible', /Curated Realm memory/.test(mainPanel) && /realmVisitCount/.test(mainPanel) && /realmDiscoveryCount/.test(mainPanel), 'main Living Nexus panel exposes bounded Realm Atlas counts');
  add('single-controller-event-bridge', /record-realm-visit/.test(mainPanel) && /record-realm-discovery/.test(mainPanel) && /controller\.recordRealmVisit/.test(mainPanel) && /controller\.recordRealmDiscovery/.test(mainPanel), 'Realm panel writes through the one existing Living Nexus controller');

  const realmPanel = read(required[3]);
  add('confirmed-entry-record', /data-eon-realm-confirm-entry/.test(realmPanel) && /record-realm-visit/.test(realmPanel) && /explicitUserAction: true/.test(realmPanel), 'only separately confirmed Realm entry emits a visit record');
  add('explicit-discovery-control', /data-eon-realm-record-discovery/.test(realmPanel) && /record-realm-discovery/.test(realmPanel), 'authored discoveries require a visible explicit record action');
  add('receipt-and-return-preserved', /syncLivingNexusRealmVerifiedOutcome/.test(realmPanel) && /eon:city:living-nexus:sync-request/.test(realmPanel) && /exitLivingNexusRealm/.test(realmPanel), 'receipt transformation and exact safe return remain in the expedition loop');
  add('no-automatic-share', /Open global Sharing Center/.test(realmPanel) && /Nothing was posted automatically|No share action occurred/.test(realmPanel), 'sharing remains a separate global review action');

  const roadmap = read(required[5]);
  add('roadmap-boundary', /W660W — Curated Realm Atlas/i.test(roadmap) && /source implementation is complete/i.test(roadmap) && /authenticated browser proof/i.test(roadmap), 'roadmap records source completion without claiming live proof');

  const pkg = JSON.parse(read('package.json'));
  add('package-command', pkg.scripts?.['qa:w660w-curated-realm-atlas'] === 'node scripts/w660w-curated-realm-atlas-gate.mjs && node --test tests/unit/w660w-curated-realm-atlas.test.mjs', 'focused W660W QA command exists');
  const manifest = JSON.parse(read('config/w624d-current-unit-test-manifest.json'));
  add('maintained-suite-current', manifest.testFileCount === manifest.testFiles.length && manifest.testFiles.includes('tests/unit/w660w-curated-realm-atlas.test.mjs'), `${manifest.testFileCount} maintained files include W660W`);
  add('contract-invariants', Object.values(W660W_CURATED_REALM_ATLAS_CONTRACT.invariants).every(Boolean), 'contract preserves canonical store, scene, review, privacy and truth invariants');

  return freeze({ schema: 'eonapp.w660w.curated-realm-atlas-gate.2026-07-21.v1', ok: checks.every((entry) => entry.pass), passed: checks.filter((entry) => entry.pass).length, total: checks.length, checks: freeze(checks) });
}

const report = inspectW660wCuratedRealmAtlas();
for (const check of report.checks) console.log(`[W660W] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W660W] ${report.ok ? 'PASS' : 'FAIL'} ${report.passed}/${report.total}`);
if (!report.ok) process.exitCode = 1;
