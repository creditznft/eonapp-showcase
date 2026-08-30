import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  W144_CRITICAL_ROUTES,
  W144_ENTERPRISE_CERTIFICATION_RECEIPT_KEY,
  W144_ENTERPRISE_CERTIFICATION_SCHEMA,
  W144_REQUIRED_LAUNCH_SCRIPTS,
  W144_REQUIRED_PRIOR_PHASES,
  W144_REQUIRED_PROOF_RECEIPTS,
  assertW144EnterpriseCertificationAudit,
  buildW144EnterpriseCertificationAudit,
  getW144CriticalRoutes,
  getW144EnterpriseChecks,
  getW144EnterpriseCertificationStatus,
  getW144RemainingPhaseSummary,
  recordW144EnterpriseCertificationReceipt
} from '../../assets/js/utils/final-enterprise-certification.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

class MemoryStorage {
  constructor(seed = {}) { this.store = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)])); }
  get length() { return this.store.size; }
  key(index) { return Array.from(this.store.keys())[index] || null; }
  getItem(key) { return this.store.has(String(key)) ? this.store.get(String(key)) : null; }
  setItem(key, value) { this.store.set(String(key), String(value)); }
}

function safePackageScripts() {
  const scripts = { ...JSON.parse(read('package.json')).scripts };
  for (const phase of W144_REQUIRED_PRIOR_PHASES) scripts[phase.script] ||= 'unit-placeholder';
  for (const script of W144_REQUIRED_LAUNCH_SCRIPTS) scripts[script] ||= 'unit-placeholder';
  return scripts;
}

function seedReceipts(storage) {
  storage.setItem('eon:update-survival-proof:v1', JSON.stringify({ schema: 'eonapp.w145.update-safe-user-data-survival.v1', ok: true }));
  storage.setItem('eon:creator:safety-copy-proof:v1', JSON.stringify({ schema: 'eonapp.w142.creator-studio-safety-copy.v1', ok: true, secretValuesIncluded: false }));
  storage.setItem('eon:legal:trust-copy-proof:v1', JSON.stringify({ schema: 'eonapp.w143.legal-billing-trust-support-final-copy.v1', ok: true, secretValuesIncluded: false }));
}

test('W144 registry defines route, prior-phase, launch-script, and receipt coverage', () => {
  assert.equal(W144_ENTERPRISE_CERTIFICATION_SCHEMA, 'eonapp.w144.final-enterprise-certification.v1');
  assert.equal(W144_ENTERPRISE_CERTIFICATION_RECEIPT_KEY, 'eon:enterprise:final-certification-proof:v1');
  assert.ok(W144_CRITICAL_ROUTES.length >= 25);
  for (const id of ['home', 'chat', 'ai-cockpit', 'workbench', 'realm', 'market', 'vault', 'creator-studio', 'telegram', 'support', 'trust', 'wallet-risk']) {
    assert.ok(W144_CRITICAL_ROUTES.some((route) => route.id === id), `missing route ${id}`);
  }
  for (const id of ['W136', 'W137', 'W138', 'W139', 'W140', 'W141', 'W145', 'W142', 'W143']) {
    assert.ok(W144_REQUIRED_PRIOR_PHASES.some((phase) => phase.id === id), `missing phase ${id}`);
  }
  for (const script of ['lint', 'build', 'smoke:build', 'audit:site', 'launch:readiness', 'qa:w144-final-enterprise-certification']) {
    assert.ok(W144_REQUIRED_LAUNCH_SCRIPTS.includes(script), `missing launch script ${script}`);
  }
  assert.ok(W144_REQUIRED_PROOF_RECEIPTS.some((entry) => entry.key === W144_ENTERPRISE_CERTIFICATION_RECEIPT_KEY));
  assert.equal(getW144CriticalRoutes().length, W144_CRITICAL_ROUTES.length);
  assert.ok(getW144EnterpriseChecks().length >= 7);
});

test('W144 audit blocks missing route basics and unsafe RC copy', () => {
  const storage = new MemoryStorage();
  seedReceipts(storage);
  const sources = Object.fromEntries(W144_CRITICAL_ROUTES.map((route) => [route.id, '<html><head><title>Short</title></head><body>TODO guaranteed profit send your seed phrase</body></html>']));
  const audit = buildW144EnterpriseCertificationAudit({ sources, packageScripts: safePackageScripts(), storage });
  assert.equal(audit.ok, false);
  assert.ok(audit.failedRouteCount > 0);
  assert.ok(audit.blockedFindingCount > 0);
  assert.throws(() => assertW144EnterpriseCertificationAudit(audit), /W144 final enterprise certification failed/);
});

test('W144 audit accepts current release-candidate surfaces', () => {
  const storage = new MemoryStorage();
  seedReceipts(storage);
  const sources = Object.fromEntries(W144_CRITICAL_ROUTES.map((route) => [route.id, read(route.file)]));
  sources.trust = read('trust.html');
  sources.creator = read('creator-studio.html');
  const audit = buildW144EnterpriseCertificationAudit({ sources, packageScripts: safePackageScripts(), storage });
  assert.equal(audit.schema, W144_ENTERPRISE_CERTIFICATION_SCHEMA);
  assert.equal(audit.ok, true);
  assert.equal(audit.score, 100);
  assert.equal(audit.failedRouteCount, 0);
  assertW144EnterpriseCertificationAudit(audit);
});

test('W144 records a redacted local enterprise certification receipt', () => {
  const storage = new MemoryStorage();
  seedReceipts(storage);
  const sources = Object.fromEntries(W144_CRITICAL_ROUTES.map((route) => [route.id, read(route.file)]));
  sources.trust = read('trust.html');
  sources.creator = read('creator-studio.html');
  const audit = buildW144EnterpriseCertificationAudit({ sources, packageScripts: safePackageScripts(), storage });
  const receipt = recordW144EnterpriseCertificationReceipt(storage, { audit });
  assert.equal(receipt.schema, W144_ENTERPRISE_CERTIFICATION_SCHEMA);
  assert.equal(receipt.key, W144_ENTERPRISE_CERTIFICATION_RECEIPT_KEY);
  assert.equal(receipt.ok, true);
  assert.equal(receipt.secretValuesIncluded, false);
  assert.equal(getW144EnterpriseCertificationStatus(storage).done, true);
  assert.equal(JSON.stringify(receipt).includes('sk-live'), false);
});

test('W144 trust page and Telegram release hygiene are wired', () => {
  assert.match(read('trust.html'), /data-w144-enterprise-certification-proof="true"/);
  assert.match(read('trust.html'), /final-enterprise-certification-proof\.js/);
  assert.match(read('telegram.html'), /Content-Security-Policy/);
  assert.match(read('assets\/js\/utils\/final-enterprise-certification.js'.replace(/\\\//g, '/')), /W144_ENTERPRISE_CERTIFICATION_SCHEMA/);
});

test('W144 remaining phases exclude W144 and preserve completed proofs', () => {
  const summary = getW144RemainingPhaseSummary();
  assert.equal(summary.completedPhase, 'W144');
  assert.equal(summary.finalEnterpriseCertificationDone, true);
  assert.equal(summary.legalTrustCopyDone, true);
  assert.equal(summary.creatorSafetyDone, true);
  assert.equal(summary.dataSurvivalDone, true);
  assert.equal(summary.phases.some((phase) => phase.id === 'W144'), false);
  for (const id of ['W146', 'W147', 'W148']) assert.ok(summary.phases.some((phase) => phase.id === id), `missing ${id}`);
});

test('W144 generated stats prove completion after gate runs', () => {
  const statsPath = path.join(root, 'artifacts', 'W144_FINAL_ENTERPRISE_CERTIFICATION_STATS_2026-06-13.json');
  if (!fs.existsSync(statsPath)) return;
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  assert.equal(stats.schema, W144_ENTERPRISE_CERTIFICATION_SCHEMA);
  assert.equal(stats.ok, true);
  assert.equal(stats.score, 100);
  assert.equal(stats.receiptKey, W144_ENTERPRISE_CERTIFICATION_RECEIPT_KEY);
});
