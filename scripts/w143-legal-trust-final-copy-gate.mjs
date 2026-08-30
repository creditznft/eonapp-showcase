#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

import {
  W143_BLOCKED_COPY_PATTERNS,
  W143_LEGAL_TRUST_COPY_SCHEMA,
  W143_LEGAL_TRUST_RECEIPT_KEY,
  W143_REQUIRED_POLICY_SURFACES,
  W143_REQUIRED_TRUST_PRINCIPLES,
  assertW143LegalTrustCopyAudit,
  buildW143LegalTrustCopyAudit,
  getW143RemainingPhaseSummary,
  recordW143LegalTrustCopyReceipt
} from '../assets/js/utils/legal-trust-copy.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

class MemoryStorage {
  constructor(seed = {}) { this.store = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)])); }
  get length() { return this.store.size; }
  key(index) { return Array.from(this.store.keys())[index] || null; }
  getItem(key) { return this.store.has(String(key)) ? this.store.get(String(key)) : null; }
  setItem(key, value) { this.store.set(String(key), String(value)); }
}

const sourceMap = Object.fromEntries(W143_REQUIRED_POLICY_SURFACES.map((surface) => [surface.id, read(surface.file)]));
sourceMap.runtime = read('assets/js/legal-trust-copy-proof.js');
sourceMap.utility = read('assets/js/utils/legal-trust-copy.js');
const audit = buildW143LegalTrustCopyAudit(sourceMap);
const storage = new MemoryStorage();
const receipt = recordW143LegalTrustCopyReceipt(storage, { audit });
const remaining = getW143RemainingPhaseSummary();
const pkg = JSON.parse(read('package.json'));

try { assertW143LegalTrustCopyAudit(audit); } catch (error) { failures.push(error.message); }

assert(W143_REQUIRED_POLICY_SURFACES.length >= 5, 'W143 policy surface registry is incomplete');
assert(W143_REQUIRED_TRUST_PRINCIPLES.length >= 8, 'W143 trust principle registry is incomplete');
assert(W143_BLOCKED_COPY_PATTERNS.length >= 7, 'W143 blocked copy registry is incomplete');
for (const surface of W143_REQUIRED_POLICY_SURFACES) {
  const html = read(surface.file);
  assert(/data-w143-trust-copy-proof="true"/.test(html), `${surface.file} missing W143 proof card`);
  assert(/legal-trust-copy-proof\.js/.test(html), `${surface.file} missing W143 proof runtime`);
}
assert(/verified payment activation/i.test(Object.values(sourceMap).join('\n')), 'W143 copy missing verified payment activation language');
assert(/public-proof-only support|Public proof only/i.test(Object.values(sourceMap).join('\n')), 'W143 copy missing public-proof-only support language');
assert(/local-first privacy|Local-first storage/i.test(Object.values(sourceMap).join('\n')), 'W143 copy missing local-first privacy language');
assert(/explicit wallet approval|require explicit approval/i.test(Object.values(sourceMap).join('\n')), 'W143 copy missing explicit wallet approval language');
assert(/Refund exceptions|Limited exceptions/i.test(Object.values(sourceMap).join('\n')), 'W143 copy missing refund exception language');
assert(/No investment|does not promise profit|No financial/i.test(Object.values(sourceMap).join('\n')), 'W143 copy missing no-investment/no-result promise language');
assert(receipt.schema === W143_LEGAL_TRUST_COPY_SCHEMA && receipt.key === W143_LEGAL_TRUST_RECEIPT_KEY && receipt.ok === true, 'W143 receipt was not recorded as passing');
assert(String(storage.getItem(W143_LEGAL_TRUST_RECEIPT_KEY) || '').includes('secretValuesIncluded'), 'W143 receipt was not written to storage');
assert(remaining.completedPhase === 'W143' && remaining.legalTrustCopyDone === true, 'W143 remaining phase summary must mark W143 done');
assert(remaining.creatorSafetyDone === true && remaining.dataSurvivalDone === true, 'W143 summary must preserve W142 and W145 completion');
assert(!remaining.phases.some((phase) => phase.id === 'W143'), 'W143 must not remain unfinished after completion');
for (const id of ['W144', 'W146', 'W147', 'W148']) assert(remaining.phases.some((phase) => phase.id === id), `remaining phases missing ${id}`);
assert(Boolean(pkg.scripts?.['qa:w143-current-policy-boundary']), 'package.json missing current W143 policy QA script');

const stats = {
  schema: W143_LEGAL_TRUST_COPY_SCHEMA,
  ok: failures.length === 0,
  score: failures.length ? 0 : 100,
  generatedAt: new Date().toISOString(),
  surfaceCount: W143_REQUIRED_POLICY_SURFACES.length,
  trustPrincipleCount: W143_REQUIRED_TRUST_PRINCIPLES.length,
  blockedPatternCount: W143_BLOCKED_COPY_PATTERNS.length,
  receiptKey: W143_LEGAL_TRUST_RECEIPT_KEY,
  audit,
  receipt,
  remainingPhases: remaining.phases,
  failures
};
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w143-legal-trust-final-copy-stats.json'), `${JSON.stringify(stats, null, 2)}\n`);
fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts', 'W143_LEGAL_TRUST_FINAL_COPY_STATS_2026-06-13.json'), `${JSON.stringify(stats, null, 2)}\n`);

if (failures.length) {
  console.error('[W143] Legal/billing/trust/support final copy failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`[W143] Current legal/billing/privacy/support policy boundary passed (${stats.score}/100): ${stats.surfaceCount} surfaces, ${stats.trustPrincipleCount} principles, redacted proof receipt recorded.`);
