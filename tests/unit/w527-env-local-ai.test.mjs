import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildW527EnvSafetyReceipt, isLoopbackEndpoint } from '../../scripts/w527-env-safety.mjs';
import { collectW527LocalAiEvidence } from '../../scripts/w527-local-ai-evidence.mjs';
import { inspectW527EnvLocalAi } from '../../scripts/w527-env-local-ai-gate.mjs';

function fixtureRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eonapp-w527-'));
  fs.writeFileSync(path.join(root, '.gitignore'), '.env.local\n');
  return root;
}

test('W527 environment receipt reports only safe presence/configuration metadata and never prints a secret', () => {
  const root = fixtureRoot();
  fs.writeFileSync(path.join(root, '.env.local'), 'EON_TEST_SECRET=do-not-read\n');
  const receipt = buildW527EnvSafetyReceipt({ root, inputEnv: { OLLAMA_BASE_URL: 'http://127.0.0.1:11434', EON_TEST_SECRET: 'super-secret-value' }, recordedAt: '2026-07-03T00:00:00.000Z' });
  const serialized = JSON.stringify(receipt);
  assert.equal(receipt.ok, true);
  assert.equal(receipt.environmentFile.valuesRead, false);
  assert.equal(receipt.environmentFile.valuesPrinted, false);
  assert.equal(serialized.includes('super-secret-value'), false);
  assert.equal(serialized.includes('do-not-read'), false);
  fs.rmSync(root, { recursive: true, force: true });
});

test('W527 accepts only URL-safe loopback endpoints and rejects LAN or credentialed URLs', () => {
  assert.equal(isLoopbackEndpoint('http://127.0.0.1:11434'), true);
  assert.equal(isLoopbackEndpoint('http://localhost:1234/v1'), true);
  assert.equal(isLoopbackEndpoint('http://192.168.1.4:11434'), false);
  assert.equal(isLoopbackEndpoint('http://token@127.0.0.1:11434'), false);
  assert.equal(isLoopbackEndpoint('https://127.0.0.1:11434'), false);
});

test('W527 defaults to no loopback traffic and labels local apps not-detected without treating that as product failure', async () => {
  let calls = 0;
  const receipt = await collectW527LocalAiEvidence({ inputEnv: {}, allowProbe: false, fetchImpl: async () => { calls += 1; throw new Error('must not run'); }, recordedAt: '2026-07-03T00:00:00.000Z' });
  assert.equal(calls, 0);
  assert.equal(receipt.probeLoopbackRequested, false);
  assert.deepEqual(receipt.results.map((entry) => entry.status), ['not-detected', 'not-detected', 'not-detected']);
});

test('W527 loopback discovery uses GET-only model lists and records counts/digests rather than model names', async () => {
  const calls = [];
  const receipt = await collectW527LocalAiEvidence({
    inputEnv: {}, allowProbe: true, recordedAt: '2026-07-03T00:00:00.000Z',
    fetchImpl: async (url, options) => {
      calls.push({ url, method: options.method });
      return { ok: true, status: 200, json: async () => url.includes('11434') ? { models: [{ name: 'local-model' }] } : { data: [{ id: 'local-model' }, { id: 'other-model' }] } };
    }
  });
  assert.deepEqual(calls.map((entry) => entry.method), ['GET', 'GET', 'GET']);
  assert.deepEqual(receipt.results.map((entry) => entry.status), ['detected-models', 'detected-models', 'detected-models']);
  assert.equal(JSON.stringify(receipt).includes('local-model'), false);
  assert.equal(inspectW527EnvLocalAi().ok, true);
});
