#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { simulateEonAppW700SignatureFlow, getEonAppW700SignatureFlowTruth } from '../assets/js/nexus/w700/eonapp-w700-signature-flow.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));

export function inspectW700SignatureFlow() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  const required = [
    'assets/js/nexus/w700/eonapp-w700-signature-flow.js',
    'assets/js/nexus/eon-nexus-app-shell.js',
    'assets/js/nexus/eon-nexus-live.js',
    'assets/js/city/w659n/eon-city-w659n-product-layer.js',
    'assets/js/city/eon-city-living-nexus-panel.js',
    'tests/unit/w700-eonapp-signature-flow.test.mjs'
  ];
  add('required-files', required.every(exists), 'signature authority, active owners and maintained tests exist');
  const simulation = simulateEonAppW700SignatureFlow();
  add('complete-simulation', simulation.ok && simulation.validation.ok && simulation.state.stage === 'core-returned', 'the deterministic explicit journey completes and validates');
  add('receipt-chain', simulation.state.receipts.length === 11 && simulation.state.receipts.every((entry) => entry.explicitUserAction && !entry.autoNavigate && !entry.autoExecute && !entry.autoApprove), 'all eleven transitions have explicit non-automatic receipts');
  const appShell = read('assets/js/nexus/eon-nexus-app-shell.js');
  add('nexus-integration', /reviewCityHandoff/.test(appShell) && /atlas-review-required-before-city/.test(appShell) && /selected-work-object-changed-after-atlas/.test(appShell), 'Nexus requires Atlas and the exact selected object before City');
  const city = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
  add('city-integration', /confirmCityEntry/.test(city) && /inspectWorkObject/.test(city) && /reviewSignatureSpecialist/.test(city) && /confirmSignatureNativeAction/.test(city), 'City advances only through the physical work object, specialist and native action');
  add('verified-outcome-integration', /EON_CITY_W659G_VERIFIED_ACTION_EVENT/.test(city) && /recordVerifiedOutcome/.test(city) && /reflectMyRealm/.test(city), 'only verified City action events can reflect My Realm');
  const panel = read('assets/js/city/eon-city-living-nexus-panel.js');
  add('core-return-integration', /my-realm-reflected/.test(panel) && /returnCore/.test(panel), 'explicit Core return completes the sequence');
  const truth = getEonAppW700SignatureFlowTruth();
  add('truth-boundaries', truth.oneEonbot && truth.oneProjectState && truth.atlasRequiredBeforeCity && truth.sameWorkObjectInCity && truth.verifiedOutcomeRequired && !truth.automaticNavigation && !truth.automaticExecution && !truth.automaticApproval, 'one-system and review-first boundaries remain locked');
  return Object.freeze({ schema: 'eonapp.w700.signature-flow-gate.2026-07-25.v1', ok: checks.every((entry) => entry.pass), passed: checks.filter((entry) => entry.pass).length, total: checks.length, checks: Object.freeze(checks) });
}

const report = inspectW700SignatureFlow();
for (const check of report.checks) console.log(`[W700] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W700] ${report.ok ? 'PASS' : 'FAIL'} ${report.passed}/${report.total}`);
if (!report.ok) process.exitCode = 1;
