import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalizeEonProviderProtocol } from '../../assets/js/ai-kernel/eon-provider-protocol-contract.js';
import { createProviderAdapterRegistry } from '../../assets/js/ai-kernel/eon-provider-adapter-registry.js';
import { createEonProviderReviewBoard } from '../../assets/js/ai-kernel/eon-provider-review-board.js';
import { createModelManifest } from '../../assets/js/ai-kernel/eon-model-manifest.js';
import { evaluateEonModelManifestLifecycle } from '../../assets/js/ai-kernel/eon-model-manifest-lifecycle.js';
import { resolveEonModelPolicy } from '../../assets/js/ai-kernel/eon-model-policy-resolver.js';
import { runW357ProviderLifecycleGovernanceGate } from '../../scripts/w357-provider-lifecycle-governance-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const now = 1_770_000_000_000;

test('W357 canonicalizes provider protocol aliases without naming or selecting models', () => {
  assert.deepEqual(normalizeEonProviderProtocol('anthropic-messages'), { input: 'anthropic-messages', protocol: 'anthropic-native', valid: true, aliasUsed: true });
  assert.equal(normalizeEonProviderProtocol('gemini-generate-content').protocol, 'gemini-native');
  assert.equal(normalizeEonProviderProtocol('unknown-wire').valid, false);
  const registry = createProviderAdapterRegistry([{
    schema: 'eonapp.provider-pack.v2', providerId: 'direct-example', label: 'Direct example', adapterId: 'anthropic-native/v1', protocol: 'anthropic-messages', trustLevel: 'bundled-audited', endpointPolicy: { mode: 'direct-user-selected' }, discovery: { mode: 'user-import', userActionRequired: true, backgroundProbeAllowed: false, modelCache: 'encrypted-device-local' }, privacy: { route: 'direct-to-provider', cloudRelayAllowed: false, defaultCrossProviderFallback: 'none' }, supportedProfiles: ['chat.deep'], adapterVersion: '1'
  }]);
  assert.equal(registry.packs[0].protocol, 'anthropic-native');
  assert.equal(registry.packs[0].protocolAliasUsed, true);
});

test('W357 review board uses the same canonical transport families as the adapter registry', () => {
  const board = createEonProviderReviewBoard({
    providerId: 'direct-example', adapterId: 'anthropic-native/v1', protocol: 'anthropic-messages', dataDestination: 'direct-to-provider', userInitiatedReview: true, models: 'user-discovered-device-local', lifecycle: { packVersioned: true, deprecationPrompt: 'explicit-user-prompt' }, privacy: { cloudRelayAllowed: false, crossProviderFallback: 'none' }
  });
  assert.equal(board.status, 'review-required');
  assert.equal(board.candidate.protocol, 'anthropic-native');
  assert.equal(board.candidate.protocolAliasUsed, true);
  assert.equal(board.providerCallCreated, false);
  assert.equal(board.eligibleForActivation, false);
});

test('W357 requires an explicit user refresh for a stale direct-provider model manifest and never replaces it', () => {
  const manifest = createModelManifest({ providerId: 'direct-example', adapterId: 'openai-compatible-chat/v1', records: [{ modelId: 'provider-model-x', verificationState: 'verified', privacyRoute: 'direct-to-provider', capabilities: { 'chat.fast': 'verified' } }], source: 'user-import', checkedAt: now });
  const current = evaluateEonModelManifestLifecycle(manifest, { now: now + (1000 * 60 * 60 * 24 * 6) });
  assert.equal(current.status, 'current');
  assert.equal(current.records[0].autoSelectable, true);
  const stale = evaluateEonModelManifestLifecycle(manifest, { now: now + (1000 * 60 * 60 * 24 * 8) });
  assert.equal(stale.status, 'recheck-required');
  assert.equal(stale.records[0].autoSelectable, false);
  assert.equal(stale.userRefreshRequired, true);
  assert.equal(stale.backgroundRefreshCreated, false);
  assert.equal(stale.silentModelReplacement, false);
  const blocked = resolveEonModelPolicy({ manifest, requestedProfile: 'chat.fast', taskPrivacyClass: 'direct-to-provider', selection: { providerId: 'direct-example', modelId: 'provider-model-x' }, now: now + (1000 * 60 * 60 * 24 * 8) });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'model-manifest-user-refresh-required');
});

test('W357 provider lifecycle governance source gate remains green', () => {
  const result = runW357ProviderLifecycleGovernanceGate(root);
  assert.equal(result.ok, true, result.errors.join('\n'));
});
