import assert from 'node:assert/strict';
import test from 'node:test';
import { W482_PRODUCT_POLISH_CODEX_HANDOFF_CONTRACT, validateW482ProductPolishCodexHandoffContract } from '../../config/w482-product-polish-codex-handoff-contract.mjs';
import { buildW482CodexHandoffPrompt, inspectW482ProductPolishCodexHandoff } from '../../scripts/w482-product-polish-codex-handoff-gate.mjs';

test('W482 contract keeps product polish and Codex duties explicit', () => {
  assert.deepEqual(validateW482ProductPolishCodexHandoffContract(), []);
  assert.ok(W482_PRODUCT_POLISH_CODEX_HANDOFF_CONTRACT.polishSurfaces.includes('guest-first-home'));
  assert.ok(W482_PRODUCT_POLISH_CODEX_HANDOFF_CONTRACT.polishSurfaces.includes('creator-ready-to-post'));
  assert.ok(W482_PRODUCT_POLISH_CODEX_HANDOFF_CONTRACT.codexMustDo.includes('capture-physical-android-iphone-tablet-evidence'));
});

test('W482 prompt blocks overwrite and unproved activations', () => {
  const prompt = buildW482CodexHandoffPrompt();
  assert.match(prompt, /Do not overwrite current main/);
  assert.match(prompt, /activate-dodo-checkout/);
  assert.match(prompt, /activate-direct-social-oauth/);
  assert.match(prompt, /activate-local-image-video-generation/);
  assert.match(prompt, /PASS \/ FIX REQUIRED \/ ENVIRONMENT BLOCKED/);
});

test('W482 gate passes as source-only handoff', () => {
  const report = inspectW482ProductPolishCodexHandoff();
  assert.equal(report.status, 'pass');
  assert.equal(report.sourceOnly, true);
  assert.ok(report.checkCount >= 9);
  assert.match(report.limitations.join(' '), /does not deploy/);
});
