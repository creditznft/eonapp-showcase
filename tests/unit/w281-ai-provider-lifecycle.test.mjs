import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildW281ProviderLifecycleSnapshot } from '../../config/w281-ai-provider-lifecycle-contract.mjs';
import { runW281AiProviderLifecycleGate } from '../../scripts/w281-ai-provider-lifecycle-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const gate = path.join(root, 'scripts', 'w281-ai-provider-lifecycle-gate.mjs');
const boardPath = path.join(root, 'release-evidence', 'W281_AI_PROVIDER_LIFECYCLE_SOURCE_READINESS_2026-06-25', 'W281_BOARD.json');

test('W281 keeps every hosted provider finite, HTTPS, BYOK-only and user-action reviewed', () => {
  const snapshot = buildW281ProviderLifecycleSnapshot();
  assert.equal(snapshot.scope, 'source-only');
  assert.equal(snapshot.remoteCallsMade, false);
  assert.equal(snapshot.userActionRequired, true);
  assert.ok(snapshot.activeProviders.length >= 1);
  for (const row of snapshot.activeProviders) {
    assert.equal(row.transport, 'https');
    assert.equal(row.executionPolicy, 'byok-only');
    if (row.id === 'perplexity') assert.equal(row.readinessProof, 'user-initiated-public-model-catalogue-plus-first-inference-key-proof');
    else assert.equal(row.readinessProof, 'user-initiated-authenticated-model-list');
    assert.equal(row.reviewStatus, 'static-contract-reviewed');
    assert.equal(row.liveAccountProof, 'required-on-user-action');
  }
});

test('W281 source gate passes and fails closed when lifecycle evidence lanes are removed', () => {
  const report = runW281AiProviderLifecycleGate(root);
  assert.equal(report.ok, true, report.errors.join('\n'));
  const original = fs.readFileSync(boardPath, 'utf8');
  try {
    const board = JSON.parse(original);
    board.requiredExternalEvidence.pop();
    fs.writeFileSync(boardPath, `${JSON.stringify(board, null, 2)}\n`);
    const result = spawnSync(process.execPath, [gate], { cwd: root, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /required external evidence lane/);
  } finally {
    fs.writeFileSync(boardPath, original);
  }
});

test('W281 read-only mode does not create a release artifact', () => {
  const statsPath = path.join(root, 'artifacts', 'w281-ai-provider-lifecycle-gate', 'stats.json');
  const prior = fs.existsSync(statsPath) ? fs.readFileSync(statsPath) : null;
  const priorMode = process.env.EONAPP_GATE_WRITE_EVIDENCE;
  try {
    fs.rmSync(statsPath, { force: true });
    process.env.EONAPP_GATE_WRITE_EVIDENCE = '0';
    const report = runW281AiProviderLifecycleGate(root);
    assert.equal(report.ok, true, report.errors.join('\n'));
    assert.equal(fs.existsSync(statsPath), false);
  } finally {
    if (priorMode === undefined) delete process.env.EONAPP_GATE_WRITE_EVIDENCE;
    else process.env.EONAPP_GATE_WRITE_EVIDENCE = priorMode;
    if (prior) {
      fs.mkdirSync(path.dirname(statsPath), { recursive: true });
      fs.writeFileSync(statsPath, prior);
    }
  }
});
