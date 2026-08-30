#!/usr/bin/env node
/** W370 — My Realm visual profile source gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';
import { getRealmVisualProfileTruth } from '../assets/js/realm/eon-realm-visual-profile.js';
import { W370_MY_REALM_VISUAL_PROFILE_CONTRACT, validateW370MyRealmVisualProfileContract } from '../config/w370-my-realm-visual-profile-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const moduleSource = read('assets/js/realm/eon-realm-visual-profile.js');
const page = read('assets/js/realm-studio-page.js');
const html = read('realm-studio.html');
const css = read('assets/css/realm-studio.css');
const docs = read('docs/W370_MY_REALM_VISUAL_PROFILE_IMPLEMENTATION_2026-06-26.md');
const imports = auditActiveSurfaceImports({ root: ROOT });
const truth = getRealmVisualProfileTruth();

check(validateW370MyRealmVisualProfileContract().length === 0, `W370 contract invalid: ${validateW370MyRealmVisualProfileContract().join(' | ')}`);
check(truth.localOnly && !truth.publicPublishingActive && !truth.cloudSyncActive && !truth.globalHandleRegistry, 'W370 Realm visual profile must stay local, non-public and non-cloud-synced.');
check(/createEncryptedRealmVisualBackup/.test(moduleSource) && /restoreEncryptedRealmVisualBackup/.test(moduleSource) && /PBKDF2/.test(moduleSource) && /AES-GCM/.test(moduleSource), 'W370 requires a bounded encrypted export/import implementation.');
check(/realm-studio-visual/.test(html) && /realm-studio-visual-save/.test(html) && /realm-studio-visual-export/.test(html) && /realm-studio-visual-import/.test(html), 'W370 Realm Studio needs visual controls and visible local backup actions.');
check(/saveRealmVisualProfile/.test(page) && /createEncryptedRealmVisualBackup/.test(page) && /restoreEncryptedRealmVisualBackup/.test(page), 'W370 Realm Studio must wire local visual profile and encrypted backup actions.');
check(/realm-studio-visual-card/.test(css), 'W370 requires Realm visual profile styles.');
check(/No GLB, texture, final companion model, public publishing, cloud sync, wallet, payment/i.test(docs) && /does not claim/i.test(docs), 'W370 docs must disclose current visual and evidence limits.');
check(!/fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon/.test(`${moduleSource}\n${page}`), 'W370 cannot add remote transport or telemetry.');
check(imports.ok, `Active graph crosses a fenced boundary: ${[...imports.legacyPrefixHits, ...imports.legacyValueHits, ...imports.forbiddenLiteralHits, ...imports.evmAddressLiteralHits].join(', ')}`);

const report = {
  schema: 'eonapp.w370.my-realm-visual-profile-gate.v1',
  ok: errors.length === 0,
  generatedAt: new Date().toISOString(),
  realm: { localOnly: true, encryptedVisualBackup: true, cloudSync: false, publicPublishing: false, globalHandleRegistry: false },
  limitations: [
    'W370 proves source contracts and local visual configuration only.',
    'No GLB, texture, final companion model, public publishing, cloud sync, wallet, payment or marketplace is delivered in this code-only wave.',
    'No browser export/import, accessibility, asset-integration, device or production proof is created by this source gate.'
  ],
  activeSurface: { routeEntryCount: imports.routeEntryCount, moduleCount: imports.moduleCount },
  errors
};
fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts', 'W370_MY_REALM_VISUAL_PROFILE_REPORT_2026-06-26.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
