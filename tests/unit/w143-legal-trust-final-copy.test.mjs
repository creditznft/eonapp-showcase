import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  W143_BLOCKED_COPY_PATTERNS,
  W143_LEGAL_TRUST_COPY_SCHEMA,
  W143_LEGAL_TRUST_RECEIPT_KEY,
  W143_REQUIRED_POLICY_SURFACES,
  W143_REQUIRED_TRUST_PRINCIPLES,
  assertW143LegalTrustCopyAudit,
  buildW143LegalTrustCopyAudit,
  getW143LegalTrustCopyStatus,
  getW143PolicySurfaceChecklist,
  getW143RemainingPhaseSummary,
  getW143TrustPrinciples,
  recordW143LegalTrustCopyReceipt
} from '../../assets/js/utils/legal-trust-copy.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

class MemoryStorage {
  constructor(seed = {}) { this.store = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)])); }
  get length() { return this.store.size; }
  key(index) { return Array.from(this.store.keys())[index] || null; }
  getItem(key) { return this.store.has(String(key)) ? this.store.get(String(key)) : null; }
  setItem(key, value) { this.store.set(String(key), String(value)); }
}

test('W143 registry defines current policy surfaces and trust principles', () => {
  assert.equal(W143_LEGAL_TRUST_COPY_SCHEMA, 'eonapp.w143.legal-billing-trust-support-final-copy.v2');
  for (const id of ['legal', 'terms', 'billing', 'privacy', 'support']) {
    assert.ok(W143_REQUIRED_POLICY_SURFACES.some((surface) => surface.id === id), `missing ${id}`);
  }
  for (const id of ['dodo-hosted-checkout-only', 'server-verified-billing-entitlements', 'public-proof-only-support', 'local-first-privacy', 'no-wallet-transaction', 'processor-backed-refunds', 'eonkeys-not-subscriptions', 'no-investment-or-result-promises', 'no-secrets-in-support', 'third-party-and-jurisdiction-boundary']) {
    assert.ok(W143_REQUIRED_TRUST_PRINCIPLES.some((entry) => entry.id === id), `missing ${id}`);
  }
  assert.equal(getW143PolicySurfaceChecklist().length, W143_REQUIRED_POLICY_SURFACES.length);
  assert.equal(getW143TrustPrinciples().length, W143_REQUIRED_TRUST_PRINCIPLES.length);
});

test('W143 audit blocks risky legal, refund, wallet, and support claims', () => {
  const audit = buildW143LegalTrustCopyAudit({
    legal: 'We provide investment advice and guaranteed profit. Send your seed phrase for support. Instant refund guarantee.'
  });
  assert.equal(audit.ok, false);
  assert.ok(audit.findings.some((finding) => finding.id === 'guaranteed-profit'));
  assert.ok(audit.findings.some((finding) => finding.id === 'private-key-request'));
  assert.throws(() => assertW143LegalTrustCopyAudit(audit), /W143 legal\/billing\/trust\/support copy audit failed/);
});

test('W143 audit accepts final trust contract language', () => {
  const safeCopy = Object.fromEntries(W143_REQUIRED_POLICY_SURFACES.map((surface) => [surface.id, `
    W143 final trust copy proof. ${surface.label}. ${surface.required.join(' ')}.
    Dodo Payments hosted checkout. Signed server webhook entitlement. Public-proof-only support. Local-first privacy. No wallet transaction.
    Processor-backed refunds. EONKEYS are not subscriptions. No investment or result promises. No financial, investment, legal, medical, or tax advice.
    Never share secrets: seed phrase, private key, full API key, wallet backup file, password, or full card data.
    Manual review. Third-party processors and jurisdiction duties.
  `]));
  const audit = buildW143LegalTrustCopyAudit(safeCopy);
  assert.equal(audit.ok, true);
  assert.equal(audit.score, 100);
  assertW143LegalTrustCopyAudit(audit);
});

test('W143 records redacted receipt and status', () => {
  const storage = new MemoryStorage();
  const safeCopy = Object.fromEntries(W143_REQUIRED_POLICY_SURFACES.map((surface) => [surface.id, `
    W143 final trust copy proof. ${surface.required.join(' ')}. Dodo Payments hosted checkout. Signed server webhook entitlement. Public-proof-only support.
    Local-first privacy. No wallet transaction. Processor-backed refunds. EONKEYS are not subscriptions. No investment or result promises.
    No financial advice. Never share secrets seed phrase private key full API key wallet backup file password full card data.
    Manual review. Third-party processors and jurisdiction duties.
  `]));
  const audit = buildW143LegalTrustCopyAudit(safeCopy);
  const receipt = recordW143LegalTrustCopyReceipt(storage, { audit });
  assert.equal(receipt.schema, W143_LEGAL_TRUST_COPY_SCHEMA);
  assert.equal(receipt.key, W143_LEGAL_TRUST_RECEIPT_KEY);
  assert.equal(receipt.secretValuesIncluded, false);
  const status = getW143LegalTrustCopyStatus(storage);
  assert.equal(status.done, true);
  assert.equal(JSON.stringify(receipt).includes('sk-live'), false);
});

test('W143 public policy pages are wired', () => {
  for (const surface of W143_REQUIRED_POLICY_SURFACES) {
    const html = read(surface.file);
    assert.match(html, /data-w143-trust-copy-proof="true"/);
    assert.match(html, /legal-trust-copy-proof\.js/);
    for (const required of surface.required) assert.match(html, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `${surface.file} missing ${required}`);
  }
});

test('W143 remaining phases exclude W143 and preserve W142/W145 completion', () => {
  const summary = getW143RemainingPhaseSummary();
  assert.equal(summary.completedPhase, 'W143');
  assert.equal(summary.legalTrustCopyDone, true);
  assert.equal(summary.creatorSafetyDone, true);
  assert.equal(summary.dataSurvivalDone, true);
  assert.equal(summary.phases.some((phase) => phase.id === 'W143'), false);
  for (const id of ['W144', 'W146', 'W147', 'W148']) assert.ok(summary.phases.some((phase) => phase.id === id), `missing ${id}`);
});

test('W143 generated stats prove completion after gate runs', () => {
  const statsPath = path.join(root, 'artifacts', 'W143_LEGAL_TRUST_FINAL_COPY_STATS_2026-06-13.json');
  if (!fs.existsSync(statsPath)) return;
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  assert.equal(stats.schema, W143_LEGAL_TRUST_COPY_SCHEMA);
  assert.equal(stats.ok, true);
  assert.equal(stats.score, 100);
  assert.equal(stats.receiptKey, W143_LEGAL_TRUST_RECEIPT_KEY);
});
