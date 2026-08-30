import test from 'node:test';
import assert from 'node:assert/strict';
import { W467_CODEX_DEPLOYMENT_HANDOFF_CONTRACT, validateW467CodexDeploymentHandoffContract } from '../../config/w467-codex-deployment-handoff-contract.mjs';
import { buildW467CodexDeploymentHandoff, writeW467CodexDeploymentHandoff } from '../../scripts/w467-codex-deployment-handoff.mjs';
import { inspectW467CodexDeploymentHandoff } from '../../scripts/w467-codex-deployment-handoff-gate.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('W467 keeps a source-only redaction-safe handoff contract', () => {
  assert.deepEqual(validateW467CodexDeploymentHandoffContract(), []);
  assert.deepEqual(W467_CODEX_DEPLOYMENT_HANDOFF_CONTRACT.canonicalRoutes, ['/', '/eoncity', '/insights']);
  assert.equal(W467_CODEX_DEPLOYMENT_HANDOFF_CONTRACT.boundaries.deploymentPerformedByScript, false);
  assert.equal(W467_CODEX_DEPLOYMENT_HANDOFF_CONTRACT.boundaries.sourceBundleApprovesRelease, false);
});

test('W467 creates an evidence-separated deployment handoff without approval claims', () => {
  const handoff = buildW467CodexDeploymentHandoff();
  assert.equal(handoff.sourceOnly, true);
  assert.equal(handoff.deploymentPerformedByScript, false);
  assert.equal(handoff.sourceBundleApprovesRelease, false);
  assert.equal(handoff.sourceBundleApprovesCommerce, false);
  assert.deepEqual(handoff.canonicalRoutes, ['/', '/eoncity', '/insights']);
  assert.ok(handoff.reportRows.includes('sourceValidation'));
  assert.ok(handoff.reportRows.includes('humanGoNoGo'));
  assert.equal(handoff.defaultReleaseTruth.productionReleaseApproved, false);
});

test('W467 writer outputs only the requested redaction-safe template', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'eon-w467-'));
  const out = path.join(dir, 'handoff.json');
  const result = writeW467CodexDeploymentHandoff({ out });
  assert.equal(result.out, out);
  const payload = JSON.parse(fs.readFileSync(out, 'utf8'));
  assert.equal(payload.wave, 'W467');
  assert.equal(payload.sourceBundleApprovesRelease, false);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('W467 deterministic gate stays green and blocked from deploying', () => {
  const result = inspectW467CodexDeploymentHandoff();
  assert.equal(result.status, 'pass');
  assert.equal(result.sourceOnly, true);
  assert.equal(result.checkCount, 8);
});
