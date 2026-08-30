import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  W142_BLOCKED_COPY_PATTERNS,
  W142_CREATOR_SAFETY_COPY_SCHEMA,
  W142_CREATOR_SAFETY_RECEIPT_KEY,
  W142_REQUIRED_CREATOR_GUARDRAILS,
  assertW142CreatorStudioAudit,
  buildW142CreatorStudioAudit,
  getW142CreatorSafetyChecklist,
  getW142CreatorSafetyStatus,
  getW142RemainingPhaseSummary,
  recordW142CreatorSafetyReceipt
} from '../../assets/js/utils/creator-studio-safety-copy.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

class MemoryStorage {
  constructor(seed = {}) { this.store = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)])); }
  get length() { return this.store.size; }
  key(index) { return Array.from(this.store.keys())[index] || null; }
  getItem(key) { return this.store.has(String(key)) ? this.store.get(String(key)) : null; }
  setItem(key, value) { this.store.set(String(key), String(value)); }
}

test('W142 registry defines blocked Creator Studio copy and required guardrails', () => {
  assert.equal(W142_CREATOR_SAFETY_COPY_SCHEMA, 'eonapp.w142.creator-studio-safety-copy.v1');
  assert.ok(W142_BLOCKED_COPY_PATTERNS.some((entry) => entry.id === 'one-click-publish'));
  assert.ok(W142_BLOCKED_COPY_PATTERNS.some((entry) => entry.id === 'auto-publish'));
  assert.ok(W142_BLOCKED_COPY_PATTERNS.some((entry) => entry.id === 'guaranteed-results'));
  for (const id of ['human-review', 'rights-review', 'no-result-promises', 'public-data-boundary', 'local-secret-boundary', 'sensitive-content-review']) {
    assert.ok(W142_REQUIRED_CREATOR_GUARDRAILS.some((entry) => entry.id === id), `missing ${id}`);
  }
  assert.equal(getW142CreatorSafetyChecklist().length, W142_REQUIRED_CREATOR_GUARDRAILS.length);
});

test('W142 audit blocks unsafe promise and unattended publish language', () => {
  const audit = buildW142CreatorStudioAudit({ html: 'One-Click Publish and guaranteed viral growth with copyright-safe outputs.' });
  assert.equal(audit.ok, false);
  assert.ok(audit.findings.some((finding) => finding.id === 'one-click-publish'));
  assert.ok(audit.findings.some((finding) => finding.id === 'guaranteed-results'));
  assert.throws(() => assertW142CreatorStudioAudit(audit), /W142 Creator Studio safety\/copy audit failed/);
});

test('W142 audit accepts review-first local-secret safe copy', () => {
  const copy = `Review-first Pipeline. Review & Post. Human review required. Rights and likeness review.
  API keys stay in local Vault and safety receipts never expose secrets. No result promises. Public data boundary.
  Sensitive content review. Review rights and platform terms before publishing.`;
  const audit = buildW142CreatorStudioAudit({ html: copy });
  assert.equal(audit.ok, true);
  assert.equal(audit.score, 100);
  assertW142CreatorStudioAudit(audit);
});

test('W142 records a redacted local receipt and status', () => {
  const storage = new MemoryStorage();
  const audit = buildW142CreatorStudioAudit({ html: 'Review-first Pipeline Review & Post Human review required Rights and likeness review API keys stay in local Vault No result promises Public data boundary Sensitive content review platform terms' });
  const receipt = recordW142CreatorSafetyReceipt(storage, { audit });
  assert.equal(receipt.schema, W142_CREATOR_SAFETY_COPY_SCHEMA);
  assert.equal(receipt.key, W142_CREATOR_SAFETY_RECEIPT_KEY);
  assert.equal(receipt.secretValuesIncluded, false);
  const status = getW142CreatorSafetyStatus(storage);
  assert.equal(status.done, true);
  assert.equal(JSON.stringify(receipt).includes('sk-live'), false);
});

test('W142 Creator Studio page and scripts are wired', () => {
  const html = read('creator-studio.html');
  const js = read('assets/js/creator-studio-page.js');
  const css = read('assets/css/creator-studio.css');
  assert.match(html, /data-w142-creator-safety-proof="true"/);
  assert.match(html, /Review-first Pipeline/);
  assert.match(html, /Review & Post/);
  assert.match(html, /AI-assisted/);
  assert.match(html, /Queue only until manual review/);
  assert.match(html, /Public Landscape Notes/);
  assert.doesNotMatch(html, /One-Click Publish|AI powered|Auto-publish|Post Now|Competitor Intel/);
  assert.match(js, /recordW142CreatorSafetyReceipt\(localStorage/);
  assert.match(js, /buildW142CreatorStudioAudit/);
  assert.match(css, /cs-safety-proof/);
});

test('W142 remaining phases exclude W142 and preserve W145 data survival completion', () => {
  const summary = getW142RemainingPhaseSummary();
  assert.equal(summary.completedPhase, 'W142');
  assert.equal(summary.creatorSafetyDone, true);
  assert.equal(summary.dataSurvivalDone, true);
  assert.equal(summary.phases.some((phase) => phase.id === 'W142'), false);
  for (const id of ['W143', 'W144', 'W146', 'W147', 'W148']) {
    assert.ok(summary.phases.some((phase) => phase.id === id), `missing ${id}`);
  }
});

test('W142 stats file is generated by the gate', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.ok(pkg.scripts['qa:w142-creator-studio-safety-copy']);
  const statsPath = path.join(root, 'tmp', 'w142-creator-studio-safety-copy-stats.json');
  fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
  execFileSync(process.execPath, [path.join(root, 'scripts', 'w142-creator-studio-safety-copy-gate.mjs')], { cwd: root, stdio: 'ignore' });
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  assert.equal(stats.schema, W142_CREATOR_SAFETY_COPY_SCHEMA);
  assert.equal(stats.score, 100);
});
