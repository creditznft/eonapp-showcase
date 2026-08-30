import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { ROUTE_CONTRACT_VERSION } from '../../config/route-contract.mjs';
import {
  PRODUCT_CLAIM_EVIDENCE,
  PRODUCT_STATUS_MATRIX,
  validateProductEvidenceRegistry
} from '../../config/product-evidence-registry.mjs';
import { findRestrictedActiveClaims, findUnmappedRootHtml, verifyProductTruth } from '../../scripts/verify-product-truth.mjs';
import { parseArgs, scanText, scanTree } from '../../scripts/secret-scan.mjs';
import { W393A_HISTORICAL_EVIDENCE_DIAGNOSTIC_TESTS, getW393ALeanHandoverStatus } from '../../config/w393a-lean-handover-integrity-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W228 maps every public and retired route to a permitted product state with source evidence', () => {
  assert.equal(validateProductEvidenceRegistry({ root }).length, 0);
  const routeWave = Number(ROUTE_CONTRACT_VERSION.match(/\.w(\d+)\./)?.[1] || 0);
  assert.ok(routeWave >= 228, `route contract must remain at or beyond the W228 re-audit baseline: ${ROUTE_CONTRACT_VERSION}`);
  assert.ok(PRODUCT_STATUS_MATRIX.length >= 90);
  assert.ok(PRODUCT_CLAIM_EVIDENCE.every((claim) => claim.evidence.length > 0));
  assert.deepEqual(findUnmappedRootHtml(root), []);
  assert.deepEqual(findRestrictedActiveClaims(root), []);
  assert.equal(verifyProductTruth({ root }).ok, true);
});

test('W227 whole-tree scanner finds real key-shaped values, masks output, and ignores explicit placeholders', () => {
  const openAiKey = ['sk', 'proj', 'abcdefghijklmnopqrstuvwxyz1234567890'].join('-');
  const finding = scanText(`OPENAI_API_KEY=${openAiKey}`, '.env');
  assert.ok(finding.length >= 1); // key signature and/or dotenv assignment must be reported.
  assert.ok(finding.every((entry) => !entry.token.includes('abcdefghijklmnopqrstuvwxyz')));
  assert.deepEqual(scanText('OPENAI_API_KEY=REDACTED_OPENAI_KEY', '.env.example'), []);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'eon-secret-scan-'));
  const botToken = ['123456789', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcd_efgh'].join(':');
  fs.writeFileSync(path.join(dir, 'probe.txt'), `BOT_TOKEN=${botToken}\n`);
  const result = scanTree(dir);
  assert.ok(result.findings.length >= 1);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('W227 secret scan recognises both standard and equals-style CI mode arguments', () => {
  assert.equal(parseArgs(['node', 'secret-scan.mjs', '--mode', 'ci']).mode, 'ci');
  assert.equal(parseArgs(['node', 'secret-scan.mjs', '--mode=ci']).mode, 'ci');
  assert.equal(parseArgs(['node', 'secret-scan.mjs', '--mode=workspace']).mode, 'workspace');
});

test('W227 keeps stale token, leaderboard, and live-dashboard browser suites outside the active runnable source', () => {
  for (const file of ['e2e/monetization.spec.js', 'e2e/leaderboard-builder.spec.js', 'tests/e2e/live-trading-dashboard.spec.ts']) {
    assert.equal(fs.existsSync(path.join(root, file)), false, file);
  }
  const status = getW393ALeanHandoverStatus();
  assert.equal(status.historicArchiveEvidence, 'not-packaged-in-lean-continuation');
  assert.equal(status.historicArchiveVerification, 'not-certified-by-this-handover');
});

test('W227 makes the current unit gate explicit and keeps unavailable historical evidence in a diagnostic lane', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.match(packageJson.scripts['test:unit'], /run-current-unit-suite/);
  assert.match(packageJson.scripts['test:unit:legacy-diagnostic'], /run-archived-legacy-diagnostic/);
  assert.equal(fs.existsSync(path.join(root, 'scripts/run-current-unit-suite.mjs')), true);
  assert.equal(fs.existsSync(path.join(root, 'scripts/run-archived-legacy-diagnostic.mjs')), true);
  assert.ok(W393A_HISTORICAL_EVIDENCE_DIAGNOSTIC_TESTS.length >= 1);
  assert.ok(W393A_HISTORICAL_EVIDENCE_DIAGNOSTIC_TESTS.every((entry) => entry.test && entry.evidence && entry.reason));
});

test('W227 replaces obsolete mainnet instructions with the frozen no-go boundary', () => {
  const instructions = fs.readFileSync(path.join(root, '.github/copilot-instructions.md'), 'utf8');
  assert.match(instructions, /archived research/i);
  assert.match(instructions, /not active/i);
  assert.doesNotMatch(instructions, /Deployment status:\s*Live/i);
  assert.doesNotMatch(instructions, /Canonical Mainnet Contract Addresses/i);
});
