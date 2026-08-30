#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

import {
  W142_CREATOR_SAFETY_RECEIPT_KEY,
  assertW142CreatorStudioAudit,
  buildW142CreatorStudioAudit,
  recordW142CreatorSafetyReceipt
} from '../assets/js/utils/creator-studio-safety-copy.js';
import {
  W143_LEGAL_TRUST_RECEIPT_KEY,
  W143_REQUIRED_POLICY_SURFACES,
  assertW143LegalTrustCopyAudit,
  buildW143LegalTrustCopyAudit,
  recordW143LegalTrustCopyReceipt
} from '../assets/js/utils/legal-trust-copy.js';
import {
  W145_UPDATE_SURVIVAL_RECEIPT_KEY,
  assertW145UpdateSurvivalManifest,
  recordW145UpdateSurvivalReceipt,
  seedW145ProofStorage,
  simulateCloudflareAppUpdate
} from '../assets/js/utils/update-safe-user-data.js';
import {
  W144_CRITICAL_ROUTES,
  W144_ENTERPRISE_CERTIFICATION_RECEIPT_KEY,
  W144_ENTERPRISE_CERTIFICATION_SCHEMA,
  W144_REQUIRED_LAUNCH_SCRIPTS,
  W144_REQUIRED_PRIOR_PHASES,
  W144_REQUIRED_PROOF_RECEIPTS,
  assertW144EnterpriseCertificationAudit,
  buildW144EnterpriseCertificationAudit,
  getW144RemainingPhaseSummary,
  recordW144EnterpriseCertificationReceipt
} from '../assets/js/utils/final-enterprise-certification.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

class MemoryStorage {
  constructor(seed = {}) { this.store = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)])); }
  get length() { return this.store.size; }
  key(index) { return Array.from(this.store.keys())[index] || null; }
  getItem(key) { return this.store.has(String(key)) ? this.store.get(String(key)) : null; }
  setItem(key, value) { this.store.set(String(key), String(value)); }
  removeItem(key) { this.store.delete(String(key)); }
}

const packageJson = JSON.parse(read('package.json'));
const sourceMap = Object.fromEntries(W144_CRITICAL_ROUTES.map((route) => [route.id, read(route.file)]));
for (const route of W144_CRITICAL_ROUTES) sourceMap[route.file] = sourceMap[route.id];
sourceMap.trust = read('trust.html');
sourceMap.creator = read('creator-studio.html');

const storage = new MemoryStorage();
seedW145ProofStorage(storage, { prefix: 'w144-enterprise-certification' });
const w145Manifest = simulateCloudflareAppUpdate(storage, {
  previousVersion: 'w143-legal-trust-final-copy',
  nextVersion: 'w144-final-enterprise-certification',
  reason: 'w144-release-candidate-gate'
});
try { assertW145UpdateSurvivalManifest(w145Manifest); } catch (error) { failures.push(error.message); }
const w145Receipt = recordW145UpdateSurvivalReceipt(storage, { manifest: w145Manifest });

const w142Audit = buildW142CreatorStudioAudit({ creator: read('creator-studio.html') });
try { assertW142CreatorStudioAudit(w142Audit); } catch (error) { failures.push(error.message); }
const w142Receipt = recordW142CreatorSafetyReceipt(storage, { audit: w142Audit });

const w143SourceMap = Object.fromEntries(W143_REQUIRED_POLICY_SURFACES.map((surface) => [surface.id, read(surface.file)]));
w143SourceMap['vault-payments'] = read('vault-payments.html');
w143SourceMap.utility = read('assets/js/utils/legal-trust-copy.js');
const w143Audit = buildW143LegalTrustCopyAudit(w143SourceMap);
try { assertW143LegalTrustCopyAudit(w143Audit); } catch (error) { failures.push(error.message); }
const w143Receipt = recordW143LegalTrustCopyReceipt(storage, { audit: w143Audit });

const w144Audit = buildW144EnterpriseCertificationAudit({
  sources: sourceMap,
  packageJson,
  storage
});
try { assertW144EnterpriseCertificationAudit(w144Audit); } catch (error) { failures.push(error.message); }
const w144Receipt = recordW144EnterpriseCertificationReceipt(storage, { audit: w144Audit });
const remaining = getW144RemainingPhaseSummary();

assert(w144Audit.schema === W144_ENTERPRISE_CERTIFICATION_SCHEMA, 'W144 audit schema mismatch');
assert(w144Audit.ok === true && w144Audit.score === 100, 'W144 audit must pass at 100');
assert(w144Audit.routeCount >= 25 && w144Audit.failedRouteCount === 0, 'W144 must pass all critical routes');
assert(W144_REQUIRED_PRIOR_PHASES.length >= 9, 'W144 prior-phase chain is incomplete');
assert(W144_REQUIRED_LAUNCH_SCRIPTS.length >= 6, 'W144 launch script registry is incomplete');
assert(W144_REQUIRED_PROOF_RECEIPTS.some((entry) => entry.key === W144_ENTERPRISE_CERTIFICATION_RECEIPT_KEY), 'W144 receipt registry missing self receipt');
assert(w145Receipt.ok === true && storage.getItem(W145_UPDATE_SURVIVAL_RECEIPT_KEY), 'W145 survival receipt missing from W144 gate');
assert(w142Receipt.ok === true && storage.getItem(W142_CREATOR_SAFETY_RECEIPT_KEY), 'W142 Creator safety receipt missing from W144 gate');
assert(w143Receipt.ok === true && storage.getItem(W143_LEGAL_TRUST_RECEIPT_KEY), 'W143 legal trust receipt missing from W144 gate');
assert(w144Receipt.ok === true && storage.getItem(W144_ENTERPRISE_CERTIFICATION_RECEIPT_KEY), 'W144 final enterprise receipt missing from W144 gate');
assert(w144Receipt.secretValuesIncluded === false, 'W144 receipt must be redacted');
assert(/data-w144-enterprise-certification-proof="true"/.test(read('trust.html')), 'trust.html missing W144 final enterprise proof card');
assert(/final-enterprise-certification-proof\.js/.test(read('trust.html')), 'trust.html missing W144 proof runtime');
assert(/Content-Security-Policy/i.test(read('telegram.html')), 'telegram.html missing release-candidate CSP');
assert(remaining.completedPhase === 'W144' && remaining.finalEnterpriseCertificationDone === true, 'W144 remaining summary must mark W144 done');
assert(remaining.legalTrustCopyDone === true && remaining.creatorSafetyDone === true && remaining.dataSurvivalDone === true, 'W144 summary must preserve W143/W142/W145 completion');
assert(!remaining.phases.some((phase) => phase.id === 'W144'), 'W144 must not remain unfinished after completion');
for (const id of ['W146', 'W147', 'W148']) assert(remaining.phases.some((phase) => phase.id === id), `remaining phases missing ${id}`);
for (const script of ['qa:w144-final-enterprise-certification', 'qa:w121-w144-visual-overhaul']) assert(Boolean(packageJson.scripts?.[script]), `package.json missing ${script}`);
for (const rel of ['_headers', '_redirects', 'manifest.webmanifest', 'sw.js', 'robots.txt', 'sitemap.xml']) assert(exists(rel), `release file missing: ${rel}`);

const stats = {
  schema: W144_ENTERPRISE_CERTIFICATION_SCHEMA,
  ok: failures.length === 0,
  score: failures.length ? 0 : 100,
  generatedAt: new Date().toISOString(),
  routeCount: w144Audit.routeCount,
  priorPhaseCount: W144_REQUIRED_PRIOR_PHASES.length,
  launchScriptCount: W144_REQUIRED_LAUNCH_SCRIPTS.length,
  proofReceiptCount: W144_REQUIRED_PROOF_RECEIPTS.length,
  receiptKey: W144_ENTERPRISE_CERTIFICATION_RECEIPT_KEY,
  audit: w144Audit,
  receipts: {
    w145: w145Receipt,
    w142: w142Receipt,
    w143: w143Receipt,
    w144: w144Receipt
  },
  remainingPhases: remaining.phases,
  failures
};
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w144-final-enterprise-certification-stats.json'), `${JSON.stringify(stats, null, 2)}\n`);
fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts', 'W144_FINAL_ENTERPRISE_CERTIFICATION_STATS_2026-06-13.json'), `${JSON.stringify(stats, null, 2)}\n`);

if (failures.length) {
  console.error('[W144] Final enterprise certification failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`[W144] Final enterprise certification passed (${stats.score}/100): ${stats.routeCount} routes, ${stats.priorPhaseCount} prior phases, ${stats.proofReceiptCount} proof receipts.`);
