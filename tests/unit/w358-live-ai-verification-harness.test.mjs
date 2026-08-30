import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { W358_LIVE_AI_VERIFICATION_CONTRACT } from '../../config/w358-live-ai-verification-contract.mjs';

test('W358 live AI harness is opt-in, dynamic, and redacts evidence by design', () => {
  const source = readFileSync('scripts/w358-live-ai-verification.mjs', 'utf8');
  assert.match(source, /--confirm-live/);
  assert.match(source, /--dry-run/);
  assert.match(source, /EON_LIVE_AI_MODEL_/);
  assert.match(source, /sessionStorage\.setItem\('eon:ai-chat-session-keys:v1'/);
  assert.match(source, /rawKeysStored: false/);
  assert.match(source, /rawPromptsStored: false/);
  assert.match(source, /rawResponsesStored: false/);
  assert.doesNotMatch(source, /fallbackModel\s*:/);
  assert.doesNotMatch(source, /defaultModel\s*:/);
});

test('W358 contract forbids hidden routing and secret-bearing evidence', () => {
  assert.equal(W358_LIVE_AI_VERIFICATION_CONTRACT.localEnvOnly, true);
  assert.equal(W358_LIVE_AI_VERIFICATION_CONTRACT.outboundCallsRequireExplicitConfirm, true);
  assert.equal(W358_LIVE_AI_VERIFICATION_CONTRACT.hardcodedModelFallback, false);
  assert.equal(W358_LIVE_AI_VERIFICATION_CONTRACT.cloudRelayAllowed, false);
  assert.equal(W358_LIVE_AI_VERIFICATION_CONTRACT.browserKeyStorage, 'session-only');
  assert.equal(W358_LIVE_AI_VERIFICATION_CONTRACT.rawKeysInReport, false);
  assert.equal(W358_LIVE_AI_VERIFICATION_CONTRACT.rawPromptsInReport, false);
  assert.equal(W358_LIVE_AI_VERIFICATION_CONTRACT.rawResponsesInReport, false);
});

test('package exposes W358 safety and live commands without running them in default unit tests', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts['qa:w358-live-ai-harness'], 'node --test tests/unit/w358-live-ai-verification-harness.test.mjs');
  assert.equal(pkg.scripts['qa:w358-live-ai'], 'node scripts/w358-live-ai-verification.mjs');
  assert.equal(pkg.scripts['qa:w358-live-ai:preflight'], 'node scripts/w358-live-ai-verification.mjs --dry-run');
});
